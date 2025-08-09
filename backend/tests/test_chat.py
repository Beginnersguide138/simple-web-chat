import pytest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient
from app.main import app


class TestChatEndpoint:
    """Test cases for the chat endpoint."""

    def test_chat_success(self, client, mock_ollama_service, mock_milvus_service):
        """Test successful chat with RAG."""
        with patch('app.api.v1.endpoints.chat.get_ollama_service', return_value=mock_ollama_service), \
             patch('app.api.v1.endpoints.chat.get_milvus_service', return_value=mock_milvus_service):
            
            response = client.post("/api/v1/chat", json={
                "query": "What is artificial intelligence?",
                "context_url": "https://example.com",
                "top_k": 3
            })
            
            assert response.status_code == 200
            data = response.json()
            assert "answer" in data
            assert "sources" in data
            assert len(data["sources"]) > 0
            assert data["answer"] == "This is a test response."
            
            # Verify service calls
            mock_ollama_service.generate_embedding.assert_called_once_with("What is artificial intelligence?")
            mock_milvus_service.search.assert_called_once()
            mock_ollama_service.generate_chat_response.assert_called_once()

    def test_chat_missing_context_url(self, client):
        """Test chat request without context_url."""
        response = client.post("/api/v1/chat", json={
            "query": "What is AI?",
            "context_url": "",
            "top_k": 3
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "context_url must be provided" in data["detail"]

    def test_chat_no_search_results(self, client, mock_ollama_service, mock_milvus_service):
        """Test chat when no relevant content is found."""
        mock_milvus_service.search.return_value = []
        
        with patch('app.api.v1.endpoints.chat.get_ollama_service', return_value=mock_ollama_service), \
             patch('app.api.v1.endpoints.chat.get_milvus_service', return_value=mock_milvus_service):
            
            response = client.post("/api/v1/chat", json={
                "query": "What is quantum computing?",
                "context_url": "https://example.com",
                "top_k": 3
            })
            
            assert response.status_code == 200
            data = response.json()
            assert "could not find any relevant information" in data["answer"]
            assert len(data["sources"]) == 0

    def test_chat_embedding_failure(self, client, mock_ollama_service, mock_milvus_service):
        """Test chat when embedding generation fails."""
        mock_ollama_service.generate_embedding.side_effect = Exception("Embedding service unavailable")
        
        with patch('app.api.v1.endpoints.chat.get_ollama_service', return_value=mock_ollama_service), \
             patch('app.api.v1.endpoints.chat.get_milvus_service', return_value=mock_milvus_service):
            
            response = client.post("/api/v1/chat", json={
                "query": "What is machine learning?",
                "context_url": "https://example.com",
                "top_k": 3
            })
            
            assert response.status_code == 500
            data = response.json()
            assert "Failed to generate query embedding" in data["detail"]

    def test_chat_search_failure(self, client, mock_ollama_service, mock_milvus_service):
        """Test chat when vector search fails."""
        mock_milvus_service.search.side_effect = Exception("Database connection error")
        
        with patch('app.api.v1.endpoints.chat.get_ollama_service', return_value=mock_ollama_service), \
             patch('app.api.v1.endpoints.chat.get_milvus_service', return_value=mock_milvus_service):
            
            response = client.post("/api/v1/chat", json={
                "query": "What is deep learning?",
                "context_url": "https://example.com",
                "top_k": 3
            })
            
            assert response.status_code == 500
            data = response.json()
            assert "Failed to search for context" in data["detail"]

    def test_chat_invalid_request_format(self, client):
        """Test chat with invalid request format."""
        response = client.post("/api/v1/chat", json={
            "invalid_field": "test"
        })
        
        assert response.status_code == 422  # Validation error

    def test_chat_custom_top_k(self, client, mock_ollama_service, mock_milvus_service):
        """Test chat with custom top_k parameter."""
        with patch('app.api.v1.endpoints.chat.get_ollama_service', return_value=mock_ollama_service), \
             patch('app.api.v1.endpoints.chat.get_milvus_service', return_value=mock_milvus_service):
            
            response = client.post("/api/v1/chat", json={
                "query": "Tell me about neural networks",
                "context_url": "https://example.com",
                "top_k": 5
            })
            
            assert response.status_code == 200
            # Verify that top_k=5 was passed to the search
            mock_milvus_service.search.assert_called_once()
            call_args = mock_milvus_service.search.call_args
            assert call_args[1]['top_k'] == 5