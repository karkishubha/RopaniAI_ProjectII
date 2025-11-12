from dotenv import load_dotenv
import os

load_dotenv()

HF_API_KEY: str = os.getenv("HF_API_KEY")
QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
# Railway injects DATABASE_URL for PostgreSQL, fallback to DB_URL
REDIS_URL: str = os.getenv("REDIS_URL") or os.getenv("REDIS_PRIVATE_URL")
VECTOR_STORE: str = os.getenv("VECTOR_STORE", "qdrant")
DB_URL: str = os.getenv("DATABASE_URL") or os.getenv("DB_URL")
EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "embed-english-v3.0")
LLM_MODEL: str = os.getenv("LLM_MODEL", "command-nightly")

# MySQL config (Railway injects MYSQL_URL)
MYSQL_URL: str = os.getenv("MYSQL_URL") or os.getenv("MYSQL_PRIVATE_URL")
MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "ropani_marketplace")

# Cohere config
COHERE_API_KEY: str = os.getenv("COHERE_API_KEY")
USE_COHERE: bool = os.getenv("USE_COHERE", "true").lower() == "true"
