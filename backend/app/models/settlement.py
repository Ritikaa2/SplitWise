from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import Column, Integer, ForeignKey, Date, DateTime, Numeric, String, Index
from sqlalchemy.orm import relationship
from ..database import Base


class Settlement(Base):
    """Settlement model for recording payments between users."""

    __tablename__ = "settlements"

    # Columns
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(
        Integer,
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    payer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    payee_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="INR")
    converted_amount_inr = Column(Numeric(15, 2), nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index('idx_settlement_group', 'group_id'),
        Index('idx_settlement_payer', 'payer_id'),
        Index('idx_settlement_payee', 'payee_id'),
    )

    # Relationships
    group = relationship("Group", back_populates="settlements")
    payer = relationship(
        "User",
        foreign_keys=[payer_id],
        back_populates="settlements_paid"
    )
    payee = relationship(
        "User",
        foreign_keys=[payee_id],
        back_populates="settlements_received"
    )

    def __repr__(self) -> str:
        return f"<Settlement(id={self.id}, payer_id={self.payer_id}, payee_id={self.payee_id}, amount={self.amount} {self.currency}, date={self.date})>"
