#!/usr/bin/env python3
"""
Setup script to create all FastAPI route files for SplitWise Pro
Run this from C:\Users\pc\Documents\SplitWise\backend\
"""

import os
import shutil

# Base path
base_path = os.path.dirname(os.path.abspath(__file__))
app_path = os.path.join(base_path, 'app')
routes_path = os.path.join(app_path, 'routes')

# Create routes directory
os.makedirs(routes_path, exist_ok=True)
print(f"✓ Created/verified routes directory: {routes_path}")

# Define all route files
routes_files = {
    'auth.py': '''from fastapi import APIRouter, HTTPException, status, Depends
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
        logger.warning(f"Registration failed: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Registration failed")


@router.post("/login", response_model=Token)
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """Login user with email and password."""
    try:
        service = UserService(db)
        user, access_token = service.login(user_login.email, user_login.password)
        return {"access_token": access_token, "token_type": "bearer", "user": UserResponse.model_validate(user)}
    except ValueError as e:
        logger.warning(f"Login failed for {user_login.email}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"})
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
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
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Token refresh failed")


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    """Logout user."""
    return {"message": "Logout successful"}
''',

    '__init__.py': '''# Routes module''',
}

# Write all files
for filename, content in routes_files.items():
    filepath = os.path.join(routes_path, filename)
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"✓ Created {filename}")

print("\n✓ Routes setup complete!")
print(f"\nRoutes directory: {routes_path}")
print(f"Files created: {len(routes_files)}")
