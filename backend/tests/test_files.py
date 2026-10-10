import io
import uuid
from tests.conftest import requires_db


@requires_db
def test_upload_pdf(auth_client):
    r = auth_client.post(
        "/api/v1/files/upload",
        files={"file": ("test.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf")},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["filename"] == "test.pdf"
    assert data["file_type"] == "pdf"
    assert "file_path" not in data


@requires_db
def test_upload_invalid_type(auth_client):
    r = auth_client.post(
        "/api/v1/files/upload",
        files={"file": ("test.exe", io.BytesIO(b"binary"), "application/octet-stream")},
    )
    assert r.status_code == 415


@requires_db
def test_list_files(auth_client):
    auth_client.post(
        "/api/v1/files/upload",
        files={"file": ("list_test.pdf", io.BytesIO(b"%PDF test"), "application/pdf")},
    )
    r = auth_client.get("/api/v1/files")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@requires_db
def test_get_file_metadata(auth_client):
    upload = auth_client.post(
        "/api/v1/files/upload",
        files={"file": ("meta.pdf", io.BytesIO(b"%PDF test"), "application/pdf")},
    )
    fid = upload.json()["id"]

    r = auth_client.get(f"/api/v1/files/{fid}")
    assert r.status_code == 200
    assert r.json()["id"] == fid


@requires_db
def test_delete_file(auth_client):
    upload = auth_client.post(
        "/api/v1/files/upload",
        files={"file": ("del.pdf", io.BytesIO(b"%PDF test"), "application/pdf")},
    )
    fid = upload.json()["id"]

    r = auth_client.delete(f"/api/v1/files/{fid}")
    assert r.status_code == 204

    r = auth_client.get(f"/api/v1/files/{fid}")
    assert r.status_code == 404


@requires_db
def test_file_ownership(auth_client, client, db):
    from app.models.user import User
    from app.auth.jwt_handler import create_access_token

    other = User(
        id=uuid.uuid4(),
        email=f"other2-{uuid.uuid4()}@example.com",
        full_name="Other",
        google_id=str(uuid.uuid4()),
    )
    db.add(other)
    db.commit()

    upload = auth_client.post(
        "/api/v1/files/upload",
        files={"file": ("owned.pdf", io.BytesIO(b"%PDF test"), "application/pdf")},
    )
    fid = upload.json()["id"]

    other_token = create_access_token(str(other.id))
    client.cookies.set("access_token", other_token)
    r = client.get(f"/api/v1/files/{fid}")
    assert r.status_code == 403


@requires_db
def test_files_unauthenticated(client):
    r = client.get("/api/v1/files")
    assert r.status_code == 401


# ── Unit tests (no DB required) ──────────────────────────────────────────────

def test_variable_extractor_basic():
    from app.services.variable_extractor import extract_variables

    result = extract_variables("Hello {{name}}, your case {{case_no}} — signed by {{name}}")
    assert result == ["name", "case_no"]  # deduplicated, order preserved


def test_variable_extractor_empty():
    from app.services.variable_extractor import extract_variables

    assert extract_variables("No variables here") == []
    assert extract_variables("") == []


def test_variable_extractor_multiple():
    from app.services.variable_extractor import extract_variables

    result = extract_variables("{{a}} {{b}} {{a}} {{c}} {{b}}")
    assert result == ["a", "b", "c"]
