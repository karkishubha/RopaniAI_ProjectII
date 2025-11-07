"""
MySQL Database configuration for Land Marketplace
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# MySQL Configuration
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "ropani_marketplace")

# Create MySQL connection URL
MYSQL_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"

# Create SQLAlchemy engine
mysql_engine = create_engine(
    MYSQL_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=True
)

# Create SessionLocal class
MySQLSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=mysql_engine)

# Create Base class for models
MySQLBase = declarative_base()

# Dependency to get DB session
def get_mysql_db():
    db = MySQLSessionLocal()
    try:
        yield db
    finally:
        db.close()
