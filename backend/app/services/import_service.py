import csv
import uuid
from datetime import datetime, date
from typing import List, Dict, Tuple, Optional
from io import StringIO
from decimal import Decimal
from sqlalchemy.orm import Session
from ..models.import_session import ImportSession, ImportAnomaly
from ..repositories.import_repository import ImportRepository
from ..repositories.user_repository import UserRepository
from ..repositories.group_repository import GroupRepository
import logging

logger = logging.getLogger(__name__)


class ImportService:
    def __init__(self, db: Session):
        self.db = db
        self.import_repository = ImportRepository(db)
        self.user_repository = UserRepository(db)
        self.group_repository = GroupRepository(db)

    def create_import_session(self, group_id: int, user_id: int) -> ImportSession:
        """Create a new import session."""
        session = ImportSession(
            id=str(uuid.uuid4()),
            group_id=group_id,
            user_id=user_id,
            status="UPLOADED"
        )
        created_session = self.import_repository.create_session(session)
        logger.info(f"Import session created: {created_session.id}")
        return created_session

    def parse_csv(self, csv_content: str) -> Tuple[List[Dict], List[ImportAnomaly]]:
        """
        Parse CSV content and return (rows, anomalies).
        Expected columns: date, title, description, amount, currency, paid_by_email, participants (comma-separated), split_type
        """
        rows = []
        anomalies = []
        row_number = 0

        try:
            reader = csv.DictReader(StringIO(csv_content))
            if not reader.fieldnames:
                anomalies.append(ImportAnomaly(
                    row_number=0,
                    field_name=None,
                    issue="CSV is empty or has no headers",
                    severity="ERROR",
                    raw_data={}
                ))
                return rows, anomalies

            required_fields = {"date", "title", "amount", "currency", "paid_by_email", "split_type"}
            if not required_fields.issubset(set(reader.fieldnames or [])):
                missing = required_fields - set(reader.fieldnames or [])
                anomalies.append(ImportAnomaly(
                    row_number=0,
                    field_name=None,
                    issue=f"Missing required fields: {', '.join(missing)}",
                    severity="ERROR",
                    raw_data={"expected": list(required_fields), "got": list(reader.fieldnames or [])}
                ))
                return rows, anomalies

            for row_number, row in enumerate(reader, start=1):
                row_dict = dict(row)
                row_anomalies = self._validate_row(row_number, row_dict)
                anomalies.extend(row_anomalies)

                if not any(a.severity == "ERROR" for a in row_anomalies):
                    rows.append(row_dict)
                else:
                    logger.warning(f"Row {row_number} has errors and will be skipped")

        except Exception as e:
            anomalies.append(ImportAnomaly(
                row_number=0,
                field_name=None,
                issue=f"Failed to parse CSV: {str(e)}",
                severity="ERROR",
                raw_data={"error": str(e)}
            ))
            logger.error(f"CSV parsing error: {str(e)}")

        return rows, anomalies

    def _validate_row(self, row_number: int, row: Dict) -> List[ImportAnomaly]:
        """Validate a single row and return list of anomalies."""
        anomalies = []

        # Validate date
        try:
            date_val = row.get("date", "").strip()
            if not date_val:
                anomalies.append(ImportAnomaly(
                    row_number=row_number,
                    field_name="date",
                    issue="Date is required",
                    severity="ERROR",
                    raw_data=row
                ))
            else:
                datetime.strptime(date_val, "%Y-%m-%d")
        except ValueError as e:
            anomalies.append(ImportAnomaly(
                row_number=row_number,
                field_name="date",
                issue=f"Invalid date format: {str(e)}. Expected YYYY-MM-DD",
                severity="ERROR",
                raw_data=row
            ))

        # Validate title
        if not row.get("title", "").strip():
            anomalies.append(ImportAnomaly(
                row_number=row_number,
                field_name="title",
                issue="Title is required",
                severity="ERROR",
                raw_data=row
            ))

        # Validate amount
        try:
            amount_val = row.get("amount", "").strip()
            if not amount_val:
                anomalies.append(ImportAnomaly(
                    row_number=row_number,
                    field_name="amount",
                    issue="Amount is required",
                    severity="ERROR",
                    raw_data=row
                ))
            else:
                amount = Decimal(amount_val)
                if amount <= 0:
                    anomalies.append(ImportAnomaly(
                        row_number=row_number,
                        field_name="amount",
                        issue="Amount must be positive",
                        severity="ERROR",
                        raw_data=row
                    ))
        except Exception as e:
            anomalies.append(ImportAnomaly(
                row_number=row_number,
                field_name="amount",
                issue=f"Invalid amount: {str(e)}",
                severity="ERROR",
                raw_data=row
            ))

        # Validate currency
        if not row.get("currency", "").strip():
            anomalies.append(ImportAnomaly(
                row_number=row_number,
                field_name="currency",
                issue="Currency is required",
                severity="ERROR",
                raw_data=row
            ))

        # Validate paid_by_email
        if not row.get("paid_by_email", "").strip():
            anomalies.append(ImportAnomaly(
                row_number=row_number,
                field_name="paid_by_email",
                issue="Payer email is required",
                severity="ERROR",
                raw_data=row
            ))

        # Validate split_type
        valid_split_types = {"EQUAL", "EXACT", "PERCENTAGE", "SHARES"}
        split_type = row.get("split_type", "").strip()
        if not split_type:
            anomalies.append(ImportAnomaly(
                row_number=row_number,
                field_name="split_type",
                issue="Split type is required",
                severity="ERROR",
                raw_data=row
            ))
        elif split_type not in valid_split_types:
            anomalies.append(ImportAnomaly(
                row_number=row_number,
                field_name="split_type",
                issue=f"Invalid split type. Must be one of: {', '.join(valid_split_types)}",
                severity="ERROR",
                raw_data=row
            ))

        return anomalies

    def store_anomalies(self, session_id: str, anomalies: List[ImportAnomaly]) -> None:
        """Store anomalies for an import session."""
        if anomalies:
            for anomaly in anomalies:
                anomaly.session_id = session_id
            self.import_repository.create_anomalies(anomalies)

    def get_session_anomalies(self, session_id: str) -> List[ImportAnomaly]:
        """Get anomalies for an import session."""
        return self.import_repository.get_session_anomalies(session_id)

    def update_session_status(self, session_id: str, status: str) -> Optional[ImportSession]:
        """Update session status."""
        return self.import_repository.update_session_status(session_id, status)
