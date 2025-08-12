from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import json

from app.services.llm_service import OllamaService, get_ollama_service
from app.services.vector_db_service import MilvusService, get_milvus_service
from app.services.langgraph_service import get_intelligent_rag_service
from app.core.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic Models
class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    query: str
    context_url: str
    messages: List[Message] = []  # Conversation history
    model: str = "gpt-oss:20b"  # Selected model
    top_k: int = 3

class Source(BaseModel):
    url: str
    text: str
    distance: float

class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]

@router.post("/chat", response_model=ChatResponse)
def chat_with_rag(request: ChatRequest):
    """
    Performs intelligent RAG-based chat within a specific context (URL).
    Uses LangGraph to determine whether RAG is needed or if direct answers are sufficient.
    """
    logger.info(f"Received chat query: '{request.query}' in context '{request.context_url}'")

    if not request.context_url:
        raise HTTPException(status_code=400, detail="A context_url must be provided.")

    try:
        # Convert messages to dict format for the service
        conversation_history = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Use intelligent RAG service with LangGraph (temporarily using old service)
        intelligent_rag = get_intelligent_rag_service()
        
        result = intelligent_rag.process_query(
            query=request.query,
            context_url=request.context_url,
            conversation_history=conversation_history,
            top_k=request.top_k
        )
        
        # Convert sources to Pydantic models
        sources = [Source(**src) for src in result.get("sources", [])]
        
        return ChatResponse(
            answer=result["answer"],
            sources=sources
        )
        
    except Exception as e:
        logger.error(f"Error during intelligent RAG processing: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process chat query: {str(e)}")

@router.post("/chat-stream")
def chat_with_rag_stream(request: ChatRequest):
    """
    Performs intelligent streaming RAG-based chat within a specific context (URL).
    Uses LangGraph to determine whether RAG is needed or if direct answers are sufficient.
    """
    logger.info(f"Received streaming chat query: '{request.query}' in context '{request.context_url}'")

    if not request.context_url:
        raise HTTPException(status_code=400, detail="A context_url must be provided.")

    def generate_stream():
        try:
            # Convert messages to dict format for the service
            conversation_history = [{"role": msg.role, "content": msg.content} for msg in request.messages]
            
            # Use intelligent RAG service with streaming (temporarily using old service)
            intelligent_rag = get_intelligent_rag_service()
            
            # Stream the response from intelligent RAG service
            for chunk in intelligent_rag.process_query_stream(
                query=request.query,
                context_url=request.context_url,
                conversation_history=conversation_history,
                top_k=request.top_k
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
                
            # End stream
            yield f"data: {json.dumps({'type': 'end'})}\n\n"
            
        except Exception as e:
            logger.error(f"Error during intelligent RAG streaming: {e}", exc_info=True)
            error_response = {
                "type": "error",
                "content": f"Failed to process streaming query: {str(e)}"
            }
            yield f"data: {json.dumps(error_response)}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
