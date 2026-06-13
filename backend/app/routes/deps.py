from fastapi import HTTPException, status

from ..models.user import User
from ..services.group_service import GroupService


def require_group_member(service: GroupService, group_id: int, user: User) -> None:
    if not service.is_member(group_id, user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an active member of this group",
        )

