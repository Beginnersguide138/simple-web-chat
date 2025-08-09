import pytest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient
from app.main import app


class TestContextsEndpoint:
    """Test cases for the contexts endpoint."""

    def test_get_contexts_success(self, client, mock_milvus_service):
        """Test successful retrieval of contexts."""
        with patch('app.api.v1.endpoints.contexts.get_milvus_service', return_value=mock_milvus_service):
            response = client.get("/api/v1/contexts")
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 2
            assert "https://example.com" in data
            assert "https://test.com" in data
            
            # Verify service call
            mock_milvus_service.list_contexts.assert_called_once()

    def test_get_contexts_empty(self, client, mock_milvus_service):
        """Test retrieval of contexts when no contexts exist."""
        mock_milvus_service.list_contexts.return_value = []
        
        with patch('app.api.v1.endpoints.contexts.get_milvus_service', return_value=mock_milvus_service):
            response = client.get("/api/v1/contexts")
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 0

    def test_get_contexts_database_error(self, client, mock_milvus_service):
        """Test contexts endpoint when database fails."""
        mock_milvus_service.list_contexts.side_effect = Exception("Database connection failed")
        
        with patch('app.api.v1.endpoints.contexts.get_milvus_service', return_value=mock_milvus_service):
            response = client.get("/api/v1/contexts")
            
            assert response.status_code == 500
            data = response.json()
            assert "Failed to retrieve contexts" in data["detail"]

    def test_get_contexts_large_dataset(self, client, mock_milvus_service):
        """Test contexts endpoint with a large number of contexts."""
        large_context_list = [f"https://example{i}.com" for i in range(100)]
        mock_milvus_service.list_contexts.return_value = large_context_list
        
        with patch('app.api.v1.endpoints.contexts.get_milvus_service', return_value=mock_milvus_service):
            response = client.get("/api/v1/contexts")
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 100
            assert "https://example0.com" in data
            assert "https://example99.com" in data