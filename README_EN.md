# RAG-based Web Content Chat Application

> 🌍 **Languages**: **English** | [中文](README_ZH.md) | [日本語](README.md)

This project is a full-stack web application that allows you to scrape content from multiple websites, store them in a partitioned vector database, and chat with the content of specific sites using Retrieval-Augmented Generation (RAG) technology.

Built with a modern tech stack, containerized for easy setup, and provides a simple, clean user interface.

## 📚 Beginner's Guide

If you're new to this tech stack and want to learn by using this repository:
👉 **[Detailed Beginner's Guide](BEGINNER_GUIDE_EN.md)**

## ✨ Features

- **Web Scraping**: Ingest content from any number of URLs
- **Multi-Context Chat**: Each ingested URL creates a separate context for chatting with specific website content
- **Vector Embeddings**: Uses Ollama's `mxbai-embed-large` model to generate embeddings for web content
- **Partitioned Vector Storage**: Stores text and embeddings in a local Milvus vector database with independent partitions for each URL
- **RAG Chat**: Uses Ollama generation models to answer questions based on stored content
- **Modern Web UI**: React frontend for website ingestion and chat interaction

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React (TypeScript) + Vite + `shadcn/ui`
- **Vector Database**: Milvus (v2.3.10)
- **LLM Serving**: Ollama (running on host machine)
  - **Embedding Model**: `mxbai-embed-large`
  - **Generation Model**: Configurable
    - `gpt-oss:20b` - Full model (requires 13GB+ memory)
    - `tinyllama` - Lightweight model (638MB)
- **Containerization**: Docker and Docker Compose

## ⚠️ Important Architecture Explanation

### Why Run Ollama on Host Machine?

This project uses an architecture where **Ollama runs on the host machine** and is accessed from Docker containers. This approach is chosen for:

1. **GPU Acceleration**: Direct access to host machine GPU (Metal Performance Shaders, etc.)
2. **Memory Efficiency**: Bypass Docker memory limitations and utilize system memory efficiently
3. **Performance**: Faster inference through native execution

💡 **This means you do NOT need to modify Docker Desktop memory settings**

## 📋 Prerequisites

### Required Components

1. **[Docker Desktop](https://www.docker.com/get-started/)** installed and running
2. **[Ollama](https://ollama.ai/)** installed and running on host machine

### Memory Requirements (Host Machine)

- **For gpt-oss:20b model**: Minimum 16GB RAM recommended (model size: ~13GB)
- **For tinyllama model**: 4GB RAM (lightweight version, 638MB)

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Ollama Setup (Important!)

#### Install Ollama
```bash
# macOS
curl -fsSL https://ollama.ai/install.sh | sh

# or via Homebrew
brew install ollama
```

#### Start Ollama
```bash
# Run in background
ollama serve
```

#### Download Required Models
```bash
# Embedding model (required)
ollama pull mxbai-embed-large

# Generation model (choose one)
ollama pull gpt-oss:20b      # High-quality model (requires 16GB+ RAM)
# or
ollama pull tinyllama        # Lightweight model (works with 4GB RAM)
```

### 3. Model Configuration (Optional)

Edit `.env` file to select your model:

```bash
# High-quality model (requires 16GB+ RAM)
GENERATION_MODEL=gpt-oss:20b

# Lightweight model (works with 4GB RAM, default)
GENERATION_MODEL=tinyllama
```

### 4. Start Application

```bash
docker-compose up --build
```

### 5. Access

Open your web browser and navigate to:
**http://localhost:5173**

## 📖 How to Use

### 1. Ingest a Website

- In the "1. Ingest a Website" section, enter the URL of the website you want to process
- Example: `https://en.wikipedia.org/wiki/Artificial_intelligence`
- Click the "Process URL" button
- Multiple URLs can be processed

### 2. Select Context

- After ingesting websites, a "Select a context to chat with" dropdown will appear
- Select the website you want to chat with

### 3. Chat

- In the "2. Chat" section, ask questions about the selected website's content
- Type your question and press Enter or click the send button
- The application generates answers based only on the selected website's information

## 🔧 Troubleshooting

### Ollama Connection Error

**Symptom**: "Could not connect to Ollama" error

**Solution**:
```bash
# Check if Ollama is running
ollama serve

# Or in another terminal
ollama list
```

### Out of Memory Error

**Symptom**: "out of memory" error

**Solution**:
1. **Switch to lightweight model**:
   ```bash
   # Edit .env file
   GENERATION_MODEL=tinyllama
   ```

2. **Restart application**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### Model Performance Comparison

| Model | Memory Usage | Quality | Use Case |
|-------|-------------|---------|----------|
| gpt-oss:20b | ~13GB | High quality | Production, high-quality answers needed |
| tinyllama | 638MB | Basic quality | Testing, learning, constrained environments |

## 🐳 Docker Service Configuration

Services defined in `docker-compose.yml`:

- **etcd**, **minio**, **milvus**: Milvus vector database and dependencies
- **backend**: FastAPI application serving the main API
- **frontend**: Vite development server for React frontend

Note: **ollama** service is commented out, using host machine Ollama (`host.docker.internal:11434`)

## 🔧 Environment Variables

Environment variables supported in `.env` file:

- `GENERATION_MODEL`: LLM model for text generation (default: `gpt-oss:20b`)
- `EMBEDDING_MODEL`: Model for generating embeddings (default: `mxbai-embed-large`)

## 📄 License

[MIT License](LICENSE)

---

### 🆘 Need Help?

- Beginners: [Detailed Beginner's Guide](BEGINNER_GUIDE_EN.md)
- Technical issues: Feel free to ask in the Issues tab
- Other languages: [中文](README_ZH.md) | [日本語](README.md)