import os
import uuid
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg2://doculex_user:doculex_pass@localhost:5432/doculex_test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-secret")

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.template_category import TemplateCategory
from app.auth.jwt_handler import create_access_token

TEST_DB_URL = os.environ["DATABASE_URL"]


def _db_available() -> bool:
    try:
        eng = create_engine(TEST_DB_URL, connect_args={"connect_timeout": 3})
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


DB_AVAILABLE = _db_available()

requires_db = pytest.mark.skipif(not DB_AVAILABLE, reason="PostgreSQL not available — start the DB to run integration tests")

if DB_AVAILABLE:
    engine = create_engine(TEST_DB_URL)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    engine = None
    TestingSessionLocal = None


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    if not DB_AVAILABLE:
        yield
        return
    from fastapi.testclient import TestClient
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    for name in ["Contracts", "Notices", "Pleadings", "Affidavits"]:
        if not db.query(TemplateCategory).filter_by(name=name).first():
            db.add(TemplateCategory(name=name))
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    user = User(
        id=uuid.uuid4(),
        email=f"test-{uuid.uuid4()}@example.com",
        full_name="Test User",
        google_id=str(uuid.uuid4()),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_client(client, test_user):
    token = create_access_token(str(test_user.id))
    client.cookies.set("access_token", token)
    return client


@pytest.fixture
def category(db):
    return db.query(TemplateCategory).filter_by(name="Contracts").first()
