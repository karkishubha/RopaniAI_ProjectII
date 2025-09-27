
from typing import List, Dict
import os
import requests
import logging
import time

# Set up logger first
logger = logging.getLogger(__name__)

try:
    import cohere
    COHERE_AVAILABLE = True
except ImportError:
    COHERE_AVAILABLE = False
    logger.warning("Cohere library not installed. Install with: pip install cohere")

# Cohere API configuration
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
USE_COHERE = os.getenv("USE_COHERE", "false").lower() == "true"

# HuggingFace fallback configuration
HF_API_KEY = os.getenv("HF_API_KEY")

class LLMService:
    """Handles LLM prompts and responses with Cohere and HuggingFace fallback."""

    def __init__(self):
        if USE_COHERE and COHERE_API_KEY and COHERE_AVAILABLE:
            # Initialize Cohere client with current working models
            self.cohere_client = cohere.Client(api_key=COHERE_API_KEY)
            self.cohere_headers = {
                "Authorization": f"Bearer {COHERE_API_KEY}",
                "Content-Type": "application/json"
            }
            self.use_cohere = True
            logger.info(f"LLM Service initialized with Cohere API client")
        else:
            self.use_cohere = False
            
        # Always initialize HF headers for fallback
        if HF_API_KEY:
            self.hf_headers = {"Authorization": f"Bearer {HF_API_KEY}"}
            logger.info(f"LLM Service initialized with HuggingFace API fallback")
        else:
            self.hf_headers = None
            logger.warning("No API keys available, using fallback responses only")

    def build_prompt(self, query: str, context: str, history: List[Dict[str, str]]) -> str:
        """Combine query, context, and history into a single prompt."""
        # Keep history short for better results
        recent_history = history[-3:] if len(history) > 3 else history
        history_text = "\n".join([f"{h['role']}: {h['message']}" for h in recent_history])
        
        prompt = f"""You are a helpful assistant. Use the provided context to answer the question accurately.

Context: {context[:1500]}

Chat History:
{history_text}

Question: {query}
Answer:"""
        return prompt

    def call_llm(self, prompt: str) -> str:
        """Call LLM API with Cohere priority and HuggingFace fallback."""
        if self.use_cohere:
            response = self._call_cohere_api(prompt)
            if response:
                return response
        
        # Try HuggingFace fallback
        if HF_API_KEY and self.hf_headers:
            response = self._call_huggingface_api(prompt)
            if response:
                return response
        
        # Use enhanced fallback
        return self._enhanced_fallback_response(prompt)

    def _call_cohere_api(self, prompt: str) -> str:
        """Call Cohere API with current available models."""
        try:
            # Current working models (as of Sept 2025)
            models_to_try = [
                "command-nightly",          # Fast and working
                "command-a-03-2025",        # Latest flagship
                "command-r7b-12-2024",      # Reliable option
                "c4ai-aya-expanse-8b",      # Open source option
                "command-r-08-2024",        # Stable release
            ]
            
            for model_name in models_to_try:
                try:
                    response = self._cohere_chat_api(prompt, model_name)
                    if response and len(response.strip()) > 10:
                        logger.info(f"Successfully generated response using Cohere {model_name}")
                        return response.strip()
                        
                except Exception as model_error:
                    logger.warning(f"Error with Cohere {model_name}: {model_error}")
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"Error calling Cohere API: {e}")
            return None

    def _cohere_chat_api(self, prompt: str, model: str) -> str:
        """Call Cohere's Chat API using the official client."""
        try:
            response = self.cohere_client.chat(
                message=prompt,
                model=model,
                temperature=0.7,
                max_tokens=300
            )
            
            return response.text.strip() if response.text else None
            
        except Exception as e:
            # Check if it's a rate limit error
            if "rate limit" in str(e).lower() or "429" in str(e):
                logger.warning(f"Cohere rate limit hit with {model}")
                time.sleep(2)
                return None
            else:
                logger.warning(f"Error with Cohere {model}: {e}")
                return None

    def _cohere_generate_api(self, prompt: str, model: str) -> str:
        """Generate API was removed September 15, 2025. Use chat API instead."""
        logger.warning("Generate API is deprecated, using chat API instead")
        return self._cohere_chat_api(prompt, model)

    def _call_huggingface_api(self, prompt: str) -> str:
        """Call HuggingFace API as fallback."""
        if not self.hf_headers:
            return None
            
        try:
            models_to_try = [
                "microsoft/DialoGPT-medium",
                "facebook/blenderbot-400M-distill",
                "google/flan-t5-base"
            ]
            
            for model_name in models_to_try:
                try:
                    model_url = f"https://api-inference.huggingface.co/models/{model_name}"
                    payload = {"inputs": prompt[-500:]}
                    
                    response = requests.post(
                        model_url,
                        headers=self.hf_headers,
                        json=payload,
                        timeout=20
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if isinstance(result, list) and len(result) > 0:
                            generated_text = result[0].get("generated_text", "")
                            if len(generated_text.strip()) > 10:
                                logger.info(f"Successfully generated response using HuggingFace {model_name}")
                                return generated_text.replace(prompt[-500:], "").strip()
                    
                except Exception as model_error:
                    logger.warning(f"Error with HuggingFace {model_name}: {model_error}")
                    continue
                    
            return None
            
        except Exception as e:
            logger.error(f"Error calling HuggingFace API: {e}")
            return None

    def _fallback_response(self, prompt: str) -> str:
        """Generate a basic fallback response by extracting context."""
        try:
            # Extract context from prompt
            if "Context:" in prompt:
                context_part = prompt.split("Context:")[1].split("Question:")[0].strip()
            elif "context" in prompt.lower():
                lines = prompt.split('\n')
                context_lines = [line for line in lines if len(line.strip()) > 10][:5]
                context_part = " ".join(context_lines)
            else:
                context_part = prompt[:500]
            
            # Try to extract meaningful information
            if context_part:
                return f"Based on the provided information: {context_part[:300]}..."
            else:
                return "I understand your question, but I'm unable to generate a detailed response at the moment. The system is working on processing your request."
                
        except Exception:
            return "I understand your question, but I'm unable to generate a detailed response at the moment."

    def _enhanced_fallback_response(self, prompt: str) -> str:
        """Generate an enhanced fallback response with better context extraction."""
        try:
            # Extract key information from the prompt
            query = ""
            context = ""
            
            # Parse prompt structure
            if "Question:" in prompt:
                parts = prompt.split("Question:")
                if len(parts) > 1:
                    query = parts[-1].strip()
                    context = parts[0].strip()
            elif "Context:" in prompt:
                parts = prompt.split("Context:")
                if len(parts) > 1:
                    context_section = parts[1]
                    if "Question:" in context_section:
                        context_parts = context_section.split("Question:")
                        context = context_parts[0].strip()
                        query = context_parts[1].strip() if len(context_parts) > 1 else ""
                    else:
                        context = context_section.strip()
            else:
                # Fallback parsing
                lines = prompt.split('\n')
                context_lines = [line for line in lines if len(line.strip()) > 20]
                context = " ".join(context_lines[:3])
                query = lines[-1] if lines else ""
            
            # Generate intelligent response
            if context and len(context.strip()) > 50:
                # Extract key entities and topics from context
                words = context.lower().split()
                key_topics = [word for word in words if len(word) > 5 and word.isalpha()][:10]
                
                if "entity" in query.lower() or "entities" in query.lower():
                    # Special handling for entity questions
                    entities = []
                    for line in context.split('\n'):
                        if any(indicator in line.lower() for indicator in ['name:', 'title:', 'id:', 'type:', 'table:', 'entity']):
                            entities.append(line.strip())
                    
                    if entities:
                        return f"Based on the document, I can identify the following entities: {', '.join(entities[:5])}. {context[:200]}..."
                
                return f"Based on the available information: {context[:400]}... The document contains information about {', '.join(key_topics[:3])} and related topics."
            else:
                return "I can see your question but I'm currently unable to access the full LLM capabilities. The system has processed your query and found relevant information, but cannot provide a detailed analysis at this moment."
                
        except Exception as e:
            logger.error(f"Error in enhanced fallback: {e}")
            return "I understand your question and have found relevant information, but I'm unable to provide a detailed response at the moment."

    def _fallback_response(self, prompt: str) -> str:
        """Provide a fallback response when LLM API is unavailable."""
        # Try to extract context from the prompt to give a better response
        lines = prompt.split('\n')
        context_lines = []
        question = ""
        
        # Extract context and question from prompt
        in_context = False
        for line in lines:
            if line.startswith('Context:'):
                in_context = True
                continue
            elif line.startswith('Question:'):
                question = line.replace('Question:', '').strip()
                break
            elif line.startswith('Chat History:') or line.startswith('Answer:'):
                in_context = False
            elif in_context and line.strip():
                context_lines.append(line.strip())
        
        context_text = ' '.join(context_lines)
        
        # If we have context, try to provide a relevant response
        if context_text and len(context_text) > 20:
            # Simple keyword-based response generation
            if any(word in question.lower() for word in ['interest', 'hobby', 'like', 'enjoy']):
                return f"Based on the document provided, I can see information about your background. However, the LLM service is currently unavailable for detailed analysis. The document contains: {context_text[:200]}..."
            elif any(word in question.lower() for word in ['skill', 'experience', 'work', 'job']):
                return f"From the uploaded document, I can see details about your professional background. The LLM service is currently unavailable, but the document mentions: {context_text[:200]}..."
            elif any(word in question.lower() for word in ['education', 'study', 'degree', 'university']):
                return f"Based on your document, I can see educational information. Unfortunately, the LLM service is unavailable for detailed responses, but the document contains: {context_text[:200]}..."
            else:
                return f"I found relevant information in your document: {context_text[:300]}... However, the LLM service is currently unavailable for detailed analysis."
        
        # Original fallback logic
        if "booking" in prompt.lower():
            return "I can help you with booking appointments. Please provide your name, email, date, and time."
        elif "document" in prompt.lower():
            return "Based on the uploaded documents, I can provide information. However, the LLM service is currently unavailable."
        else:
            return "I understand your question, but I'm currently unable to provide a detailed response due to service limitations."

    def _enhanced_fallback_response(self, prompt: str) -> str:
        """Generate an enhanced fallback response with better context extraction."""
        try:
            # Extract key information from the prompt
            query = ""
            context = ""
            
            # Parse prompt structure
            if "Question:" in prompt:
                parts = prompt.split("Question:")
                if len(parts) > 1:
                    query = parts[-1].strip()
                    context = parts[0].strip()
            elif "Context:" in prompt:
                parts = prompt.split("Context:")
                if len(parts) > 1:
                    context_section = parts[1]
                    if "Question:" in context_section:
                        context_parts = context_section.split("Question:")
                        context = context_parts[0].strip()
                        query = context_parts[1].strip() if len(context_parts) > 1 else ""
                    else:
                        context = context_section.strip()
            else:
                # Fallback parsing
                lines = prompt.split('\n')
                context_lines = [line for line in lines if len(line.strip()) > 20]
                context = " ".join(context_lines[:3])
                query = lines[-1] if lines else ""
            
            # Generate intelligent response
            if context and len(context.strip()) > 50:
                # Extract key entities and topics from context
                words = context.lower().split()
                key_topics = [word for word in words if len(word) > 5 and word.isalpha()][:10]
                
                if "entity" in query.lower() or "entities" in query.lower():
                    # Special handling for entity questions
                    entities = []
                    for line in context.split('\n'):
                        if any(indicator in line.lower() for indicator in ['name:', 'title:', 'id:', 'type:', 'table:', 'entity']):
                            entities.append(line.strip())
                    
                    if entities:
                        return f"Based on the document, I can identify the following entities: {', '.join(entities[:5])}. {context[:200]}..."
                
                return f"Based on the available information: {context[:400]}... The document contains information about {', '.join(key_topics[:3])} and related topics."
            else:
                return "I can see your question but I'm currently unable to access the full LLM capabilities. The system has processed your query and found relevant information, but cannot provide a detailed analysis at this moment."
                
        except Exception as e:
            logger.error(f"Error in enhanced fallback: {e}")
            return "I understand your question and have found relevant information, but I'm unable to provide a detailed response at the moment."
