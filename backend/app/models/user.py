from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Index
from sqlalchemy.orm import relationship
from ..database import Base


class User(Base):
    """User model for storing user information."""

    __tablename__ = "users"

    # Columns
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index('idx_users_email', 'email'),
    )

    # Relationships
    group_memberships = relationship(
        "GroupMember",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    expenses_paid = relationship(
        "Expense",
        back_populates="paid_by",
        foreign_keys="Expense.paid_by_id",
        cascade="all, delete-orphan"
    )
    expense_participants = relationship(
        "ExpenseParticipant",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    settlements_paid = relationship(
        "Settlement",
        back_populates="payer",
        foreign_keys="Settlement.payer_id",
        cascade="all, delete-orphan"
    )
    settlements_received = relationship(
        "Settlement",
        back_populates="payee",
        foreign_keys="Settlement.payee_id",
        cascade="all, delete-orphan"
    )
    import_sessions = relationship(
        "ImportSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    audit_logs = relationship(
        "AuditLog",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"
