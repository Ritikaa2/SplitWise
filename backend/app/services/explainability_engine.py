from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal
from typing import List, Dict, Any
from ..repositories.expense_repository import ExpenseRepository
from ..repositories.settlement_repository import SettlementRepository
from ..repositories.group_repository import GroupRepository
from ..repositories.user_repository import UserRepository

class ExplainabilityEngine:
    def __init__(self, db: Session):
        self.db = db
        self.expense_repo = ExpenseRepository(db)
        self.settlement_repo = SettlementRepository(db)
        self.group_repo = GroupRepository(db)
        self.user_repo = UserRepository(db)

    def explain_user_transactions(self, group_id: int, user_id: int) -> List[Dict[str, Any]]:
        """
        Generates a chronological audit trail explaining how a user's balance changed
        with each expense and settlement.
        """
        # Get all expenses and settlements
        expenses = self.expense_repo.get_group_expenses(group_id)
        settlements = self.settlement_repo.get_group_settlements(group_id)

        # Build combined list of transactions
        transactions: List[Dict[str, Any]] = []

        for e in expenses:
            transactions.append({
                "type": "EXPENSE",
                "id": e.id,
                "title": e.title,
                "amount": float(e.amount),
                "currency": e.currency,
                "amount_inr": float(e.converted_amount_inr),
                "date": e.date,
                "created_at": e.created_at,
                "paid_by_id": e.paid_by_id,
                "split_type": e.split_type,
                "raw_obj": e
            })

        for s in settlements:
            transactions.append({
                "type": "SETTLEMENT",
                "id": s.id,
                "title": f"Settlement payment",
                "amount": float(s.amount),
                "currency": s.currency,
                "amount_inr": float(s.converted_amount_inr),
                "date": s.date,
                "created_at": s.created_at,
                "paid_by_id": s.payer_id,  # payer is the one who pays (debtor)
                "payee_id": s.payee_id,
                "raw_obj": s
            })

        # Sort chronologically
        transactions.sort(key=lambda x: (x["date"], x["created_at"]))

        running_balance = Decimal("0.00")
        audit_trail = []

        for tx in transactions:
            explanation = ""
            net_change = Decimal("0.00")
            
            if tx["type"] == "EXPENSE":
                expense = tx["raw_obj"]
                payer_id = expense.paid_by_id
                payer_user = self.user_repo.get_by_id(payer_id)
                payer_name = payer_user.name if payer_user else "Someone"

                # Check if the user is a participant
                participation = next((p for p in expense.participants if p.user_id == user_id), None)
                owed_by_user = Decimal(str(participation.amount_owed)) if participation else Decimal("0.00")
                
                # Check if the user was the payer
                paid_by_user = Decimal(str(expense.amount)) if payer_id == user_id else Decimal("0.00")
                
                # Convert user's paid/owed amounts to INR proportionally
                paid_inr = Decimal(str(expense.converted_amount_inr)) if payer_id == user_id else Decimal("0.00")
                owed_inr = Decimal("0.00")
                if participation and expense.amount > 0:
                    owed_inr = Decimal(str(expense.converted_amount_inr)) * (owed_by_user / Decimal(str(expense.amount)))

                net_change = paid_inr - owed_inr
                running_balance += net_change

                # Create text explanation
                currency_str = f"{tx['amount']} {tx['currency']}"
                if tx["currency"] != "INR":
                    currency_str += f" (≈ {tx['amount_inr']} INR)"

                if payer_id == user_id:
                    # User paid
                    if owed_by_user > 0:
                        explanation = f"You paid {currency_str} for '{tx['title']}'. Split Type: {tx['split_type']}. Your share was {owed_by_user} {tx['currency']}. You are credited +{paid_inr - owed_inr:.2f} INR."
                    else:
                        explanation = f"You paid {currency_str} for '{tx['title']}'. You did not participate. You are credited +{paid_inr:.2f} INR."
                else:
                    # Someone else paid
                    if owed_by_user > 0:
                        explanation = f"{payer_name} paid {currency_str} for '{tx['title']}'. Split Type: {tx['split_type']}. Your share is {owed_by_user} {tx['currency']}. You are charged -{owed_inr:.2f} INR."
                    else:
                        explanation = f"{payer_name} paid {currency_str} for '{tx['title']}'. You did not participate. Your balance remains unchanged."

            elif tx["type"] == "SETTLEMENT":
                settlement = tx["raw_obj"]
                payer_id = settlement.payer_id
                payee_id = settlement.payee_id
                payer_user = self.user_repo.get_by_id(payer_id)
                payee_user = self.user_repo.get_by_id(payee_id)
                
                payer_name = payer_user.name if payer_user else "Someone"
                payee_name = payee_user.name if payee_user else "Someone"

                currency_str = f"{tx['amount']} {tx['currency']}"
                if tx["currency"] != "INR":
                    currency_str += f" (≈ {tx['amount_inr']} INR)"

                if payer_id == user_id:
                    # User paid the settlement (debtor)
                    net_change = Decimal(str(settlement.converted_amount_inr))
                    running_balance += net_change
                    explanation = f"You recorded a payment of {currency_str} to {payee_name}. Your balance increases by +{net_change:.2f} INR."
                elif payee_id == user_id:
                    # User received the settlement (creditor)
                    net_change = -Decimal(str(settlement.converted_amount_inr))
                    running_balance += net_change
                    explanation = f"{payer_name} recorded a payment of {currency_str} to you. Your balance decreases by -{abs(net_change):.2f} INR."
                else:
                    # User not involved
                    explanation = f"{payer_name} paid {currency_str} to {payee_name}. You were not involved."

            audit_trail.append({
                "type": tx["type"],
                "id": tx["id"],
                "title": tx["title"],
                "date": tx["date"],
                "explanation": explanation,
                "net_change_inr": float(net_change),
                "running_balance_inr": float(running_balance)
            })

        # Return reversed (latest first) or chronological. Latest first is standard for activity streams.
        return list(reversed(audit_trail))
