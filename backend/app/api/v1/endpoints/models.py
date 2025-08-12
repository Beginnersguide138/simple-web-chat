from fastapi import APIRouter, HTTPException
import logging
import httpx
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

def get_ollama_models():
    """Get all models available in Ollama."""
    try:
        with httpx.Client() as client:
            response = client.get(f"{settings.OLLAMA_HOST}/api/tags", timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                return data.get("models", [])
            else:
                logger.warning(f"Failed to fetch Ollama models: {response.status_code}")
                return []
    except Exception as e:
        logger.warning(f"Error fetching Ollama models: {e}")
        return []

def format_model_name(model_name: str) -> str:
    """Convert Ollama model name to display name."""
    # Remove :latest suffix for cleaner display
    name = model_name.replace(":latest", "")
    
    # Create display names for known models
    display_mapping = {
        "gpt-oss": "GPT-OSS",
        "mistral": "Mistral",
        "gemma3:4b": "Gemma 3 4B",
        "gemma3:1b": "Gemma 3 1B",
        "gemma3:27b": "Gemma 3 27B",
        "gemma3:12b": "Gemma 3 12B",
        "deepseek-r1:8b": "DeepSeek R1 8B",
        "qwen3:4b": "Qwen 3 4B",
        "gpt-oss:20b": "GPT-OSS 20B",
        "llama3.2": "Llama 3.2",
    }
    
    # Check for exact matches first
    if name in display_mapping:
        return display_mapping[name]
    
    # Check for partial matches
    for key, display in display_mapping.items():
        if key in name:
            return display
    
    # Fall back to formatted version of the original name
    return name.replace("-", " ").replace(":", " ").title()

@router.get("/models")
def get_available_models():
    """
    Get all available models from all configured providers.
    """
    logger.info("Received request to list all available models.")
    try:
        models_data = {"models": {}, "default_model": "gpt-oss:20b"}
        
        # Get Ollama models dynamically
        ollama_models = get_ollama_models()
        for model in ollama_models:
            model_name = model.get("name", "")
            if model_name and "embed" not in model_name.lower():  # Skip embedding models
                size_mb = model.get("size", 0) // (1024 * 1024)  # Convert to MB
                display_name = format_model_name(model_name)
                
                # Add size info to display name if available
                if size_mb > 1024:
                    size_str = f" ({size_mb // 1024:.1f}GB)"
                elif size_mb > 0:
                    size_str = f" ({size_mb}MB)"
                else:
                    size_str = ""
                
                models_data["models"][model_name] = {
                    "name": model_name,
                    "display_name": f"{display_name}{size_str}",
                    "provider": "ollama",
                    "requires_api_key": False,
                    "context_length": 4096
                }
        
        # Add cloud models from settings if API keys are available
        for model_name, model_config in settings.available_models.items():
            if model_config.provider.value != "ollama":  # Only add non-Ollama models from settings
                models_data["models"][model_name] = {
                    "name": model_config.name,
                    "display_name": model_config.display_name,
                    "provider": model_config.provider.value,
                    "requires_api_key": model_config.requires_api_key,
                    "context_length": model_config.context_length
                }
        
        return models_data
    except Exception as e:
        logger.error(f"Failed to retrieve models: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve available models.")

@router.get("/models/providers")
def get_providers():
    """
    Get information about available providers and their status.
    """
    logger.info("Received request to list all providers.")
    try:
        providers_data = {
            "providers": {
                "ollama": {
                    "name": "Ollama",
                    "description": "Local LLM inference",
                    "available": True,
                    "requires_api_key": False
                },
                "openai": {
                    "name": "OpenAI",
                    "description": "GPT models from OpenAI",
                    "available": False,
                    "requires_api_key": True
                }
            }
        }
        return providers_data
    except Exception as e:
        logger.error(f"Failed to retrieve providers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve available providers.")