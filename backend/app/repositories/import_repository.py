from sqlalchemy.orm import Session
from datetime import date
from ..models.import_session import ImportSession, ImportAnomaly
from ..models.exchange_rate import ExchangeRate
from ..models.audit_log import AuditLog

class ImportRepository:
    def __init__(self, db: Session):
        self.db = db

    # Import Sessions
    def create_session(self, session: ImportSession) -> ImportSession:
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_session(self, session_id: str) -> ImportSession | None:
        return self.db.query(ImportSession).filter(ImportSession.id == session_id).first()

    def update_session_status(self, session_id: str, status: str) -> ImportSession | None:
        session = self.get_session(session_id)
        if session:
            session.status = status
            self.db.commit()
            self.db.refresh(session)
        return session

    # Anomalies
    def create_anomalies(self, anomalies: list[ImportAnomaly]) -> None:
        self.db.add_all(anomalies)
        self.db.commit()

    def get_session_anomalies(self, session_id: str) -> list[ImportAnomaly]:
        return self.db.query(ImportAnomaly).filter(ImportAnomaly.session_id == session_id).order_by(ImportAnomaly.row_number.asc()).all()

    def get_anomaly(self, anomaly_id: int) -> ImportAnomaly | None:
        return self.db.query(ImportAnomaly).filter(ImportAnomaly.id == anomaly_id).first()

    def mark_anomaly_resolved(self, anomaly_id: int) -> None:
        anomaly = self.get_anomaly(anomaly_id)
        if anomaly:
            anomaly.resolved = True
            self.db.commit()

    # Exchange Rates
    def get_exchange_rate(self, from_currency: str, to_currency: str, effective_date: date) -> float:
        if from_currency == to_currency:
            return 1.0
        # Try to find exact match
        rate_record = self.db.query(ExchangeRate).filter(
            ExchangeRate.from_currency == from_currency,
            ExchangeRate.to_currency == to_currency,
            ExchangeRate.effective_date <= effective_date
        ).order_by(ExchangeRate.effective_date.desc()).first()
        
        if rate_record:
            return float(rate_record.rate)
            
        # Fallback default hardcoded exchange rate
        if from_currency == "USD" and to_currency == "INR":
            return 83.00
        elif from_currency == "INR" and to_currency == "USD":
            return 1.0 / 83.00
            
        return 1.0

    # Audit Logs
    def log_action(self, user_id: int | None, action: str, entity_type: str, entity_id: int | None = None, details: str | None = None) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_audit_logs(self, limit: int = 50) -> list[AuditLog]:
        return self.db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
