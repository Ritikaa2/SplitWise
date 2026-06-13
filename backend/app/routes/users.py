from fastapi import APIRouter, Depends

from ..models.user import User
from ..schemas.user import UserResponse
from ..services.auth_service import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

