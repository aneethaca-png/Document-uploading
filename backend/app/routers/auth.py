import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.google_oauth import build_google_auth_url, exchange_code_for_tokens, get_google_user_info, generate_state
from app.auth.jwt_handler import create_access_token, get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory state store (use Redis in production)
_oauth_states: set[str] = set()


@router.get("/google")
async def google_login():
    state = generate_state()
    _oauth_states.add(state)
    url = build_google_auth_url(state)
    return RedirectResponse(url=url)


@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    state: str = Query(...),
    response: Response = Response(),
    db: Session = Depends(get_db),
):
    if state not in _oauth_states:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    _oauth_states.discard(state)

    try:
        tokens = await exchange_code_for_tokens(code)
        user_info = await get_google_user_info(tokens["access_token"])
    except Exception:
        logger.exception("Google OAuth token exchange failed")
        raise HTTPException(status_code=400, detail="OAuth token exchange failed")

    google_id = user_info.get("id", "")
    email = user_info.get("email", "")
    full_name = user_info.get("name", email.split("@")[0])
    avatar_url = user_info.get("picture")

    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = User(
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            google_id=google_id,
        )
        db.add(user)
    else:
        user.avatar_url = avatar_url
        if not user.full_name:
            user.full_name = full_name

    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    redirect = RedirectResponse(url="/dashboard", status_code=302)
    redirect.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60,
    )
    return redirect


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.full_name is not None:
        current_user.full_name = body.full_name
    db.commit()
    db.refresh(current_user)
    return current_user
