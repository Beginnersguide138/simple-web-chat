from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any

from app.services.llm_service import OllamaService, get_ollama_service
from app.services.vector_db_service import MilvusService, get_milvus_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic Models
class ChatRequest(BaseModel):
    query: str
    context_url: str
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
        answer = ollama.generate_chat_response(request.query, context)
    except Exception as e:
        logger.error(f"Error during chat response generation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate chat response: {str(e)}")

    sources = [Source(**res) for res in search_results]

    return ChatResponse(answer=answer, sources=sources)
