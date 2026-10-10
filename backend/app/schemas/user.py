from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str
    avatar_url: str | None
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    full_name: str | None = None
