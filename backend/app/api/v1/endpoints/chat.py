from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import json

from app.services.llm_service import OllamaService, get_ollama_service
from app.services.vector_db_service import MilvusService, get_milvus_service
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
    top_k: int = 3

class Source(BaseModel):
    url: str
    text: str
    distance: float

class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]

@router.post("/chat", response_model=ChatResponse)
def chat_with_rag(
    request: ChatRequest,
    ollama: OllamaService = Depends(get_ollama_service),
    milvus: MilvusService = Depends(get_milvus_service)
):
    """
    Performs RAG-based chat within a specific context (URL).
    1. Embeds the user query.
    2. Searches for relevant context in the specified partition in Milvus.
    3. Generates a response using the query and context.
    """
    logger.info(f"Received chat query: '{request.query}' in context '{request.context_url}'")

    if not request.context_url:
        raise HTTPException(status_code=400, detail="A context_url must be provided.")

    # 1. Embed the query
    try:
        query_embedding = ollama.generate_embedding(request.query)
        if not query_embedding:
            raise HTTPException(status_code=500, detail="Failed to generate query embedding.")
    except Exception as e:
        logger.error(f"Error during query embedding: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate query embedding: {str(e)}")

    # 2. Search for context in the specified partition
    try:
        search_results = milvus.search(
            query_embedding=query_embedding,
            context_url=request.context_url,
            top_k=request.top_k
        )
    except Exception as e:
        logger.error(f"Error during Milvus search: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to search for context: {str(e)}")

    if not search_results:
        return ChatResponse(
            answer=f"I could not find any relevant information for your query in the content from {request.context_url}.",
            sources=[]
        )

    # 3. Generate response
    context = "\n\n".join([f"Source URL: {res['url']}\nContent: {res['text']}" for res in search_results])

    try:
        # Convert messages to dict format for LLM service
        conversation_history = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        answer = ollama.generate_chat_response(request.query, context, conversation_history)
    except Exception as e:
        logger.error(f"Error during chat response generation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate chat response: {str(e)}")

    sources = [Source(**res) for res in search_results]

    return ChatResponse(answer=answer, sources=sources)

@router.post("/chat-stream")
def chat_with_rag_stream(
    request: ChatRequest,
    ollama: OllamaService = Depends(get_ollama_service),
    milvus: MilvusService = Depends(get_milvus_service)
):
    """
    Performs streaming RAG-based chat within a specific context (URL).
    1. Embeds the user query.
    2. Searches for relevant context in the specified partition in Milvus.
    3. Streams the response using the query and context.
    """
    logger.info(f"Received streaming chat query: '{request.query}' in context '{request.context_url}'")

    if not request.context_url:
        raise HTTPException(status_code=400, detail="A context_url must be provided.")

    # 1. Embed the query
    try:
        query_embedding = ollama.generate_embedding(request.query)
        if not query_embedding:
            raise HTTPException(status_code=500, detail="Failed to generate query embedding.")
    except Exception as e:
        logger.error(f"Error during query embedding: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate query embedding: {str(e)}")

    # 2. Search for context in the specified partition
    try:
        search_results = milvus.search(
            query_embedding=query_embedding,
            context_url=request.context_url,
            top_k=request.top_k
        )
    except Exception as e:
        logger.error(f"Error during Milvus search: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to search for context: {str(e)}")

    if not search_results:
        def error_stream():
            response = {
                "type": "error",
                "content": f"I could not find any relevant information for your query in the content from {request.context_url}."
            }
            yield f"data: {json.dumps(response)}\n\n"
        
        return StreamingResponse(
            error_stream(),
            media_type="text/plain",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )

    # 3. Generate streaming response
    context = "\n\n".join([f"Source URL: {res['url']}\nContent: {res['text']}" for res in search_results])
    sources = [Source(**res) for res in search_results]

    def generate_stream():
        # First send sources
        sources_data = {
            "type": "sources",
            "sources": [{"url": s.url, "text": s.text, "distance": s.distance} for s in sources]
        }
        yield f"data: {json.dumps(sources_data)}\n\n"
        
        # Then stream the chat response
        try:
            # Convert messages to dict format for LLM service
            conversation_history = [{"role": msg.role, "content": msg.content} for msg in request.messages]
            for chunk in ollama.generate_chat_response_stream(request.query, context, conversation_history):
                if chunk:
                    response = {
                        "type": "content",
                        "content": chunk
                    }
                    yield f"data: {json.dumps(response)}\n\n"
        except Exception as e:
            logger.error(f"Error during streaming chat response generation: {e}", exc_info=True)
            error_response = {
                "type": "error",
                "content": f"Failed to generate chat response: {str(e)}"
            }
            yield f"data: {json.dumps(error_response)}\n\n"
        
        # End stream
        yield f"data: {json.dumps({'type': 'end'})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
