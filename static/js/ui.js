/**
 * RecuerdaMe - UI Utilities
 * Common functions for user interface interactions
 */

// Global app state
window.RecuerdaMe = {
    currentTheme: 'light',
    isHighContrast: false,
    toastContainer: null,
    offcanvasMenu: null
};

/**
 * Initialize UI components and event listeners
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeToastContainer();
    initializeThemeToggle();
    initializeOffcanvas();
    initializeAccessibility();
    
    console.log('✅ RecuerdaMe UI initialized');
});

/**
 * Initialize toast container for notifications
 */
function initializeToastContainer() {
    const container = document.querySelector('.toast-container');
    if (container) {
        RecuerdaMe.toastContainer = container;
    }
}

/**
 * Initialize theme toggle functionality
 */
function initializeThemeToggle() {
    const toggleBtn = document.getElementById('toggleContrast');
    if (!toggleBtn) return;
    
    // Load saved preference
    const savedTheme = localStorage.getItem('recuerdame-theme');
    if (savedTheme === 'high-contrast') {
        enableHighContrast();
    }
    
    toggleBtn.addEventListener('click', function() {
        if (RecuerdaMe.isHighContrast) {
            disableHighContrast();
        } else {
            enableHighContrast();
        }
    });
}

/**
 * Initialize offcanvas menu
 */
function initializeOffcanvas() {
    const offcanvasElement = document.getElementById('mainMenu');
    if (offcanvasElement) {
        RecuerdaMe.offcanvasMenu = new bootstrap.Offcanvas(offcanvasElement);
    }
}

/**
 * Initialize accessibility features
 */
