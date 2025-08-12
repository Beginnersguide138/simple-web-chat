from fastapi import FastAPI
from app.api.v1.endpoints import scrape, chat, contexts, models
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for scraping websites, managing a vector database, and interacting with a RAG-based chat.",
    version="0.1.0",
)

# Include API routers
app.include_router(scrape.router, prefix=settings.API_V1_STR, tags=["Ingestion"])
app.include_router(chat.router, prefix=settings.API_V1_STR, tags=["Chat"])
app.include_router(contexts.router, prefix=settings.API_V1_STR, tags=["Contexts"])
app.include_router(models.router, prefix=settings.API_V1_STR, tags=["Models"])

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

