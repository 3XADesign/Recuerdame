/**
 * FCM.js - Firebase Cloud Messaging utilities
 * Handles push notifications, service worker, and messaging
 */

class FCMManager {
    constructor() {
        this.messaging = null;
        this.token = null;
        this.isSupported = false;
        this.isInitialized = false;
        this.vapidKey = 'YOUR_VAPID_KEY'; // TODO: Replace with actual VAPID key
        
        this.notificationPermission = 'default';
        this.subscribers = new Map();
        
        this.init();
    }

    // Initialize FCM
    async init() {
        try {
            // Check if Firebase and messaging are available
            if (typeof firebase === 'undefined' || !firebase.messaging) {
                console.warn('Firebase messaging not available');
                return;
            }

            // Check if service workers are supported
            if (!('serviceWorker' in navigator)) {
                console.warn('Service workers not supported');
                return;
            }

            // Check if notifications are supported
            if (!('Notification' in window)) {
                console.warn('Notifications not supported');
                return;
            }

            this.isSupported = true;
            this.messaging = firebase.messaging();
            
            // Set VAPID key
            this.messaging.usePublicVapidKey(this.vapidKey);
            
            // Handle foreground messages
            this.messaging.onMessage((payload) => {
                this.handleForegroundMessage(payload);
            });

            this.isInitialized = true;
            console.log('FCM initialized successfully');

        } catch (error) {
            console.error('Failed to initialize FCM:', error);
        }
    }

    // Check if FCM is supported
    checkSupport() {
        return {
            isSupported: this.isSupported,
            hasServiceWorker: 'serviceWorker' in navigator,
            hasNotifications: 'Notification' in window,
            hasFirebase: typeof firebase !== 'undefined' && !!firebase.messaging,
            permission: Notification.permission
        };
    }

    // Request notification permission
    async requestPermission() {
        if (!this.isSupported) {
            throw new Error('FCM no soportado en este dispositivo');
        }

        try {
            // Request notification permission
            this.notificationPermission = await Notification.requestPermission();
            
            if (this.notificationPermission === 'granted') {
                console.log('Notification permission granted');
                
                // Get FCM token
                await this.getToken();
                
                if (window.UI) {
                    UI.showToast('Notificaciones activadas correctamente', 'success');
                }
                
                return true;
            } else {
                console.log('Notification permission denied');
                
                if (window.UI) {
                    UI.showToast('Permisos de notificación denegados', 'warning');
                }
                
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            
            if (window.UI) {
                UI.showToast('Error al solicitar permisos de notificación', 'error');
            }
            
            throw error;
        }
    }

    // Get FCM token
    async getToken() {
        if (!this.isSupported || !this.messaging) {
            throw new Error('FCM no disponible');
        }

        try {
            this.token = await this.messaging.getToken();
            
            if (this.token) {
                console.log('FCM token obtained:', this.token);
                
                // Send token to server
                await this.sendTokenToServer();
                
                // Listen for token refresh
                this.messaging.onTokenRefresh(async () => {
                    console.log('FCM token refreshed');
                    this.token = await this.messaging.getToken();
                    await this.sendTokenToServer();
                });
                
                return this.token;
            } else {
                console.log('No FCM token available');
                return null;
            }
        } catch (error) {
            console.error('Failed to get FCM token:', error);
            throw error;
        }
    }

    // Send token to server
    async sendTokenToServer() {
        if (!this.token) return;
        
        try {
            if (window.API) {
                await window.API.updateFCMToken(this.token);
                console.log('FCM token sent to server');
            }
        } catch (error) {
            console.error('Failed to send FCM token to server:', error);
        }
    }

    // Delete FCM token
    async deleteToken() {
        if (!this.messaging || !this.token) return;
        
        try {
            await this.messaging.deleteToken();
            
            // Remove from server
            if (window.API) {
                await window.API.removeFCMToken(this.token);
            }
            
            this.token = null;
            console.log('FCM token deleted');
            
        } catch (error) {
            console.error('Failed to delete FCM token:', error);
            throw error;
        }
    }

    // Handle foreground messages
    handleForegroundMessage(payload) {
        console.log('Received foreground message:', payload);
        
        const { notification, data } = payload;
        
        if (notification) {
            this.showNotification(notification.title, {
                body: notification.body,
                icon: notification.icon || '/static/icons/icon-192x192.png',
                badge: '/static/icons/badge-72x72.png',
                tag: data?.tag || 'general',
                data: data
            });
        }
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('fcmMessage', {
            detail: { payload }
        }));
        
        // Handle specific message types
        if (data?.type) {
            this.handleMessageType(data.type, data);
        }
    }

