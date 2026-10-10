import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.template import Template
from app.models.template_category import TemplateCategory
from app.schemas.template import TemplateCreate, TemplateUpdate
from app.services.variable_extractor import extract_variables


def _owned_or_403(template: Template | None, user_id: str) -> Template:
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    if str(template.user_id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return template


def list_templates(
    db: Session,
    user_id: str,
    page: int = 1,
    page_size: int = 20,
    category_id: int | None = None,
    search: str | None = None,
) -> tuple[list[Template], int]:
    query = db.query(Template).filter(Template.user_id == user_id)
    if category_id is not None:
        query = query.filter(Template.category_id == category_id)
    if search:
        query = query.filter(Template.title.ilike(f"%{search}%"))
    total = query.count()
    items = query.order_by(Template.updated_at.desc().nulls_last(), Template.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_template(db: Session, template_id: str, user_id: str) -> Template:
    t = db.query(Template).filter(Template.id == template_id).first()
    return _owned_or_403(t, user_id)


def create_template(db: Session, user_id: str, data: TemplateCreate) -> Template:
    category = db.query(TemplateCategory).filter(TemplateCategory.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")

    template = Template(
        id=uuid.uuid4(),
        user_id=user_id,
        title=data.title,
        category_id=data.category_id,
        body=data.body,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def update_template(db: Session, template_id: str, user_id: str, data: TemplateUpdate) -> Template:
    template = get_template(db, template_id, user_id)

    if data.title is not None:
        template.title = data.title
    if data.category_id is not None:
        category = db.query(TemplateCategory).filter(TemplateCategory.id == data.category_id).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")
        template.category_id = data.category_id
    if data.body is not None:
        template.body = data.body

    db.commit()
    db.refresh(template)
    return template


def delete_template(db: Session, template_id: str, user_id: str) -> None:
    template = get_template(db, template_id, user_id)
    db.delete(template)
    db.commit()


def duplicate_template(db: Session, template_id: str, user_id: str) -> Template:
    original = get_template(db, template_id, user_id)
    copy = Template(
        id=uuid.uuid4(),
        user_id=user_id,
        title=f"{original.title} (Copy)",
        category_id=original.category_id,
        body=original.body,
        is_duplicate_of=original.id,
    )
    db.add(copy)
    db.commit()
    db.refresh(copy)
    return copy


def get_variables(db: Session, template_id: str, user_id: str) -> list[str]:
    template = get_template(db, template_id, user_id)
    return extract_variables(template.body)


def list_categories(db: Session) -> list[TemplateCategory]:
    return db.query(TemplateCategory).order_by(TemplateCategory.name).all()
