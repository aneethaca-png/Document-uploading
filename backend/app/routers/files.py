from fastapi import APIRouter, Depends, UploadFile, File, status
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.jwt_handler import get_current_user
from app.models.user import User
from app.schemas.uploaded_file import FileResponse
from app.services import file_service

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await file_service.upload_file(db, str(current_user.id), file)


@router.get("", response_model=list[FileResponse])
async def list_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return file_service.list_files(db, str(current_user.id))


@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return file_service.get_file(db, file_id, str(current_user.id))


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_service.delete_file(db, file_id, str(current_user.id))


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = file_service.get_file(db, file_id, str(current_user.id))
    media_type = "application/pdf" if record.file_type == "pdf" else \
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return FastAPIFileResponse(
        path=record.file_path,
        filename=record.filename,
        media_type=media_type,
    )
