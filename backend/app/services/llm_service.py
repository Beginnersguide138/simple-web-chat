import ollama
import os
import logging
from dotenv import load_dotenv
from typing import List, Dict, Any

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
EMBEDDING_MODEL = "mxbai-embed-large"
GENERATION_MODEL = "gpt-oss:20b"

class OllamaService:
    def __init__(self, host: str = OLLAMA_HOST):
        logger.info(f"Initializing OllamaService with host: {host}")
        self.client = ollama.Client(host=host)
        self._ensure_models_are_available()

    def _ensure_models_are_available(self):
        """Checks if required models are available and pulls them if not."""
        try:
            local_models = [m['name'] for m in self.client.list()['models']]
            logger.info(f"Available Ollama models: {local_models}")
            required_models = [f"{EMBEDDING_MODEL}:latest", f"{GENERATION_MODEL}:latest"]

            for model in required_models:
                if model not in local_models:
                    logger.info(f"Model '{model}' not found. Pulling it now...")
                    self.client.pull(model.split(':')[0]) # pull by model name
                    logger.info(f"Successfully pulled model: {model}")

        except Exception as e:
            logger.error(f"Failed to connect to Ollama or pull models: {e}", exc_info=True)
            raise RuntimeError(f"Could not initialize Ollama models. Is Ollama running at {OLLAMA_HOST}?") from e

    def generate_embedding(self, text: str) -> List[float]:
        """Generates an embedding for the given text."""
        if not text.strip():
            logger.warning("Attempted to generate embedding for empty text.")
            return []
        try:
            response = self.client.embeddings(model=EMBEDDING_MODEL, prompt=text)
            return response["embedding"]
        except Exception as e:
            logger.error(f"Error generating embedding: {e}", exc_info=True)
            raise

    def generate_chat_response(self, query: str, context: str) -> str:
        """Generates a chat response using a query and context."""
        if not query:
            return "Please provide a query."

        prompt = f"""
        You are a helpful assistant. Answer the following question based *only* on the provided context.
        If the answer is not found in the context, say "I could not find an answer in the provided context."

        Context:
        ---
        {context}
        ---

        Question: {query}

        Answer:
        """

        try:
            response = self.client.chat(
                model=GENERATION_MODEL,
                messages=[
                    {
                        'role': 'user',
                        'content': prompt,
                    },
                ]
            )
            return response['message']['content']
        except Exception as e:
            logger.error(f"Error generating chat response: {e}", exc_info=True)
            raise

# Dependency injection functions
def get_ollama_service():
    if not ollama_service:
        raise RuntimeError("Ollama service is not available.")
    return ollama_service

# Singleton instance
try:
    ollama_service = OllamaService()
except RuntimeError as e:
    logger.error(f"Could not create OllamaService instance: {e}")
    ollama_service = None
