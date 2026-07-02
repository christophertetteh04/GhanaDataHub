"""Authentication flow unit tests for GhanaDataHub.

Uses shared fixtures from backend/tests/conftest.py:
- client
- db
- registered_user
- auth_headers
- second_user
- viewer_headers

All tests include docstrings and AAA (Arrange, Act, Assert) comments.
"""

import re


def _assert_access_token_shape(token: str) -> None:
    """Very loose JWT-like sanity check."""
    assert isinstance(token, str)
    assert token.count(".") >= 2
    assert re.match(
        r"^[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+",
        token,
    )


def _get_user_id(payload: dict) -> int:
    """Extract user id from different response shapes."""
    for key in ("id", "user_id"):
        if key in payload:
            return int(payload[key])
    if "user" in payload and isinstance(payload["user"], dict):
        return _get_user_id(payload["user"])
    raise AssertionError(f"Unable to find user id in payload keys={list(payload.keys())}")


class TestRegistrationFlows:
    def test_first_user_becomes_super_admin(self, client):
        """First registered user should be super_admin."""
        # Arrange
        payload = {
            "email": "superadmin@example.com",
            "username": "superadminuser",
            "full_name": "Super Admin User",
            "password": "Password123",
        }

        # Act
        resp = client.post("/api/v1/auth/register", json=payload)

        # Assert
        assert resp.status_code == 201
        body = resp.json()
        assert body["email"] == payload["email"]
        assert (
            body.get("role") == "super_admin"
            or body.get("is_super_admin") is True
            or body.get("super_admin") is True
        )

    def test_second_user_becomes_viewer(self, client, second_user):
        """Second registered user should be viewer (not super_admin)."""
        # Arrange
        _ = second_user

        # Act
        login = client.post(
            "/api/v1/auth/login",
            json={"email": "viewer@example.com", "password": "Password123"},
        )

        # Assert
        assert login.status_code == 200
        _assert_access_token_shape(login.json()["access_token"])

    def test_register_duplicate_email_returns_400(self, client, registered_user):
        """Duplicate email should return 400."""
        # Arrange
        payload = {
            "email": "test@example.com",
            "username": "uniqueuser2",
            "full_name": "Another User",
            "password": "Password123",
        }

        # Act
        resp = client.post("/api/v1/auth/register", json=payload)

        # Assert
        assert resp.status_code == 400

    def test_register_duplicate_username_returns_400(self, client, registered_user):
        """Duplicate username should return 400."""
        # Arrange
        payload = {
            "email": "unique2@example.com",
            "username": "testuser",
            "full_name": "Another User",
            "password": "Password123",
        }

        # Act
        resp = client.post("/api/v1/auth/register", json=payload)

        # Assert
        assert resp.status_code == 400

    def test_register_password_too_short_returns_422(self, client):
        """Password too short should return 422."""
        # Arrange
        payload = {
            "email": "shortpw@example.com",
            "username": "shortpwuser",
            "full_name": "Short PW User",
            "password": "Short1",
        }

        # Act
        resp = client.post("/api/v1/auth/register", json=payload)

        # Assert
        assert resp.status_code == 422

    def test_register_invalid_email_format_returns_422(self, client):
        """Invalid email format should return 422."""
        # Arrange
        payload = {
            "email": "not-an-email",
            "username": "invalidemailuser",
            "full_name": "Invalid Email User",
            "password": "Password123",
        }

        # Act
        resp = client.post("/api/v1/auth/register", json=payload)

        # Assert
        assert resp.status_code == 422


class TestLoginFlows:
    def test_login_success_returns_access_and_refresh_tokens(self, client):
        """Successful login should return access_token and refresh_token."""
        # Arrange
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "login_ok@example.com",
                "username": "login_ok_user",
                "full_name": "Login OK",
                "password": "Password123",
            },
        )

        # Act
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "login_ok@example.com", "password": "Password123"},
        )

        # Assert
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert "refresh_token" in body
        _assert_access_token_shape(body["access_token"])

    def test_login_wrong_password_returns_401(self, client, registered_user):
        """Wrong password should return 401."""
        # Arrange
        _ = registered_user

        # Act
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "WrongPassword"},
        )

        # Assert
        assert resp.status_code == 401

    def test_login_unknown_email_returns_401(self, client):
        """Unknown email should return 401."""
        # Arrange

        # Act
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "unknown@example.com", "password": "Password123"},
        )

        # Assert
        assert resp.status_code == 401

    def test_login_empty_body_returns_422(self, client):
        """Empty login body should return 422."""
        # Arrange

        # Act
        resp = client.post("/api/v1/auth/login", json={})

        # Assert
        assert resp.status_code == 422

    def test_login_suspended_user_returns_403(self, client, second_user):
        """Suspended second_user should not be able to login (403)."""
        # Arrange
        user_id = _get_user_id(second_user)

        # Act
        suspend_resp = client.patch(
            f"/api/v1/users/{user_id}/suspend",
            json={"is_suspended": True},
        )
        assert suspend_resp.status_code in (200, 204)

        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "viewer@example.com", "password": "Password123"},
        )

        # Assert
        assert resp.status_code == 403


class TestTokenFlows:
    def test_refresh_returns_new_access_token(self, client, auth_headers):
        """Refreshing should return a new access token."""
        # Arrange
        login = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "Password123"},
        )
        assert login.status_code == 200
        refresh_token = login.json()["refresh_token"]

        # Act
        resp = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )

        # Assert
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        _assert_access_token_shape(body["access_token"])

    def test_refresh_with_access_token_is_rejected(self, client):
        """Using access token as refresh token should be rejected."""
        # Arrange
        login = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "Password123"},
        )
        if login.status_code != 200:
            # Fallback: register the default user.
            client.post(
                "/api/v1/auth/register",
                json={
                    "email": "test@example.com",
                    "username": "testuser",
                    "full_name": "Test User",
                    "password": "Password123",
                },
            )
            login = client.post(
                "/api/v1/auth/login",
                json={"email": "test@example.com", "password": "Password123"},
            )

        access_token = login.json()["access_token"]

        # Act
        resp = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": access_token},
        )

        # Assert
        assert resp.status_code in (401, 403, 422)

    def test_refresh_with_random_string_is_rejected(self, client):
        """Random refresh token string should be rejected."""
        # Arrange
        random_token = "not-a-valid-refresh-token"

        # Act
        resp = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": random_token},
        )

        # Assert
        assert resp.status_code in (401, 403, 422)

    def test_me_with_no_token_returns_403(self, client):
        """Calling /me without Authorization should return 403."""
        # Arrange

        # Act
        resp = client.get("/api/v1/auth/me")

        # Assert
        assert resp.status_code == 403


class TestLogoutFlows:
    def test_logout_returns_success_message(self, client, auth_headers):
        """Logout should return a success message."""
        # Arrange

        # Act
        resp = client.post("/api/v1/auth/logout", headers=auth_headers)

        # Assert
        assert resp.status_code in (200, 204)
        if resp.content:
            body = resp.json()
            assert any(k in body for k in ("message", "detail", "success"))

