from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.services.vector_db_service import MilvusService, get_milvus_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/contexts", response_model=List[str])
def get_ingested_contexts(
    milvus: MilvusService = Depends(get_milvus_service)
):
    """
    Retrieves a list of all unique URLs that have been ingested and stored.
    These URLs act as the contexts for the chat.
    """
    logger.info("Received request to list all contexts.")
    try:
        contexts = milvus.list_contexts()
        return contexts
    except Exception as e:
        logger.error(f"Failed to retrieve contexts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve contexts from the database.")

@router.delete("/contexts/{context_url:path}")
def delete_context(
    context_url: str,
    milvus: MilvusService = Depends(get_milvus_service)
):
    """
    Deletes a specific context (URL) and all its associated data from the database.
    """
    logger.info(f"Received request to delete context: {context_url}")
    try:
        success = milvus.delete_context(context_url)
        if success:
            return {"message": f"Context '{context_url}' deleted successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to delete context")
    except Exception as e:
        logger.error(f"Failed to delete context '{context_url}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete context from the database.")
