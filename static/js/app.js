/**
 * App.js - Core application logic
 * Handles theme management, routing, and app initialization
 */

class App {
    constructor() {
        this.currentTheme = 'light';
        this.isOnline = navigator.onLine;
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupNavigation();
        this.setupServiceWorker();
        this.setupOnlineStatus();
        this.checkOnboarding();
        
        console.log('RecuerdaMe app initialized');
    }

    // Theme Management
    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme toggle icons
        const lightIcon = document.querySelector('.theme-icon-light');
        const darkIcon = document.querySelector('.theme-icon-dark');
        
        if (lightIcon && darkIcon) {
            if (theme === 'dark') {
                lightIcon.style.display = 'none';
                darkIcon.style.display = 'block';
            } else {
                lightIcon.style.display = 'block';
                darkIcon.style.display = 'none';
            }
        }

        // Dispatch theme change event
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme } 
        }));
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        
        // Show feedback
        if (window.UI) {
            UI.showToast(`Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'info');
        }
    }

    // Theme and accessibility initialization for settings
    initThemeToggle() {
        // Esta función es llamada desde settings.js
        // El manejo real del tema está en setTheme()
        console.log('🎨 Theme toggle inicializado desde settings');
    }

    initA11yPrefs() {
        // Aplicar preferencias de accesibilidad guardadas
        const highContrast = localStorage.getItem('highContrast') === 'true';
        const textSize = localStorage.getItem('textSize') || 'normal';

        if (highContrast) {
            document.documentElement.classList.add('high-contrast');
        }

        if (textSize === 'large') {
            document.documentElement.classList.add('text-lg');
        }

        console.log('♿ Preferencias de accesibilidad aplicadas');
    }

    // Navigation
    setupNavigation() {
        // Active nav state
        this.updateActiveNav();
        
        // Handle nav clicks
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleNavClick(e, item);
            });
        });

        // Handle back button
        window.addEventListener('popstate', () => {
            this.updateActiveNav();
        });
    }

    updateActiveNav() {
        const currentPath = window.location.pathname;
        
        document.querySelectorAll('.nav-item').forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPath || (currentPath === '/' && href === '/')) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    handleNavClick(e, item) {
        // Add click animation
        item.style.transform = 'scale(0.95)';
        setTimeout(() => {
            item.style.transform = '';
        }, 150);
    }

    // Service Worker
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdatePrompt();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.log('SW registration failed:', error);
                });
        }
    }

    showUpdatePrompt() {
        if (window.UI) {
            UI.showToast('Nueva versión disponible', 'info', {
                action: 'Actualizar',
                onAction: () => window.location.reload()
            });
        }
    }

    // Online/Offline Status
    setupOnlineStatus() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            if (window.UI) {
                UI.showToast('Conexión restaurada', 'success');
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            if (window.UI) {
                UI.showToast('Sin conexión - modo offline', 'warning');
            }
        });
    }

    // Onboarding
    checkOnboarding() {
        const onboardingCompleted = localStorage.getItem('onboarding_completed');
        const currentPath = window.location.pathname;
        
        if (!onboardingCompleted && currentPath !== '/onboarding') {
            // Redirect to onboarding
            window.location.href = '/onboarding';
        }
    }

    // Utility methods
    getTheme() {
        return this.currentTheme;
    }

    isOffline() {
        return !this.isOnline;
    }

    // Route helpers (simple client-side routing for SPA-like behavior)
    navigate(path) {
        history.pushState(null, '', path);
        this.updateActiveNav();
    }

    // Error handling
    handleError(error, context = 'App') {
        console.error(`[${context}] Error:`, error);
        
        if (window.UI) {
            UI.showToast('Algo salió mal. Inténtalo de nuevo.', 'danger');
        }
    }

    // App state management
    setState(key, value) {
        localStorage.setItem(`app_${key}`, JSON.stringify(value));
    }

    getState(key, defaultValue = null) {
        try {
            const stored = localStorage.getItem(`app_${key}`);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    // Performance monitoring
    trackPerformance(name, startTime) {
        if (performance && performance.mark) {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.App = new App();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
