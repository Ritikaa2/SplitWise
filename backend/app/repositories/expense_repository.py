from sqlalchemy.orm import Session
from ..models.expense import Expense, ExpenseParticipant

class ExpenseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, expense_id: int) -> Expense | None:
        return self.db.query(Expense).filter(Expense.id == expense_id).first()

    def create(self, expense: Expense) -> Expense:
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def delete(self, expense: Expense) -> None:
        self.db.delete(expense)
        self.db.commit()

    def update(self, expense: Expense) -> Expense:
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def get_group_expenses(self, group_id: int) -> list[Expense]:
        return self.db.query(Expense).filter(Expense.group_id == group_id).order_by(Expense.date.desc()).all()

    def add_participants(self, participants: list[ExpenseParticipant]) -> None:
        self.db.add_all(participants)
        self.db.commit()

    def remove_participants(self, expense_id: int) -> None:
        self.db.query(ExpenseParticipant).filter(ExpenseParticipant.expense_id == expense_id).delete()
        self.db.commit()
