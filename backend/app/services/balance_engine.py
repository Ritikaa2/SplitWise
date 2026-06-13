from sqlalchemy.orm import Session
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Any
from ..repositories.group_repository import GroupRepository
from ..repositories.expense_repository import ExpenseRepository
from ..repositories.settlement_repository import SettlementRepository
from ..repositories.user_repository import UserRepository
from ..models.user import User

class BalanceEngine:
    def __init__(self, db: Session):
        self.db = db
        self.group_repo = GroupRepository(db)
        self.expense_repo = ExpenseRepository(db)
        self.settlement_repo = SettlementRepository(db)
        self.user_repo = UserRepository(db)

    def _quantize(self, val: Decimal) -> Decimal:
        return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def calculate_group_balances(self, group_id: int) -> Dict[int, Decimal]:
        """
        Calculates the net balance (in INR) for every member in the group.
        Net Balance = (Total Paid in Expenses) - (Total Owed in Expenses) 
                      - (Total Paid in Settlements) + (Total Received in Settlements)
        """
        group = self.group_repo.get_by_id(group_id)
        if not group:
            return {}

        # Initialize all members with 0 net balance
        balances: Dict[int, Decimal] = {}
        for member in group.members:
            balances[member.user_id] = Decimal("0.00")

        # Process Expenses
        expenses = self.expense_repo.get_group_expenses(group_id)
        for expense in expenses:
            # Payer gets credited the full converted INR amount of the expense
            payer_id = expense.paid_by_id
            if payer_id in balances:
                balances[payer_id] += Decimal(str(expense.converted_amount_inr))
            
            # Participants get debited their share in INR
            for participant in expense.participants:
                part_id = participant.user_id
                if part_id in balances:
                    # Calculate participant's share in INR:
                    # INR share = expense.converted_amount_inr * (participant.amount_owed / expense.amount)
                    if expense.amount > 0:
                        part_share_inr = Decimal(str(expense.converted_amount_inr)) * (Decimal(str(participant.amount_owed)) / Decimal(str(expense.amount)))
                        balances[part_id] -= self._quantize(part_share_inr)

        # Process Settlements
        settlements = self.settlement_repo.get_group_settlements(group_id)
        for settlement in settlements:
            payer_id = settlement.payer_id  # debtor
            payee_id = settlement.payee_id  # creditor
            
            if payer_id in balances:
                # Payer (debtor) has paid, so their balance goes up (closer to 0)
                balances[payer_id] += Decimal(str(settlement.converted_amount_inr))
                
            if payee_id in balances:
                # Payee (creditor) has received, so their balance goes down (closer to 0)
                balances[payee_id] -= Decimal(str(settlement.converted_amount_inr))

        # Quantize all balances
        for uid in balances:
            balances[uid] = self._quantize(balances[uid])

        return balances

    def simplify_debts(self, group_id: int) -> List[Dict[str, Any]]:
        """
        Computes the simplified list of payments to resolve all debts in the group.
        Uses a greedy matching algorithm matching the largest debtor to the largest creditor.
        """
        balances = self.calculate_group_balances(group_id)
        if not balances:
            return []

        # Separate into debtors and creditors
        debtors: List[List[Any]] = []  # List of [user_id, balance] where balance < 0
        creditors: List[List[Any]] = []  # List of [user_id, balance] where balance > 0

        for uid, bal in balances.items():
            if bal < Decimal("-0.01"):
                debtors.append([uid, bal])
            elif bal > Decimal("0.01"):
                creditors.append([uid, bal])

        simplified_payments = []

        # Greedy matching
        while debtors and creditors:
            # Sort debtors ascending (most negative first)
            debtors.sort(key=lambda x: x[1])
            # Sort creditors descending (most positive first)
            creditors.sort(key=lambda x: x[1], reverse=True)

            debtor = debtors[0]
            creditor = creditors[0]

            debtor_id, debtor_bal = debtor
            creditor_id, creditor_bal = creditor

            debt_to_settle = abs(debtor_bal)
            credit_to_receive = creditor_bal

            settle_amount = min(debt_to_settle, credit_to_receive)
            settle_amount = self._quantize(settle_amount)

            if settle_amount > 0:
                payer_user = self.user_repo.get_by_id(debtor_id)
                payee_user = self.user_repo.get_by_id(creditor_id)
                
                simplified_payments.append({
                    "from_user_id": debtor_id,
                    "from_user_name": payer_user.name if payer_user else f"User {debtor_id}",
                    "to_user_id": creditor_id,
                    "to_user_name": payee_user.name if payee_user else f"User {creditor_id}",
                    "amount": float(settle_amount),
                    "currency": "INR"
                })

            # Update balances
            debtor[1] += settle_amount
            creditor[1] -= settle_amount

            # Remove if close to zero
            if abs(debtor[1]) < Decimal("0.01"):
                debtors.pop(0)
            if abs(creditor[1]) < Decimal("0.01"):
                creditors.pop(0)

        return simplified_payments
