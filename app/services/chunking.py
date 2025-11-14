from typing import List
import re

class ChunkingService:
    """Provides multiple strategies for splitting text into chunks."""

    def __init__(self, token_size: int = 300, overlap: int = 50):
        self.token_size = token_size
        self.overlap = overlap

    def sentence_chunk(self, text: str) -> List[str]:
        """Split text by sentences."""
        sentences = re.split(r'(?<=[.!?]) +', text)
        return [s.strip() for s in sentences if s.strip()]

    def token_chunk(self, text: str) -> List[str]:
        """Split text into chunks of approx. `token_size` words."""
        words = text.split()
        chunks = []
        for i in range(0, len(words), self.token_size):
            chunk = " ".join(words[i:i+self.token_size])
            chunks.append(chunk)
        return chunks

    def sliding_window_chunk(self, text: str) -> List[str]:
        """Split text using sliding window with overlap."""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), self.token_size - self.overlap):
            chunk_words = words[i:i + self.token_size]
            if len(chunk_words) == 0:
                break
            chunk = " ".join(chunk_words)
            chunks.append(chunk)
            #Checked for empty chunked tokens
            # Break if we've reached the end
            if i + self.token_size >= len(words):
                break
                
        return chunks
