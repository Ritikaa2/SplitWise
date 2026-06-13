from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session
from ..models.user import User
from ..repositories.user_repository import UserRepository
from ..utils.security import get_password_hash, verify_password, create_access_token
import logging

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = UserRepository(db)

    def register(self, name: str, email: str, password: str) -> User:
        """
        Register a new user.
        Raises ValueError if email already exists.
        """
        existing_user = self.repository.get_by_email(email)
        if existing_user:
            logger.warning(f"Registration attempt with existing email: {email}")
            raise ValueError("Email already registered")

        hashed_password = get_password_hash(password)
        user = User(
            name=name,
            email=email,
            hashed_password=hashed_password
        )
        created_user = self.repository.create(user)
        logger.info(f"User registered: {email} (id={created_user.id})")
        return created_user

    def login(self, email: str, password: str) -> tuple[User, str]:
        """
        Login user and return (user, access_token).
        Raises ValueError if credentials are invalid.
        """
        user = self.repository.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            logger.warning(f"Login failed for email: {email}")
            raise ValueError("Invalid email or password")

        access_token = create_access_token(user.email)
        logger.info(f"User logged in: {email} (id={user.id})")
        return user, access_token

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return self.repository.get_by_id(user_id)

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.repository.get_by_email(email)

    def update_user(self, user: User, name: Optional[str] = None, email: Optional[str] = None, password: Optional[str] = None) -> User:
        """
        Update user information.
        Raises ValueError if new email already exists.
        """
        if email and email != user.email:
            existing_user = self.repository.get_by_email(email)
            if existing_user:
                logger.warning(f"Update attempt with existing email: {email}")
                raise ValueError("Email already in use")
            user.email = email

        if name:
            user.name = name

        if password:
            user.hashed_password = get_password_hash(password)

        updated_user = self.repository.update(user)
        logger.info(f"User updated: {user.email} (id={user.id})")
        return updated_user

    def verify_token(self, email: str) -> bool:
        """Verify that user with given email exists."""
        user = self.repository.get_by_email(email)
        return user is not None
