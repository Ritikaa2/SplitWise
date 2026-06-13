from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional
from .user import UserResponse

class GroupMemberBase(BaseModel):
    user_id: int
    joined_at: date
    left_at: Optional[date] = None

class GroupMemberCreate(BaseModel):
    user_email: str
    joined_at: date = date.today()

class GroupMemberResponse(BaseModel):
    id: int
    group_id: int
    user_id: int
    joined_at: date
    left_at: Optional[date] = None
    user: UserResponse

    class Config:
        from_attributes = True

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    default_currency: str = "INR"

class GroupCreate(GroupBase):
    members: List[GroupMemberCreate] = []

class GroupResponse(GroupBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class GroupDetailResponse(GroupResponse):
    members: List[GroupMemberResponse] = []

    class Config:
        from_attributes = True
