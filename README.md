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
  - **Generation Model**: `gpt-oss:20b`
- **Containerization**: Docker and Docker Compose

## Prerequisites

- [Docker](https://www.docker.com/get-started/) installed and running on your machine.
- Sufficient RAM allocated to Docker (recommended: 16GB+) as running multiple services and large language models can be memory-intensive.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Start the application:**
    Run the following command in the root of the project directory:
    ```bash
    docker-compose up --build
    ```
    This command will build the Docker images for the frontend and backend services and start all the required containers (Ollama, Milvus, Backend, Frontend).

3.  **Initial Model Download (First-time setup):**
    The first time you start the application, the backend service will automatically pull the required LLM models (`mxbai-embed-large` and `gpt-oss:20b`) from Ollama. This can take a significant amount of time and network bandwidth depending on your internet connection. You can monitor the progress by checking the logs for the `backend` service:
    ```bash
    docker-compose logs -f backend
    ```

4.  **Access the application:**
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
