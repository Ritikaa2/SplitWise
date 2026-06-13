from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, Numeric, Index
from sqlalchemy.orm import relationship
from ..database import Base


class Expense(Base):
    """Expense model for storing expense information."""

    __tablename__ = "expenses"

    # Columns
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(
        Integer,
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="INR")
    converted_amount_inr = Column(Numeric(15, 2), nullable=False)
    date = Column(Date, nullable=False, index=True)
    paid_by_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    split_type = Column(String(50), nullable=False)  # EQUAL, EXACT, PERCENTAGE, SHARES
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index('idx_expense_group', 'group_id'),
        Index('idx_expense_date', 'date'),
        Index('idx_expense_paid_by', 'paid_by_id'),
    )

    # Relationships
    group = relationship("Group", back_populates="expenses")
    paid_by = relationship("User", back_populates="expenses_paid", foreign_keys=[paid_by_id])
    participants = relationship(
        "ExpenseParticipant",
        back_populates="expense",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Expense(id={self.id}, title={self.title}, amount={self.amount} {self.currency}, date={self.date})>"


class ExpenseParticipant(Base):
    """ExpenseParticipant model for tracking how expenses are split."""

    __tablename__ = "expense_participants"

    # Columns
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(
        Integer,
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    amount_owed = Column(Numeric(15, 2), nullable=False)
    share_value = Column(Numeric(15, 2), nullable=True)

    # Indexes
    __table_args__ = (
        Index('idx_participant_expense', 'expense_id'),
        Index('idx_participant_user', 'user_id'),
    )

    # Relationships
    expense = relationship("Expense", back_populates="participants")
    user = relationship("User", back_populates="expense_participants")

    def __repr__(self) -> str:
        return f"<ExpenseParticipant(expense_id={self.expense_id}, user_id={self.user_id}, owed={self.amount_owed})>"
