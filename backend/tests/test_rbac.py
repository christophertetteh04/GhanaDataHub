"""RBAC (Role-Based Access Control) tests for GhanaDataHub.

Uses shared fixtures from backend/tests/conftest.py:
- client
- auth_headers (super_admin)
- viewer_headers (viewer)
- second_user

All tests include docstrings and AAA (Arrange, Act, Assert) comments.
"""


class TestViewerRestrictions:
    def test_viewer_cannot_upload_dataset(self, client, viewer_headers):
        """Viewer should be forbidden from uploading datasets."""
        # Arrange
        # Use a minimal CSV payload.
        import io

        payload = {
            "title": "Viewer Upload Should Fail",
            "visibility": "public",
            "tags": "ghana,regions",
        }
        csv = (
            "region,population,gdp_usd\n" 
            "Greater Accra,5400000,12000000000\n"
            "Ashanti,5310000,9000000000"
        ).encode("utf-8")

        # Act
        resp = client.post(
            "/api/v1/datasets/",
            headers=viewer_headers,
            data=payload,
            files={"file": ("ghana_regions.csv", io.BytesIO(csv), "text/csv")},
        )

        # Assert
        assert resp.status_code in (401, 403)

    def test_viewer_cannot_create_organization(self, client, viewer_headers):
        """Viewer should be forbidden from creating organizations."""
        # Arrange
        org_payload = {
            "name": "Viewer Org",
            "description": "Created by viewer should fail",
        }

        # Act
        resp = client.post("/api/v1/organizations/", headers=viewer_headers, json=org_payload)

        # Assert
        assert resp.status_code in (401, 403)

    def test_viewer_cannot_access_users_list(self, client, viewer_headers):
        """Viewer should be forbidden from accessing users list."""
        # Arrange

        # Act
        resp = client.get("/api/v1/users/", headers=viewer_headers)

        # Assert
        assert resp.status_code in (401, 403)

    def test_viewer_cannot_access_audit_logs(self, client, viewer_headers):
        """Viewer should be forbidden from accessing audit logs."""
        # Arrange

        # Act
        resp = client.get("/api/v1/audit/", headers=viewer_headers)

        # Assert
        assert resp.status_code in (401, 403)


class TestSuperAdminPowers:
    def test_super_admin_can_access_audit_logs(self, client, auth_headers):
        """Super admin should be allowed to access audit logs."""
        # Arrange

        # Act
        resp = client.get("/api/v1/audit/", headers=auth_headers)

        # Assert
        assert resp.status_code in (200, 204)

    def test_super_admin_can_suspend_user(self, client, auth_headers, second_user):
        """Super admin should be able to suspend users."""
        # Arrange
        user_payload = second_user
        user_id = user_payload.get("id") or user_payload.get("user_id")
        assert user_id is not None

        # Act
        resp = client.patch(
            f"/api/v1/users/{user_id}/suspend",
            headers=auth_headers,
            json={"is_suspended": True},
        )

        # Assert
        assert resp.status_code in (200, 204)

    def test_super_admin_can_change_user_role(self, client, auth_headers, second_user):
        """Super admin should be able to change a user's role."""
        # Arrange
        user_payload = second_user
        user_id = user_payload.get("id") or user_payload.get("user_id")
        assert user_id is not None

        # Act
        resp = client.patch(
            f"/api/v1/users/{user_id}/role",
            headers=auth_headers,
            json={"role": "viewer"},
        )

        # Assert
        # Accept common success shapes.
        assert resp.status_code in (200, 204)


class TestUnauthenticatedAccess:
    def test_unauthenticated_can_read_public_datasets(self, client):
        """Unauthenticated users should be able to read public datasets."""
        # Arrange

        # Act
        resp = client.get("/api/v1/datasets/?visibility=public")

        # Assert
        assert resp.status_code in (200, 204)

    def test_unauthenticated_cannot_read_private_dataset(self, client):
        """Unauthenticated users should not be able to read private datasets."""
        # Arrange
        # Try to find any private dataset id by querying the private list.
        # If the API doesn't support listing private datasets, this call may return 401/403.

        # Act
        resp = client.get("/api/v1/datasets/?visibility=private")

        # Assert
        assert resp.status_code in (401, 403)

