from pydantic import BaseModel, Field
from datetime import datetime, date
from decimal import Decimal
from .user import UserResponse

class SettlementBase(BaseModel):
    payer_id: int
    payee_id: int
    amount: Decimal = Field(..., gt=0)
    currency: str = "INR"
    date: date

class SettlementCreate(SettlementBase):
    pass

class SettlementResponse(SettlementBase):
    id: int
    group_id: int
    converted_amount_inr: Decimal
    created_at: datetime
    payer: UserResponse
    payee: UserResponse

    class Config:
        from_attributes = True
