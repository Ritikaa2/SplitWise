from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from ..database import Base


class Group(Base):
    """Group model for storing group/trip information."""

    __tablename__ = "groups"

    # Columns
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    default_currency = Column(String(10), nullable=False, default="INR")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    members = relationship(
        "GroupMember",
        back_populates="group",
        cascade="all, delete-orphan"
    )
    expenses = relationship(
        "Expense",
        back_populates="group",
        cascade="all, delete-orphan"
    )
    settlements = relationship(
        "Settlement",
        back_populates="group",
        cascade="all, delete-orphan"
    )
    import_sessions = relationship(
        "ImportSession",
        back_populates="group",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Group(id={self.id}, name={self.name}, currency={self.default_currency})>"


class GroupMember(Base):
    """GroupMember model for tracking users in a group."""

    __tablename__ = "group_members"

    # Columns
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(
        Integer,
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    joined_at = Column(Date, nullable=False)
    left_at = Column(Date, nullable=True)

    # Indexes
    __table_args__ = (
        Index('idx_member_group_user', 'group_id', 'user_id'),
        UniqueConstraint('group_id', 'user_id', 'joined_at', name='uq_member_group_user_date'),
    )

    # Relationships
    group = relationship("Group", back_populates="members")
    user = relationship("User", back_populates="group_memberships")

    def __repr__(self) -> str:
        return f"<GroupMember(group_id={self.group_id}, user_id={self.user_id}, joined={self.joined_at})>"
