# RAG Backend API

A robust Retrieval-Augmented Generation (RAG) backend built with FastAPI, supporting document ingestion, conversational AI, and interview booking functionality.

## Features

### 🚀 Core Functionality
- **Document Ingestion API**: Upload PDF/TXT files with intelligent text extraction and chunking
- **Conversational RAG API**: Multi-turn conversations with document context and Redis-based memory
- **Interview Booking API**: Schedule interviews with validation and storage
- **Two Chunking Strategies**: Sentence-based and sliding window with overlap
- **Vector Storage**: Qdrant integration for semantic search
- **Chat Memory**: Redis-powered conversation history
- **Database**: PostgreSQL for metadata and booking storage

### 🛠️ Technology Stack
- **Backend**: FastAPI with async support
- **Vector Database**: Qdrant
- **Session Store**: Redis
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Embeddings**: Cohere API (embed-english-v3.0)
- **LLM**: Cohere API (command-nightly) with HuggingFace fallback
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites
- Docker Desktop
- Python 3.11+ (for local development)
- Git

### 1. Clone and Setup
```bash
git clone https://github.com/Anuj-Bhusal/Rag-Backend
cd rag-backend
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.template .env

# Required: Add Cohere API key for AI functionality
# Edit .env and add: COHERE_API_KEY=your_key_here
# Optional: HF_API_KEY=your_hf_key (fallback)
```

### 3. Run with Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f app
```

The API will be available at `http://localhost:8000`

### 4. API Documentation
Visit `http://localhost:8000/docs` for interactive API documentation.

## API Endpoints

### Document Ingestion
```http
POST /ingest/upload
Content-Type: multipart/form-data

file: <PDF or TXT file>
chunk_strategy: "sentence" | "sliding"
```

### Conversational Chat
```http
POST /chat/query
Content-Type: application/json

{
  "session_id": "unique_session_id",
  "query": "Your question about the documents"
}
```

### Interview Booking
```http
POST /booking/create
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "date": "2024-01-15",
  "time": "14:30"
}
```

## Local Development

### Setup Python Environment
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Run Services Locally
```bash
# Start databases only
docker-compose up -d postgres redis qdrant

# Run FastAPI app locally
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Testing

### Run Test Pipeline
```bash
python test_pipeline.py
```

### Manual API Testing
```bash
# Upload a document
curl -X POST "http://localhost:8000/ingest/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample.pdf" \
  -F "chunk_strategy=sentence"

# Query the document
curl -X POST "http://localhost:8000/chat/query" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session",
    "query": "What is this document about?"
  }'
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI App   │────│   PostgreSQL    │    │     Redis       │
│                 │    │   (Metadata)    │    │ (Chat Memory)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              
         │              ┌─────────────────┐             
         └──────────────│     Qdrant      │             
                        │ (Vector Store)  │             
                        └─────────────────┘             
```

### Data Flow
1. **Document Upload** → Text Extraction → Chunking → Embedding → Vector Store + Database
2. **Chat Query** → Embedding → Vector Search → Context Retrieval → LLM → Response + Memory Update

## Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `DB_URL` | PostgreSQL connection string | `postgresql+psycopg2://postgres:postgres@localhost:5432/rag` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `QDRANT_URL` | Qdrant server URL | `http://localhost:6333` |
| `COHERE_API_KEY` | Cohere API key (required) | - |
| `USE_COHERE` | Enable Cohere integration | `true` |
| `HF_API_KEY` | HuggingFace API key (fallback) | - |

### Chunking Strategies
- **Sentence**: Split by sentence boundaries (good for semantic coherence)
- **Sliding Window**: Overlapping chunks with configurable size and overlap (better coverage)

## Deployment

### Production Considerations
1. **Environment Variables**: Set production values in `.env`
2. **Database**: Use managed PostgreSQL service
3. **Redis**: Use managed Redis service  
4. **Qdrant**: Consider Qdrant Cloud for production
5. **Monitoring**: Add logging and health checks
6. **Security**: Implement authentication/authorization

### Docker Production Build
```bash
# Build production image
docker build -t rag-backend:prod .

# Run with production settings
docker run -p 8000:8000 --env-file .env.prod rag-backend:prod
```

## Troubleshooting

### Common Issues
1. **Model Loading Errors**: Ensure sufficient disk space for SentenceTransformers models
2. **Qdrant Connection**: Check if Qdrant service is running and accessible
3. **HuggingFace API**: Rate limits may cause delays; model loading takes time
4. **PostgreSQL Connection**: Verify database is accessible and credentials are correct

### Health Checks
```bash
# Check service status
curl http://localhost:8000/docs

# Check Qdrant
curl http://localhost:6333/health

# Check Redis
docker exec -it rag_redis redis-cli ping
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
