import ollama
import openai
import anthropic
import google.generativeai as genai
import os
import logging
from typing import List, Dict, Any, Generator
from dotenv import load_dotenv

from app.core.config import settings, ModelProvider, ModelConfig

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MultiLLMService:
    def __init__(self):
        logger.info("Initializing MultiLLMService")
        self.ollama_client = None
        self.openai_client = None
        self.anthropic_client = None
        
        # Initialize Ollama client
        try:
            self.ollama_client = ollama.Client(host=settings.OLLAMA_HOST)
            logger.info(f"Ollama client initialized with host: {settings.OLLAMA_HOST}")
        except Exception as e:
            logger.error(f"Failed to initialize Ollama client: {e}")
        
        # Initialize OpenAI client if API key is provided
        if settings.OPENAI_API_KEY:
            try:
                self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
        
        # Initialize Anthropic client if API key is provided
        if settings.ANTHROPIC_API_KEY:
            try:
                self.anthropic_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                logger.info("Anthropic client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic client: {e}")
        
        # Initialize Google client if API key is provided
        if settings.GOOGLE_API_KEY:
            try:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                logger.info("Google Generative AI client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Google client: {e}")

    def get_available_models(self) -> Dict[str, Dict[str, Any]]:
        """Returns a dictionary of available models with their configurations."""
        models = {}
        available_models = settings.available_models
        
        for model_name, model_config in available_models.items():
            models[model_name] = {
                "name": model_config.name,
                "display_name": model_config.display_name,
                "provider": model_config.provider.value,
                "requires_api_key": model_config.requires_api_key,
                "context_length": model_config.context_length
            }
        
        return models

    def generate_embedding(self, text: str, model: str = None) -> List[float]:
        """Generates an embedding for the given text using Ollama."""
        if not text.strip():
            logger.warning("Attempted to generate embedding for empty text.")
            return []
        
        if not self.ollama_client:
            raise RuntimeError("Ollama client is not available for embedding generation.")
        
        try:
            embedding_model = model or settings.EMBEDDING_MODEL
            response = self.ollama_client.embeddings(model=embedding_model, prompt=text)
            return response["embedding"]
        except Exception as e:
            logger.error(f"Error generating embedding: {e}", exc_info=True)
            raise

    def generate_chat_response(self, query: str, context: str, model: str, 
                             conversation_history: List[Dict[str, str]] = None) -> str:
        """Generates a chat response using the specified model and provider."""
        if not query:
            return "Please provide a query."

        # Get model configuration
        available_models = settings.available_models
        if model not in available_models:
            raise ValueError(f"Model '{model}' is not available.")
        
        model_config = available_models[model]
        
        # Build messages array
        messages = self._build_messages(query, context, conversation_history)
        
        # Route to appropriate provider
        if model_config.provider == ModelProvider.OLLAMA:
            return self._generate_ollama_response(model, messages)
        elif model_config.provider == ModelProvider.OPENAI:
            return self._generate_openai_response(model, messages)
        elif model_config.provider == ModelProvider.ANTHROPIC:
            return self._generate_anthropic_response(model, messages)
        elif model_config.provider == ModelProvider.GOOGLE:
            return self._generate_google_response(model, messages)
        else:
            raise ValueError(f"Unsupported provider: {model_config.provider}")

    def generate_chat_response_stream(self, query: str, context: str, model: str,
                                    conversation_history: List[Dict[str, str]] = None) -> Generator[str, None, None]:
        """Generates a streaming chat response using the specified model and provider."""
        if not query:
            yield "Please provide a query."
            return

        # Get model configuration
        available_models = settings.available_models
        if model not in available_models:
            yield f"Error: Model '{model}' is not available."
            return
        
        model_config = available_models[model]
        
        # Build messages array
        messages = self._build_messages(query, context, conversation_history)
        
        # Route to appropriate provider
        try:
            if model_config.provider == ModelProvider.OLLAMA:
                yield from self._generate_ollama_response_stream(model, messages)
            elif model_config.provider == ModelProvider.OPENAI:
                yield from self._generate_openai_response_stream(model, messages)
            elif model_config.provider == ModelProvider.ANTHROPIC:
                yield from self._generate_anthropic_response_stream(model, messages)
            elif model_config.provider == ModelProvider.GOOGLE:
                yield from self._generate_google_response_stream(model, messages)
            else:
                yield f"Error: Unsupported provider: {model_config.provider}"
        except Exception as e:
            logger.error(f"Error generating streaming response: {e}", exc_info=True)
            yield f"Error: {str(e)}"

    def _build_messages(self, query: str, context: str, conversation_history: List[Dict[str, str]] = None) -> List[Dict[str, str]]:
        """Builds the messages array for the chat request."""
        messages = []
        
        # Add system message with context
        system_prompt = f"""You are a helpful assistant. Answer questions based on the provided context and previous conversation history.
        
        Context:
        ---
        {context}
        ---
        
        Instructions:
        - Use the context to answer questions accurately
        - Maintain conversation continuity by referencing previous messages when relevant
        - If the answer is not found in the context, say "I could not find an answer in the provided context."
        - Be conversational and remember what was discussed earlier"""
        
        messages.append({"role": "system", "content": system_prompt})
        
        # Add conversation history
        if conversation_history:
            for msg in conversation_history:
                # Convert "bot" to "assistant" for compatibility
                role = "assistant" if msg["role"] == "bot" else msg["role"]
                messages.append({"role": role, "content": msg["content"]})
        
        # Add current user query
        messages.append({"role": "user", "content": query})
        
        return messages

    def _generate_ollama_response(self, model: str, messages: List[Dict[str, str]]) -> str:
        """Generates response using Ollama."""
        if not self.ollama_client:
            raise RuntimeError("Ollama client is not available.")
        
        # Ensure model name has :latest tag if not present
        model_name = model if ':' in model else f"{model}:latest"
        
        response = self.ollama_client.chat(model=model_name, messages=messages)
        return response['message']['content']

    def _generate_ollama_response_stream(self, model: str, messages: List[Dict[str, str]]) -> Generator[str, None, None]:
        """Generates streaming response using Ollama."""
        if not self.ollama_client:
            yield "Error: Ollama client is not available."
            return
        
        # Ensure model name has :latest tag if not present
        model_name = model if ':' in model else f"{model}:latest"
        
        stream = self.ollama_client.chat(model=model_name, messages=messages, stream=True)
        
        for chunk in stream:
            if chunk['message']['content']:
                yield chunk['message']['content']

    def _generate_openai_response(self, model: str, messages: List[Dict[str, str]]) -> str:
        """Generates response using OpenAI."""
        if not self.openai_client:
            raise RuntimeError("OpenAI client is not available.")
        
        response = self.openai_client.chat.completions.create(
            model=model,
            messages=messages
        )
        return response.choices[0].message.content

    def _generate_openai_response_stream(self, model: str, messages: List[Dict[str, str]]) -> Generator[str, None, None]:
        """Generates streaming response using OpenAI."""
        if not self.openai_client:
            yield "Error: OpenAI client is not available."
            return
        
        stream = self.openai_client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content

    def _generate_anthropic_response(self, model: str, messages: List[Dict[str, str]]) -> str:
        """Generates response using Anthropic."""
        if not self.anthropic_client:
            raise RuntimeError("Anthropic client is not available.")
        
        # Anthropic requires system message to be separate
        system_message = ""
        conversation_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                conversation_messages.append(msg)
        
        response = self.anthropic_client.messages.create(
            model=model,
            max_tokens=4096,
            system=system_message,
            messages=conversation_messages
        )
        return response.content[0].text

    def _generate_anthropic_response_stream(self, model: str, messages: List[Dict[str, str]]) -> Generator[str, None, None]:
        """Generates streaming response using Anthropic."""
        if not self.anthropic_client:
            yield "Error: Anthropic client is not available."
            return
        
        # Anthropic requires system message to be separate
        system_message = ""
        conversation_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                conversation_messages.append(msg)
        
        with self.anthropic_client.messages.stream(
            model=model,
            max_tokens=4096,
            system=system_message,
            messages=conversation_messages
        ) as stream:
            for text in stream.text_stream:
                yield text

    def _generate_google_response(self, model: str, messages: List[Dict[str, str]]) -> str:
        """Generates response using Google Generative AI."""
        try:
            model_instance = genai.GenerativeModel(model)
            
            # Convert messages to Google format
            chat = model_instance.start_chat(history=[])
            
            # Add conversation history
            for msg in messages[1:]:  # Skip system message for now
                if msg["role"] == "user":
                    response = chat.send_message(msg["content"])
                elif msg["role"] == "assistant":
                    # For assistant messages, we need to add them to history
                    chat.history.append({
                        'role': 'user',
                        'parts': [msg["content"]]
                    })
            
            # Get the last user message
            last_user_message = messages[-1]["content"]
            response = chat.send_message(last_user_message)
            
            return response.text
        except Exception as e:
            logger.error(f"Error with Google Generative AI: {e}")
            raise

    def _generate_google_response_stream(self, model: str, messages: List[Dict[str, str]]) -> Generator[str, None, None]:
        """Generates streaming response using Google Generative AI."""
        try:
            model_instance = genai.GenerativeModel(model)
            
            # Convert messages to Google format
            chat = model_instance.start_chat(history=[])
            
            # Add conversation history
            for msg in messages[1:-1]:  # Skip system message and last user message
                if msg["role"] == "user":
                    chat.send_message(msg["content"])
                elif msg["role"] == "assistant":
                    chat.history.append({
                        'role': 'model',
                        'parts': [msg["content"]]
                    })
            
            # Get the last user message and stream response
            last_user_message = messages[-1]["content"]
            response = chat.send_message(last_user_message, stream=True)
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Error with Google Generative AI streaming: {e}")
            yield f"Error: {str(e)}"


# Dependency injection functions
def get_multi_llm_service():
    logger.info(f"get_multi_llm_service called, multi_llm_service is: {multi_llm_service}")
    if not multi_llm_service:
        logger.error("Multi-LLM service is not available.")
        raise RuntimeError("Multi-LLM service is not available.")
    logger.info("Multi-LLM service returned successfully")
    return multi_llm_service

# Singleton instance
try:
    multi_llm_service = MultiLLMService()
except Exception as e:
    logger.error(f"Could not create MultiLLMService instance: {e}")
    multi_llm_service = None