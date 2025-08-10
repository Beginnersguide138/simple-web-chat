from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.scraping_service import scrape_url
from app.services.llm_service import ollama_service, OllamaService
from app.services.vector_db_service import milvus_service, MilvusService
import logging
from typing import List

router = APIRouter()
logger = logging.getLogger(__name__)

# Constants for text chunking
MAX_CHUNK_SIZE = 50000  # Max size per chunk (well below 65535 to be safe)
CHUNK_OVERLAP = 500     # Overlap between chunks for context continuity

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


def chunk_text(text: str, max_size: int = MAX_CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """
    Split text into chunks with a specified maximum size and overlap.
    """
    if len(text) <= max_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + max_size
        
        # If this is not the last chunk, try to break at a sentence or paragraph
        if end < len(text):
            # Try to find a good break point (sentence end)
            break_points = ['. ', '.\n', '\n\n', '\n', ' ']
            for break_point in break_points:
                last_break = text.rfind(break_point, start, end)
                if last_break > start:
                    end = last_break + len(break_point)
                    break
        
        chunks.append(text[start:end])
        
        # Move start position with overlap
        if end >= len(text):
            break
        start = end - overlap
    
    return chunks


@router.post("/process-url", response_model=ProcessResponse)
def scrape_and_embed_url(
    request: ScrapeRequest,
    ollama: OllamaService = Depends(get_ollama_service),
    milvus: MilvusService = Depends(get_milvus_service)
):
    """
    Scrapes a URL, generates embeddings for its content (chunked if necessary), and stores it in Milvus.
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

    logger.info(f"Scraped content length: {len(text_content)} characters")
    
    # 2. Chunk the text if it's too large
    chunks = chunk_text(text_content)
    logger.info(f"Split content into {len(chunks)} chunks")
    
    total_insert_count = 0
    total_embeddings = []
    
    # 3. Process each chunk
    for i, chunk in enumerate(chunks):
        logger.info(f"Processing chunk {i+1}/{len(chunks)} (length: {len(chunk)} characters)")
        
        # Generate embedding for this chunk
        try:
            embedding = ollama.generate_embedding(chunk)
            if not embedding:
                logger.error(f"Failed to generate embedding for chunk {i+1} from {url}")
                continue  # Skip this chunk but continue with others
            total_embeddings.append(embedding)
        except Exception as e:
            logger.error(f"Failed during embedding generation for chunk {i+1} from {url}: {e}", exc_info=True)
            continue  # Skip this chunk but continue with others
        
        # Insert chunk into Milvus
        try:
            insert_count = milvus.insert_data(url=url, text=chunk, embedding=embedding)
            total_insert_count += insert_count
            logger.info(f"Successfully inserted chunk {i+1} for URL: {url}")
        except Exception as e:
            logger.error(f"Failed during Milvus insertion for chunk {i+1} from {url}: {e}", exc_info=True)
            continue  # Skip this chunk but continue with others
    
    if total_insert_count == 0:
        logger.error(f"Failed to insert any chunks for URL: {url}")
        raise HTTPException(status_code=500, detail="Failed to insert data into Milvus.")
    
    logger.info(f"Successfully processed and stored {total_insert_count} chunks for URL: {url}")
    return ProcessResponse(
        url=url,
        message=f"Successfully scraped, embedded, and stored the content in {total_insert_count} chunks.",
        text_length=len(text_content),
        vector_dim=len(total_embeddings[0]) if total_embeddings else 0,
        milvus_insert_count=total_insert_count
    )
