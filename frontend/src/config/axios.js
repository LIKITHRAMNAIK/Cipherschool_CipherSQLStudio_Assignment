import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const errorData = error.response.data || {};
      const errorMessage = errorData.message || errorData.error || error.response.statusText || 'Request failed';
      return Promise.reject({
        response: error.response,
        message: errorMessage,
        error: errorData.error,
        status: error.response.status,
      });
    } else if (error.request) {
      return Promise.reject({ 
        message: 'Network error. Please check your connection.',
        request: error.request 
      });
    } else {
      return Promise.reject({ 
        message: error.message || 'An unexpected error occurred' 
      });
    }
  }
);

export default api;

