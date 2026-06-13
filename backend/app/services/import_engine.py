import csv
import io
import uuid
from datetime import datetime, date
from decimal import Decimal
import json
from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..repositories.import_repository import ImportRepository
from ..repositories.group_repository import GroupRepository
from ..repositories.user_repository import UserRepository
from ..models.import_session import ImportSession, ImportAnomaly
from ..schemas.expense import ExpenseCreate, ExpenseParticipantCreate
from .expense_service import ExpenseService

class ImportEngine:
    def __init__(self, db: Session):
        self.db = db
        self.import_repo = ImportRepository(db)
        self.group_repo = GroupRepository(db)
        self.user_repo = UserRepository(db)
        self.expense_service = ExpenseService(db)

    def parse_csv_to_rows(self, contents: bytes) -> list[dict]:
        """
        Parses raw bytes from CSV file upload to a list of dicts.
        """
        text = contents.decode("utf-8")
        f = io.StringIO(text)
        reader = csv.DictReader(f)
        rows = []
        for r in reader:
            # Normalize keys to lowercase and strip whitespace
            normalized_row = {k.strip().lower(): v.strip() for k, v in r.items() if k is not None}
            rows.append(normalized_row)
        return rows

    def validate_csv_data(self, group_id: int, user_id: int, csv_rows: list[dict]) -> ImportSession:
        """
        Runs full anomaly checks on CSV rows, creates a session, logs import anomalies,
        and saves them to the database.
        """
        session_id = str(uuid.uuid4())
        session = ImportSession(
            id=session_id,
            group_id=group_id,
            user_id=user_id,
            status="VALIDATED"
        )
        self.import_repo.create_session(session)

        anomalies = []
        seen_ids = set()

        for idx, row in enumerate(csv_rows, start=1):
            raw_data_json = json.dumps(row)
            
            # Helper to add anomaly
            def add_anomaly(field: str, issue: str, severity: str = "ERROR"):
                anomalies.append(ImportAnomaly(
                    session_id=session_id,
                    row_number=idx,
                    field_name=field,
                    issue=issue,
                    severity=severity,
                    raw_data=raw_data_json
                ))

            # 1. Duplicate ID Check (if CSV provides an id column)
            row_id = row.get("id")
            if row_id:
                if row_id in seen_ids:
                    add_anomaly("id", f"Duplicate row ID detected: {row_id}")
                seen_ids.add(row_id)

            # 2. Title & Description checks
            title = row.get("title", "").strip()
            if not title:
                add_anomaly("title", "Missing expense title")
            
            desc = row.get("description", "").strip()
            if not desc:
                add_anomaly("description", "Empty description", "WARNING")

            # 3. Settlement Logged As Expense Check
            title_lower = title.lower()
            settlement_keywords = ["settle", "payment", "repay", "settlement"]
            if any(k in title_lower for k in settlement_keywords):
                add_anomaly("title", f"Potential settlement logged as expense ('{title}')", "WARNING")

            # 4. Amount Checks
            amount_str = row.get("amount", "")
            amount = None
            if not amount_str:
                add_anomaly("amount", "Missing amount")
            else:
                try:
                    amount = Decimal(amount_str)
                    if amount < 0:
                        add_anomaly("amount", f"Negative amount detected: {amount}")
                    elif amount == 0:
                        add_anomaly("amount", "Amount is zero")
                except ValueError:
                    add_anomaly("amount", f"Invalid amount number format: {amount_str}")

            # 5. Currency Check
            currency = row.get("currency", "INR").strip().upper()
            if currency not in ["USD", "INR"]:
                add_anomaly("currency", f"Unsupported currency '{currency}' (Only USD and INR are supported)")
            else:
                group = self.group_repo.get_by_id(group_id)
                if group and group.default_currency != currency:
                    add_anomaly("currency", f"Currency mismatch: row currency '{currency}' does not match group default currency '{group.default_currency}'", "WARNING")

            # 6. Date Checks
            date_str = row.get("date", "").strip()
            expense_date = None
            if not date_str:
                add_anomaly("date", "Missing expense date")
            else:
                try:
                    # Support ISO format YYYY-MM-DD or standard CSV date formats
                    expense_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                    if expense_date > date.today():
                        add_anomaly("date", f"Future date detected: {expense_date}")
                except ValueError:
                    add_anomaly("date", f"Invalid date format: {date_str} (Use YYYY-MM-DD)")

            # 7. Split Type Check
            split_type = row.get("split_type", "").strip().upper()
            if not split_type:
                add_anomaly("split_type", "Missing split type")
            elif split_type not in ["EQUAL", "EXACT", "PERCENTAGE", "SHARES"]:
                add_anomaly("split_type", f"Invalid split type '{split_type}' (Must be EQUAL, EXACT, PERCENTAGE, or SHARES)")

            # 8. Payer Checks (Missing, Unknown, Active Timeline)
            payer_email = row.get("paid_by_email", "").strip()
            payer_user = None
            if not payer_email:
                add_anomaly("paid_by_email", "Missing payer email")
            else:
                payer_user = self.user_repo.get_by_email(payer_email)
                if not payer_user:
                    add_anomaly("paid_by_email", f"Unknown member: Payer with email '{payer_email}' does not exist in SplitWise Pro")
                elif expense_date:
                    # Check if active member on date
                    is_active = self.group_repo.is_user_active_on_date(group_id, payer_user.id, expense_date)
                    if not is_active:
                        add_anomaly("paid_by_email", f"Payer '{payer_user.name}' was not an active member in the group on {expense_date}")

            # 9. Participants & Split Share Value Checks
            part_emails_str = row.get("participants_emails", "").strip()
            shares_str = row.get("share_values", "").strip()
            
            part_emails = [e.strip() for e in part_emails_str.split(";") if e.strip()] if part_emails_str else []
            shares = [s.strip() for s in shares_str.split(";") if s.strip()] if shares_str else []

            if not part_emails:
                add_anomaly("participants_emails", "Missing participants emails list")
            else:
                # Check each participant
                for p_idx, p_email in enumerate(part_emails):
                    p_user = self.user_repo.get_by_email(p_email)
                    if not p_user:
                        add_anomaly("participants_emails", f"Unknown member: Participant with email '{p_email}' does not exist in SplitWise Pro")
                    else:
                        if expense_date:
                            is_active = self.group_repo.is_user_active_on_date(group_id, p_user.id, expense_date)
                            if not is_active:
                                add_anomaly("participants_emails", f"Participant '{p_user.name}' was not an active member in the group on {expense_date}")

                # If split type is not EQUAL, shares count must match participants count
                if split_type in ["EXACT", "PERCENTAGE", "SHARES"]:
                    if len(shares) != len(part_emails):
                        add_anomaly("share_values", f"Mismatch: split type '{split_type}' requires matching count of share values ({len(shares)} provided for {len(part_emails)} participants)")
                    else:
                        # Validate shares are numbers
                        for sh_idx, sh in enumerate(shares):
                            try:
                                sh_val = Decimal(sh)
                                if sh_val < 0:
                                    add_anomaly("share_values", f"Negative share value detected for participant {part_emails[sh_idx]}: {sh_val}")
                            except ValueError:
                                add_anomaly("share_values", f"Invalid share value number format for participant {part_emails[sh_idx]}: {sh}")

        if anomalies:
            self.import_repo.create_anomalies(anomalies)
            
        return session

    def process_approved_import(self, session_id: str, approved_actions: list[dict], acting_user_id: int) -> dict:
        """
        Processes the user approved actions list, skipping or modifying and creating expenses.
        Generates the final Import Report as a dictionary.
        """
        session = self.import_repo.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Import session not found")

        if session.status in ["COMPLETED", "APPROVED"]:
            raise HTTPException(status_code=400, detail="Import session already processed")

        # Get anomalies
        anomalies = self.import_repo.get_session_anomalies(session_id)
        # Create lookup of approved actions by row number
        actions_lookup = {action["row_number"]: action for action in approved_actions}

        imported_count = 0
        skipped_count = 0
        report_rows = []

        # We parse the original rows from the raw anomalies list
        # Since anomalies store the full raw row dictionary in JSON
        # Let's map row number to raw row data
        rows_data = {}
        row_issues = {}
        for a in anomalies:
            row_num = a.row_number
            rows_data[row_num] = json.loads(a.raw_data)
            if row_num not in row_issues:
                row_issues[row_num] = []
            row_issues[row_num].append(f"{a.field_name or 'Row'}: {a.issue} ({a.severity})")

        # Group ID from session
        group_id = session.group_id

        # Iterate through the row actions
        for row_num, action_data in actions_lookup.items():
            action = action_data.get("action", "SKIP").upper()
            overrides = action_data.get("overrides") or {}
            
            raw_row = rows_data.get(row_num)
            if not raw_row:
                continue

            row_issue_str = "; ".join(row_issues.get(row_num, []))
            severity_str = "ERROR" if "ERROR" in row_issue_str else ("WARNING" if row_issue_str else None)

            if action == "SKIP":
                skipped_count += 1
                report_rows.append({
                    "row_number": row_num,
                    "issue": row_issue_str or "No issue (user skipped)",
                    "severity": severity_str,
                    "action_taken": "SKIPPED",
                    "timestamp": datetime.utcnow()
                })
                continue

            try:
                # Build ExpenseCreate DTO
                # Extract details from raw row, applying overrides if present
                title = overrides.get("title") or raw_row.get("title", "")
                description = overrides.get("description") or raw_row.get("description", "")
                
                amount_str = overrides.get("amount") or raw_row.get("amount", "0")
                amount = Decimal(str(amount_str))
                
                currency = overrides.get("currency") or raw_row.get("currency", "INR")
                currency = currency.strip().upper()
                
                date_str = overrides.get("date") or raw_row.get("date", "")
                expense_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                
                split_type = overrides.get("split_type") or raw_row.get("split_type", "EQUAL")
                split_type = split_type.strip().upper()

                # Get paid_by_id: we need User ID
                payer_email = overrides.get("paid_by_email") or raw_row.get("paid_by_email", "")
                payer_user = self.user_repo.get_by_email(payer_email)
                if not payer_user:
                    raise ValueError(f"Unknown payer email: {payer_email}")
                paid_by_id = payer_user.id

                # Participants list
                part_emails_str = overrides.get("participants_emails") or raw_row.get("participants_emails", "")
                shares_str = overrides.get("share_values") or raw_row.get("share_values", "")
                
                part_emails = [e.strip() for e in part_emails_str.split(";") if e.strip()] if isinstance(part_emails_str, str) else part_emails_str
                shares = [s.strip() for s in shares_str.split(";") if s.strip()] if isinstance(shares_str, str) else shares_str

                participants = []
                for p_idx, p_email in enumerate(part_emails):
                    p_user = self.user_repo.get_by_email(p_email)
                    if not p_user:
                        raise ValueError(f"Unknown participant email: {p_email}")
                    
                    sh_val = None
                    if split_type in ["EXACT", "PERCENTAGE", "SHARES"] and p_idx < len(shares):
                        sh_val = Decimal(str(shares[p_idx]))
                        
                    participants.append(ExpenseParticipantCreate(
                        user_id=p_user.id,
                        share_value=sh_val
                    ))

                # Create Expense Create schema
                expense_create = ExpenseCreate(
                    title=title,
                    description=description,
                    amount=amount,
                    currency=currency,
                    date=expense_date,
                    paid_by_id=paid_by_id,
                    split_type=split_type,
                    participants=participants
                )

                # Create Expense through service (runs database writes and logs audits)
                self.expense_service.create_expense(group_id, expense_create, acting_user_id)
                
                imported_count += 1
                action_taken = "FIXED_AND_IMPORTED" if overrides else "IMPORTED"
                report_rows.append({
                    "row_number": row_num,
                    "issue": row_issue_str or None,
                    "severity": severity_str,
                    "action_taken": action_taken,
                    "timestamp": datetime.utcnow()
                })

            except Exception as e:
                # If row execution fails, report the error
                skipped_count += 1
                report_rows.append({
                    "row_number": row_num,
                    "issue": f"{row_issue_str}; Exec failed: {str(e)}",
                    "severity": "ERROR",
                    "action_taken": "SKIPPED_ON_FAILURE",
                    "timestamp": datetime.utcnow()
                })

        # Update Session
        self.import_repo.update_session_status(session_id, "COMPLETED")

        # Log Session Import completion action
        self.import_repo.log_action(
            user_id=acting_user_id,
            action="CSV_IMPORT_COMPLETE",
            entity_type="import_session",
            entity_id=None,
            details=f"Completed CSV import session {session_id}. Imported: {imported_count}, Skipped: {skipped_count}"
        )

        return {
            "session_id": session_id,
            "imported_count": imported_count,
            "skipped_count": skipped_count,
            "report": report_rows
        }
