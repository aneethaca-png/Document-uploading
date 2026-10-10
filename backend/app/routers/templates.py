from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.jwt_handler import get_current_user
from app.models.user import User
from app.schemas.template import (
    TemplateCreate, TemplateUpdate, TemplateResponse,
    TemplateListResponse, CategoryResponse,
)
from app.services import template_service

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return template_service.list_categories(db)


@router.get("", response_model=TemplateListResponse)
async def list_templates(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: int | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = template_service.list_templates(
        db, str(current_user.id), page, page_size, category_id, search
    )
    return TemplateListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    body: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return template_service.create_template(db, str(current_user.id), body)


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return template_service.get_template(db, template_id, str(current_user.id))


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: str,
    body: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return template_service.update_template(db, template_id, str(current_user.id), body)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template_service.delete_template(db, template_id, str(current_user.id))


@router.post("/{template_id}/duplicate", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return template_service.duplicate_template(db, template_id, str(current_user.id))


@router.get("/{template_id}/variables", response_model=list[str])
async def get_variables(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return template_service.get_variables(db, template_id, str(current_user.id))
