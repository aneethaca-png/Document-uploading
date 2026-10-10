from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID


class FileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    file_type: str
    file_size_bytes: int
    created_at: datetime
    # file_path intentionally excluded — never exposed via API
