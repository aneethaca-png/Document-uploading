import logging
from fastapi import Depends, Cookie, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db

logger = logging.getLogger(__name__)

# Stub — replaced with full JWT implementation in Phase 2


async def get_current_user_stub(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Auth not yet wired")
