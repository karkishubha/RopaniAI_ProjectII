from typing import List, Dict
import redis
import os
import json

# Railway provides REDIS_URL, fallback to individual host/port for local dev
REDIS_URL = os.getenv("REDIS_URL")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

class MemoryService:
    """Handles chat memory using Redis."""

    def __init__(self):
        # Use REDIS_URL if available (Railway), otherwise use host/port (local)
        if REDIS_URL:
            self.redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        else:
            self.redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        """Return list of previous messages."""
        data = self.redis_client.get(session_id)
        return json.loads(data) if data else []

    def add_message(self, session_id: str, role: str, message: str) -> None:
        """Add a message to the Redis memory."""
        history = self.get_history(session_id)
        history.append({"role": role, "message": message})
        self.redis_client.set(session_id, json.dumps(history))
