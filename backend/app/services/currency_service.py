from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal
from ..repositories.import_repository import ImportRepository

class CurrencyService:
    def __init__(self, db: Session):
        self.import_repo = ImportRepository(db)

    def convert_to_inr(self, amount: Decimal, from_currency: str, effective_date: date) -> Decimal:
        if from_currency == "INR":
            return amount
        
        rate = self.import_repo.get_exchange_rate(from_currency, "INR", effective_date)
        # Decimal multiplication
        return Decimal(str(amount)) * Decimal(str(rate))

    def convert(self, amount: Decimal, from_currency: str, to_currency: str, effective_date: date) -> Decimal:
        if from_currency == to_currency:
            return amount
            
        rate = self.import_repo.get_exchange_rate(from_currency, to_currency, effective_date)
        return Decimal(str(amount)) * Decimal(str(rate))
