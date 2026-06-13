from decimal import Decimal
from typing import Optional, Dict, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.expense import Expense, ExpenseParticipant
from ..models.settlement import Settlement
from ..repositories.expense_repository import ExpenseRepository
from ..repositories.settlement_repository import SettlementRepository
import logging

logger = logging.getLogger(__name__)


class BalanceService:
    def __init__(self, db: Session):
        self.db = db
        self.expense_repository = ExpenseRepository(db)
        self.settlement_repository = SettlementRepository(db)

    def calculate_group_balance(self, group_id: int) -> Dict[int, Decimal]:
        """
        Calculate balance for each user in a group.
        Positive = owed money, Negative = owes money.
        """
        balances: Dict[int, Decimal] = {}

        # Get all expenses in group
        expenses = self.expense_repository.get_group_expenses(group_id)
        for expense in expenses:
            # Add amount paid by user
            if expense.paid_by_id not in balances:
                balances[expense.paid_by_id] = Decimal("0")
            balances[expense.paid_by_id] += expense.amount

            # Subtract amounts owed by participants
            for participant in expense.participants:
                if participant.user_id not in balances:
                    balances[participant.user_id] = Decimal("0")
                balances[participant.user_id] -= participant.amount_owed

        # Adjust for settlements
        settlements = self.settlement_repository.get_group_settlements(group_id)
        for settlement in settlements:
            if settlement.payer_id not in balances:
                balances[settlement.payer_id] = Decimal("0")
            if settlement.payee_id not in balances:
                balances[settlement.payee_id] = Decimal("0")

            balances[settlement.payer_id] -= settlement.amount
            balances[settlement.payee_id] += settlement.amount

        return balances

    def calculate_user_balance(self, group_id: int, user_id: int) -> Decimal:
        """
        Calculate balance for a specific user in a group.
        Positive = owed money, Negative = owes money.
        """
        balance = Decimal("0")

        # Calculate from expenses
        expenses = self.expense_repository.get_group_expenses(group_id)
        for expense in expenses:
            if expense.paid_by_id == user_id:
                balance += expense.amount

            for participant in expense.participants:
                if participant.user_id == user_id:
                    balance -= participant.amount_owed

        # Adjust for settlements
        settlements = self.settlement_repository.get_group_settlements(group_id)
        for settlement in settlements:
            if settlement.payer_id == user_id:
                balance -= settlement.amount
            if settlement.payee_id == user_id:
                balance += settlement.amount

        return balance

    def get_creditors_and_debtors(self, group_id: int) -> Tuple[Dict[int, Decimal], Dict[int, Decimal]]:
        """
        Get creditors (people owed money) and debtors (people who owe money).
        Returns: (creditors_dict, debtors_dict)
        """
        balances = self.calculate_group_balance(group_id)

        creditors = {user_id: amount for user_id, amount in balances.items() if amount > 0}
        debtors = {user_id: abs(amount) for user_id, amount in balances.items() if amount < 0}

        return creditors, debtors

    def get_user_summary(self, group_id: int, user_id: int) -> Dict[str, any]:
        """Get a summary of user's balance in a group."""
        balance = self.calculate_user_balance(group_id, user_id)

        return {
            "user_id": user_id,
            "group_id": group_id,
            "balance": balance,
            "status": "owed" if balance > 0 else ("owed" if balance < 0 else "settled"),
            "amount": abs(balance)
        }
