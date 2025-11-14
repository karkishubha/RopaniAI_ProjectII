# app/services/embeddings.py
from dotenv import load_dotenv
import os
from typing import List
import requests
import logging
import hashlib
import json

logger = logging.getLogger(__name__)
load_dotenv()

class EmbeddingService:
    def __init__(self, model_name: str = "embed-english-v3.0") -> None:
        self.model_name = model_name
        self.embedding_dim = 1024  # Cohere embedding dimension 
        #Initialized the cohere dimesnions at 1024dimensions
        
        # Check if we should use Cohere
        self.use_cohere = os.getenv("USE_COHERE", "false").lower() == "true"
        self.cohere_api_key = os.getenv("COHERE_API_KEY")
        
        if self.use_cohere and self.cohere_api_key:
            self.cohere_url = "https://api.cohere.ai/v1/embed"
            self.headers = {
                "Authorization": f"Bearer {self.cohere_api_key}",
                "Content-Type": "application/json"
            }
            logger.info(f"Using Cohere API for embeddings: {model_name}")
        else:
            # Fallback to HuggingFace
            self.use_huggingface = os.getenv("HF_API_KEY") is not None
            if self.use_huggingface:
                self.hf_api_key = os.getenv("HF_API_KEY")
                self.hf_url = f"https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
                self.hf_headers = {"Authorization": f"Bearer {self.hf_api_key}"}
                logger.info("Using HuggingFace API for embeddings (Cohere disabled)")
            else:
                logger.info("Using hash-based embeddings (no API keys provided)")

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        if not texts:
            return []
        
        if self.use_cohere and self.cohere_api_key:
            return self._embed_with_cohere(texts)
        elif hasattr(self, 'use_huggingface') and self.use_huggingface:
            return self._embed_with_huggingface(texts)
        else:
            return self._embed_with_hash(texts)

    def _embed_with_cohere(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using Cohere API."""
        try:
            # Clean and prepare texts
            cleaned_texts = [text.strip()[:2048] for text in texts if text.strip()]
            
            # Try different Cohere models
            models_to_try = ["embed-english-v3.0", "embed-english-v2.0", "embed-english-light-v3.0"]
            
            for model in models_to_try:
                try:
                    payload = {
                        "texts": cleaned_texts,
                        "model": model,
                        "input_type": "search_document",  # Optimized for RAG
                        "truncate": "END"
                    }
                    
                    response = requests.post(
                        self.cohere_url,
                        headers=self.headers,
                        json=payload,
                        timeout=30
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        embeddings = result.get("embeddings", [])
                        
                        if embeddings and len(embeddings) == len(cleaned_texts):
                            logger.info(f"Generated {len(embeddings)} embeddings via Cohere {model}")
                            return embeddings
                        else:
                            logger.warning(f"Invalid embeddings response from {model}")
                    
                    elif response.status_code == 429:  # Rate limit
                        logger.warning(f"Rate limit hit with {model}, waiting...")
                        import time
                        time.sleep(2)
                        continue
                    else:
                        logger.warning(f"Cohere API error with {model}: {response.status_code} - {response.text}")
                        
                except Exception as model_error:
                    logger.warning(f"Error with Cohere model {model}: {model_error}")
                    continue
            
            # All Cohere models failed
            logger.warning("All Cohere models failed, falling back to hash embeddings")
            return self._embed_with_hash(texts)
            
        except Exception as e:
            logger.error(f"Error with Cohere API: {e}, falling back to hash embeddings")
            return self._embed_with_hash(texts)

    def _embed_with_huggingface(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using HuggingFace API."""
        try:
            response = requests.post(
                self.hf_url,
                headers=self.hf_headers,
                json={"inputs": texts, "options": {"wait_for_model": True}},
                timeout=30
            )
            
            if response.status_code == 200:
                embeddings = response.json()
                logger.info(f"Generated {len(embeddings)} embeddings via HuggingFace API")
                return embeddings
            else:
                logger.warning(f"HuggingFace API error: {response.status_code}, falling back to hash embeddings")
                return self._embed_with_hash(texts)
                
        except Exception as e:
            logger.error(f"Error with HuggingFace API: {e}, falling back to hash embeddings")
            return self._embed_with_hash(texts)

    def _embed_with_hash(self, texts: List[str]) -> List[List[float]]:
        """Generate simple hash-based embeddings for texts."""
        embeddings = []
        
        for text in texts:
            # Create a hash of the text
            text_hash = hashlib.sha256(text.encode()).hexdigest()
            
            # Convert hash to numbers and normalize
            embedding = []
            for i in range(0, len(text_hash), 2):
                hex_pair = text_hash[i:i+2]
                value = (int(hex_pair, 16) / 255.0) - 0.5  # Normalize to [-0.5, 0.5]
                embedding.append(value)
            
            # Pad or truncate to desired dimension
            target_dim = 1024 if self.use_cohere else 384  # Match API dimensions
            while len(embedding) < target_dim:
                embedding.extend(embedding[:min(len(embedding), target_dim - len(embedding))])
            
            embedding = embedding[:target_dim]
            
            # Simple normalization
            norm = sum(x*x for x in embedding) ** 0.5
            if norm > 0:
                embedding = [x/norm for x in embedding]
            
            embeddings.append(embedding)
        
        logger.info(f"Generated {len(embeddings)} hash-based embeddings")
        return embeddings
