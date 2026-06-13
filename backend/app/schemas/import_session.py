from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any, Dict

class ImportAnomalyResponse(BaseModel):
    id: int
    session_id: str
    row_number: int
    field_name: Optional[str] = None
    issue: str
    severity: str
    raw_data: Any
    resolved: bool

    class Config:
        from_attributes = True

class ImportSessionResponse(BaseModel):
    id: str
    group_id: int
    user_id: int
    status: str
    created_at: datetime
    anomalies: List[ImportAnomalyResponse] = []

    class Config:
        from_attributes = True

class RowAction(BaseModel):
    row_number: int
    action: str  # SKIP, APPROVE
    overrides: Optional[Dict[str, Any]] = None  # e.g., {"paid_by_id": 3, "participants": [3, 4], "amount": 100.0}

class ImportApprovalRequest(BaseModel):
    actions: List[RowAction]

class ImportReportRow(BaseModel):
    row_number: int
    issue: Optional[str] = None
    severity: Optional[str] = None
    action_taken: str  # IMPORTED, SKIPPED, FIXED_AND_IMPORTED
    timestamp: datetime

class ImportReportResponse(BaseModel):
    session_id: str
    imported_count: int
    skipped_count: int
    report: List[ImportReportRow]
