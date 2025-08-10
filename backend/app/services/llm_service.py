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
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "mxbai-embed-large")
# Model selection: Use environment variable or default to gpt-oss:20b
# Options:
#   - "gpt-oss:20b" - Full 20B parameter model (requires 13.4GB+ memory)
#   - "gpt-oss:latest" - Latest version of gpt-oss
#   - "tinyllama" - Ultra lightweight model (638MB) for testing
GENERATION_MODEL = os.getenv("GENERATION_MODEL", "gpt-oss:20b")

logger.info(f"Using generation model: {GENERATION_MODEL}")
logger.info(f"Using embedding model: {EMBEDDING_MODEL}")

class OllamaService:
    def __init__(self, host: str = OLLAMA_HOST):
        logger.info(f"Initializing OllamaService with host: {host}")
        self.client = ollama.Client(host=host)
        self._ensure_models_are_available()

    def _ensure_models_are_available(self):
        """Checks if required models are available and pulls them if not."""
        try:
            response = self.client.list()
            # Handle both possible response formats
            if isinstance(response, dict) and 'models' in response:
                models_data = response['models']
            else:
                models_data = response
            
            # Extract model names, handling different possible structures
            local_models = []
            for m in models_data:
                if isinstance(m, dict):
                    # Try different possible key names
                    model_name = m.get('name') or m.get('model') or m.get('model_name', '')
                elif isinstance(m, str):
                    model_name = m
                else:
                    continue
                if model_name:
                    local_models.append(model_name)
            
            logger.info(f"Available Ollama models: {local_models}")
            required_models = [f"{EMBEDDING_MODEL}:latest", f"{GENERATION_MODEL}:latest"]

            for model in required_models:
                # Check if model exists (with or without :latest tag)
                model_base = model.split(':')[0]
                model_found = any(m.startswith(model_base) for m in local_models)
                
                if not model_found:
                    logger.info(f"Model '{model}' not found. Pulling it now...")
                    self.client.pull(model_base) # pull by model name
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
            # Ensure model name has :latest tag if not present
            model_name = GENERATION_MODEL if ':' in GENERATION_MODEL else f"{GENERATION_MODEL}:latest"
            
            response = self.client.chat(
                model=model_name,
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
