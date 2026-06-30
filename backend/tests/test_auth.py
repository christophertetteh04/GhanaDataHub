import pytest


def test_register_success(client):
    resp = client.post("/api/v1/auth/register", json={
        "email": "user@example.com",
        "username": "newuser",
        "full_name": "New User",
        "password": "StrongPass1",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "user@example.com"
    assert data["username"] == "newuser"
    assert "id" in data


def test_register_duplicate_email(client, registered_user):
    resp = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "another",
        "full_name": "Another",
        "password": "Password123",
    })
    assert resp.status_code == 400


def test_register_weak_password(client):
    resp = client.post("/api/v1/auth/register", json={
        "email": "weak@example.com",
        "username": "weakuser",
        "full_name": "Weak User",
        "password": "123",
    })
    assert resp.status_code == 422


def test_login_success(client, registered_user):
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "Password123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, registered_user):
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


def test_login_unknown_email(client):
    resp = client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com",
        "password": "Password123",
    })
    assert resp.status_code == 401


def test_me(client, auth_headers):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


def test_refresh_token(client, registered_user):
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "Password123",
    })
    refresh_token = login_resp.json()["refresh_token"]
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_me_without_token(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 403
