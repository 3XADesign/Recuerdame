/**
 * RecuerdaMe - Firebase Cloud Messaging (FCM) Module
 * Push notifications for web app
 */

// FCM configuration (these will need to be set with real Firebase project values)
const FCM_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    vapidKey: "YOUR_VAPID_KEY"
};

// FCM state
let messaging = null;
let isNotificationsEnabled = false;
let currentToken = null;

/**
 * Initialize Firebase Cloud Messaging
 */
async function initializeFCM() {
    // TODO: Initialize Firebase SDK when real config is available
    console.log('🔄 FCM initialization placeholder - requires real Firebase config');
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
    }
    
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
        console.warn('This browser does not support service workers');
        return false;
    }
    
    // For now, simulate FCM initialization
    simulateFCMBehavior();
    return true;
}

/**
 * Simulate FCM behavior for development/demo
 */
function simulateFCMBehavior() {
    // Simulate notification permission state
    const permission = Notification.permission;
    isNotificationsEnabled = permission === 'granted';
    
    console.log(`📱 Notification permission: ${permission}`);
    
    // Update UI based on permission state
    updateNotificationUI();
}

/**
 * Request notification permission from user
 * @returns {Promise<boolean>} Whether permission was granted
 */
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('Las notificaciones no están soportadas en este navegador', 'warning');
        return false;
    }
    
    try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            isNotificationsEnabled = true;
            showToast('Notificaciones activadas correctamente', 'success');
            
            // TODO: Get FCM token and send to server
            await getFCMToken();
            
            updateNotificationUI();
            return true;
            
        } else if (permission === 'denied') {
            showToast('Notificaciones denegadas. Puedes activarlas en la configuración del navegador.', 'warning', 8000);
            updateNotificationUI();
            return false;
            
        } else {
            // Default (dismissed)
            showToast('Permisos de notificación no otorgados', 'info');
            return false;
        }
        
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        showToast('Error solicitando permisos de notificación', 'error');
        return false;
    }
}

/**
 * Get FCM registration token
 * @returns {Promise<string|null>}
 */
async function getFCMToken() {
    try {
        // TODO: Implement real FCM token retrieval
        // const token = await getToken(messaging, { vapidKey: FCM_CONFIG.vapidKey });
        
        // For now, generate a mock token
        const mockToken = 'mock_fcm_token_' + Date.now();
        currentToken = mockToken;
        
        console.log('📱 FCM Token (mock):', mockToken);
        
        // TODO: Send token to server
        await sendTokenToServer(mockToken);
        
        return mockToken;
        
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

/**
 * Send FCM token to server for user registration
 * @param {string} token - FCM token
 */
async function sendTokenToServer(token) {
    try {
        // TODO: Implement server endpoint for token registration
        console.log('📤 Sending FCM token to server (mock):', token);
        
        // Mock server call
        const response = await fetch('/api/fcm-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                userId: 'demo-user-123', // TODO: Get from session
                familyId: 'demo-family-456' // TODO: Get from session
            })
        });
        
        if (response.ok) {
            console.log('✅ FCM token registered successfully');
        } else {
            console.warn('⚠️ Failed to register FCM token');
        }
        
    } catch (error) {
        console.error('Error sending token to server:', error);
    }
}

/**
 * Subscribe to topic notifications
 * @param {string} topic - Topic name (e.g., 'family-alerts', 'reminders')
 */
async function subscribeToTopic(topic) {
    // TODO: Implement topic subscription via server
    console.log(`📨 Subscribing to topic: ${topic} (mock)`);
    
    try {
        const response = await fetch('/api/fcm-subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: currentToken,
                topic: topic
            })
        });
        
        if (response.ok) {
            showToast(`Suscrito a ${topic}`, 'success', 2000);
        }
        
    } catch (error) {
        console.error('Error subscribing to topic:', error);
    }
}

/**
 * Show local notification (for testing)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} options - Additional options
 */
