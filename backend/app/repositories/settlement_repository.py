from sqlalchemy.orm import Session
from ..models.settlement import Settlement

class SettlementRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, settlement_id: int) -> Settlement | None:
        return self.db.query(Settlement).filter(Settlement.id == settlement_id).first()

    def create(self, settlement: Settlement) -> Settlement:
        self.db.add(settlement)
        self.db.commit()
        self.db.refresh(settlement)
        return settlement

    def delete(self, settlement: Settlement) -> None:
        self.db.delete(settlement)
        self.db.commit()

    def get_group_settlements(self, group_id: int) -> list[Settlement]:
        return self.db.query(Settlement).filter(Settlement.group_id == group_id).order_by(Settlement.date.desc()).all()
