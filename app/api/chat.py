from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.services.embeddings import EmbeddingService
from app.services.vectorstore import VectorStoreService
from app.services.memory import MemoryService
from app.services.llm import LLMService
from app.db.session import get_db
from app.db import models

router = APIRouter(prefix="/chat", tags=["Chat"])

# Services
embedder = EmbeddingService()
vectorstore = VectorStoreService()
memory = MemoryService()
llm = LLMService()


class QueryRequest(BaseModel):
    session_id: str
    query: str
    document_id: int = None  # Optional: focus on specific document
    use_latest_document: bool = True  # Default: prioritize latest upload


class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    document_context: Dict[str, Any] = None  # Info about which document was used


@router.post("/query", response_model=QueryResponse)
async def chat_query(request: QueryRequest, db: Session = Depends(get_db)) -> QueryResponse:
    """
    Handle conversational RAG queries with document prioritization.
    """
    document_context = None
    
    # Step 1: Determine target document(s)
    target_document_ids = []
    if request.document_id:
        # User specified a document
        target_document_ids = [request.document_id]
        doc = db.query(models.Document).filter(models.Document.id == request.document_id).first()
        if doc:
            document_context = {"id": doc.id, "filename": doc.filename, "uploaded": doc.uploaded_at}
    elif request.use_latest_document:
        # Use the most recently uploaded document
        latest_doc = db.query(models.Document).order_by(models.Document.uploaded_at.desc()).first()
        if latest_doc:
            target_document_ids = [latest_doc.id]
            document_context = {"id": latest_doc.id, "filename": latest_doc.filename, "uploaded": latest_doc.uploaded_at}

    # Step 2: Embed the query
    query_embedding: List[float] = embedder.embed_texts([request.query])[0]

    # Step 3: Retrieve from Qdrant with document filtering if specified
    results: List[Dict[str, Any]] = []
    context = ""
    
    if target_document_ids:
        # First try to get results from target document(s)
        all_results = vectorstore.query(query_embedding, top_k=10)  # Get more results
        
        # Filter results by target document(s)
        filtered_results = []
        for result in all_results:
            if result.get("metadata", {}).get("document_id") in target_document_ids:
                filtered_results.append(result)
        
        if len(filtered_results) >= 3:
            results = filtered_results[:5]  # Use filtered results
        else:
            # Not enough results from target document, supplement with others but prioritize target
            results = filtered_results + [r for r in all_results if r not in filtered_results][:5]
    else:
        # No document specified, search all documents
        results = vectorstore.query(query_embedding, top_k=5)
    
    # Step 4: Build context from results
    if results:
        context = "\n".join([r["metadata"]["text"] for r in results])
    else:
        # Fallback: Search database for text containing keywords
        query_keywords = request.query.lower().split()
        
        if target_document_ids:
            # Search only in target document(s)
            chunks = db.query(models.DocumentChunk).filter(
                models.DocumentChunk.document_id.in_(target_document_ids)
            ).all()
        else:
            chunks = db.query(models.DocumentChunk).all()
        
        relevant_chunks = []
        for chunk in chunks:
            chunk_text_lower = chunk.chunk_text.lower()
            if any(keyword in chunk_text_lower for keyword in query_keywords):
                relevant_chunks.append(chunk)
        
        if relevant_chunks:
            context = "\n".join([chunk.chunk_text for chunk in relevant_chunks[:3]])
            # Create mock results for response
            results = [
                {
                    "id": f"chunk_{chunk.id}",
                    "score": 0.8,
                    "metadata": {
                        "document_id": chunk.document_id,
                        "chunk_id": chunk.id,
                        "text": chunk.chunk_text
                    }
                }
                for chunk in relevant_chunks[:3]
            ]

    # Step 5: Get history from Redis
    history: List[Dict[str, str]] = memory.get_history(request.session_id)

    # Step 6: Build enhanced prompt with document context
    if document_context:
        enhanced_query = f"Based on the document '{document_context['filename']}' uploaded on {document_context['uploaded']}: {request.query}"
    else:
        enhanced_query = request.query
    
    prompt: str = llm.build_prompt(enhanced_query, context, history)

    # Step 7: Call LLM
    answer: str = llm.call_llm(prompt)

    # Step 8: Update Redis memory
    memory.add_message(request.session_id, "user", request.query)
    memory.add_message(request.session_id, "assistant", answer)

    return QueryResponse(
        answer=answer, 
        sources=results,
        document_context=document_context
    )


@router.get("/documents")
async def list_documents(db: Session = Depends(get_db)):
    """List all uploaded documents."""
    documents = db.query(models.Document).order_by(models.Document.uploaded_at.desc()).all()
    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "filetype": doc.filetype,
            "uploaded_at": doc.uploaded_at,
            "chunk_count": len(doc.chunks) if hasattr(doc, 'chunks') else 0
        }
        for doc in documents
    ]


@router.delete("/documents/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a document and all its chunks."""
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from vector store (if implemented)
    try:
        vectorstore.delete_by_document_id(document_id)
    except Exception as e:
        logger.warning(f"Could not delete from vector store: {e}")
    
    # Delete from database
    db.query(models.DocumentChunk).filter(models.DocumentChunk.document_id == document_id).delete()
    db.delete(document)
    db.commit()
    
    return {"message": f"Document {document_id} deleted successfully"}
