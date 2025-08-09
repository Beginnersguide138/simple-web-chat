import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

# Mock the services before importing the app
with patch('app.services.llm_service.ollama_service', None), \
     patch('app.services.vector_db_service.milvus_service', None):
    from app.main import app

def test_read_root():
    """Test the root endpoint."""
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "RAG" in data["message"] or "Welcome" in data["message"]

def test_health_check():
    """Test the health check endpoint."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

def test_api_documentation():
    """Test that the API documentation is accessible."""
    client = TestClient(app)
    response = client.get("/docs")
    assert response.status_code == 200

def test_openapi_schema():
    """Test that the OpenAPI schema is accessible."""
    client = TestClient(app)
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "info" in data
    assert "paths" in data