import io
import pytest


def test_list_datasets_public(client):
    resp = client.get("/api/v1/datasets/")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


def test_create_dataset_requires_auth(client):
    resp = client.post("/api/v1/datasets/")
    assert resp.status_code == 403


def test_create_dataset_success(client, auth_headers):
    csv_content = b"id,name,value\n1,Alice,100\n2,Bob,200"
    resp = client.post(
        "/api/v1/datasets/",
        headers=auth_headers,
        data={
            "title": "Test Dataset",
            "description": "A test dataset",
            "visibility": "public",
            "tags": "test,demo",
        },
        files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test Dataset"
    assert data["version"] == 1
    assert len(data["tags"]) == 2
    return data


def test_get_dataset(client, auth_headers):
    # Create first
    csv_content = b"a,b\n1,2"
    create_resp = client.post(
        "/api/v1/datasets/",
        headers=auth_headers,
        data={"title": "Get Test", "visibility": "public"},
        files={"file": ("a.csv", io.BytesIO(csv_content), "text/csv")},
    )
    dataset_id = create_resp.json()["id"]
    resp = client.get(f"/api/v1/datasets/{dataset_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == dataset_id


def test_get_private_dataset_unauthorized(client, auth_headers):
    csv_content = b"a,b\n1,2"
    create_resp = client.post(
        "/api/v1/datasets/",
        headers=auth_headers,
        data={"title": "Private Set", "visibility": "private"},
        files={"file": ("priv.csv", io.BytesIO(csv_content), "text/csv")},
    )
    dataset_id = create_resp.json()["id"]
    # Access without auth
    resp = client.get(f"/api/v1/datasets/{dataset_id}")
    assert resp.status_code == 403


def test_delete_dataset(client, auth_headers):
    csv_content = b"x,y\n1,2"
    create_resp = client.post(
        "/api/v1/datasets/",
        headers=auth_headers,
        data={"title": "Delete Me", "visibility": "public"},
        files={"file": ("del.csv", io.BytesIO(csv_content), "text/csv")},
    )
    dataset_id = create_resp.json()["id"]
    del_resp = client.delete(f"/api/v1/datasets/{dataset_id}", headers=auth_headers)
    assert del_resp.status_code == 204
    get_resp = client.get(f"/api/v1/datasets/{dataset_id}")
    assert get_resp.status_code == 404


def test_search_datasets(client, auth_headers):
    csv_content = b"col\n1"
    client.post(
        "/api/v1/datasets/",
        headers=auth_headers,
        data={"title": "Ghana Economy Data 2024", "visibility": "public"},
        files={"file": ("econ.csv", io.BytesIO(csv_content), "text/csv")},
    )
    resp = client.get("/api/v1/search/?q=Ghana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1


def test_dataset_versions(client, auth_headers):
    csv_content = b"a\n1"
    create_resp = client.post(
        "/api/v1/datasets/",
        headers=auth_headers,
        data={"title": "Version Test", "visibility": "public"},
        files={"file": ("v1.csv", io.BytesIO(csv_content), "text/csv")},
    )
    dataset_id = create_resp.json()["id"]

    # Update creates version 2
    client.put(
        f"/api/v1/datasets/{dataset_id}",
        headers=auth_headers,
        data={"title": "Version Test Updated", "change_summary": "Added column"},
        files={"file": ("v2.csv", io.BytesIO(b"a,b\n1,2"), "text/csv")},
    )

    versions_resp = client.get(f"/api/v1/datasets/{dataset_id}/versions", headers=auth_headers)
    assert versions_resp.status_code == 200
    versions = versions_resp.json()
    assert len(versions) == 2
