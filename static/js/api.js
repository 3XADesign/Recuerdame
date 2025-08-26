/**
 * API.js - API communication utilities
 * Handles HTTP requests and data management
 */

class API {
    constructor() {
        this.baseURL = window.location.origin;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
        this.init();
    }

    init() {
        this.setupInterceptors();
        console.log('API module initialized');
    }

    // HTTP Methods
    async get(endpoint, options = {}) {
        return this.request('GET', endpoint, null, options);
    }

    async post(endpoint, data = null, options = {}) {
        return this.request('POST', endpoint, data, options);
    }

    async put(endpoint, data = null, options = {}) {
        return this.request('PUT', endpoint, data, options);
    }

    async delete(endpoint, options = {}) {
        return this.request('DELETE', endpoint, null, options);
    }

    async patch(endpoint, data = null, options = {}) {
        return this.request('PATCH', endpoint, data, options);
    }

    // Core request method
    async request(method, endpoint, data = null, options = {}) {
        const {
            headers = {},
            timeout = 10000,
            retries = 0,
            cache = false
        } = options;

        const url = this.buildURL(endpoint);
        const config = {
            method,
            headers: { ...this.defaultHeaders, ...headers },
            signal: AbortSignal.timeout(timeout)
        };

        // Add body for non-GET requests
        if (data && method !== 'GET') {
            if (data instanceof FormData) {
                // Remove Content-Type for FormData (browser sets it automatically)
                delete config.headers['Content-Type'];
                config.body = data;
            } else {
                config.body = JSON.stringify(data);
            }
        }

        // Cache handling
        if (cache && method === 'GET') {
            const cached = this.getFromCache(url);
            if (cached) return cached;
        }

        try {
            const response = await this.fetchWithRetry(url, config, retries);
            const result = await this.handleResponse(response);

            // Cache successful GET requests
            if (cache && method === 'GET' && response.ok) {
                this.setCache(url, result);
            }

            return result;
        } catch (error) {
            this.handleError(error, endpoint);
            throw error;
        }
    }

    // URL building
    buildURL(endpoint) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${this.baseURL}${cleanEndpoint}`;
    }

    // Retry mechanism
    async fetchWithRetry(url, config, retries) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, config);
                
                // Don't retry on client errors (4xx) unless it's a timeout
                if (response.status >= 400 && response.status < 500 && response.status !== 408) {
                    return response;
                }
                
                // Retry on server errors (5xx) or network issues
                if (response.ok || attempt === retries) {
                    return response;
                }
                
                // Wait before retry (exponential backoff)
                await this.delay(Math.pow(2, attempt) * 1000);
            } catch (error) {
                if (attempt === retries) throw error;
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }
    }

    // Response handling
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
            const error = new Error(`HTTP Error: ${response.status}`);
            error.status = response.status;
            error.statusText = response.statusText;
            
            // Try to get error details from response
            try {
                if (contentType?.includes('application/json')) {
                    error.data = await response.json();
                } else {
                    error.data = await response.text();
                }
            } catch (e) {
                // Ignore parsing errors
            }
            
            throw error;
        }

        // Handle different content types
        if (contentType?.includes('application/json')) {
            return response.json();
        } else if (contentType?.includes('text/')) {
            return response.text();
        } else {
            return response.blob();
        }
    }

    // Error handling
    handleError(error, endpoint) {
        console.error(`API Error [${endpoint}]:`, error);
        
        // Show user-friendly error messages
        if (window.UI) {
            let message = 'Error de conexión';
            
            if (error.name === 'AbortError') {
                message = 'La solicitud tardó demasiado';
            } else if (error.status === 404) {
                message = 'Recurso no encontrado';
            } else if (error.status === 401) {
                message = 'No autorizado';
            } else if (error.status === 403) {
                message = 'Acceso denegado';
            } else if (error.status >= 500) {
                message = 'Error del servidor';
            } else if (!navigator.onLine) {
                message = 'Sin conexión a internet';
            }
            
            UI.showToast(message, 'danger');
        }
    }

    // Cache management
    getFromCache(url) {
        try {
            const cached = localStorage.getItem(`api_cache_${url}`);
            if (cached) {
                const { data, timestamp, ttl } = JSON.parse(cached);
                if (Date.now() - timestamp < ttl) {
                    return data;
                }
                localStorage.removeItem(`api_cache_${url}`);
            }
        } catch (e) {
            // Ignore cache errors
        }
        return null;
    }

    setCache(url, data, ttl = 300000) { // 5 minutes default TTL
        try {
            const cacheEntry = {
                data,
                timestamp: Date.now(),
                ttl
            };
            localStorage.setItem(`api_cache_${url}`, JSON.stringify(cacheEntry));
        } catch (e) {
            // Ignore cache errors (probably quota exceeded)
        }
    }

    clearCache() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('api_cache_')) {
                localStorage.removeItem(key);
            }
        });
    }

    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Request interceptors
    setupInterceptors() {
        // Add CSRF token if available
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (csrfToken) {
            this.defaultHeaders['X-CSRF-Token'] = csrfToken;
        }
    }

    // Specific API endpoints
    async getLastLocation() {
        return this.get('/api/last-location', { cache: true });
    }

    async updateLocation(latitude, longitude) {
        return this.post('/api/location', { latitude, longitude });
    }

    async createFamily(familyData) {
        return this.post('/api/family', familyData);
    }

    async sendInvite(email, role = 'member') {
        return this.post('/api/invite', { email, role });
    }

    async getMemories(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        const endpoint = params ? `/api/memories?${params}` : '/api/memories';
        return this.get(endpoint, { cache: true });
    }

    async createMemory(memoryData) {
        return this.post('/api/memories', memoryData);
    }

    async getReminders() {
        return this.get('/api/reminders', { cache: true });
    }

    async createReminder(reminderData) {
        return this.post('/api/reminders', reminderData);
    }

    async updateReminder(id, updates) {
        return this.patch(`/api/reminders/${id}`, updates);
    }

    async getAlerts(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        const endpoint = params ? `/api/alerts?${params}` : '/api/alerts';
        return this.get(endpoint, { cache: true });
    }

    async markAlertAsRead(alertId) {
        return this.patch(`/api/alerts/${alertId}`, { read: true });
    }

    async getFamilyMembers() {
        return this.get('/api/family/members', { cache: true });
    }

    async uploadFile(file, path = '/api/upload') {
        const formData = new FormData();
        formData.append('file', file);
        
        return this.post(path, formData, {
            timeout: 30000 // Longer timeout for file uploads
        });
    }

    // Health check
    async healthCheck() {
        return this.get('/healthz');
    }

    // Batch requests
    async batch(requests) {
        const promises = requests.map(req => {
            const { method = 'GET', endpoint, data, options } = req;
            return this.request(method, endpoint, data, options)
                .catch(error => ({ error, endpoint }));
        });
        
        return Promise.all(promises);
    }
}

// Initialize API when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.API = new API();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
