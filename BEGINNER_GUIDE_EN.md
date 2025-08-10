# Detailed Beginner's Guide - RAG-based Web Chat Application

> 👋 **About this guide**: Designed for beginner AI engineers to learn a modern AI tech stack through this repository.

## 🎯 What You Can Learn from This Project

### Technology Areas
- **RAG (Retrieval-Augmented Generation)**: The latest approach in AI chat
- **Vector Databases**: A key technology in the era of large language models
- **Full-Stack Development**: A modern combination of React + FastAPI
- **Container Technology**: Practical development environment setup using Docker
- **LLM Operations**: Efficient model management using Ollama

### Skill Acquisition Goals
1. **Practical Understanding of AI Technology**: Learn from a working system, not just theory
2. **Modern Web Development**: Latest front-end development with TypeScript + React
3. **API Design**: Design and implementation of REST APIs using FastAPI
4. **Database Design**: Concepts and utilization of vector databases
5. **DevOps Fundamentals**: Standardization of development environments with Docker

## 📚 Learning Paths by Knowledge Level

### 🟢 Level 1: Programming Beginner
**Required Basic Knowledge**: Basic programming concepts (variables, functions, conditional statements)

**Learning Order**:
1. [Application Operation Check](#step1-operation-check)
2. [Understanding Basic Concepts](#basic-concepts-explained)
3. [Grasping File Structure](#project-structure-deep-dive)
4. [Simple Customization](#beginner-customization)

### 🟡 Level 2: Experienced Web Developer
**Prerequisites**: Basics of HTML/CSS/JavaScript, concept of REST APIs

**Learning Order**:
1. [Tech Stack Overview](#tech-stack-deep-dive)
2. [Understanding the Architecture](#system-architecture)
3. [Front-End Analysis](#front-end-deep-dive)
4. [Back-End API Analysis](#back-end-api-deep-dive)

### 🟠 Level 3: AI/ML Beginner
**Prerequisites**: Python, basic machine learning concepts

**Learning Order**:
1. [Understanding RAG Architecture](#rag-technology-deep-dive)
2. [Utilizing Vector Databases](#vector-database-deep-dive)
3. [LLM Integration Patterns](#llm-integration-patterns)
4. [Applied System Design](#applied-system-design)

## Step 1: Operation Check

### 1.1 Detailed Environment Setup

#### Detailed Steps for macOS Environment

```bash
# 1. Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install necessary tools
brew install git docker ollama

# 3. Install Docker Desktop (GUI is required)
open https://www.docker.com/products/docker-desktop/

# 4. Clone repository
git clone <this-repository-url>
cd simple-web-chat
```

#### Detailed Steps for Windows Environment

```powershell
# 1. Install tools via Chocolatey (administrator privileges)
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

choco install git docker-desktop

# 2. Manual installation of Ollama
# Download the Windows version from https://ollama.ai/

# 3. Clone repository
git clone <this-repository-url>
cd simple-web-chat
```

### 1.2 First-Time Startup Checklist

```bash
# ✅ Confirm Docker Desktop is running
docker --version
docker compose version

# ✅ Confirm Ollama is running
ollama serve &
ollama list

# ✅ Download required models (this will take time)
ollama pull mxbai-embed-large    # ~669MB
ollama pull tinyllama            # ~638MB (for testing)

# ✅ Start the application
docker compose up --build

# ✅ Access in browser
open http://localhost:5173
```

### 1.3 Operation Check Procedure

1. **Website Ingestion Test**
   ```
   Example URL: https://en.wikipedia.org/wiki/Artificial_intelligence
   → Click "Process URL"
   → Confirm success message
   ```

2. **Chat Functionality Test**
   ```
   Select context: The URL you just ingested
   Example question: "What is the definition of artificial intelligence?"
   → Confirm the AI provides an answer
   ```

## Basic Concepts Explained

### What is RAG (Retrieval-Augmented Generation)?

**Traditional Chatbot**:
```
User Question → LLM → Answer
```
- Problem: Cannot answer questions about information not in the LLM's training data
- Problem: May provide outdated or inaccurate information

**RAG System**:
```
User Question → Retrieve Relevant Documents → LLM (Question + Documents) → Answer
```
- Solution: Answers based on the latest, accurate documents
- Solution: Can leverage specialized knowledge from specific domains

### The Role of Vector Databases

**Traditional Search**:
```sql
SELECT * FROM documents WHERE content LIKE '%artificial intelligence%'
```
- Problem: Cannot find documents without an exact keyword match
- Problem: Cannot find semantically related documents

**Vector Search**:
```python
# Understands that "AI", "machine learning", and "deep learning" are semantically close
query_vector = embedding_model("Tell me about artificial intelligence")
similar_docs = vector_db.similarity_search(query_vector, top_k=5)
```

### Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Front-End     │───▶│   Back-End API   │───▶│  Ollama (LLM)   │
│   (React/TS)    │    │   (FastAPI)      │    │  (Host Machine) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Milvus Vector DB │
                    │   (Docker)       │
                    └──────────────────┘
```

## Project Structure Deep Dive

### Directory Structure and Roles

```
simple-web-chat/
├── frontend/                    # React Front-End
│   ├── src/
│   │   ├── components/         # UI Components
│   │   │   ├── Chat.tsx       # Chat screen
│   │   │   ├── ContextSelector.tsx  # URL selection
│   │   │   └── IngestionForm.tsx    # URL input form
│   │   └── App.tsx            # Main application
│   ├── package.json           # Dependency management
│   └── vite.config.ts         # Build configuration
│
├── backend/                    # Python Back-End
│   ├── app/
│   │   ├── api/v1/endpoints/  # API Endpoints
│   │   │   ├── chat.py       # Chat API
│   │   │   ├── contexts.py   # Context management
│   │   │   └── scrape.py     # Web scraping
│   │   ├── services/          # Business Logic
│   │   │   ├── llm_service.py      # LLM integration
│   │   │   ├── vector_db_service.py # Vector DB operations
│   │   │   └── scraping_service.py # Scraping process
│   │   └── main.py            # FastAPI application
│   └── requirements.txt       # Python dependencies
│
├── docker-compose.yml          # Docker configuration
├── .env                       # Environment variables
└── README.md                  # Main documentation
```

### Key File Explanations

#### `frontend/src/App.tsx`
**Role**: Main application screen
**Learning Points**: React Hooks, state management, API calls

```typescript
// Key state management
const [contexts, setContexts] = useState<string[]>([])
const [selectedContext, setSelectedContext] = useState<string>('')
const [messages, setMessages] = useState<Message[]>([])

// API communication pattern
const fetchContexts = async () => {
  const response = await fetch('/api/v1/contexts')
  const data = await response.json()
  setContexts(data.contexts)
}
```

#### `backend/app/services/llm_service.py`
**Role**: Integration with Ollama LLM
**Learning Points**: Communication with AI models, prompt engineering

```python
def generate_chat_response(self, query: str, context: str) -> str:
    # Designing the system prompt (important!)
    system_prompt = f"""
    You are an AI assistant that answers questions based solely on the provided context.
    
    Context:
    {context}
    
    Instructions:
    - Use only the information in the context to answer.
    - If the information is not found, honestly say "I don't know".
    """
```

#### `backend/app/services/vector_db_service.py`
**Role**: Vector database operations
**Learning Points**: Embedding generation, similarity search

```python
def similarity_search(self, query: str, context_id: str, top_k: int = 5):
    # 1. Convert query to a vector
    query_vector = self.ollama_service.generate_embedding(query)
    
    # 2. Execute similarity search
    search_params = {"metric_type": "COSINE", "params": {"nprobe": 10}}
    results = self.collection.search(
        data=[query_vector],
        anns_field="vector",
        param=search_params,
        limit=top_k
    )
```

## Tech Stack Deep Dive

### Front-End: React + TypeScript + Vite

#### Why This Choice
- **React**: Component-based design, rich ecosystem
- **TypeScript**: Type safety, suitable for large-scale development
- **Vite**: Fast development server, modern build tool

#### Key Technical Concepts
```typescript
// 1. State management with React Hooks
const [isLoading, setIsLoading] = useState<boolean>(false)

// 2. Side effect handling with useEffect
useEffect(() => {
  fetchContexts()
}, []) // Run only on initial render

// 3. Type definitions with TypeScript
interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}
```

### Back-End: FastAPI + Python

#### Why This Choice
- **FastAPI**: Automatic API documentation, type hint utilization, high performance
- **Python**: Richness of AI/ML libraries, readability

#### Key Patterns
```python
# 1. Dependency Injection pattern
@router.post("/chat")
async def chat(
    request: ChatRequest,
    llm_service: LLMService = Depends(get_llm_service)
):
    return await llm_service.generate_response(request.message)

# 2. Data validation with Pydantic
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    context_id: str = Field(..., regex="^[a-zA-Z0-9_-]+$")
```

### Database: Milvus Vector Database

#### Why This Choice
- **High Performance**: Supports searching billions of vectors
- **Scalability**: Horizontal scaling with cluster configuration
- **Compatibility**: Supports standard vector DB operations

#### Key Operations
```python
# 1. Create a collection (schema definition)
schema = CollectionSchema(
    fields=[
        FieldSchema(name="id", dtype=DataType.INT64, is_primary=True),
        FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=1024),
        FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=65535),
        FieldSchema(name="url", dtype=DataType.VARCHAR, max_length=1000)
    ]
)

# 2. Create an index (for search acceleration)
index_params = {
    "index_type": "IVF_FLAT",
    "params": {"nlist": 1024},
    "metric_type": "COSINE"
}
collection.create_index(field_name="vector", index_params=index_params)
```

## Front-End Deep Dive

### Component Design Patterns

#### 1. Chat.tsx - Implementing Chat Functionality
```typescript
export function Chat({ selectedContext }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Real-time communication with WebSocket or Server-Sent Events
  const sendMessage = async (message: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context_id: selectedContext,
          conversation_history: messages
        })
      })
      
      const data = await response.json()
      setMessages(prev => [...prev, 
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: data.response, timestamp: new Date() }
      ])
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }
}
```

#### 2. IngestionForm.tsx - Implementing URL Processing
```typescript
const handleSubmit = async (url: string) => {
  // 1. URL validation
  if (!isValidUrl(url)) {
    setError('Please enter a valid URL')
    return
  }

  // 2. Duplicate check
  if (contexts.includes(url)) {
    setError('This URL has already been processed')
    return
  }

  // 3. Execute scraping on the back-end
  setIsProcessing(true)
  try {
    await fetch('/api/v1/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    
    // 4. Update the context list
    await refreshContexts()
    setSuccess('Website processing completed')
  } catch (error) {
    setError('An error occurred during processing')
  } finally {
    setIsProcessing(false)
  }
}
```

### State Management Design Principles

```typescript
// 1. Single Responsibility Principle - Each component focuses on one function
// 2. Clear Data Flow - props down, events up
// 3. Proper Side Effect Management - Accurate dependency arrays for useEffect

// Good example: Clear separation of responsibilities
function App() {
  const [contexts, setContexts] = useState<string[]>([])
  const [selectedContext, setSelectedContext] = useState<string>('')
  
  return (
    <div>
      <IngestionForm onNewContext={handleNewContext} />
      <ContextSelector 
        contexts={contexts} 
        selected={selectedContext}
        onSelect={setSelectedContext} 
      />
      <Chat selectedContext={selectedContext} />
    </div>
  )
}
```

## Back-End API Deep Dive

### FastAPI Design Patterns

#### 1. Router Configuration
```python
# app/api/v1/endpoints/chat.py
from fastapi import APIRouter, Depends, HTTPException
from app.services.llm_service import LLMService, get_llm_service

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/")
async def chat_endpoint(
    request: ChatRequest,
    llm_service: LLMService = Depends(get_llm_service)
) -> ChatResponse:
    """
    Chat API
    
    - **message**: User's question
    - **context_id**: Dialogue context ID
    - **conversation_history**: Past conversation history
    """
    try:
        response = await llm_service.generate_chat_response(
            query=request.message,
            context_id=request.context_id,
            history=request.conversation_history
        )
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### 2. Service Layer Implementation
```python
# app/services/llm_service.py
class LLMService:
    def __init__(self):
        self.client = ollama.Client(host=OLLAMA_HOST)
        self.vector_service = VectorDBService()
    
    async def generate_chat_response(
        self, 
        query: str, 
        context_id: str,
        history: List[Message] = None
    ) -> str:
        # 1. Retrieve relevant documents with vector search
        relevant_docs = self.vector_service.similarity_search(
            query=query, 
            context_id=context_id,
            top_k=5
        )
        
        # 2. Build the context
        context = "\n".join([doc.content for doc in relevant_docs])
        
        # 3. Assemble the prompt
        messages = self._build_messages(query, context, history)
        
        # 4. Execute LLM inference
        response = await self._call_ollama(messages)
        
        return response
    
    def _build_messages(self, query: str, context: str, history: List[Message]):
        """Build messages considering conversation history"""
        messages = [{
            "role": "system",
            "content": f"""
            You are an AI that answers questions based on the provided context.
            
            Context:
            {context}
            
            Instructions:
            - Use only information from the context
            - Respond naturally, considering the flow of the conversation
            - If you don't know, say so honestly
            """
        }]
        
        # Add conversation history
        if history:
            for msg in history[-10:]:  # Only the last 10 messages
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Add the current question
        messages.append({"role": "user", "content": query})
        
        return messages
```

### Error Handling Best Practices

```python
# Define custom exceptions
class LLMServiceError(Exception):
    """LLM service related errors"""
    pass

class VectorDBError(Exception):
    """Vector DB related errors"""
    pass

# Global exception handler
@app.exception_handler(LLMServiceError)
async def llm_service_error_handler(request: Request, exc: LLMServiceError):
    return JSONResponse(
        status_code=500,
        content={
            "error": "LLM_SERVICE_ERROR",
            "message": "An error occurred while communicating with the language model",
            "detail": str(exc)
        }
    )
```

## RAG Technology Deep Dive

### Detailed Flow of the RAG Pipeline

```python
class RAGPipeline:
    """Example implementation of a RAG processing pipeline"""
    
    def __init__(self):
        self.embedding_model = EmbeddingModel("mxbai-embed-large")
        self.vector_db = VectorDatabase()
        self.llm = LanguageModel("gpt-oss:20b")
    
    async def process_document(self, url: str, content: str):
        """Document processing and vectorization"""
        # 1. Text preprocessing
        chunks = self._chunk_text(content, chunk_size=1000, overlap=200)
        
        # 2. Vectorize each chunk
        vectors = []
        for chunk in chunks:
            vector = await self.embedding_model.encode(chunk)
            vectors.append({
                'id': self._generate_id(),
                'text': chunk,
                'vector': vector,
                'url': url,
                'metadata': self._extract_metadata(chunk)
            })
        
        # 3. Save to vector DB
        await self.vector_db.insert(vectors)
    
    def _chunk_text(self, text: str, chunk_size: int, overlap: int):
        """Split text into overlapping chunks"""
        chunks = []
        start = 0
        
        while start < len(text):
            end = min(start + chunk_size, len(text))
            chunk = text[start:end]
            
            # Adjust to not cut in the middle of a sentence
            if end < len(text):
                last_sentence = chunk.rfind('.')
                if last_sentence > chunk_size * 0.8:
                    end = start + last_sentence + 1
                    chunk = text[start:end]
            
            chunks.append(chunk)
            start = end - overlap
        
        return chunks
    
    async def retrieve_and_generate(self, query: str, context_id: str):
        """Integrated retrieval and generation process"""
        # 1. Expand the search query
        expanded_query = await self._expand_query(query)
        
        # 2. Vector search
        search_results = await self.vector_db.similarity_search(
            query=expanded_query,
            context_id=context_id,
            top_k=10
        )
        
        # 3. Rerank the results
        reranked_results = self._rerank_results(query, search_results)
        
        # 4. Build context
        context = self._build_context(reranked_results[:5])
        
        # 5. Generation
        response = await self.llm.generate(
            prompt=self._build_prompt(query, context),
            max_tokens=500,
            temperature=0.7
        )
        
        return response
    
    def _rerank_results(self, query: str, results: List[SearchResult]):
        """Rerank search results considering diversity and score"""
        scored_results = []
        
        for result in results:
            # Semantic similarity
            semantic_score = result.similarity_score
            
            # Keyword matching score
            keyword_score = self._calculate_keyword_score(query, result.text)
            
            # Diversity score (overlap with already selected results)
            diversity_score = self._calculate_diversity_score(result, scored_results)
            
            # Total score
            total_score = (
                semantic_score * 0.5 +
                keyword_score * 0.3 +
                diversity_score * 0.2
            )
            
            scored_results.append((result, total_score))
        
        return [result for result, _ in sorted(scored_results, key=lambda x: x[1], reverse=True)]
```

### Prompt Engineering Best Practices

```python
class PromptTemplate:
    """Effective prompt templates"""
    
    SYSTEM_PROMPT = """
You are a professional information retrieval assistant. Strictly follow the instructions below:

【Role】
- Answer questions based solely on the provided context
- Emphasize accuracy and usefulness
- Understand the flow of the conversation and respond naturally

【Constraints】
- Do not use knowledge outside the context
- Avoid answers based on speculation or conjecture  
- If you don't know, honestly say "I could not find the information"
- Clearly state the basis for your answers

【Response Format】
- Concise and easy-to-understand English
- Use bullet points or structure as needed
- Emphasize important points
"""
    
    USER_PROMPT_TEMPLATE = """
Context:
---
{context}
---

Conversation History:
{conversation_history}

Question: {query}

Answer:"""
    
    @classmethod
    def build_messages(cls, query: str, context: str, history: List[dict]):
        """Build complete messages"""
        # Format conversation history
        history_text = ""
        if history:
            for msg in history[-5:]:  # Last 5 messages
                role = "User" if msg["role"] == "user" else "Assistant"
                history_text += f"\n{role}: {msg['content']}"
        
        user_prompt = cls.USER_PROMPT_TEMPLATE.format(
            context=context,
            conversation_history=history_text,
            query=query
        )
        
        return [
            {"role": "system", "content": cls.SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]
```

## Vector Database Deep Dive

### Internal Workings of Milvus

```python
class MilvusManager:
    """Detailed implementation of Milvus operations"""
    
    def __init__(self):
        self.connections.connect(
            alias="default",
            host="localhost",
            port="19530"
        )
    
    def create_optimized_collection(self, collection_name: str, dimension: int):
        """Create an optimized collection"""
        # Schema design
        fields = [
            FieldSchema(
                name="id", 
                dtype=DataType.INT64, 
                is_primary=True, 
                auto_id=True
            ),
            FieldSchema(
                name="vector", 
                dtype=DataType.FLOAT_VECTOR, 
                dim=dimension
            ),
            FieldSchema(
                name="text", 
                dtype=DataType.VARCHAR, 
                max_length=65535
            ),
            FieldSchema(
                name="url", 
                dtype=DataType.VARCHAR, 
                max_length=1000
            ),
            FieldSchema(
                name="timestamp", 
                dtype=DataType.INT64
            )
        ]
        
        schema = CollectionSchema(
            fields=fields,
            description="RAG document storage with optimized search"
        )
        
        collection = Collection(collection_name, schema)
        
        # Index configuration (for search performance optimization)
        index_params = {
            "metric_type": "COSINE",  # Cosine similarity
            "index_type": "IVF_FLAT", # Inverted File index
            "params": {
                "nlist": 1024  # Number of clusters
            }
        }
        
        collection.create_index(
            field_name="vector",
            index_params=index_params
        )
        
        return collection
    
    async def advanced_search(
        self, 
        collection: Collection,
        query_vector: List[float],
        filters: dict = None,
        top_k: int = 10
    ):
        """Advanced search functionality"""
        # Search parameters
        search_params = {
            "metric_type": "COSINE",
            "params": {"nprobe": 16}  # Number of clusters to search
        }
        
        # Build filter expression
        expr = ""
        if filters:
            conditions = []
            for key, value in filters.items():
                if isinstance(value, str):
                    conditions.append(f'{key} == "{value}"')
                elif isinstance(value, list):
                    conditions.append(f'{key} in {value}')
            expr = " and ".join(conditions)
        
        # Execute search
        results = collection.search(
            data=[query_vector],
            anns_field="vector",
            param=search_params,
            limit=top_k,
            expr=expr if expr else None,
            output_fields=["text", "url", "timestamp"]
        )
        
        return self._process_search_results(results)
    
    def _process_search_results(self, raw_results):
        """Post-process search results"""
        processed_results = []
        
        for hits in raw_results:
            for hit in hits:
                result = SearchResult(
                    id=hit.id,
                    score=hit.score,
                    text=hit.entity.get("text"),
                    url=hit.entity.get("url"),
                    timestamp=hit.entity.get("timestamp")
                )
                processed_results.append(result)
        
        # Score normalization
        if processed_results:
            max_score = max(r.score for r in processed_results)
            min_score = min(r.score for r in processed_results)
            score_range = max_score - min_score
            
            for result in processed_results:
                if score_range > 0:
                    result.normalized_score = (result.score - min_score) / score_range
                else:
                    result.normalized_score = 1.0
        
        return processed_results
```

### Embedding Model Selection and Optimization

```python
class EmbeddingOptimizer:
    """Embedding model optimization"""
    
    def __init__(self, model_name: str = "mxbai-embed-large"):
        self.model_name = model_name
        self.client = ollama.Client()
        self.cache = {}  # Embedding cache
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Optimized embedding generation"""
        # Check cache
        text_hash = hashlib.md5(text.encode()).hexdigest()
        if text_hash in self.cache:
            return self.cache[text_hash]
        
        # Text preprocessing
        processed_text = self._preprocess_text(text)
        
        # Generate embedding
        try:
            response = await self.client.embeddings(
                model=self.model_name,
                prompt=processed_text
            )
            embedding = response["embedding"]
            
            # Normalization
            embedding = self._normalize_vector(embedding)
            
            # Save to cache
            self.cache[text_hash] = embedding
            
            return embedding
            
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise EmbeddingError(f"Failed to generate embedding: {e}")
    
    def _preprocess_text(self, text: str) -> str:
        """Text preprocessing for embedding generation"""
        # Remove unnecessary characters and symbols
        text = re.sub(r'[^\w\s.,!?]', '', text)
        
        # Truncate long text
        if len(text) > 8000:  # Limit for mxbai-embed-large
            text = text[:8000]
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def _normalize_vector(self, vector: List[float]) -> List[float]:
        """Normalize a vector (to a unit vector)"""
        import numpy as np
        norm = np.linalg.norm(vector)
        return (np.array(vector) / norm).tolist() if norm > 0 else vector
```

## Beginner Customization

### Level 1: UI Customization

```typescript
// Example of simple changes in frontend/src/App.tsx

// 1. Change the title
const APP_TITLE = "My AI Chat Assistant" // Was: "RAG Chat Application"

// 2. Change the color theme
const theme = {
  primary: "#4f46e5",      // Was: "#3b82f6" 
  secondary: "#10b981",    // Was: "#6b7280"
  background: "#f8fafc",   // Was: "#ffffff"
  text: "#1f2937"         // Was: "#374151"
}

// 3. Change placeholder texts
const PLACEHOLDER_MESSAGES = {
  urlInput: "Enter the URL of the website you want to learn from...",
  chatInput: "Enter your question (e.g., What are the key points of this article?)...",
  noContext: "Please ingest a website first"
}

// 4. Customize message display
function Message({ message, isUser }: MessageProps) {
  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && <span className="avatar">🤖</span>}
      <div className="content">
        {message.content}
        <span className="timestamp">
          {message.timestamp.toLocaleTimeString('en-US')}
        </span>
      </div>
      {isUser && <span className="avatar">👤</span>}
    </div>
  )
}
```

### Level 2: Feature Addition

```python
# Example of adding a feature to backend/app/api/v1/endpoints/chat.py

@router.post("/summarize")
async def summarize_context(
    request: SummarizeRequest,
    llm_service: LLMService = Depends(get_llm_service)
) -> SummarizeResponse:
    """Context summarization feature"""
    try:
        # Get the full content of the specified context
        all_content = await vector_service.get_all_content(request.context_id)
        
        # Build the summarization prompt
        summary_prompt = f"""
Please summarize the content of the following website in English:

Content:
{all_content[:4000]}  # Considering token limits

Requirements:
- 3-5 key points in a bulleted list
- Each point should be 1-2 sentences and concise
- Include important numbers and proper nouns
"""
        
        summary = await llm_service.generate_summary(summary_prompt)
        
        return SummarizeResponse(
            summary=summary,
            context_id=request.context_id,
            generated_at=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation error: {str(e)}")

# New data models
class SummarizeRequest(BaseModel):
    context_id: str = Field(..., description="ID of the context to summarize")

class SummarizeResponse(BaseModel):
    summary: str = Field(..., description="Generated summary")
    context_id: str = Field(..., description="Original context ID")
    generated_at: datetime = Field(..., description="Generation timestamp")
```

### Level 3: Advanced Customization

```python
# app/services/advanced_rag_service.py
class AdvancedRAGService:
    """Implementation of advanced RAG features"""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.vector_service = VectorDBService()
        self.query_analyzer = QueryAnalyzer()
    
    async def multi_step_reasoning(self, query: str, context_id: str):
        """Implementation of multi-step reasoning"""
        
        # 1. Analyze and decompose the query
        sub_queries = await self.query_analyzer.decompose_query(query)
        
        # 2. Search and answer for each sub-query
        sub_answers = []
        for sub_query in sub_queries:
            docs = await self.vector_service.similarity_search(sub_query, context_id)
            answer = await self.llm_service.generate_response(sub_query, docs)
            sub_answers.append({
                'query': sub_query,
                'answer': answer,
                'sources': docs
            })
        
        # 3. Generate the integrated answer
        final_prompt = self._build_integration_prompt(query, sub_answers)
        final_answer = await self.llm_service.generate_response(final_prompt)
        
        return {
            'final_answer': final_answer,
            'reasoning_steps': sub_answers,
            'confidence_score': self._calculate_confidence(sub_answers)
        }
    
    async def conversational_search(self, query: str, conversation_history: List[dict]):
        """Search considering conversation history"""
        
        # 1. Extract context keywords from conversation history
        context_keywords = self._extract_context_keywords(conversation_history)
        
        # 2. Contextualize the query
        contextualized_query = await self._contextualize_query(query, context_keywords)
        
        # 3. Execute an expanded search
        search_results = await self.vector_service.contextual_search(
            query=contextualized_query,
            context_keywords=context_keywords,
            top_k=15
        )
        
        # 4. Generate a conversation-appropriate response
        response = await self.llm_service.conversational_response(
            query=query,
            documents=search_results,
            conversation_history=conversation_history
        )
        
        return response
```

## Detailed Troubleshooting Guide

### Common Problems and Solutions

#### 1. Ollama Connection Error
```bash
# Error: "Could not connect to Ollama"

# Diagnostic steps:
# 1. Check the Ollama process
ps aux | grep ollama

# 2. Check the port
lsof -i :11434

# 3. Check the Ollama logs
ollama serve --verbose

# 4. Check the model list
ollama list

# Solution:
# If Ollama is not running
ollama serve &

# If the port is in use
sudo lsof -ti:11434 | xargs sudo kill -9
ollama serve --port 11435  # Start on a different port
```

#### 2. Docker Memory-Related Errors
```bash
# Error: Docker containers not starting

# Diagnosis:
docker system info | grep -E "Total Memory|CPUs"
docker system df
docker stats

# Solution:
# Remove unused containers and images
docker system prune -a

# Restart the Docker daemon
sudo systemctl restart docker  # Linux
# Restart Docker Desktop # macOS/Windows
```

#### 3. Front-End Build Errors
```bash
# Error: "Module not found" or "Build failed"

# Check Node.js/npm versions
node --version  # Recommended: v18+
npm --version

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npx tsc --noEmit  # Type check

# Check Vite configuration
npm run build -- --debug
```

### Performance Optimization

#### Model Selection Guidelines

```python
# Recommended settings per environment
PERFORMANCE_CONFIGS = {
    "development": {
        "generation_model": "tinyllama",
        "embedding_model": "mxbai-embed-large", 
        "vector_search_top_k": 3,
        "max_context_length": 2000
    },
    "staging": {
        "generation_model": "gpt-oss:20b",
        "embedding_model": "mxbai-embed-large",
        "vector_search_top_k": 5,
        "max_context_length": 4000
    },
    "production": {
        "generation_model": "gpt-oss:20b", 
        "embedding_model": "mxbai-embed-large",
        "vector_search_top_k": 10,
        "max_context_length": 6000,
        "enable_caching": True,
        "enable_async_processing": True
    }
}

# Dynamic configuration loading
def get_config():
    env = os.getenv("ENVIRONMENT", "development")
    return PERFORMANCE_CONFIGS.get(env, PERFORMANCE_CONFIGS["development"])
```

## Applied System Design

### Scalable Extension Methods

#### 1. Microservices
```yaml
# Example docker-compose.production.yml
version: '3.8'

services:
  # API Gateway
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf

  # Authentication Service  
  auth-service:
    build: ./services/auth
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=${AUTH_DB_URL}

  # RAG Processing Service
  rag-service:
    build: ./services/rag
    replicas: 3
    environment:
      - OLLAMA_HOST=${OLLAMA_HOST}
      - VECTOR_DB_HOST=${VECTOR_DB_HOST}

  # Web Scraping Service
  scraping-service:
    build: ./services/scraping
    environment:
      - REDIS_URL=${REDIS_URL}
      - CELERY_BROKER_URL=${CELERY_BROKER_URL}

  # Queue Worker
  celery-worker:
    build: ./services/scraping
    command: celery worker -A scraping_service.celery
    replicas: 2
```

#### 2. Distributed Vector DB Configuration
```python
class DistributedVectorDB:
    """Distributed vector DB management"""
    
    def __init__(self, nodes: List[str]):
        self.nodes = nodes
        self.load_balancer = LoadBalancer(nodes)
        self.replication_factor = 2
    
    async def insert_with_replication(self, vectors: List[dict]):
        """Data insertion with replication"""
        primary_node = self.load_balancer.get_primary_node()
        replica_nodes = self.load_balancer.get_replica_nodes(self.replication_factor)
        
        # Insert into the primary node
        await self._insert_to_node(primary_node, vectors)
        
        # Asynchronously replicate to replica nodes
        replication_tasks = [
            self._insert_to_node(node, vectors) 
            for node in replica_nodes
        ]
        await asyncio.gather(*replication_tasks, return_exceptions=True)
    
    async def distributed_search(self, query_vector: List[float], top_k: int):
        """Execute a distributed search"""
        search_tasks = [
            self._search_on_node(node, query_vector, top_k) 
            for node in self.nodes
        ]
        
        # Collect results from all nodes
        all_results = await asyncio.gather(*search_tasks)
        
        # Merge and rank the results to return the top k
        merged_results = self._merge_and_rank_results(all_results, top_k)
        
        return merged_results
```

#### 3. Adding Real-Time Features
```typescript
// WebSocket-based real-time chat
class RealtimeChatClient {
  private ws: WebSocket
  private messageQueue: Message[] = []
  
  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl)
    this.setupEventHandlers()
  }
  
  setupEventHandlers() {
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'chat_response_chunk':
          this.handleStreamingResponse(data.chunk)
          break
        case 'processing_status':
          this.updateProcessingStatus(data.status)
          break
        case 'error':
          this.handleError(data.error)
          break
      }
    }
  }
  
  async sendMessage(message: string, contextId: string) {
    const payload = {
      type: 'chat_message',
      message,
      context_id: contextId,
      timestamp: Date.now()
    }
    
    this.ws.send(JSON.stringify(payload))
  }
  
  private handleStreamingResponse(chunk: string) {
    // Update the display of the streaming response
    const currentMessage = this.getCurrentMessage()
    if (currentMessage) {
      currentMessage.content += chunk
      this.updateMessageDisplay(currentMessage)
    }
  }
}
```

## Learning Resources and Next Steps

### Learning Paths by Tech Stack

#### React + TypeScript
- **Official Documentation**: [React Docs](https://react.dev/)
- **TypeScript Learning**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **Practical Project**: Extend the front-end of this repository

#### FastAPI + Python
- **Official Documentation**: [FastAPI](https://fastapi.tiangolo.com/)
- **Asynchronous Programming**: [Asyncio in Python](https://docs.python.org/3/library/asyncio.html)
- **Practical Project**: Extend the back-end API features

#### Vector Databases
- **Milvus Official**: [Milvus Documentation](https://milvus.io/docs)
- **Vector Search Theory**: Basics of linear algebra, information retrieval
- **Practical Project**: Experiment with improving search accuracy

#### LLMs and RAG
- **Ollama**: [Ollama Documentation](https://ollama.ai/docs)
- **RAG Paper**: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"
- **Prompt Engineering**: Designing effective prompts

### Advanced Project Ideas

#### Beginner Projects
1. **UI Improvements**: Introduce a design system, responsive design
2. **Feature Additions**: Favorites, search history, export functionality
3. **Language Support**: Multilingual UI, translation features
4. **Performance**: Loading states, improved error handling

#### Intermediate Projects  
1. **Authentication System**: User management, session management
2. **File Upload**: Ingest PDF, Word documents
3. **Advanced Search**: Filtering, sorting, faceted search
4. **Analytics**: Usage statistics, popular content analysis

#### Advanced Projects
1. **Multi-Tenancy**: Turn it into a SaaS for businesses
2. **Public API**: Third-party integrations, webhooks
3. **ML Ops**: Model performance monitoring, A/B testing
4. **Distributed System**: Microservices, Kubernetes support

### Troubleshooting Communities

- **GitHub Issues**: Ask questions in this repository's Issues tab
- **Discord/Slack**: Exchange information in AI development communities
- **Stack Overflow**: Solve technical problems
- **Reddit**: Discussions on r/MachineLearning, r/webdev

---

## Summary

Through this guide, you can understand the overall picture of a modern AI web application and learn from a working system, acquiring skills from both theoretical and practical perspectives.

**The most important things are**:
1. **Get your hands dirty**: First get it working, then customize
2. **Incremental learning**: Gradually improve your skills according to your level
3. **Community participation**: Exchange information with other learners

Technology is constantly evolving, so developing your own project based on this repository is the most effective way to learn.

**Next Actions**:
- [ ] Confirm basic operation
- [ ] Implement customizations appropriate for your level  
- [ ] Plan and implement an advanced project
- [ ] Share what you've learned with the community

Good luck! 🚀