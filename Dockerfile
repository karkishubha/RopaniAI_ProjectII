FROM python:3.11-slim

WORKDIR /code

# Install system dependencies including Tesseract OCR
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    tesseract-ocr \
    tesseract-ocr-nep \
    tesseract-ocr-eng \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /code
USER app

# Expose port
EXPOSE 8000

# Command to run the application - Railway will inject PORT env var
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}