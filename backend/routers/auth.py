"""Authentication router — login, refresh, current-user, and registration."""
from typing import Optional
import datetime
from fastapi import APIRouter, Form, HTTPException, status, Depends
from pydantic import BaseModel

from auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    get_user,
    get_current_active_user,
    pwd_context,
    FAKE_USERS_DB,
    User,
    Token,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

ACCESS_TOKEN_EXPIRE_MINUTES = 30


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None


def _issue_tokens(user: User) -> dict:
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.username, "roles": user.roles},
        expires_delta=datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(
        data={"sub": user.username, "user_id": user.username}
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/login", response_model=Token)
async def login(username: str = Form(...), password: str = Form(...)):
    """Authenticate and return JWT access + refresh tokens."""
    user = authenticate_user(username, password)
    if not user:
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _issue_tokens(user)


@router.post("/refresh", response_model=Token)
async def refresh(refresh_token: str = Form(...)):
    """Exchange a valid refresh token for a new token pair."""
    from jose import JWTError, jwt
    from auth import SECRET_KEY, ALGORITHM

    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = get_user(username)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _issue_tokens(user)


@router.get("/me", response_model=User)
async def me(current_user: User = Depends(get_current_active_user)):
    """Return the currently authenticated user."""
    return current_user


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    """Register a new user (assigned the 'user' role).

    Note: this is an in-memory demo registry (no persistence layer yet).
    """
    if get_user(req.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already registered",
        )
    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters",
        )
    FAKE_USERS_DB[req.username] = {
        "username": req.username,
        "email": req.email,
        "full_name": req.full_name,
        "hashed_password": pwd_context.hash(req.password),
        "roles": ["user"],
        "disabled": False,
    }
    return User(
        username=req.username,
        email=req.email,
        full_name=req.full_name,
        roles=["user"],
    )
