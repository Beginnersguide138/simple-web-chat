import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI application."""
    return TestClient(app)


@pytest.fixture
def mock_ollama_service():
    """Mock OllamaService for testing."""
    mock_service = Mock()
    mock_service.generate_embedding.return_value = [0.1, 0.2, 0.3, 0.4, 0.5]
    mock_service.generate_chat_response.return_value = "This is a test response."
    return mock_service


@pytest.fixture
def mock_milvus_service():
    """Mock MilvusService for testing."""
    mock_service = Mock()
    mock_service.search.return_value = [
        {
            "url": "https://example.com",
            "text": "This is test content from example.com",
            "distance": 0.8
        },
        {
            "url": "https://example.com",
            "text": "More test content from example.com",
            "distance": 0.7
        }
    ]
    mock_service.list_contexts.return_value = [
        "https://example.com",
        "https://test.com"
    ]
    mock_service.ingest_url.return_value = {"message": "URL processed successfully"}
    return mock_service


@pytest.fixture
def mock_scraping_service():
    """Mock ScrapingService for testing."""
    mock_service = Mock()
    mock_service.scrape_website.return_value = [
        "This is scraped content from the website.",
        "More scraped content for testing."
    ]
    return mock_service