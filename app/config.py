from dotenv import load_dotenv
import os

load_dotenv()

HF_API_KEY: str = os.getenv("HF_API_KEY")
QDRANT_URL: str = os.getenv("QDRANT_URL")
REDIS_URL: str = os.getenv("REDIS_URL")
VECTOR_STORE: str = os.getenv("VECTOR_STORE")
DB_URL: str = os.getenv("DB_URL")
EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL")
LLM_MODEL: str = os.getenv("LLM_MODEL")
