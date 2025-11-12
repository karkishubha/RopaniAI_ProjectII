import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .models import Base

# Railway injects DATABASE_URL, fallback to DB_URL, then localhost
DATABASE_URL: str = os.getenv("DATABASE_URL") or os.getenv("DB_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/rag")

# Create engine
engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Initialize database by creating tables."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """Dependency for getting a database session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
