from pydantic_settings import BaseSettings
from typing import Dict, List, Optional
from enum import Enum
import os

class ModelProvider(str, Enum):
    OLLAMA = "ollama"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"

class ModelConfig:
    def __init__(self, name: str, display_name: str, provider: ModelProvider,
                 requires_api_key: bool = False, context_length: int = 4096):
        self.name = name
        self.display_name = display_name
        self.provider = provider
        self.requires_api_key = requires_api_key
        self.context_length = context_length

class Settings(BaseSettings):
    PROJECT_NAME: str = "RAG Web Application"
    API_V1_STR: str = "/api/v1"
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    
    # Ollama Settings
    OLLAMA_HOST: str = "http://localhost:11434"
    EMBEDDING_MODEL: str = "mxbai-embed-large"
    
    # Default Model
    DEFAULT_GENERATION_MODEL: str = "gpt-oss:20b"

    class Config:
        case_sensitive = True

    @property
    def available_models(self) -> Dict[str, ModelConfig]:
        """Returns a dictionary of available models based on configuration."""
        models = {}
        
        # Ollama Models (always available)
        ollama_models = [
            ModelConfig("gpt-oss:20b", "GPT-OSS 20B", ModelProvider.OLLAMA),
            ModelConfig("gpt-oss:latest", "GPT-OSS Latest", ModelProvider.OLLAMA),
            ModelConfig("tinyllama", "TinyLlama (638MB)", ModelProvider.OLLAMA),
            ModelConfig("gemma2:9b", "Gemma 2 9B", ModelProvider.OLLAMA),
            ModelConfig("gemma2:27b", "Gemma 2 27B", ModelProvider.OLLAMA),
            ModelConfig("llama3.1:8b", "Llama 3.1 8B", ModelProvider.OLLAMA),
            ModelConfig("llama3.1:70b", "Llama 3.1 70B", ModelProvider.OLLAMA),
            ModelConfig("qwen2.5:7b", "Qwen 2.5 7B", ModelProvider.OLLAMA),
            ModelConfig("phi3:3.8b", "Phi-3 Mini", ModelProvider.OLLAMA),
        ]
        
        for model in ollama_models:
            models[model.name] = model
        
        # OpenAI Models (if API key is provided)
        if self.OPENAI_API_KEY:
            openai_models = [
                ModelConfig("gpt-4o", "GPT-4o", ModelProvider.OPENAI, True, 128000),
                ModelConfig("gpt-4o-mini", "GPT-4o Mini", ModelProvider.OPENAI, True, 128000),
                ModelConfig("gpt-4-turbo", "GPT-4 Turbo", ModelProvider.OPENAI, True, 128000),
                ModelConfig("gpt-3.5-turbo", "GPT-3.5 Turbo", ModelProvider.OPENAI, True, 16384),
            ]
            for model in openai_models:
                models[model.name] = model
        
        # Anthropic Models (if API key is provided)
        if self.ANTHROPIC_API_KEY:
            anthropic_models = [
                ModelConfig("claude-3-5-sonnet-20241022", "Claude 3.5 Sonnet", ModelProvider.ANTHROPIC, True, 200000),
                ModelConfig("claude-3-5-haiku-20241022", "Claude 3.5 Haiku", ModelProvider.ANTHROPIC, True, 200000),
                ModelConfig("claude-3-opus-20240229", "Claude 3 Opus", ModelProvider.ANTHROPIC, True, 200000),
            ]
            for model in anthropic_models:
                models[model.name] = model
        
        # Google Models (if API key is provided)
        if self.GOOGLE_API_KEY:
            google_models = [
                ModelConfig("gemini-1.5-pro", "Gemini 1.5 Pro", ModelProvider.GOOGLE, True, 1048576),
                ModelConfig("gemini-1.5-flash", "Gemini 1.5 Flash", ModelProvider.GOOGLE, True, 1048576),
                ModelConfig("gemini-pro", "Gemini Pro", ModelProvider.GOOGLE, True, 32768),
            ]
            for model in google_models:
                models[model.name] = model
        
        return models

settings = Settings()
