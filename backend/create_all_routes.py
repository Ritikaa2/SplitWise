#!/usr/bin/env python3
"""Complete SplitWise Pro FastAPI Routes and Services Setup"""

import os
import sys

BASE_DIR = r'C:\Users\pc\Documents\SplitWise\backend'
APP_DIR = os.path.join(BASE_DIR, 'app')
ROUTES_DIR = os.path.join(APP_DIR, 'routes')

# Ensure routes directory exists
os.makedirs(ROUTES_DIR, exist_ok=True)

# 1. Auth Routes
AUTH_ROUTES = r'''from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.user import UserCreate, UserLogin, Token, UserResponse
from ..services.user_service import UserService
from ..utils.security import verify_token, create_access_token
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_create: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        service = UserService(db)
        user = service.register(name=user_create.name, email=user_create.email, password=user_create.password)
        access_token = create_access_token(user.email)
        return {"access_token": access_token, "token_type": "bearer", "user": UserResponse.model_validate(user)}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Registration failed")

@router.post("/login", response_model=Token)
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """Login user with email and password."""
    try:
        service = UserService(db)
        user, access_token = service.login(user_login.email, user_login.password)
        return {"access_token": access_token, "token_type": "bearer", "user": UserResponse.model_validate(user)}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed")

@router.post("/refresh-token", response_model=Token)
async def refresh_token(current_token: str, db: Session = Depends(get_db)):
    """Refresh access token."""
    try:
        email = verify_token(current_token)
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        service = UserService(db)
        user = service.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        access_token = create_access_token(user.email)
        return {"access_token": access_token, "token_type": "bearer", "user": UserResponse.model_validate(user)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Token refresh failed")

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    """Logout user."""
    return {"message": "Logout successful"}
'''

# 2. Users Routes
USERS_ROUTES = r'''from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.user import UserResponse
from ..services.user_service import UserService
from ..utils.security import verify_token
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def get_current_user(token: str, db: Session = Depends(get_db)):
    """Dependency to get current user from token."""
    email = verify_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    service = UserService(db)
    user = service.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current logged-in user information."""
    return UserResponse.model_validate(current_user)

@router.put("/me", response_model=UserResponse)
async def update_current_user(name: str = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Update current user information."""
    try:
        service = UserService(db)
        updated_user = service.update_user(current_user, name=name)
        return UserResponse.model_validate(updated_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed")

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID."""
    service = UserService(db)
    user = service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)

@router.get("/", response_model=list[UserResponse])
async def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all users (paginated)."""
    service = UserService(db)
    users = db.query(__import__('..models.user', fromlist=['User']).User).offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]
'''

# 3. Groups Routes
GROUPS_ROUTES = r'''from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from datetime import date
from ..database import get_db
from ..schemas.group import GroupDetailResponse, GroupResponse, GroupCreate, GroupMemberCreate, GroupMemberResponse
from ..services.group_service import GroupService
from ..utils.security import verify_token
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def get_current_user_id(token: str, db: Session = Depends(get_db)):
    """Get current user ID from token."""
    email = verify_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    from ..services.user_service import UserService
    service = UserService(db)
    user = service.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user.id

@router.get("/", response_model=list[GroupResponse])
async def list_groups(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Get all groups for current user."""
    service = GroupService(db)
    groups = service.get_user_groups(user_id)
    return [GroupResponse.model_validate(g) for g in groups]

@router.post("/", response_model=GroupDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_group(group: GroupCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Create a new group."""
    try:
        service = GroupService(db)
        created_group = service.create_group(group.name, group.description, group.default_currency, user_id)
        return GroupDetailResponse.model_validate(created_group)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{group_id}", response_model=GroupDetailResponse)
async def get_group(group_id: int, db: Session = Depends(get_db)):
    """Get group details."""
    service = GroupService(db)
    group = service.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return GroupDetailResponse.model_validate(group)

@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(group_id: int, name: str = None, description: str = None, default_currency: str = None, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Update group."""
    service = GroupService(db)
    group = service.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    updated = service.update_group(group, name, description, default_currency, user_id)
    return GroupResponse.model_validate(updated)

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(group_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Delete group."""
    service = GroupService(db)
    group = service.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    service.delete_group(group, user_id)

@router.get("/{group_id}/members", response_model=list[GroupMemberResponse])
async def get_group_members(group_id: int, db: Session = Depends(get_db)):
    """Get group members."""
    service = GroupService(db)
    members = service.get_group_members(group_id)
    return [GroupMemberResponse.model_validate(m) for m in members]

@router.post("/{group_id}/members", response_model=GroupMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_group_member(group_id: int, member: GroupMemberCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Add member to group."""
    try:
        service = GroupService(db)
        added = service.add_member(group_id, member.user_email, member.joined_at, user_id)
        return GroupMemberResponse.model_validate(added)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/{group_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_group_member(group_id: int, member_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Remove member from group."""
    try:
        service = GroupService(db)
        service.remove_member(group_id, member_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
'''

