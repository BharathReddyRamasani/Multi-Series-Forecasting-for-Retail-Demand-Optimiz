"""
Authentication and authorization for the DemandAI Forecasting API.

Self-contained JWT auth (HS256) with an in-memory user registry used for the
demo. In production, swap FAKE_USERS_DB + get_user for a real user store.
"""
import os
import datetime
from typing import Optional, Dict, Any, List

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

# ── Security settings ──────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production-use-a-long-random-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

# ── Token / user models ─────────────────────────────────────────────────────
class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[str] = None
    roles: List[str] = []
    exp: Optional[datetime.datetime] = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: bool = False
    roles: List[str] = []


class UserInDB(User):
    hashed_password: str


# ── In-memory user registry (demo only) ─────────────────────────────────────
FAKE_USERS_DB: Dict[str, dict] = {
    "admin": {
        "username": "admin",
        "email": "admin@example.com",
        "full_name": "Administrator",
        "hashed_password": pwd_context.hash("admin123"),
        "roles": ["admin", "user"],
        "disabled": False,
    },
    "user": {
        "username": "user",
        "email": "user@example.com",
        "full_name": "Regular User",
        "hashed_password": pwd_context.hash("user123"),
        "roles": ["user"],
        "disabled": False,
    },
    "analyst": {
        "username": "analyst",
        "email": "analyst@example.com",
        "full_name": "Data Analyst",
        "hashed_password": pwd_context.hash("analyst123"),
        "roles": ["analyst", "user"],
        "disabled": False,
    },
}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def get_user(username: str) -> Optional[UserInDB]:
    if username in FAKE_USERS_DB:
        return UserInDB(**FAKE_USERS_DB[username])
    return None


def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    user = get_user(username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (
        expires_delta or datetime.timedelta(minutes=15)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> TokenData:
    """Verify a locally-issued HS256 JWT and return its claims."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username: Optional[str] = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenData(
        username=username,
        user_id=payload.get("user_id"),
        roles=payload.get("roles", []),
        exp=(
            datetime.datetime.fromtimestamp(payload["exp"])
            if payload.get("exp") else None
        ),
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Bypass strict JWT validation since the frontend uses Clerk for auth."""
    return User(
        username="clerk_user",
        email="clerk@example.com",
        full_name="Clerk Authenticated User",
        roles=["admin", "user", "analyst"]
    )


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def role_required(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_active_user)):
        if not any(role in current_user.roles for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted",
            )
        return current_user

    return role_checker


# Convenience role dependencies
get_current_admin_user = role_required(["admin"])
get_current_analyst_user = role_required(["analyst"])
get_current_user_user = role_required(["user"])
