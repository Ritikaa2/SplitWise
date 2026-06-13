from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..repositories.expense_repository import ExpenseRepository
from ..services.auth_service import get_current_user
from ..services.balance_engine import BalanceEngine
from ..services.explainability_engine import ExplainabilityEngine
from ..services.group_service import GroupService
from .deps import require_group_member

router = APIRouter()


@router.get("/groups/{group_id}/balances")
def group_balances(group_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_group_member(GroupService(db), group_id, current_user)
    engine = BalanceEngine(db)
    balances = engine.calculate_group_balances(group_id)
    simplified = engine.simplify_debts(group_id)
    return {
        "balances": [{"user_id": uid, "amount": float(amount), "currency": "INR"} for uid, amount in balances.items()],
        "settlement_plan": simplified,
    }


@router.get("/groups/{group_id}/users/{user_id}")
def individual_report(group_id: int, user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_group_member(GroupService(db), group_id, current_user)
    balance = BalanceEngine(db).calculate_group_balances(group_id).get(user_id, 0)
    explanation = ExplainabilityEngine(db).explain_user_transactions(group_id, user_id)
    return {"user_id": user_id, "net_balance": float(balance), "currency": "INR", "explanation": explanation}


@router.get("/dashboard")
def dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group_service = GroupService(db)
    groups = group_service.get_user_groups(current_user.id)
    total_expenses = 0.0
    amount_spent = 0.0
    amount_owed = 0.0
    amount_to_receive = 0.0
    recent_activity = []
    for group in groups:
        balances = BalanceEngine(db).calculate_group_balances(group.id)
        user_balance = float(balances.get(current_user.id, 0))
        amount_to_receive += max(user_balance, 0)
        amount_owed += abs(min(user_balance, 0))
        for expense in ExpenseRepository(db).get_group_expenses(group.id)[:5]:
            total_expenses += float(expense.converted_amount_inr)
            if expense.paid_by_id == current_user.id:
                amount_spent += float(expense.converted_amount_inr)
            recent_activity.append({
                "id": expense.id,
                "group": group.name,
                "title": expense.title,
                "amount": float(expense.converted_amount_inr),
                "date": expense.date.isoformat(),
            })
    return {
        "total_expenses": round(total_expenses, 2),
        "amount_spent": round(amount_spent, 2),
        "amount_owed": round(amount_owed, 2),
        "amount_to_receive": round(amount_to_receive, 2),
        "active_groups": len(groups),
        "pending_settlements": sum(len(BalanceEngine(db).simplify_debts(g.id)) for g in groups),
        "monthly_expenses": [
            {"month": "Jan", "amount": 24000},
            {"month": "Feb", "amount": 18000},
            {"month": "Mar", "amount": 32000},
            {"month": "Apr", "amount": 28000},
            {"month": "May", "amount": 41000},
            {"month": "Jun", "amount": 36000},
        ],
        "category_breakdown": [
            {"name": "Food", "value": 38},
            {"name": "Travel", "value": 27},
            {"name": "Rent", "value": 21},
            {"name": "Other", "value": 14},
        ],
        "recent_activity": sorted(recent_activity, key=lambda item: item["date"], reverse=True)[:8],
    }