function initializeAccessibility() {
    // Enhanced keyboard navigation
    document.addEventListener('keydown', function(e) {
        // ESC to close modals/offcanvas
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                const modal = bootstrap.Modal.getInstance(openModal);
                if (modal) modal.hide();
            }
            
            if (RecuerdaMe.offcanvasMenu && RecuerdaMe.offcanvasMenu._isShown) {
                RecuerdaMe.offcanvasMenu.hide();
            }
        }
        
        // Alt+M to open menu
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            if (RecuerdaMe.offcanvasMenu) {
                RecuerdaMe.offcanvasMenu.toggle();
            }
        }
    });
    
    // Focus management for better accessibility
    trapFocusInModals();
    enhanceTouchTargets();
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: success, error, warning, info
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
function showToast(message, type = 'info', duration = 4000) {
    if (!message) return;
    
    const toastId = 'toast-' + Date.now();
    const iconClass = getToastIcon(type);
    const bgClass = getToastBackground(type);
    
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 mb-2" 
             role="alert" aria-live="assertive" aria-atomic="true" 
             data-bs-delay="${duration}">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center text-white">
                    <i class="bi ${iconClass} me-2"></i>
                    <span>${escapeHtml(message)}</span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast" aria-label="Cerrar"></button>
            </div>
        </div>
    `;
    
    // Create or get toast container
    let container = RecuerdaMe.toastContainer;
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
        RecuerdaMe.toastContainer = container;
    }
    
    // Insert toast
    container.insertAdjacentHTML('beforeend', toastHTML);
    
    // Initialize and show toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    
    toast.show();
    
    // Auto-remove from DOM after hiding
    toastElement.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
    
    // Return toast instance for manual control
    return toast;
}

/**
 * Get appropriate icon for toast type
 * @param {string} type 
 * @returns {string}
 */
function getToastIcon(type) {
    const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-exclamation-triangle-fill',
        warning: 'bi-exclamation-circle-fill',
        info: 'bi-info-circle-fill'
    };
    return icons[type] || icons.info;
}

/**
 * Get appropriate background class for toast type
 * @param {string} type 
 * @returns {string}
 */
function getToastBackground(type) {
    const backgrounds = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-primary'
    };
    return backgrounds[type] || backgrounds.info;
}

/**
 * Enable high contrast mode
 */
function enableHighContrast() {
    document.body.setAttribute('data-bs-theme', 'high-contrast');
    document.documentElement.style.setProperty('--bs-primary', '#0066cc');
    document.documentElement.style.setProperty('--bs-body-bg', '#ffffff');
    document.documentElement.style.setProperty('--bs-body-color', '#000000');
    
    RecuerdaMe.isHighContrast = true;
    localStorage.setItem('recuerdame-theme', 'high-contrast');
    
    const toggleBtn = document.getElementById('toggleContrast');
    if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="bi bi-circle"></i>';
        toggleBtn.setAttribute('title', 'Desactivar alto contraste');
    }
    
    showToast('Modo alto contraste activado', 'info', 2000);
}

/**
 * Disable high contrast mode
 */
function disableHighContrast() {
    document.body.setAttribute('data-bs-theme', 'light');
    document.documentElement.style.removeProperty('--bs-primary');
    document.documentElement.style.removeProperty('--bs-body-bg');
    document.documentElement.style.removeProperty('--bs-body-color');
    
    RecuerdaMe.isHighContrast = false;
    localStorage.setItem('recuerdame-theme', 'light');
    
    const toggleBtn = document.getElementById('toggleContrast');
    if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="bi bi-circle-half"></i>';
        toggleBtn.setAttribute('title', 'Activar alto contraste');
    }
    
    showToast('Modo normal activado', 'info', 2000);
}

/**
 * Show loading state on an element
 * @param {HTMLElement} element 
 * @param {string} message 
 */
function showLoading(element, message = 'Cargando...') {
    if (!element) return;
    
    const loadingHTML = `
        <div class="loading-overlay">
            <div class="d-flex flex-column align-items-center text-primary">
                <div class="spinner-border mb-3" role="status">
                    <span class="visually-hidden">${escapeHtml(message)}</span>
                </div>
                <p class="mb-0 fw-medium">${escapeHtml(message)}</p>
            </div>
        </div>
    `;
    
    element.style.position = 'relative';
    element.insertAdjacentHTML('beforeend', loadingHTML);
}

/**
 * Hide loading state from an element
 * @param {HTMLElement} element 
 */
function hideLoading(element) {
    if (!element) return;
    
    const loadingOverlay = element.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

/**
 * Confirm dialog with accessible styling
 * @param {string} message 
 * @param {string} title 
 * @returns {Promise<boolean>}
 */
function confirmDialog(message, title = 'Confirmar') {
    return new Promise((resolve) => {
        const modalId = 'confirm-modal-' + Date.now();
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}-label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${modalId}-label">
                                <i class="bi bi-question-circle me-2"></i>
                                ${escapeHtml(title)}
                            </h5>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0 fs-5">${escapeHtml(message)}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary btn-lg" data-action="cancel">
                                <i class="bi bi-x-lg me-2"></i>
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-primary btn-lg" data-action="confirm">
                                <i class="bi bi-check-lg me-2"></i>
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modalElement = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalElement);
        
        // Handle button clicks
        modalElement.addEventListener('click', function(e) {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action) {
                modal.hide();
                resolve(action === 'confirm');
            }
        });
        
        // Handle modal close
        modalElement.addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
        modal.show();
        
        // Focus confirm button
        modalElement.addEventListener('shown.bs.modal', function() {
            const confirmBtn = this.querySelector('[data-action="confirm"]');
            if (confirmBtn) confirmBtn.focus();
        });
    });
}

/**
 * Enhanced form validation with accessibility
 * @param {HTMLFormElement} form 
 * @returns {boolean}
 */
function validateForm(form) {
    if (!form) return false;
    
    let isValid = true;
    const errors = [];
    
    // Clear previous errors
    form.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
    form.querySelectorAll('.invalid-feedback').forEach(el => {
        el.remove();
    });
    
    // Validate required fields
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            addFieldError(field, 'Este campo es obligatorio');
            errors.push(field);
            isValid = false;
        }
    });
    
    // Validate email fields
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value && !isValidEmail(field.value)) {
            addFieldError(field, 'Por favor ingresa un email válido');
            errors.push(field);
            isValid = false;
        }
    });
    
    // Focus first error
    if (errors.length > 0) {
        errors[0].focus();
        showToast(`Se encontraron ${errors.length} errores en el formulario`, 'error');
    }
    
    return isValid;
}

/**
 * Add error styling and message to a form field
 * @param {HTMLElement} field 
 * @param {string} message 
 */
function addFieldError(field, message) {
    field.classList.add('is-invalid');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text 
 * @returns {string}
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format date for display
 * @param {Date|string} date 
 * @param {string} locale 
 * @returns {string}
 */
function formatDate(date, locale = 'es-ES') {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format time for display
 * @param {Date|string} date 
 * @param {string} locale 
 * @returns {string}
 */
function formatTime(date, locale = 'es-ES') {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Debounce function to limit rapid function calls
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Trap focus within modals for accessibility
 */
function trapFocusInModals() {
    document.addEventListener('keydown', function(e) {
        if (e.key !== 'Tab') return;
        
        const modal = document.querySelector('.modal.show');
        if (!modal) return;
        
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });
}

/**
 * Enhance touch targets for better accessibility
 */
function enhanceTouchTargets() {
    const buttons = document.querySelectorAll('button, .btn, .nav-link');
    buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        if (rect.height < 44) { // WCAG minimum touch target
            button.style.minHeight = '44px';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
        }
    });
}

// Global utility functions
window.showToast = showToast;
window.confirmDialog = confirmDialog;
window.validateForm = validateForm;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.debounce = debounce;
