from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from ..repositories.settlement_repository import SettlementRepository
from ..repositories.group_repository import GroupRepository
from ..repositories.user_repository import UserRepository
from ..repositories.import_repository import ImportRepository
from ..models.settlement import Settlement
from ..schemas.settlement import SettlementCreate
from .currency_service import CurrencyService

class SettlementService:
    def __init__(self, db: Session):
        self.db = db
        self.settlement_repo = SettlementRepository(db)
        self.group_repo = GroupRepository(db)
        self.user_repo = UserRepository(db)
        self.import_repo = ImportRepository(db)
        self.currency_service = CurrencyService(db)

    def create_settlement(self, group_id: int, settlement_in: SettlementCreate, acting_user_id: int) -> Settlement:
        # Verify group
        group = self.group_repo.get_by_id(group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        # Verify members
        payer_active = self.group_repo.is_user_active_on_date(group_id, settlement_in.payer_id, settlement_in.date)
        payee_active = self.group_repo.is_user_active_on_date(group_id, settlement_in.payee_id, settlement_in.date)

        if not payer_active or not payee_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payer and Payee must be active members of the group on the settlement date."
            )

        # Convert to INR
        converted_amount = self.currency_service.convert_to_inr(
            settlement_in.amount, settlement_in.currency, settlement_in.date
        )

        settlement = Settlement(
            group_id=group_id,
            payer_id=settlement_in.payer_id,
            payee_id=settlement_in.payee_id,
            amount=settlement_in.amount,
            currency=settlement_in.currency,
            converted_amount_inr=converted_amount,
            date=settlement_in.date
        )
        created_settlement = self.settlement_repo.create(settlement)

        # Log action
        payer_user = self.user_repo.get_by_id(settlement_in.payer_id)
        payee_user = self.user_repo.get_by_id(settlement_in.payee_id)
        payer_name = payer_user.name if payer_user else f"User {settlement_in.payer_id}"
        payee_name = payee_user.name if payee_user else f"User {settlement_in.payee_id}"

        self.import_repo.log_action(
            user_id=acting_user_id,
            action="CREATE_SETTLEMENT",
            entity_type="settlement",
            entity_id=created_settlement.id,
            details=f"Recorded settlement: {payer_name} paid {settlement_in.amount} {settlement_in.currency} to {payee_name} in group {group_id}"
        )

        return created_settlement

    def delete_settlement(self, group_id: int, settlement_id: int, acting_user_id: int) -> None:
        settlement = self.settlement_repo.get_by_id(settlement_id)
        if not settlement or settlement.group_id != group_id:
            raise HTTPException(status_code=404, detail="Settlement not found in this group")

        self.settlement_repo.delete(settlement)

        # Log action
        self.import_repo.log_action(
            user_id=acting_user_id,
            action="DELETE_SETTLEMENT",
            entity_type="settlement",
            entity_id=settlement_id,
            details=f"Deleted settlement ID {settlement_id} in group {group_id}"
        )
