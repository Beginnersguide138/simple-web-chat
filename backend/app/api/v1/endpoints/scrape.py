from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.scraping_service import scrape_url
from app.services.llm_service import ollama_service, OllamaService
from app.services.vector_db_service import milvus_service, MilvusService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic Models
class ScrapeRequest(BaseModel):
    url: str

class ProcessResponse(BaseModel):
    url: str
    message: str
    text_length: int
    vector_dim: int
    milvus_insert_count: int

# Dependency Injection for services
def get_ollama_service():
    if not ollama_service:
        raise HTTPException(status_code=503, detail="Ollama service is not available.")
    return ollama_service

def get_milvus_service():
    if not milvus_service:
        raise HTTPException(status_code=503, detail="Milvus service is not available.")
    return milvus_service


@router.post("/process-url", response_model=ProcessResponse)
def scrape_and_embed_url(
    request: ScrapeRequest,
    ollama: OllamaService = Depends(get_ollama_service),
    milvus: MilvusService = Depends(get_milvus_service)
):
    """
    Scrapes a URL, generates an embedding for its content, and stores it in Milvus.
    """
    url = request.url
    logger.info(f"Processing URL: {url}")

    # 1. Scrape the URL
    try:
        text_content = scrape_url(url)
        if not text_content:
            logger.warning(f"No content found for URL: {url}")
            raise HTTPException(status_code=404, detail="Could not retrieve content from the URL.")
    except Exception as e:
        logger.error(f"Failed during scraping of {url}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to scrape URL: {str(e)}")

    # 2. Generate embedding
    try:
        embedding = ollama.generate_embedding(text_content)
        if not embedding:
            logger.error(f"Failed to generate embedding for content from {url}")
            raise HTTPException(status_code=500, detail="Failed to generate embedding.")
    except Exception as e:
        logger.error(f"Failed during embedding generation for {url}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")

    # 3. Insert into Milvus
    try:
        insert_count = milvus.insert_data(url=url, text=text_content, embedding=embedding)
        if insert_count == 0:
            logger.error(f"Failed to insert data into Milvus for URL: {url}")
            raise HTTPException(status_code=500, detail="Failed to insert data into Milvus.")
    except Exception as e:
        logger.error(f"Failed during Milvus insertion for {url}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to insert data into Milvus: {str(e)}")

    logger.info(f"Successfully processed and stored URL: {url}")
    return ProcessResponse(
        url=url,
        message="Successfully scraped, embedded, and stored the content.",
        text_length=len(text_content),
        vector_dim=len(embedding),
        milvus_insert_count=insert_count
    )
