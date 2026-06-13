from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..schemas.group import GroupCreate, GroupDetailResponse, GroupMemberCreate, GroupMemberResponse, GroupResponse
from ..services.auth_service import get_current_user
from ..services.group_service import GroupService
from .deps import require_group_member

router = APIRouter()


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_currency: Optional[str] = None


@router.get("", response_model=list[GroupResponse])
def list_groups(
    search: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    groups = GroupService(db).get_user_groups(current_user.id)
    if search:
        needle = search.lower()
        groups = [g for g in groups if needle in g.name.lower()]
    return groups


@router.post("", response_model=GroupDetailResponse, status_code=201)
def create_group(payload: GroupCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = GroupService(db)
    group = service.create_group(payload.name, payload.description, payload.default_currency, current_user.id)
    for member in payload.members:
        try:
            service.add_member(group.id, member.user_email, member.joined_at, current_user.id)
        except ValueError:
            continue
    return service.get_group(group.id)


@router.get("/{group_id}", response_model=GroupDetailResponse)
def get_group(group_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = GroupService(db)
    require_group_member(service, group_id, current_user)
    group = service.get_group(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.patch("/{group_id}", response_model=GroupResponse)
def update_group(group_id: int, payload: GroupUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = GroupService(db)
    require_group_member(service, group_id, current_user)
    group = service.get_group(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return service.update_group(group, payload.name, payload.description, payload.default_currency, current_user.id)


@router.delete("/{group_id}", status_code=204)
def delete_group(group_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = GroupService(db)
    require_group_member(service, group_id, current_user)
    group = service.get_group(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    service.delete_group(group, current_user.id)


@router.get("/{group_id}/members", response_model=list[GroupMemberResponse])
def list_members(group_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = GroupService(db)
    require_group_member(service, group_id, current_user)
    return service.get_group_members(group_id)


@router.post("/{group_id}/members", response_model=GroupMemberResponse, status_code=201)
def add_member(group_id: int, payload: GroupMemberCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = GroupService(db)
    require_group_member(service, group_id, current_user)
    try:
        return service.add_member(group_id, payload.user_email, payload.joined_at, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/{group_id}/members/{user_id}", response_model=GroupMemberResponse)
def remove_member(group_id: int, user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = GroupService(db)
    require_group_member(service, group_id, current_user)
    try:
        return service.remove_member(group_id, user_id, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{group_id}/active-members", response_model=list[GroupMemberResponse])
def active_members(group_id: int, on: date = Query(default_factory=date.today), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = GroupService(db)
    require_group_member(service, group_id, current_user)
    users = service.get_active_members_on_date(group_id, on)
    group = service.get_group(group_id)
    return [m for m in group.members if m.user_id in {u.id for u in users}]

