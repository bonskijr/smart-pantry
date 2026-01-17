// Centralized configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const ENDPOINTS = {
    ITEMS: `${API_BASE_URL}/items`,
    CATEGORIES: `${API_BASE_URL}/categories`,
    EXPIRING: `${API_BASE_URL}/expiring`,
    BULK_IMPORT: `${API_BASE_URL}/items/bulk`,
};
