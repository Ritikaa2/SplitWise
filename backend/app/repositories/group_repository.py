from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import date
from ..models.group import Group, GroupMember
from ..models.user import User

class GroupRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, group_id: int) -> Group | None:
        return self.db.query(Group).filter(Group.id == group_id).first()

    def create(self, group: Group) -> Group:
        self.db.add(group)
        self.db.commit()
        self.db.refresh(group)
        return group

    def update(self, group: Group) -> Group:
        self.db.commit()
        self.db.refresh(group)
        return group

    def delete(self, group: Group) -> None:
        self.db.delete(group)
        self.db.commit()

    def get_user_groups(self, user_id: int) -> list[Group]:
        return self.db.query(Group).join(GroupMember).filter(GroupMember.user_id == user_id).all()

    def add_member(self, group_member: GroupMember) -> GroupMember:
        self.db.add(group_member)
        self.db.commit()
        self.db.refresh(group_member)
        return group_member

    def get_member(self, group_id: int, user_id: int) -> GroupMember | None:
        return self.db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
            GroupMember.left_at.is_(None)
        ).first()

    def get_membership_history(self, group_id: int, user_id: int) -> list[GroupMember]:
        return self.db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id
        ).order_by(GroupMember.joined_at.desc()).all()

    def is_user_active_on_date(self, group_id: int, user_id: int, check_date: date) -> bool:
        # Check if there exists a membership record where check_date is between joined_at and left_at
        membership = self.db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
            GroupMember.joined_at <= check_date,
            or_(
                GroupMember.left_at.is_(None),
                GroupMember.left_at >= check_date
            )
        ).first()
        return membership is not None

    def get_active_members_on_date(self, group_id: int, check_date: date) -> list[User]:
        return self.db.query(User).join(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.joined_at <= check_date,
            or_(
                GroupMember.left_at.is_(None),
                GroupMember.left_at >= check_date
            )
        ).all()
