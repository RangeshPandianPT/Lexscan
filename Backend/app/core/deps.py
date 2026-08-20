from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.db import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_officer(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role not in ("officer", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return current_user


def verify_service_key(x_service_key: str = Header(...)):
    """Dependency for Group 1's ingest endpoint — uses a static service key."""
    if x_service_key != settings.SERVICE_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid service key")
