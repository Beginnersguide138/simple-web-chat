# RAG-based Web Content Chat Application

This project is a full-stack web application that allows you to scrape the content of multiple websites, store them in a partitioned vector database, and then chat with the content of a specific site using a Retrieval-Augmented Generation (RAG) model.

The application is built with a modern stack, containerized for easy setup, and provides a simple, clean user interface.

## Features

- **Web Scraping**: Ingest content from any number of URLs.
- **Multi-Context Chat**: Each ingested URL creates a separate context. You can switch between contexts to chat with a specific website's content.
- **Vector Embeddings**: Uses Ollama with the `mxbai-embed-large` model to generate embeddings for the web content.
- **Partitioned Vector Storage**: Stores text and embeddings in a local Milvus vector database, with each URL's content stored in a separate partition for data isolation.
- **RAG Chat**: Uses Ollama with the `gpt-oss:20b` model to answer questions based on the stored content.
- **Web UI**: A modern React frontend for ingesting websites and interacting with the chat.

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React (TypeScript) with Vite and `shadcn/ui`
- **Vector Database**: Milvus (v2.3.10)
- **LLM Serving**: Ollama
  - **Embedding Model**: `mxbai-embed-large`
  - **Generation Model**: Configurable
    - `gpt-oss:20b` - Full model (requires 16GB+ Docker memory)
    - `tinyllama` - Lightweight model (works with 4GB Docker memory)
- **Containerization**: Docker and Docker Compose

## Prerequisites

- [Docker](https://www.docker.com/get-started/) installed and running on your machine.
- **Important for Mac users**: Docker Desktop must have sufficient memory allocated:
  - **For gpt-oss:20b model**: Minimum 16GB RAM (recommended)
  - **For tinyllama model**: 4GB RAM (lightweight alternative)
  - See [Docker Memory Setup Guide](./DOCKER_MEMORY_SETUP.md) for detailed instructions

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Configure Docker Desktop Memory (Mac users):**
    - Check current Docker memory: `docker system info | grep "Total Memory"`
    - If less than 16GB, see [Docker Memory Setup Guide](./DOCKER_MEMORY_SETUP.md)
    - For limited memory environments, use the lightweight model (see Model Configuration below)

3.  **Model Configuration (Optional):**
    The application uses environment variables to select the LLM model:
    - Edit `.env` file to choose your model:
      ```bash
      # For systems with 16GB+ Docker memory:
      GENERATION_MODEL=gpt-oss:20b
      
      # For systems with limited memory (default):
      GENERATION_MODEL=tinyllama
      ```

4.  **Start the application:**
    Run the following command in the root of the project directory:
    ```bash
    docker-compose up --build
    ```
    This command will build the Docker images for the frontend and backend services and start all the required containers (Ollama, Milvus, Backend, Frontend).

5.  **Initial Model Download (First-time setup):**
    The first time you start the application, the backend service will automatically pull the required LLM models. The download size depends on your chosen model:
    - `gpt-oss:20b`: ~13GB download
    - `tinyllama`: ~638MB download
    - `mxbai-embed-large`: ~669MB download
    
    You can monitor the progress by checking the logs:
    ```bash
    docker-compose logs -f backend
    ```

6.  **Access the application:**
    Once all services are running and the models are downloaded, you can access the web interface by navigating to:
    [http://localhost:5173](http://localhost:5173)

## How to Use

1.  **Ingest a Website**:
    - In the "1. Ingest a Website" section, enter the full URL of a website you want to process (e.g., `https://en.wikipedia.org/wiki/Artificial_intelligence`).
    - Click the "Process URL" button. The application will scrape the content and store it in the database.
    - You can repeat this process for multiple URLs.

2.  **Select a Context**:
    - After ingesting one or more websites, a dropdown menu labeled "Select a context to chat with" will appear.
    - This dropdown will contain all the URLs you have ingested.
    - Select a URL from the list to set it as the context for your conversation.

3.  **Chat with the Content**:
    - Once a context is selected, you can ask questions about its content in the "2. Chat" section.
    - Type your question in the input box and press Enter or click the send button.
    - The application will retrieve the most relevant information *from the selected website only* and use it to generate an answer.
    - The answer and the sources used to generate it will appear in the chat window.

## Services

The `docker-compose.yml` file defines the following services:

- `ollama`: The Ollama server for running the language models.
- `etcd`, `minio`, `milvus`: The Milvus vector database and its dependencies.
- `backend`: The FastAPI application that serves the main API.
- `frontend`: The Vite development server for the React frontend.

## Troubleshooting

### Memory Issues

If you encounter memory errors like "out of memory" when using the gpt-oss model:

1. **Check Docker Desktop memory allocation:**
   ```bash
   docker system info | grep "Total Memory"
   ```

2. **If memory is insufficient:**
   - Option 1: Increase Docker Desktop memory allocation (see [Docker Memory Setup Guide](./DOCKER_MEMORY_SETUP.md))
   - Option 2: Switch to the lightweight `tinyllama` model by editing `.env`:
     ```bash
     GENERATION_MODEL=tinyllama
     ```

3. **After changing memory settings or model:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Model Performance

- **gpt-oss:20b**: Provides the best quality responses but requires significant memory (13.4GB+)
- **tinyllama**: Lightweight alternative (638MB) suitable for testing and memory-constrained environments

## Environment Variables

The application supports the following environment variables (configured in `.env`):

- `GENERATION_MODEL`: LLM model for text generation (default: `tinyllama`)
- `EMBEDDING_MODEL`: Model for generating embeddings (default: `mxbai-embed-large`)
