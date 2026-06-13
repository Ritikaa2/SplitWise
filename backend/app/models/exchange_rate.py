from datetime import date
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, Date, Index, UniqueConstraint
from ..database import Base


class ExchangeRate(Base):
    """ExchangeRate model for storing currency conversion rates."""

    __tablename__ = "exchange_rates"

    # Columns
    id = Column(Integer, primary_key=True, index=True)
    from_currency = Column(String(10), nullable=False)
    to_currency = Column(String(10), nullable=False)
    rate = Column(Numeric(15, 6), nullable=False)
    effective_date = Column(Date, nullable=False)

    # Indexes
    __table_args__ = (
        UniqueConstraint(
            'from_currency',
            'to_currency',
            'effective_date',
            name='uq_exchange_rate'
        ),
    )

    def __repr__(self) -> str:
        return f"<ExchangeRate(from={self.from_currency}, to={self.to_currency}, rate={self.rate}, date={self.effective_date})>"
