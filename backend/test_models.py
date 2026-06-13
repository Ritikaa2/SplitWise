#!/usr/bin/env python
"""Quick test to verify all ORM models are properly defined."""

from app.models import (
    Base,
    User,
    Group,
    GroupMember,
    Expense,
    ExpenseParticipant,
    Settlement,
    ExchangeRate,
    ImportSession,
    ImportAnomaly,
    AuditLog,
)
from app.database import SessionLocal
from datetime import datetime, date
from decimal import Decimal


def test_models_import():
    """Test that all models import successfully."""
    models = [
        User,
        Group,
        GroupMember,
        Expense,
        ExpenseParticipant,
        Settlement,
        ExchangeRate,
        ImportSession,
        ImportAnomaly,
        AuditLog,
    ]
    print("✓ All models imported successfully")
    for model in models:
        print(f"  - {model.__name__} (table: {model.__tablename__})")


def test_model_repr():
    """Test __repr__ methods."""
    print("\n✓ Testing __repr__ methods:")
    
    user = User(id=1, name="John Doe", email="john@example.com", hashed_password="hash")
    print(f"  - User: {repr(user)}")
    
    group = Group(id=1, name="Trip to Europe", default_currency="EUR")
    print(f"  - Group: {repr(group)}")
    
    member = GroupMember(id=1, group_id=1, user_id=1, joined_at=date.today())
    print(f"  - GroupMember: {repr(member)}")
    
    expense = Expense(
        id=1,
        group_id=1,
        title="Dinner",
        amount=Decimal("100.00"),
        currency="EUR",
        converted_amount_inr=Decimal("8300.00"),
        date=date.today(),
        paid_by_id=1,
        split_type="EQUAL",
    )
    print(f"  - Expense: {repr(expense)}")
    
    participant = ExpenseParticipant(
        id=1,
        expense_id=1,
        user_id=2,
        amount_owed=Decimal("50.00"),
    )
    print(f"  - ExpenseParticipant: {repr(participant)}")
    
    settlement = Settlement(
        id=1,
        group_id=1,
        payer_id=1,
        payee_id=2,
        amount=Decimal("50.00"),
        currency="EUR",
        converted_amount_inr=Decimal("4150.00"),
        date=date.today(),
    )
    print(f"  - Settlement: {repr(settlement)}")
    
    exchange_rate = ExchangeRate(
        id=1,
        from_currency="EUR",
        to_currency="INR",
        rate=Decimal("83.00"),
        effective_date=date.today(),
    )
    print(f"  - ExchangeRate: {repr(exchange_rate)}")
    
    import_session = ImportSession(
        id="uuid-123",
        group_id=1,
        user_id=1,
        status="UPLOADED",
    )
    print(f"  - ImportSession: {repr(import_session)}")
    
    anomaly = ImportAnomaly(
        id=1,
        session_id="uuid-123",
        row_number=5,
        field_name="amount",
        issue="Invalid amount format",
        severity="ERROR",
        raw_data={"raw": "data"},
    )
    print(f"  - ImportAnomaly: {repr(anomaly)}")
    
    audit_log = AuditLog(
        id=1,
        user_id=1,
        action="CREATE_EXPENSE",
        entity_type="Expense",
        entity_id=1,
    )
    print(f"  - AuditLog: {repr(audit_log)}")


def test_model_relationships():
    """Test model relationships are correctly configured."""
    print("\n✓ Testing model relationships:")
    
    # Check User relationships
    user_rels = [attr for attr in dir(User) if not attr.startswith('_')]
    assert 'group_memberships' in user_rels
    assert 'expenses_paid' in user_rels
    assert 'settlements_paid' in user_rels
    print("  - User relationships: ✓")
    
    # Check Group relationships
    group_rels = [attr for attr in dir(Group) if not attr.startswith('_')]
    assert 'members' in group_rels
    assert 'expenses' in group_rels
    print("  - Group relationships: ✓")
    
    # Check Expense relationships
    expense_rels = [attr for attr in dir(Expense) if not attr.startswith('_')]
    assert 'paid_by' in expense_rels
    assert 'participants' in expense_rels
    print("  - Expense relationships: ✓")
    
    # Check Settlement relationships
    settlement_rels = [attr for attr in dir(Settlement) if not attr.startswith('_')]
    assert 'payer' in settlement_rels
    assert 'payee' in settlement_rels
    print("  - Settlement relationships: ✓")


def test_model_columns():
    """Test model columns are properly defined."""
    print("\n✓ Testing model columns:")
    
    # Check User columns
    user_columns = {c.name for c in User.__table__.columns}
    assert 'id' in user_columns
    assert 'email' in user_columns
    assert 'hashed_password' in user_columns
    assert 'created_at' in user_columns
    print("  - User columns: ✓")
    
    # Check Expense columns
    expense_columns = {c.name for c in Expense.__table__.columns}
    assert 'group_id' in expense_columns
    assert 'amount' in expense_columns
    assert 'converted_amount_inr' in expense_columns
    assert 'split_type' in expense_columns
    print("  - Expense columns: ✓")
    
    # Check Settlement columns
    settlement_columns = {c.name for c in Settlement.__table__.columns}
    assert 'payer_id' in settlement_columns
    assert 'payee_id' in settlement_columns
    assert 'converted_amount_inr' in settlement_columns
    print("  - Settlement columns: ✓")


if __name__ == "__main__":
    print("=" * 60)
    print("SQLAlchemy ORM Models Test")
    print("=" * 60)
    
    test_models_import()
    test_model_repr()
    test_model_relationships()
    test_model_columns()
    
    print("\n" + "=" * 60)
    print("✓ All tests passed! Models are correctly configured.")
    print("=" * 60)
