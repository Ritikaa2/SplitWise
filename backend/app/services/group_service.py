from datetime import date
from typing import Optional, List
from sqlalchemy.orm import Session
from ..models.group import Group, GroupMember
from ..models.user import User
from ..repositories.group_repository import GroupRepository
from ..repositories.user_repository import UserRepository
from ..repositories.import_repository import ImportRepository
import logging

logger = logging.getLogger(__name__)


class GroupService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = GroupRepository(db)
        self.user_repository = UserRepository(db)
        self.import_repository = ImportRepository(db)

    def create_group(self, name: str, description: Optional[str], default_currency: str, creator_id: int) -> Group:
        """Create a new group and add creator as the first member."""
        group = Group(
            name=name,
            description=description,
            default_currency=default_currency
        )
        created_group = self.repository.create(group)

        member = GroupMember(
            group_id=created_group.id,
            user_id=creator_id,
            joined_at=date.today()
        )
        self.repository.add_member(member)
        
        self.import_repository.log_action(
            user_id=creator_id,
            action="CREATE_GROUP",
            entity_type="group",
            entity_id=created_group.id,
            details=f"Created group '{name}'"
        )
        logger.info(f"Group created: {name} (id={created_group.id}) by user_id={creator_id}")
        return created_group

    def get_group(self, group_id: int) -> Optional[Group]:
        """Get group by ID."""
        return self.repository.get_by_id(group_id)

    def update_group(self, group: Group, name: Optional[str] = None, description: Optional[str] = None, default_currency: Optional[str] = None, user_id: int = None) -> Group:
        """Update group information."""
        if name:
            group.name = name
        if description is not None:
            group.description = description
        if default_currency:
            group.default_currency = default_currency

        updated_group = self.repository.update(group)
        
        if user_id:
            self.import_repository.log_action(
                user_id=user_id,
                action="UPDATE_GROUP",
                entity_type="group",
                entity_id=group.id,
                details=f"Updated group '{group.name}'"
            )
        logger.info(f"Group updated: {group.name} (id={group.id})")
        return updated_group

    def delete_group(self, group: Group, user_id: int = None) -> None:
        """Delete a group."""
        group_id = group.id
        group_name = group.name
        self.repository.delete(group)
        
        if user_id:
            self.import_repository.log_action(
                user_id=user_id,
                action="DELETE_GROUP",
                entity_type="group",
                entity_id=group_id,
                details=f"Deleted group '{group_name}'"
            )
        logger.info(f"Group deleted: {group_name} (id={group_id})")

    def get_user_groups(self, user_id: int) -> List[Group]:
        """Get all groups a user is a member of."""
        return self.repository.get_user_groups(user_id)

    def add_member(self, group_id: int, user_email: str, joined_at: date = None, user_id: int = None) -> GroupMember:
        """
        Add a user to a group.
        Raises ValueError if user doesn't exist or already a member.
        """
        if joined_at is None:
            joined_at = date.today()

        user = self.user_repository.get_by_email(user_email)
        if not user:
            logger.warning(f"Attempt to add non-existent user: {user_email} to group_id={group_id}")
            raise ValueError(f"User with email {user_email} not found")

        existing_member = self.repository.get_member(group_id, user.id)
        if existing_member:
            logger.warning(f"User {user_email} already a member of group_id={group_id}")
            raise ValueError("User is already a member of this group")

        member = GroupMember(
            group_id=group_id,
            user_id=user.id,
            joined_at=joined_at
        )
        added_member = self.repository.add_member(member)
        
        if user_id:
            self.import_repository.log_action(
                user_id=user_id,
                action="ADD_GROUP_MEMBER",
                entity_type="group",
                entity_id=group_id,
                details=f"Added member {user.name} ({user_email}) to group"
            )
        logger.info(f"Member added: user_id={user.id} to group_id={group_id}")
        return added_member

    def remove_member(self, group_id: int, user_id: int, actor_id: int = None) -> Optional[GroupMember]:
        """Remove a user from a group by marking left_at."""
        member = self.repository.get_member(group_id, user_id)
        if not member:
            logger.warning(f"Attempt to remove non-member: user_id={user_id} from group_id={group_id}")
            raise ValueError("User is not a member of this group")

        member.left_at = date.today()
        updated_member = self.repository.update(member)
        
        if actor_id:
            user = self.user_repository.get_by_id(user_id)
            user_name = user.name if user else f"User {user_id}"
            self.import_repository.log_action(
                user_id=actor_id,
                action="REMOVE_GROUP_MEMBER",
                entity_type="group",
                entity_id=group_id,
                details=f"Removed member {user_name} from group"
            )
        logger.info(f"Member removed: user_id={user_id} from group_id={group_id}")
        return updated_member

    def get_group_members(self, group_id: int) -> List[GroupMember]:
        """Get active members of a group."""
        group = self.repository.get_by_id(group_id)
        if not group:
            return []
        return [m for m in group.members if m.left_at is None]

    def is_member(self, group_id: int, user_id: int) -> bool:
        """Check if user is an active member of a group."""
        member = self.repository.get_member(group_id, user_id)
        return member is not None

    def is_user_active_on_date(self, group_id: int, user_id: int, check_date: date) -> bool:
        """Check if user was an active member on a specific date."""
        return self.repository.is_user_active_on_date(group_id, user_id, check_date)

    def get_active_members_on_date(self, group_id: int, check_date: date) -> List[User]:
        """Get users who were active members on a specific date."""
        return self.repository.get_active_members_on_date(group_id, check_date)
