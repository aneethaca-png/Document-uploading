import uuid
import os
import re
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.config import settings
from app.models.uploaded_file import UploadedFile

ALLOWED_CONTENT_TYPES: dict[str, str] = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}


def _sanitize_filename(filename: str) -> str:
    return re.sub(r'[^\w\-_\. ]', '_', filename)


def _owned_or_403(file: UploadedFile | None, user_id: str) -> UploadedFile:
    if file is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    if str(file.user_id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return file


async def upload_file(db: Session, user_id: str, upload: UploadFile) -> UploadedFile:
    content_type = upload.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF and DOCX files are accepted",
        )

    content = await upload.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit",
        )

    file_type = ALLOWED_CONTENT_TYPES[content_type]
    original_name = upload.filename or "upload"
    safe_name = _sanitize_filename(original_name)
    file_id = str(uuid.uuid4())
    user_dir = os.path.join(settings.UPLOAD_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)
    file_path = os.path.join(user_dir, f"{file_id}_{safe_name}")

    with open(file_path, "wb") as f:
        f.write(content)

    record = UploadedFile(
        id=file_id,
        user_id=user_id,
        filename=original_name,
        file_path=file_path,
        file_type=file_type,
        file_size_bytes=len(content),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_files(db: Session, user_id: str) -> list[UploadedFile]:
    return (
        db.query(UploadedFile)
        .filter(UploadedFile.user_id == user_id)
        .order_by(UploadedFile.created_at.desc())
        .all()
    )


def get_file(db: Session, file_id: str, user_id: str) -> UploadedFile:
    f = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    return _owned_or_403(f, user_id)


def delete_file(db: Session, file_id: str, user_id: str) -> None:
    record = get_file(db, file_id, user_id)
    if os.path.exists(record.file_path):
        os.remove(record.file_path)
    db.delete(record)
    db.commit()
