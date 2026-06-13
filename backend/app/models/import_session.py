from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, JSON, Index
from sqlalchemy.orm import relationship
from ..database import Base


class ImportSession(Base):
    """ImportSession model for tracking CSV/file import sessions."""

    __tablename__ = "import_sessions"

    # Columns
    id = Column(String(255), primary_key=True, index=True)  # UUID
    group_id = Column(
        Integer,
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    status = Column(
        String(50),
        nullable=False,
        default="UPLOADED"
    )  # UPLOADED, VALIDATED, APPROVED, COMPLETED, FAILED
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    group = relationship("Group", back_populates="import_sessions")
    user = relationship("User", back_populates="import_sessions")
    anomalies = relationship(
        "ImportAnomaly",
        back_populates="session",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<ImportSession(id={self.id}, group_id={self.group_id}, status={self.status})>"


class ImportAnomaly(Base):
    """ImportAnomaly model for tracking data anomalies during import."""

    __tablename__ = "import_anomalies"

    # Columns
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        String(255),
        ForeignKey("import_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    row_number = Column(Integer, nullable=False)
    field_name = Column(String(100), nullable=True)
    issue = Column(String(500), nullable=False)
    severity = Column(String(50), nullable=False)  # ERROR, WARNING
    raw_data = Column(JSON, nullable=False)
    resolved = Column(Boolean, nullable=False, default=False)

    # Indexes
    __table_args__ = (
        Index('idx_anomaly_session', 'session_id'),
    )

    # Relationships
    session = relationship("ImportSession", back_populates="anomalies")

    def __repr__(self) -> str:
        return f"<ImportAnomaly(id={self.id}, session_id={self.session_id}, row={self.row_number}, severity={self.severity})>"
