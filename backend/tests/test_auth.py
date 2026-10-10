from tests.conftest import requires_db


@requires_db
def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@requires_db
def test_me_unauthenticated(client):
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401


@requires_db
def test_me_authenticated(auth_client, test_user):
    r = auth_client.get("/api/v1/auth/me")
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name


@requires_db
def test_update_me(auth_client):
    r = auth_client.put("/api/v1/auth/me", json={"full_name": "Updated Name"})
    assert r.status_code == 200
    assert r.json()["full_name"] == "Updated Name"


@requires_db
def test_logout(auth_client):
    r = auth_client.post("/api/v1/auth/logout")
    assert r.status_code == 200


@requires_db
def test_invalid_token(client):
    client.cookies.set("access_token", "invalid.token.here")
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401
