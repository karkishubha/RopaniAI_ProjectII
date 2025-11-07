# 🏗️ Ropani AI - System Architecture

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                    http://localhost:5173                         │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ HTTP/REST
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                   REACT FRONTEND (Vite)                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌────────────┐  │
│  │    Home    │  │  Chatbot   │  │   OCR    │  │ Dashboard  │  │
│  │    Page    │  │    Page    │  │  Form    │  │    Page    │  │
│  └────────────┘  └────────────┘  └──────────┘  └────────────┘  │
│                    ┌────────────┐                                │
│                    │   Price    │                                │
│                    │ Predictor  │                                │
│                    └────────────┘                                │
│                                                                   │
│                    ┌────────────┐                                │
│                    │ API Service│                                │
│                    │  (Axios)   │                                │
│                    └─────┬──────┘                                │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ Proxy: /api -> :8000
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                   FASTAPI BACKEND                                 │
│                  http://localhost:8000                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API ROUTES                             │   │
│  │  /api/chat/query  │  /api/ingest/upload  │  /api/booking │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                       │
│  ┌────────────────────────▼──────────────────────────────────┐  │
│  │                    SERVICES LAYER                          │  │
│  │                                                             │  │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────┐         │  │
│  │  │ Embeddings │  │    LLM     │  │  Chunking   │         │  │
│  │  │  Service   │  │  Service   │  │   Service   │         │  │
│  │  │  (Cohere)  │  │  (Cohere)  │  │  (Sentence) │         │  │
│  │  └────────────┘  └────────────┘  └─────────────┘         │  │
│  │                                                             │  │
│  │  ┌────────────┐  ┌────────────┐                           │  │
│  │  │ Vectorstore│  │   Memory   │                           │  │
│  │  │  Service   │  │  Service   │                           │  │
│  │  │  (Qdrant)  │  │  (Redis)   │                           │  │
│  │  └────────────┘  └────────────┘                           │  │
│  └─────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
┌──────────▼─────────┐ ┌──▼───────┐ ┌─────▼──────┐
│    PostgreSQL      │ │  Redis   │ │   Qdrant   │
│   (Metadata DB)    │ │ (Memory) │ │ (Vectors)  │
│  localhost:5432    │ │   :6379  │ │   :6333    │
└────────────────────┘ └──────────┘ └────────────┘
```

## 🔄 Data Flow Diagrams

### 1. Document Ingestion Flow

```
User Upload (PDF/TXT)
         │
         ▼
   Frontend Upload Component
         │
         ▼
   POST /api/ingest/upload
         │
         ▼
   FastAPI Ingest Endpoint
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
   Text Extraction    Metadata Storage
    (PyPDF/txt)       (PostgreSQL)
         │
         ▼
   Chunking Service
   (Sentence/Sliding)
         │
         ▼
   Embedding Service
     (Cohere API)
     embed-english-v3.0
         │
         ▼
   Vector Storage
   (Qdrant Collection)
         │
         ▼
   Return Success Response
         │
         ▼
   Frontend Updates UI
```

### 2. Chat Query Flow

```
User Types Message
         │
         ▼
   Chatbot Component
   (Session ID)
         │
         ▼
   POST /api/chat/query
         │
         ▼
   FastAPI Chat Endpoint
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
   Memory Service    Vector Search     Query Embedding
   (Get History)      (Qdrant)         (Cohere)
    [Redis]              │
         │               │
         │               ▼
         │      Top-K Similar Chunks
         │               │
         └───────────────┴──────────────┐
                                        │
                                        ▼
                              Build Context Prompt
                                        │
                                        ▼
                                LLM Generation
                              (Cohere command-nightly)
                                        │
                                        ▼
                              Store in Memory (Redis)
                                        │
                                        ▼
                              Return Response + Sources
                                        │
                                        ▼
                              Frontend Displays Message
```

### 3. Price Prediction Flow

```
User Fills Form
         │
         ▼
   Price Predictor Component
         │
         ▼
   Calculate Price (Frontend)
   [Mock ML Model]
         │
         ├─ Base Price (by location)
         ├─ Type Multiplier
         ├─ Road Multiplier
         └─ Facilities Multiplier
         │
         ▼
   Display Prediction
   - Price per unit
   - Total value
   - Confidence score
   - Factor breakdown
```

## 🗂️ Component Hierarchy

### Frontend Component Tree

```
App
├── Navbar
│   └── Navigation Links (Home, Chatbot, OCR, Dashboard, Predictor)
│
├── Routes
│   ├── Home
│   │   ├── Hero Section
│   │   ├── Features Grid
│   │   └── About Section
│   │
│   ├── Chatbot
│   │   ├── Sidebar
│   │   │   ├── Upload Button
│   │   │   └── Documents List
│   │   └── Main Chat
│   │       ├── Header
│   │       ├── Messages Area
│   │       │   ├── Welcome Message
│   │       │   ├── User Messages
│   │       │   ├── Assistant Messages
│   │       │   └── System Messages
│   │       └── Input Area
│   │
│   ├── OCRForm
│   │   ├── Upload Section
│   │   │   ├── Drop Zone
│   │   │   └── File Preview
│   │   └── Extracted Data Section
│   │       ├── Document Details
│   │       ├── Owner Info
│   │       ├── Land Details
│   │       ├── Location
│   │       └── Boundaries
│   │
│   ├── Dashboard
│   │   ├── Header with Selector
│   │   ├── Stats Cards (3)
│   │   ├── Charts Grid
│   │   │   ├── Price Trend (Line Chart)
│   │   │   ├── Transactions (Bar Chart)
│   │   │   ├── Land Use (Pie Chart)
│   │   │   └── City Comparison (Bars)
│   │   └── Insights Section
│   │
│   └── PricePredictor
│       ├── Input Form
│       │   ├── Location Fields
│       │   ├── Area Fields
│       │   ├── Land Type Radio
│       │   ├── Road Access Radio
│       │   └── Facilities Checkboxes
│       └── Result Section
│           ├── Price Display
│           ├── Confidence Bar
│           ├── Factors Grid
│           └── Disclaimer
│
└── API Service
    ├── chatAPI
    ├── ingestAPI
    └── bookingAPI