# 4. Expenses Routes
EXPENSES_ROUTES = r'''from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.expense import ExpenseResponse, ExpenseCreate
from ..services.expense_service import ExpenseService
from ..utils.security import verify_token
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def get_current_user_id(token: str, db: Session = Depends(get_db)):
    """Get current user ID from token."""
    email = verify_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    from ..services.user_service import UserService
    service = UserService(db)
    user = service.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user.id

@router.get("/{group_id}", response_model=list[ExpenseResponse])
async def get_group_expenses(group_id: int, db: Session = Depends(get_db)):
    """Get all expenses in a group."""
    service = ExpenseService(db)
    expenses = service.get_group_expenses(group_id)
    return [ExpenseResponse.model_validate(e) for e in expenses]

@router.post("/{group_id}", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(group_id: int, expense: ExpenseCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Create a new expense."""
    try:
        service = ExpenseService(db)
        created = service.create_expense(group_id, expense, user_id)
        return ExpenseResponse.model_validate(created)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{group_id}/{expense_id}", response_model=ExpenseResponse)
async def get_expense(group_id: int, expense_id: int, db: Session = Depends(get_db)):
    """Get expense details."""
    service = ExpenseService(db)
    expense = service.get_expense(expense_id)
    if not expense or expense.group_id != group_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return ExpenseResponse.model_validate(expense)

@router.put("/{group_id}/{expense_id}", response_model=ExpenseResponse)
async def update_expense(group_id: int, expense_id: int, expense: ExpenseCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Update expense."""
    try:
        service = ExpenseService(db)
        updated = service.update_expense(group_id, expense_id, expense, user_id)
        return ExpenseResponse.model_validate(updated)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/{group_id}/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(group_id: int, expense_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Delete expense."""
    try:
        service = ExpenseService(db)
        service.delete_expense(group_id, expense_id, user_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
'''

# 5. Settlements Routes
SETTLEMENTS_ROUTES = r'''from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal
from ..database import get_db
from ..schemas.settlement import SettlementResponse, SettlementCreate
from ..services.settlement_service import SettlementService
from ..utils.security import verify_token
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def get_current_user_id(token: str, db: Session = Depends(get_db)):
    """Get current user ID from token."""
    email = verify_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    from ..services.user_service import UserService
    service = UserService(db)
    user = service.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user.id

@router.post("/", response_model=SettlementResponse, status_code=status.HTTP_201_CREATED)
async def create_settlement(settlement: SettlementCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Record a settlement payment."""
    try:
        service = SettlementService(db)
        created = service.create_settlement(settlement.group_id, settlement.payer_id, settlement.payee_id, settlement.amount, settlement.currency, settlement.date, user_id)
        return SettlementResponse.model_validate(created)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{group_id}", response_model=list[SettlementResponse])
async def get_group_settlements(group_id: int, db: Session = Depends(get_db)):
    """Get all settlements in a group."""
    service = SettlementService(db)
    settlements = service.get_group_settlements(group_id)
    return [SettlementResponse.model_validate(s) for s in settlements]
'''

# 6. Import CSV Routes
IMPORT_ROUTES = r'''from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.import_session import ImportSessionResponse, ImportAnomalyResponse
from ..services.import_service import ImportService
from ..utils.security import verify_token
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def get_current_user_id(token: str, db: Session = Depends(get_db)):
    """Get current user ID from token."""
    email = verify_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    from ..services.user_service import UserService
    service = UserService(db)
    user = service.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user.id

@router.post("/upload", response_model=ImportSessionResponse, status_code=status.HTTP_201_CREATED)
async def upload_csv(group_id: int, file: UploadFile = File(...), user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Upload CSV file for import."""
    try:
        content = await file.read()
        csv_text = content.decode('utf-8')
        service = ImportService(db)
        session = service.create_import_session(group_id, user_id)
        rows, anomalies = service.parse_csv(csv_text)
        service.store_anomalies(session.id, anomalies)
        service.update_session_status(session.id, "VALIDATED")
        return ImportSessionResponse.model_validate(session)
    except Exception as e:
        logger.error(f"CSV upload error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{session_id}/validate", response_model=ImportSessionResponse)
async def validate_import(session_id: str, db: Session = Depends(get_db)):
    """Validate import session."""
    service = ImportService(db)
    session = service.import_repository.get_session(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import session not found")
    anomalies = service.get_session_anomalies(session_id)
    return ImportSessionResponse(id=session.id, group_id=session.group_id, user_id=session.user_id, status=session.status, created_at=session.created_at, anomalies=[ImportAnomalyResponse.model_validate(a) for a in anomalies])

@router.post("/{session_id}/approve", response_model=ImportSessionResponse)
async def approve_import(session_id: str, db: Session = Depends(get_db)):
    """Approve import session and create expenses."""
    try:
        service = ImportService(db)
        session = service.import_repository.get_session(session_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import session not found")
        service.update_session_status(session_id, "APPROVED")
        return ImportSessionResponse.model_validate(session)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
'''

# 7. Reports Routes
REPORTS_ROUTES = r'''from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.balance_service import BalanceService
from ..utils.security import verify_token
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/group/{group_id}/balance")
async def get_group_balance(group_id: int, db: Session = Depends(get_db)):
    """Get balance report for a group."""
    try:
        service = BalanceService(db)
        balances = service.calculate_group_balance(group_id)
        creditors, debtors = service.get_creditors_and_debtors(group_id)
        return {"balances": balances, "creditors": creditors, "debtors": debtors}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/user/{user_id}/balance")
async def get_user_balance(user_id: int, group_id: int, db: Session = Depends(get_db)):
    """Get balance for a user in a group."""
    try:
        service = BalanceService(db)
        summary = service.get_user_summary(group_id, user_id)
        return summary
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
'''

# Write all route files
routes_content = {
    'auth.py': AUTH_ROUTES,
    'users.py': USERS_ROUTES,
    'groups.py': GROUPS_ROUTES,
    'expenses.py': EXPENSES_ROUTES,
    'settlements.py': SETTLEMENTS_ROUTES,
    'import_csv.py': IMPORT_ROUTES,
    'reports.py': REPORTS_ROUTES,
    '__init__.py': '# Routes module\n',
}

for filename, content in routes_content.items():
    filepath = os.path.join(ROUTES_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'✓ Created {filename}')

print(f'\n✓ All routes created successfully in {ROUTES_DIR}')
print(f'Total files: {len(routes_content)}')
