from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..repositories.import_repository import ImportRepository
from ..services.auth_service import get_current_user
from ..services.group_service import GroupService
from ..services.import_engine import ImportEngine
from .deps import require_group_member

router = APIRouter()


class ApprovalPayload(BaseModel):
    actions: list[dict]


@router.post("/groups/{group_id}/sessions")
async def upload_csv(group_id: int, file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_group_member(GroupService(db), group_id, current_user)
    engine = ImportEngine(db)
    rows = engine.parse_csv_to_rows(await file.read())
    session = engine.validate_csv_data(group_id, current_user.id, rows)
    anomalies = ImportRepository(db).get_session_anomalies(session.id)
    return {"session_id": session.id, "status": session.status, "rows": len(rows), "anomalies": anomalies}


@router.get("/sessions/{session_id}/anomalies")
def get_anomalies(session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = ImportRepository(db).get_session(session_id)
    if session:
        require_group_member(GroupService(db), session.group_id, current_user)
    return ImportRepository(db).get_session_anomalies(session_id)


@router.post("/sessions/{session_id}/approve")
def approve_import(session_id: str, payload: ApprovalPayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = ImportRepository(db).get_session(session_id)
    if session:
        require_group_member(GroupService(db), session.group_id, current_user)
    return ImportEngine(db).process_approved_import(session_id, payload.actions, current_user.id)

