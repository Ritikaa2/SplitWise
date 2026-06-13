from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import List, Optional
from decimal import Decimal
from .user import UserResponse

class ExpenseParticipantBase(BaseModel):
    user_id: int
    share_value: Optional[Decimal] = None  # Represents percentage, absolute value or shares

class ExpenseParticipantCreate(ExpenseParticipantBase):
    pass

class ExpenseParticipantResponse(ExpenseParticipantBase):
    id: int
    expense_id: int
    amount_owed: Decimal
    user: UserResponse

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    title: str
    description: Optional[str] = None
    amount: Decimal = Field(..., gt=0)
    currency: str = "INR"
    date: date
    paid_by_id: int
    split_type: str  # EQUAL, EXACT, PERCENTAGE, SHARES

class ExpenseCreate(ExpenseBase):
    participants: List[ExpenseParticipantCreate]

class ExpenseResponse(ExpenseBase):
    id: int
    group_id: int
    converted_amount_inr: Decimal
    created_at: datetime
    participants: List[ExpenseParticipantResponse]
    paid_by: UserResponse

    class Config:
        from_attributes = True
