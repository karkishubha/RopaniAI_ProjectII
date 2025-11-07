import axios from 'axios';

// Since Vite proxy handles /api -> http://localhost:8000, we just need /api
const api = axios.create({
  baseURL: '',  // Empty since we're using relative paths with Vite proxy
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chat API
export const chatAPI = {
  // Send a chat query
  sendQuery: async (sessionId, query, documentId = null, useLatestDocument = true) => {
    const payload = {
      session_id: sessionId,
      query: query,
      use_latest_document: useLatestDocument,
    };
    
    // Only add document_id if it's provided
    if (documentId !== null && documentId !== undefined) {
      payload.document_id = documentId;
    }
    
    console.log('Sending query:', payload);
    const response = await api.post('/api/chat/query', payload);
    console.log('Response:', response.data);
    return response.data;
  },

  // Get list of documents
  getDocuments: async () => {
    const response = await api.get('/api/chat/documents');
    return response.data;
  },

  // Delete a document
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/api/chat/documents/${documentId}`);
    return response.data;
  },
};

// Document Ingestion API
export const ingestAPI = {
  // Upload a document
  uploadDocument: async (file, chunkStrategy = 'sentence') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chunk_strategy', chunkStrategy);

    const response = await api.post('/api/ingest/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Booking API
export const bookingAPI = {
  // Create a booking
  createBooking: async (bookingData) => {
    const response = await api.post('/api/booking/create', bookingData);
    return response.data;
  },

  // Get a booking
  getBooking: async (bookingId) => {
    const response = await api.get(`/api/booking/${bookingId}`);
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