function showLocalNotification(title, body, options = {}) {
    if (!isNotificationsEnabled) {
        console.warn('Notifications not enabled');
        return;
    }
    
    const defaultOptions = {
        icon: '/static/img/icon.png',
        badge: '/static/img/icon.png',
        vibrate: [200, 100, 200],
        tag: 'recuerdame-notification',
        requireInteraction: false,
        ...options
    };
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Send to service worker
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: title,
            body: body,
            options: defaultOptions
        });
    } else {
        // Show directly
        new Notification(title, {
            body: body,
            ...defaultOptions
        });
    }
}

/**
 * Update notification UI elements
 */
function updateNotificationUI() {
    // Update permission badge in settings
    const permissionBadge = document.getElementById('notificationPermission');
    if (permissionBadge) {
        if (isNotificationsEnabled) {
            permissionBadge.className = 'badge bg-success';
            permissionBadge.textContent = 'Activadas';
        } else {
            permissionBadge.className = 'badge bg-warning';
            permissionBadge.textContent = 'Desactivadas';
        }
    }
    
    // Update toggle buttons
    const toggleBtns = document.querySelectorAll('[data-notification-toggle]');
    toggleBtns.forEach(btn => {
        if (isNotificationsEnabled) {
            btn.classList.remove('btn-outline-primary');
            btn.classList.add('btn-success');
            btn.innerHTML = '<i class="bi bi-bell-fill me-2"></i>Notificaciones Activas';
        } else {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-outline-primary');
            btn.innerHTML = '<i class="bi bi-bell me-2"></i>Activar Notificaciones';
        }
    });
}

/**
 * Handle notification click (from service worker)
 * @param {Object} notificationData - Notification data
 */
function handleNotificationClick(notificationData) {
    console.log('Notification clicked:', notificationData);
    
    // Navigate to appropriate page based on notification type
    if (notificationData.type === 'geofence') {
        window.location.href = '/dashboard';
    } else if (notificationData.type === 'reminder') {
        window.location.href = '/reminders';
    } else {
        window.location.href = '/alerts';
    }
}

/**
 * Test notification functionality
 */
function testNotification() {
    if (!isNotificationsEnabled) {
        showToast('Primero activa las notificaciones', 'warning');
        return;
    }
    
    showLocalNotification(
        'RecuerdaMe - Prueba',
        'Esta es una notificación de prueba. ¡Todo funciona correctamente!',
        {
            tag: 'test-notification',
            icon: '/static/img/icon.png'
        }
    );
    
    showToast('Notificación de prueba enviada', 'info');
}

/**
 * Initialize notification settings UI
 */
function initializeNotificationSettings() {
    // Permission request buttons
    const requestBtns = document.querySelectorAll('[data-notification-request]');
    requestBtns.forEach(btn => {
        btn.addEventListener('click', requestNotificationPermission);
    });
    
    // Toggle buttons
    const toggleBtns = document.querySelectorAll('[data-notification-toggle]');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (isNotificationsEnabled) {
                // TODO: Implement disable notifications
                showToast('Para desactivar, usa la configuración del navegador', 'info');
            } else {
                requestNotificationPermission();
            }
        });
    });
    
    // Test buttons
    const testBtns = document.querySelectorAll('[data-notification-test]');
    testBtns.forEach(btn => {
        btn.addEventListener('click', testNotification);
    });
}

/**
 * Cleanup FCM on page unload
 */
function cleanupFCM() {
    // TODO: Cleanup FCM resources if needed
    console.log('🧹 FCM cleanup');
}

// Initialize FCM when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeFCM();
    initializeNotificationSettings();
});

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupFCM);

// Listen for service worker messages
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
            handleNotificationClick(event.data.notification);
        }
    });
}

// Export functions for global use
window.requestNotificationPermission = requestNotificationPermission;
window.showLocalNotification = showLocalNotification;
window.testNotification = testNotification;
window.subscribeToTopic = subscribeToTopic;
