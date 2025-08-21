/**
 * RecuerdaMe - Main App Module
 * Application initialization and global utilities
 */

// Global app state
window.RecuerdaMe = {
    isInitialized: false,
    user: null,
    family: null,
    settings: {
        debug: true,
        enableNotifications: false,
        theme: 'light'
    }
};

/**
 * Initialize RecuerdaMe application
 */
function initRecuerdaMe() {
    console.log('🚀 Inicializando RecuerdaMe...');
    
    // Set app as initialized
    window.RecuerdaMe.isInitialized = true;
    
    // Initialize components based on current page
    const currentPage = window.location.pathname;
    
    if (currentPage === '/dashboard' || currentPage === '/') {
        // Dashboard-specific initialization
        initDashboard();
    }
    
    // Initialize common components
    initServiceWorker();
    initNotifications();
    
    console.log('✅ RecuerdaMe inicializado correctamente');
}

/**
 * Initialize dashboard-specific functionality
 */
function initDashboard() {
    console.log('📊 Inicializando Dashboard...');
    
    // Map will be initialized by Google Maps callback
    // Location tracking will be initialized by location.js
}

/**
 * Initialize Service Worker for PWA functionality
 */
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('✅ Service Worker registrado:', registration.scope);
            })
            .catch(function(error) {
                console.log('❌ Error registrando Service Worker:', error);
            });
    }
}

/**
 * Initialize notifications
 */
function initNotifications() {
    // Check if notifications are already permitted
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            window.RecuerdaMe.settings.enableNotifications = true;
            console.log('✅ Notificaciones ya están permitidas');
        }
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to show
 * @param {string} type - Type: success, error, warning, info
 * @param {number} duration - Duration in ms (default: 4000)
 */
function showToast(message, type = 'info', duration = 4000) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    toast.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
    `;
    
    toast.innerHTML = `
        <strong>${type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</strong>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, duration);
}

/**
 * Utility function to format dates for seniors
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatFriendlyDate(date) {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
        return `Hoy ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
        return `Ayer ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return d.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

/**
 * Check if app is running as PWA
 * @returns {boolean}
 */
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

/**
 * Show PWA install prompt
 */
function showPWAInstallPrompt() {
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ Usuario aceptó instalar la PWA');
                showToast('¡RecuerdaMe se está instalando!', 'success');
            }
            window.deferredPrompt = null;
        });
    } else {
        showToast('Para instalar, usa el menú de tu navegador: "Agregar a pantalla de inicio"', 'info', 6000);
    }
}

// Listen for PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    console.log('📱 PWA install prompt disponible');
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initRecuerdaMe();
});

// Export global functions
window.showToast = showToast;
window.formatFriendlyDate = formatFriendlyDate;
window.isPWA = isPWA;
window.showPWAInstallPrompt = showPWAInstallPrompt;
