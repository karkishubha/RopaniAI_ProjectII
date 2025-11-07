import axios from 'axios';

const baseURL = '';

const marketplaceAPI = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const marketplaceService = {
  // Land Listings
  createListing: async (listingData) => {
    const response = await marketplaceAPI.post('/api/marketplace/listings', listingData);
    return response.data;
  },

  getListings: async (filters = {}) => {
    const response = await marketplaceAPI.get('/api/marketplace/listings', {
      params: filters
    });
    return response.data;
  },

  getListing: async (listingId) => {
    const response = await marketplaceAPI.get(`/api/marketplace/listings/${listingId}`);
    return response.data;
  },

  adjustPrice: async (listingId, adjustmentAmount) => {
    const response = await marketplaceAPI.patch(
      `/api/marketplace/listings/${listingId}/price`,
      { adjustment_amount: adjustmentAmount }
    );
    return response.data;
  },

  deleteListing: async (listingId) => {
    const response = await marketplaceAPI.delete(`/api/marketplace/listings/${listingId}`);
    return response.data;
  },

  // Transactions
  createTransaction: async (transactionData) => {
    const response = await marketplaceAPI.post('/api/marketplace/transactions', transactionData);
    return response.data;
  },

  getTransaction: async (transactionId) => {
    const response = await marketplaceAPI.get(`/api/marketplace/transactions/${transactionId}`);
    return response.data;
  },

  updateTransaction: async (transactionId, updateData) => {
    const response = await marketplaceAPI.patch(
      `/api/marketplace/transactions/${transactionId}`,
      updateData
    );
    return response.data;
  },

  getListingTransactions: async (listingId) => {
    const response = await marketplaceAPI.get(`/api/marketplace/listings/${listingId}/transactions`);
    return response.data;
  },

  // Statistics
  getStats: async () => {
    const response = await marketplaceAPI.get('/api/marketplace/stats');
    return response.data;
  },

  // Photo Management
  uploadPhoto: async (listingId, file, caption = '', isPrimary = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', caption);
    formData.append('is_primary', isPrimary.toString());

    const response = await marketplaceAPI.post(
      `/api/marketplace/listings/${listingId}/photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getPhotos: async (listingId) => {
    const response = await marketplaceAPI.get(`/api/marketplace/listings/${listingId}/photos`);
    return response.data;
  },

  deletePhoto: async (listingId, photoId) => {
    const response = await marketplaceAPI.delete(`/api/marketplace/listings/${listingId}/photos/${photoId}`);
    return response.data;
  },

  setPrimaryPhoto: async (listingId, photoId) => {
    const response = await marketplaceAPI.patch(
      `/api/marketplace/listings/${listingId}/photos/${photoId}/primary`
    );
    return response.data;
  },

  // OCR Document Extraction
  extractDocumentData: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await marketplaceAPI.post(
      '/api/marketplace/extract-document',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

export default marketplaceService;