    // Show local notification
    showNotification(title, options = {}) {
        if (Notification.permission !== 'granted') {
            console.warn('Cannot show notification: permission not granted');
            return;
        }

        const defaultOptions = {
            icon: '/static/icons/icon-192x192.png',
            badge: '/static/icons/badge-72x72.png',
            vibrate: [200, 100, 200],
            requireInteraction: false,
            silent: false
        };

        const notificationOptions = { ...defaultOptions, ...options };
        
        try {
            const notification = new Notification(title, notificationOptions);
            
            notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                notification.close();
                
                // Handle notification click
                if (options.data?.url) {
                    window.location.href = options.data.url;
                }
            };
            
            // Auto close after 5 seconds if not requiring interaction
            if (!notificationOptions.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, 5000);
            }
            
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    // Handle different message types
    handleMessageType(type, data) {
        switch (type) {
            case 'location_alert':
                this.handleLocationAlert(data);
                break;
            case 'memory_reminder':
                this.handleMemoryReminder(data);
                break;
            case 'family_invitation':
                this.handleFamilyInvitation(data);
                break;
            case 'emergency':
                this.handleEmergency(data);
                break;
            default:
                console.log('Unknown message type:', type);
        }
    }

    // Handle location alert
    handleLocationAlert(data) {
        console.log('Location alert received:', data);
        
        if (window.UI) {
            UI.showToast(`Alerta de ubicación: ${data.message}`, 'warning');
        }
        
        // Update location status if needed
        if (window.Location) {
            // Could trigger location check or update UI
        }
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('locationAlert', {
            detail: { data }
        }));
    }

    // Handle memory reminder
    handleMemoryReminder(data) {
        console.log('Memory reminder received:', data);
        
        if (window.UI) {
            UI.showToast(`Recordatorio: ${data.title}`, 'info');
        }
        
        // Could open memory detail or show modal
        if (data.memoryId && window.location.pathname !== '/memories') {
            // Show option to view memory
            if (confirm('¿Ver este recuerdo ahora?')) {
                window.location.href = `/memory/${data.memoryId}`;
            }
        }
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('memoryReminder', {
            detail: { data }
        }));
    }

    // Handle family invitation
    handleFamilyInvitation(data) {
        console.log('Family invitation received:', data);
        
        if (window.UI) {
            UI.showToast(`Invitación familiar de ${data.senderName}`, 'info');
        }
        
        // Could show invitation modal or redirect
        if (data.invitationId) {
            if (confirm(`${data.senderName} te invitó a unirte a su familia. ¿Aceptar?`)) {
                window.location.href = `/family/join/${data.invitationId}`;
            }
        }
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('familyInvitation', {
            detail: { data }
        }));
    }

    // Handle emergency
    handleEmergency(data) {
        console.log('Emergency alert received:', data);
        
        // Show urgent notification
        this.showNotification('🚨 EMERGENCIA', {
            body: data.message,
            requireInteraction: true,
            vibrate: [500, 200, 500, 200, 500],
            tag: 'emergency',
            data: data
        });
        
        if (window.UI) {
            UI.showToast(`🚨 EMERGENCIA: ${data.message}`, 'error');
        }
        
        // Could trigger emergency mode in app
        document.body.classList.add('emergency-mode');
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('emergencyAlert', {
            detail: { data }
        }));
    }

    // Subscribe to topic
    async subscribeToTopic(topic) {
        if (!this.token) {
            throw new Error('No FCM token available');
        }
        
        try {
            if (window.API) {
                await window.API.subscribeToTopic(this.token, topic);
                this.subscribers.set(topic, true);
                console.log(`Subscribed to topic: ${topic}`);
            }
        } catch (error) {
            console.error(`Failed to subscribe to topic ${topic}:`, error);
            throw error;
        }
    }

    // Unsubscribe from topic
    async unsubscribeFromTopic(topic) {
        if (!this.token) {
            throw new Error('No FCM token available');
        }
        
        try {
            if (window.API) {
                await window.API.unsubscribeFromTopic(this.token, topic);
                this.subscribers.delete(topic);
                console.log(`Unsubscribed from topic: ${topic}`);
            }
        } catch (error) {
            console.error(`Failed to unsubscribe from topic ${topic}:`, error);
            throw error;
        }
    }

    // Get notification settings
    getNotificationSettings() {
        return {
            permission: Notification.permission,
            isSupported: this.isSupported,
            hasToken: !!this.token,
            token: this.token,
            subscriptions: Array.from(this.subscribers.keys())
        };
    }

    // Test notification
    async testNotification() {
        if (Notification.permission !== 'granted') {
            const granted = await this.requestPermission();
            if (!granted) return false;
        }
        
        this.showNotification('RecuerdaMe - Test', {
            body: 'Las notificaciones están funcionando correctamente',
            icon: '/static/icons/icon-192x192.png',
            tag: 'test'
        });
        
        return true;
    }

    // Clear all notifications
    clearAllNotifications() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    registration.getNotifications().then(notifications => {
                        notifications.forEach(notification => {
                            notification.close();
                        });
                    });
                }
            });
        }
    }
}

// Initialize FCM when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.FCM = new FCMManager();
});

// Global FCM instance
window.FCM = window.FCM || new FCMManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FCMManager;
}