```

### Backend Service Architecture

```
FastAPI Application
├── API Layer (app/api/)
│   ├── chat.py
│   │   └── /chat/query
│   ├── ingest.py
│   │   └── /ingest/upload
│   └── booking.py
│       └── /booking/create
│
├── Services Layer (app/services/)
│   ├── embeddings.py
│   │   └── CohereEmbeddings
│   ├── llm.py
│   │   └── CohereLLM
│   ├── chunking.py
│   │   ├── SentenceChunker
│   │   └── SlidingWindowChunker
│   ├── vectorstore.py
│   │   └── QdrantVectorStore
│   └── memory.py
│       └── RedisMemory
│
├── Database Layer (app/db/)
│   ├── models.py
│   │   ├── Document
│   │   └── Booking
│   └── session.py
│       └── get_db()
│
└── Configuration (app/)
    ├── config.py
    └── main.py
```

## 🔐 Security & Configuration

### Environment Variables

```
Backend (.env):
├── COHERE_API_KEY      # Cohere API key (required)
├── USE_COHERE          # Enable Cohere (true/false)
├── HF_API_KEY          # HuggingFace key (fallback)
├── DB_URL              # PostgreSQL connection
├── REDIS_HOST          # Redis host
├── REDIS_PORT          # Redis port
└── QDRANT_URL          # Qdrant server URL

Frontend:
└── VITE_API_BASE_URL   # Backend API URL (optional)
```

## 🌐 Network Architecture

```
┌─────────────────────────────────────────────────┐
│              Docker Network                      │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │PostgreSQL│  │  Redis   │  │  Qdrant  │     │
│  │  :5432   │  │  :6379   │  │  :6333   │     │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘     │
│        │             │              │           │
│        └─────────────┼──────────────┘           │
│                      │                          │
│                 ┌────▼────┐                     │
│                 │ FastAPI │                     │
│                 │  :8000  │                     │
│                 └────┬────┘                     │
│                      │                          │
└──────────────────────┼──────────────────────────┘
                       │
                  Port Mapping
                       │
                  Host :8000
                       │
                  Vite Proxy
                       │
                  Frontend :5173
```

## 📦 Deployment Architecture

### Development Setup
```
Developer Machine
├── Docker Desktop
│   ├── PostgreSQL Container
│   ├── Redis Container
│   ├── Qdrant Container
│   └── FastAPI Container
└── Node.js (Vite Dev Server)
```

### Production Setup (Proposed)
```
Cloud Infrastructure
├── Frontend
│   └── Vercel / Netlify
│       └── Static Build (dist/)
│
├── Backend
│   └── Cloud Run / AWS ECS / Heroku
│       └── FastAPI Container
│
├── Databases
│   ├── Managed PostgreSQL (AWS RDS / GCP SQL)
│   ├── Managed Redis (AWS ElastiCache / Redis Cloud)
│   └── Qdrant Cloud
│
└── CDN
    └── CloudFlare / AWS CloudFront
```

## 🔄 State Management

### Frontend State
```
Component State (useState)
├── Chatbot
│   ├── messages[]
│   ├── sessionId
│   ├── documents[]
│   ├── loading
│   └── input
│
├── Dashboard
│   ├── selectedMunicipality
│   └── chartData
│
└── PricePredictor
    ├── formData{}
    ├── prediction{}
    └── loading
```

### Backend State
```
In-Memory State
├── Application Config
│   └── Settings Object
│
Persistent State
├── PostgreSQL
│   ├── documents
│   └── bookings
│
├── Redis
│   └── chat_sessions:{session_id}
│       └── messages[]
│
└── Qdrant
    └── documents_collection
        └── vectors + metadata
```

## 🚀 Request Flow Examples

### Example 1: Upload Document
```
1. User selects file in Chatbot
2. Frontend: POST /api/ingest/upload (multipart/form-data)
3. Backend: Receives file, extracts text
4. Backend: Chunks text (sentence/sliding)
5. Backend: Calls Cohere API for embeddings
6. Backend: Stores vectors in Qdrant
7. Backend: Stores metadata in PostgreSQL
8. Backend: Returns {status: "success", doc_id: "..."}
9. Frontend: Shows success message, adds to documents list
```

### Example 2: Chat Query
```
1. User types message and clicks send
2. Frontend: POST /api/chat/query {session_id, query}
3. Backend: Gets chat history from Redis
4. Backend: Generates query embedding (Cohere)
5. Backend: Searches Qdrant for similar chunks
6. Backend: Builds context with top-K results
7. Backend: Calls Cohere LLM with context + history
8. Backend: Gets response from LLM
9. Backend: Stores message pair in Redis
10. Backend: Returns {response, sources}
11. Frontend: Displays assistant message with sources
```

## 📊 Performance Considerations

### Frontend
- **Code Splitting**: React Router lazy loading (not implemented yet)
- **Image Optimization**: Not applicable (no images)
- **Bundle Size**: ~500 KB estimated
- **Caching**: Browser cache for static assets

### Backend
- **Connection Pooling**: SQLAlchemy engine with pool
- **Redis Caching**: Session memory for fast retrieval
- **Vector Search**: Qdrant optimized for similarity search
- **Async Operations**: FastAPI async endpoints

---

**This architecture provides a scalable, maintainable foundation for Ropani AI!** 🚀
