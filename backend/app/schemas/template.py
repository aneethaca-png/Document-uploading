from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class TemplateCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category_id: int
    body: str = Field(..., min_length=1)


class TemplateUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    category_id: int | None = None
    body: str | None = Field(default=None, min_length=1)


class TemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    category: CategoryResponse
    body: str
    is_duplicate_of: UUID | None
    created_at: datetime
    updated_at: datetime | None


class TemplateListResponse(BaseModel):
    items: list[TemplateResponse]
    total: int
    page: int
    page_size: int
