from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import List
from ..repositories.expense_repository import ExpenseRepository
from ..repositories.group_repository import GroupRepository
from ..repositories.user_repository import UserRepository
from ..repositories.import_repository import ImportRepository
from ..models.expense import Expense, ExpenseParticipant
from ..schemas.expense import ExpenseCreate, ExpenseParticipantCreate
from .currency_service import CurrencyService

class ExpenseService:
    def __init__(self, db: Session):
        self.db = db
        self.expense_repo = ExpenseRepository(db)
        self.group_repo = GroupRepository(db)
        self.user_repo = UserRepository(db)
        self.import_repo = ImportRepository(db)
        self.currency_service = CurrencyService(db)

    def _quantize(self, amount: Decimal) -> Decimal:
        return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def calculate_splits(self, total_amount: Decimal, split_type: str, participants: List[ExpenseParticipantCreate]) -> List[Decimal]:
        """
        Calculates the amount owed by each participant based on the split type.
        Ensures the sum of splits matches the total_amount exactly by adjusting the last participant's share for rounding.
        """
        if not participants:
            raise HTTPException(status_code=400, detail="An expense must have at least one participant.")
            
        count = len(participants)
        amounts = []

        if split_type == "EQUAL":
            equal_share = self._quantize(total_amount / Decimal(str(count)))
            amounts = [equal_share] * count
            
        elif split_type == "EXACT":
            sum_exact = sum(Decimal(str(p.share_value or 0)) for p in participants)
            if abs(sum_exact - total_amount) > Decimal("0.01"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Sum of exact splits ({sum_exact}) must equal total amount ({total_amount})."
                )
            amounts = [self._quantize(Decimal(str(p.share_value or 0))) for p in participants]
            
        elif split_type == "PERCENTAGE":
            sum_percent = sum(Decimal(str(p.share_value or 0)) for p in participants)
            if abs(sum_percent - Decimal("100.00")) > Decimal("0.01"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Sum of percentages ({sum_percent}%) must equal 100%."
                )
            amounts = [self._quantize(total_amount * Decimal(str(p.share_value or 0)) / Decimal("100.00")) for p in participants]
            
        elif split_type == "SHARES":
            total_shares = sum(Decimal(str(p.share_value or 0)) for p in participants)
            if total_shares <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Total shares must be greater than 0."
                )
            amounts = [self._quantize(total_amount * Decimal(str(p.share_value or 0)) / total_shares) for p in participants]
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid split type: {split_type}"
            )

        # Rounding adjustments: adjust the last participant's share to make the sum exact
        sum_amounts = sum(amounts)
        difference = total_amount - sum_amounts
        if difference != 0:
            amounts[-1] += difference
            
        return amounts

    def _validate_timeline(self, group_id: int, user_id: int, expense_date: date, name_hint: str = "User"):
        """
        Validates if the user was active in the group on the expense_date.
        """
        is_active = self.group_repo.is_user_active_on_date(group_id, user_id, expense_date)
        if not is_active:
            user = self.user_repo.get_by_id(user_id)
            user_name = user.name if user else name_hint
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{user_name} (ID: {user_id}) was not active in group on {expense_date}."
            )

    def create_expense(self, group_id: int, expense_in: ExpenseCreate, acting_user_id: int) -> Expense:
        # Validate group existence
        group = self.group_repo.get_by_id(group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        # Business Rule: Payer must be active in group on expense date
        self._validate_timeline(group_id, expense_in.paid_by_id, expense_in.date, "Payer")

        # Business Rule: All participants must be active on expense date
        for p in expense_in.participants:
            self._validate_timeline(group_id, p.user_id, expense_in.date, "Participant")

        # Calculate splits
        split_amounts = self.calculate_splits(expense_in.amount, expense_in.split_type, expense_in.participants)

        # Convert amount to INR
        converted_amount = self.currency_service.convert_to_inr(
            expense_in.amount, expense_in.currency, expense_in.date
        )

        # Create expense record
        expense = Expense(
            group_id=group_id,
            title=expense_in.title,
            description=expense_in.description,
            amount=expense_in.amount,
            currency=expense_in.currency,
            converted_amount_inr=converted_amount,
            date=expense_in.date,
            paid_by_id=expense_in.paid_by_id,
            split_type=expense_in.split_type
        )
        created_expense = self.expense_repo.create(expense)

        # Create expense participants records
        part_records = []
        for p, amt in zip(expense_in.participants, split_amounts):
            part = ExpenseParticipant(
                expense_id=created_expense.id,
                user_id=p.user_id,
                amount_owed=amt,
                share_value=p.share_value
            )
            part_records.append(part)
        
        self.expense_repo.add_participants(part_records)
        
        # Log action
        self.import_repo.log_action(
            user_id=acting_user_id,
            action="CREATE_EXPENSE",
            entity_type="expense",
            entity_id=created_expense.id,
            details=f"Created expense '{created_expense.title}' in group {group_id} for {expense_in.amount} {expense_in.currency}"
        )

        return self.expense_repo.get_by_id(created_expense.id)

    def update_expense(self, group_id: int, expense_id: int, expense_in: ExpenseCreate, acting_user_id: int) -> Expense:
        expense = self.expense_repo.get_by_id(expense_id)
        if not expense or expense.group_id != group_id:
            raise HTTPException(status_code=404, detail="Expense not found in this group")

        # Business Rule: Payer must be active in group on expense date
        self._validate_timeline(group_id, expense_in.paid_by_id, expense_in.date, "Payer")

        # Business Rule: All participants must be active on expense date
        for p in expense_in.participants:
            self._validate_timeline(group_id, p.user_id, expense_in.date, "Participant")

        # Calculate splits
        split_amounts = self.calculate_splits(expense_in.amount, expense_in.split_type, expense_in.participants)

        # Convert amount to INR
        converted_amount = self.currency_service.convert_to_inr(
            expense_in.amount, expense_in.currency, expense_in.date
        )

        # Update expense
        expense.title = expense_in.title
        expense.description = expense_in.description
        expense.amount = expense_in.amount
        expense.currency = expense_in.currency
        expense.converted_amount_inr = converted_amount
        expense.date = expense_in.date
        expense.paid_by_id = expense_in.paid_by_id
        expense.split_type = expense_in.split_type

        # Re-create participants
        self.expense_repo.remove_participants(expense_id)
        
        part_records = []
        for p, amt in zip(expense_in.participants, split_amounts):
            part = ExpenseParticipant(
                expense_id=expense_id,
                user_id=p.user_id,
                amount_owed=amt,
                share_value=p.share_value
            )
            part_records.append(part)
        
        self.expense_repo.add_participants(part_records)
        updated_expense = self.expense_repo.update(expense)

        # Log action
        self.import_repo.log_action(
            user_id=acting_user_id,
            action="UPDATE_EXPENSE",
            entity_type="expense",
            entity_id=expense_id,
            details=f"Updated expense '{expense.title}' (ID: {expense_id}) in group {group_id}"
        )

        return updated_expense

    def delete_expense(self, group_id: int, expense_id: int, acting_user_id: int) -> None:
        expense = self.expense_repo.get_by_id(expense_id)
        if not expense or expense.group_id != group_id:
            raise HTTPException(status_code=404, detail="Expense not found in this group")

        title = expense.title
        self.expense_repo.delete(expense)

        # Log action
        self.import_repo.log_action(
            user_id=acting_user_id,
            action="DELETE_EXPENSE",
            entity_type="expense",
            entity_id=expense_id,
            details=f"Deleted expense '{title}' (ID: {expense_id}) in group {group_id}"
        )
