from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..repositories.expense_repository import ExpenseRepository
from ..schemas.expense import ExpenseCreate, ExpenseResponse
from ..services.auth_service import get_current_user
from ..services.expense_service import ExpenseService
from ..services.group_service import GroupService
from .deps import require_group_member

router = APIRouter()


@router.get("/groups/{group_id}", response_model=list[ExpenseResponse])
def list_expenses(group_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group_service = GroupService(db)
    require_group_member(group_service, group_id, current_user)
    return ExpenseRepository(db).get_group_expenses(group_id)


@router.post("/groups/{group_id}", response_model=ExpenseResponse, status_code=201)
def create_expense(group_id: int, payload: ExpenseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group_service = GroupService(db)
    require_group_member(group_service, group_id, current_user)
    return ExpenseService(db).create_expense(group_id, payload, current_user.id)


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = ExpenseRepository(db).get_by_id(expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    require_group_member(GroupService(db), expense.group_id, current_user)
    return expense


@router.put("/groups/{group_id}/{expense_id}", response_model=ExpenseResponse)
def update_expense(group_id: int, expense_id: int, payload: ExpenseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_group_member(GroupService(db), group_id, current_user)
    return ExpenseService(db).update_expense(group_id, expense_id, payload, current_user.id)


@router.delete("/groups/{group_id}/{expense_id}", status_code=204)
def delete_expense(group_id: int, expense_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_group_member(GroupService(db), group_id, current_user)
    ExpenseService(db).delete_expense(group_id, expense_id, current_user.id)

