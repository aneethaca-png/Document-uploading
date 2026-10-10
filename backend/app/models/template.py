import uuid
from sqlalchemy import Column, String, Text, Integer, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin


class Template(Base, TimestampMixin):
    __tablename__ = "templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category_id = Column(Integer, ForeignKey("template_categories.id"), nullable=False)
    body = Column(Text, nullable=False)
    is_duplicate_of = Column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=True)

    user = relationship("User", back_populates="templates")
    category = relationship("TemplateCategory")

    __table_args__ = (
        Index("ix_templates_user_category", "user_id", "category_id"),
    )
