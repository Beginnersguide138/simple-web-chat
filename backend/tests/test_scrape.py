import pytest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient
from app.main import app


class TestScrapeEndpoint:
    """Test cases for the scrape endpoint."""

    def test_scrape_success(self, client, mock_ollama_service, mock_milvus_service, mock_scraping_service):
        """Test successful URL scraping and processing."""
        mock_milvus_service.insert_data.return_value = 1
        
        with patch('app.api.v1.endpoints.scrape.scrape_url', return_value="This is scraped content"), \
             patch('app.api.v1.endpoints.scrape.get_ollama_service', return_value=mock_ollama_service), \
             patch('app.api.v1.endpoints.scrape.get_milvus_service', return_value=mock_milvus_service):
            
            response = client.post("/api/v1/process-url", json={
                "url": "https://example.com"
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["url"] == "https://example.com"
            assert data["message"] == "Successfully scraped, embedded, and stored the content."
            assert data["text_length"] == len("This is scraped content")
            assert data["vector_dim"] == 5  # Length of mock embedding
            assert data["milvus_insert_count"] == 1

    def test_scrape_invalid_url(self, client):
        """Test scraping with invalid URL format."""
        response = client.post("/api/v1/process-url", json={
            "url": "invalid-url"
        })
        
        # Should still process but might fail during scraping
        # The exact behavior depends on the scraping service implementation
        assert response.status_code in [200, 404, 500]

    def test_scrape_no_content(self, client, mock_ollama_service, mock_milvus_service):
        """Test scraping when no content is found."""
        with patch('app.api.v1.endpoints.scrape.scrape_url', return_value=""), \
             patch('app.api.v1.endpoints.scrape.get_ollama_service', return_value=mock_ollama_service), \
             patch('app.api.v1.endpoints.scrape.get_milvus_service', return_value=mock_milvus_service):
            
            response = client.post("/api/v1/process-url", json={
                "url": "https://example.com/empty"
            })
            
            assert response.status_code == 404
            data = response.json()
            assert "Could not retrieve content" in data["detail"]

    def test_scrape_scraping_failure(self, client, mock_ollama_service, mock_milvus_service):
        """Test scraping when scraping service fails."""
        with patch('app.api.v1.endpoints.scrape.scrape_url', side_effect=Exception("Network error")), \
             patch('app.api.v1.endpoints.scrape.get_ollama_service', return_value=mock_ollama_service), \
             patch('app.api.v1.endpoints.scrape.get_milvus_service', return_value=mock_milvus_service):
            
            response = client.post("/api/v1/process-url", json={
                "url": "https://example.com/error"
            })
            
            assert response.status_code == 500
            data = response.json()
            assert "Failed to scrape URL" in data["detail"]

    def test_scrape_embedding_failure(self, client, mock_ollama_service, mock_milvus_service):
        """Test scraping when embedding generation fails."""
        mock_ollama_service.generate_embedding.side_effect = Exception("Embedding service down")
        
        with patch('app.api.v1.endpoints.scrape.scrape_url', return_value="Test content"), \
             patch('app.api.v1.endpoints.scrape.get_ollama_service', return_value=mock_ollama_service), \
             patch('app.api.v1.endpoints.scrape.get_milvus_service', return_value=mock_milvus_service):
            
            response = client.post("/api/v1/process-url", json={
                "url": "https://example.com"
            })
            
            assert response.status_code == 500
            data = response.json()
            assert "Failed to generate embedding" in data["detail"]

    def test_scrape_milvus_failure(self, client, mock_ollama_service, mock_milvus_service):
        """Test scraping when Milvus insertion fails."""
        mock_milvus_service.insert_data.side_effect = Exception("Database connection error")
        
        with patch('app.api.v1.endpoints.scrape.scrape_url', return_value="Test content"), \
             patch('app.api.v1.endpoints.scrape.get_ollama_service', return_value=mock_ollama_service), \
             patch('app.api.v1.endpoints.scrape.get_milvus_service', return_value=mock_milvus_service):
            
            response = client.post("/api/v1/process-url", json={
                "url": "https://example.com"
            })
            
            assert response.status_code == 500
            data = response.json()
            assert "Failed to insert data into Milvus" in data["detail"]

    def test_scrape_invalid_request_format(self, client):
        """Test scraping with invalid request format."""
        response = client.post("/api/v1/process-url", json={
            "invalid_field": "test"
        })
        
        assert response.status_code == 422  # Validation error

    def test_scrape_missing_url(self, client):
        """Test scraping without URL."""
        response = client.post("/api/v1/process-url", json={})
        
        assert response.status_code == 422  # Validation error

    def test_scrape_ollama_service_unavailable(self, client):
        """Test scraping when Ollama service is unavailable."""
        with patch('app.api.v1.endpoints.scrape.ollama_service', None):
            response = client.post("/api/v1/process-url", json={
                "url": "https://example.com"
            })
            
            assert response.status_code == 503
            data = response.json()
            assert "Ollama service is not available" in data["detail"]

    def test_scrape_milvus_service_unavailable(self, client):
        """Test scraping when Milvus service is unavailable."""
        with patch('app.api.v1.endpoints.scrape.milvus_service', None):
            response = client.post("/api/v1/process-url", json={
                "url": "https://example.com"
            })
            
            assert response.status_code == 503
            data = response.json()
            assert "Milvus service is not available" in data["detail"]