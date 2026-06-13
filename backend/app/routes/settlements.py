from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..repositories.settlement_repository import SettlementRepository
from ..schemas.settlement import SettlementCreate, SettlementResponse
from ..services.auth_service import get_current_user
from ..services.group_service import GroupService
from ..services.settlement_service import SettlementService
from .deps import require_group_member

router = APIRouter()


@router.get("/groups/{group_id}", response_model=list[SettlementResponse])
def list_settlements(group_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_group_member(GroupService(db), group_id, current_user)
    return SettlementRepository(db).get_group_settlements(group_id)


@router.post("/groups/{group_id}", response_model=SettlementResponse, status_code=201)
def create_settlement(group_id: int, payload: SettlementCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_group_member(GroupService(db), group_id, current_user)
    return SettlementService(db).create_settlement(group_id, payload, current_user.id)


@router.delete("/groups/{group_id}/{settlement_id}", status_code=204)
def delete_settlement(group_id: int, settlement_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_group_member(GroupService(db), group_id, current_user)
    SettlementService(db).delete_settlement(group_id, settlement_id, current_user.id)

