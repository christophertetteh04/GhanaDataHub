import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app

#SQLALCHEMY_TEST_URL = "sqlite:///./test.db"
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://postgres:password@localhost:5434/ghanadatahub_test"
)

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
#TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
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
def registered_user(client):
    resp = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": "Password123",
    })
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture
def auth_headers(client, registered_user):
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "Password123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def silence_logging():
    '''Suppress log output during tests so results are readable.'''
    import logging
    logging.disable(logging.CRITICAL)
    yield
    logging.disable(logging.NOTSET)


@pytest.fixture
def second_user(client):
    '''A second registered user - becomes viewer (not super_admin).'''
    resp = client.post('/api/v1/auth/register', json={
        'email': 'viewer@example.com', 'username': 'vieweruser',
        'full_name': 'Viewer User', 'password': 'Password123',
    })
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture
def viewer_headers(client, registered_user, second_user):
    '''Auth headers for the viewer user.'''
    resp = client.post('/api/v1/auth/login', json={
        'email': 'viewer@example.com', 'password': 'Password123'
    })
    assert resp.status_code == 200
    return {'Authorization': f'Bearer {resp.json()["access_token"]}'}


@pytest.fixture
def csv_bytes():
    '''Minimal CSV content as bytes for upload tests.'''
    import io
    data = b'region,population,gdp_usd\nGreater Accra,5400000,12000000000\nAshanti,5310000,9000000000'
    return ('ghana_regions.csv', io.BytesIO(data), 'text/csv')


@pytest.fixture
def uploaded_dataset(client, auth_headers, csv_bytes):
    '''A pre-uploaded public dataset for tests needing an existing dataset.'''
    resp = client.post('/api/v1/datasets/', headers=auth_headers,
        data={'title': 'Ghana Regions Data', 'visibility': 'public', 'tags': 'ghana,regions'},
        files={'file': csv_bytes})
    assert resp.status_code == 201, resp.json()
    return resp.json()

