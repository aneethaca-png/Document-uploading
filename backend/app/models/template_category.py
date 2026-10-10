from sqlalchemy import Column, Integer, String
from app.database import Base


class TemplateCategory(Base):
    __tablename__ = "template_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
