import uuid
from tests.conftest import requires_db


@requires_db
def test_list_categories(auth_client):
    r = auth_client.get("/api/v1/templates/categories")
    assert r.status_code == 200
    names = [c["name"] for c in r.json()]
    assert "Contracts" in names


@requires_db
def test_create_template(auth_client, category):
    r = auth_client.post("/api/v1/templates", json={
        "title": "Test NDA",
        "category_id": category.id,
        "body": "This is between {{client_name}} and {{company_name}}.",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Test NDA"
    assert data["category"]["name"] == "Contracts"


@requires_db
def test_get_template(auth_client, category):
    create = auth_client.post("/api/v1/templates", json={
        "title": "Get Test",
        "category_id": category.id,
        "body": "Hello {{name}}",
    })
    tid = create.json()["id"]

    r = auth_client.get(f"/api/v1/templates/{tid}")
    assert r.status_code == 200
    assert r.json()["id"] == tid


@requires_db
def test_update_template(auth_client, category):
    create = auth_client.post("/api/v1/templates", json={
        "title": "Original",
        "category_id": category.id,
        "body": "Body",
    })
    tid = create.json()["id"]

    r = auth_client.put(f"/api/v1/templates/{tid}", json={"title": "Updated"})
    assert r.status_code == 200
    assert r.json()["title"] == "Updated"


@requires_db
def test_delete_template(auth_client, category):
    create = auth_client.post("/api/v1/templates", json={
        "title": "Delete Me",
        "category_id": category.id,
        "body": "Body",
    })
    tid = create.json()["id"]

    r = auth_client.delete(f"/api/v1/templates/{tid}")
    assert r.status_code == 204

    r = auth_client.get(f"/api/v1/templates/{tid}")
    assert r.status_code == 404


@requires_db
def test_duplicate_template(auth_client, category):
    create = auth_client.post("/api/v1/templates", json={
        "title": "Original",
        "category_id": category.id,
        "body": "Body",
    })
    tid = create.json()["id"]

    r = auth_client.post(f"/api/v1/templates/{tid}/duplicate")
    assert r.status_code == 201
    data = r.json()
    assert "(Copy)" in data["title"]
    assert data["is_duplicate_of"] == tid


@requires_db
def test_extract_variables(auth_client, category):
    create = auth_client.post("/api/v1/templates", json={
        "title": "Var Test",
        "category_id": category.id,
        "body": "Hello {{name}}, your case is {{case_number}}. Regards, {{name}}.",
    })
    tid = create.json()["id"]

    r = auth_client.get(f"/api/v1/templates/{tid}/variables")
    assert r.status_code == 200
    assert r.json() == ["name", "case_number"]


@requires_db
def test_template_ownership(auth_client, client, db, category):
    from app.models.user import User
    from app.auth.jwt_handler import create_access_token

    other_user = User(
        id=uuid.uuid4(),
        email=f"other-{uuid.uuid4()}@example.com",
        full_name="Other User",
        google_id=str(uuid.uuid4()),
    )
    db.add(other_user)
    db.commit()

    create = auth_client.post("/api/v1/templates", json={
        "title": "Mine",
        "category_id": category.id,
        "body": "Body",
    })
    tid = create.json()["id"]

    other_token = create_access_token(str(other_user.id))
    client.cookies.set("access_token", other_token)
    r = client.get(f"/api/v1/templates/{tid}")
    assert r.status_code == 403


@requires_db
def test_list_templates_unauthenticated(client):
    r = client.get("/api/v1/templates")
    assert r.status_code == 401
