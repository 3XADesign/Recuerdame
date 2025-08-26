/**
 * Auth.js - Authentication utilities
 * Handles user authentication, sessions, and auth state management
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.authListeners = new Set();
        
        this.init();
    }

    // Initialize auth manager
    init() {
        // Load saved auth state
        this.loadAuthState();
        
        // Set up periodic token refresh
        this.setupTokenRefresh();
        
        // Listen for storage changes (multi-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === 'recuerdame_auth') {
                this.loadAuthState();
            }
        });
        
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isAuthenticated) {
                this.validateSession();
            }
        });
        
        console.log('Auth manager initialized');
    }

    // Load auth state from storage
    loadAuthState() {
        try {
            const authData = localStorage.getItem('recuerdame_auth');
            if (authData) {
                const data = JSON.parse(authData);
                
                // Check if token is expired
                if (data.tokenExpiry && Date.now() > data.tokenExpiry) {
                    console.log('Auth token expired, clearing state');
                    this.clearAuthState();
                    return;
                }
                
                this.currentUser = data.user;
                this.authToken = data.authToken;
                this.refreshToken = data.refreshToken;
                this.tokenExpiry = data.tokenExpiry;
                this.isAuthenticated = true;
                
                console.log('Auth state loaded:', this.currentUser?.email);
                this.notifyAuthListeners('authenticated');
            }
        } catch (error) {
            console.error('Failed to load auth state:', error);
            this.clearAuthState();
        }
    }

    // Save auth state to storage
    saveAuthState() {
        try {
            const authData = {
                user: this.currentUser,
                authToken: this.authToken,
                refreshToken: this.refreshToken,
                tokenExpiry: this.tokenExpiry
            };
            
            localStorage.setItem('recuerdame_auth', JSON.stringify(authData));
            console.log('Auth state saved');
        } catch (error) {
            console.error('Failed to save auth state:', error);
        }
    }

    // Clear auth state
    clearAuthState() {
        this.currentUser = null;
        this.authToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.isAuthenticated = false;
        
        localStorage.removeItem('recuerdame_auth');
        console.log('Auth state cleared');
        
        this.notifyAuthListeners('unauthenticated');
    }

    // Login with email and password
    async login(email, password) {
        try {
            if (window.UI) {
                UI.showLoading('Iniciando sesión...');
            }
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.handleAuthSuccess(data);
                
                if (window.UI) {
                    UI.hideLoading();
                    UI.showToast('Sesión iniciada correctamente', 'success');
                }
                
                return { success: true, user: this.currentUser };
            } else {
                throw new Error(data.message || 'Error al iniciar sesión');
            }
            
        } catch (error) {
            console.error('Login failed:', error);
            
            if (window.UI) {
                UI.hideLoading();
                UI.showToast(error.message || 'Error al iniciar sesión', 'error');
            }
            
            return { success: false, error: error.message };
        }
    }

    // Register new user
    async register(userData) {
        try {
            if (window.UI) {
                UI.showLoading('Creando cuenta...');
            }
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.handleAuthSuccess(data);
                
                if (window.UI) {
                    UI.hideLoading();
                    UI.showToast('Cuenta creada correctamente', 'success');
                }
                
                return { success: true, user: this.currentUser };
            } else {
                throw new Error(data.message || 'Error al crear cuenta');
            }
            
        } catch (error) {
            console.error('Registration failed:', error);
            
            if (window.UI) {
                UI.hideLoading();
                UI.showToast(error.message || 'Error al crear cuenta', 'error');
            }
            
            return { success: false, error: error.message };
        }
    }

    // Logout
    async logout() {
        try {
            // Notify server
            if (this.authToken) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            
            // Clear local state
            this.clearAuthState();
            
            // Clear FCM token
            if (window.FCM) {
                await window.FCM.deleteToken();
            }
            
            if (window.UI) {
                UI.showToast('Sesión cerrada', 'info');
            }
            
            // Redirect to login
            window.location.href = '/onboarding';
            
        } catch (error) {
            console.error('Logout error:', error);
            // Clear state anyway
            this.clearAuthState();
            window.location.href = '/onboarding';
        }
    }

    // Handle successful authentication
    handleAuthSuccess(data) {
        this.currentUser = data.user;
        this.authToken = data.token;
        this.refreshToken = data.refreshToken;
        this.tokenExpiry = Date.now() + (data.expiresIn * 1000);
        this.isAuthenticated = true;
        
        this.saveAuthState();
        this.notifyAuthListeners('authenticated');
        
        console.log('Authentication successful:', this.currentUser.email);
    }

    // Refresh auth token
    async refreshAuthToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }
        
        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.authToken = data.token;
                this.tokenExpiry = Date.now() + (data.expiresIn * 1000);
                this.saveAuthState();
                
                console.log('Auth token refreshed');
                return this.authToken;
            } else {
                throw new Error(data.message || 'Failed to refresh token');
            }
            
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearAuthState();
            throw error;
        }
    }

    // Setup automatic token refresh
    setupTokenRefresh() {
        setInterval(async () => {
            if (this.isAuthenticated && this.tokenExpiry) {
                // Refresh if token expires in next 5 minutes
                const timeUntilExpiry = this.tokenExpiry - Date.now();
                if (timeUntilExpiry < 5 * 60 * 1000) {
                    try {
                        await this.refreshAuthToken();
                    } catch (error) {
                        console.error('Automatic token refresh failed:', error);
                    }
                }
            }
        }, 60000); // Check every minute
    }

    // Validate current session
    async validateSession() {
        if (!this.isAuthenticated || !this.authToken) {
            return false;
        }
        
        try {
            const response = await fetch('/api/auth/validate', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    // Update user data if provided
                    if (data.user) {
                        this.currentUser = data.user;
                        this.saveAuthState();
                    }
                    return true;
                }
            }
            
            // Session invalid
            this.clearAuthState();
            return false;
            
        } catch (error) {
            console.error('Session validation failed:', error);
            return false;
        }
    }

    // Get auth header for API requests
    getAuthHeader() {
        if (this.authToken) {
            return { 'Authorization': `Bearer ${this.authToken}` };
        }
        return {};
    }

    // Check if user has specific permission
    hasPermission(permission) {
        if (!this.currentUser || !this.currentUser.permissions) {
            return false;
        }
        return this.currentUser.permissions.includes(permission);
    }

    // Check if user is admin
    isAdmin() {
        return this.hasPermission('admin') || this.currentUser?.role === 'admin';
    }

    // Update user profile
    async updateProfile(updates) {
        if (!this.isAuthenticated) {
            throw new Error('User not authenticated');
        }
        
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    ...this.getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Update local user data
                this.currentUser = { ...this.currentUser, ...data.user };
                this.saveAuthState();
                
                if (window.UI) {
                    UI.showToast('Perfil actualizado', 'success');
                }
                
                return { success: true, user: this.currentUser };
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
            
        } catch (error) {
            console.error('Profile update failed:', error);
            
            if (window.UI) {
                UI.showToast(error.message || 'Error al actualizar perfil', 'error');
            }
            
            return { success: false, error: error.message };
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        if (!this.isAuthenticated) {
            throw new Error('User not authenticated');
        }
        
        try {
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: {
                    ...this.getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                if (window.UI) {
                    UI.showToast('Contraseña actualizada', 'success');
                }
                return { success: true };
            } else {
                throw new Error(data.message || 'Failed to change password');
            }
            
        } catch (error) {
            console.error('Password change failed:', error);
            
            if (window.UI) {
                UI.showToast(error.message || 'Error al cambiar contraseña', 'error');
            }
            
            return { success: false, error: error.message };
        }
    }

    // Auth event listeners
    addAuthListener(callback) {
        this.authListeners.add(callback);
        
        // Immediately call with current state
        if (this.isAuthenticated) {
            callback('authenticated', this.currentUser);
        } else {
            callback('unauthenticated', null);
        }
    }

    removeAuthListener(callback) {
        this.authListeners.delete(callback);
    }

    notifyAuthListeners(state) {
        this.authListeners.forEach(callback => {
            try {
                callback(state, this.currentUser);
            } catch (error) {
                console.error('Auth listener error:', error);
            }
        });
    }

    // Require authentication (redirect if not authenticated)
    requireAuth(redirectUrl = '/onboarding') {
        if (!this.isAuthenticated) {
            console.log('Authentication required, redirecting...');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check authentication status
    isLoggedIn() {
        return this.isAuthenticated && !!this.currentUser;
    }
}

// Initialize auth manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.Auth = new AuthManager();
});

// Global auth instance
window.Auth = window.Auth || new AuthManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
