/**
 * UI.js - User Interface utilities
 * Handles toasts, modals, animations, and other UI interactions
 */

class UI {
    constructor() {
        this.toastContainer = null;
        this.init();
    }

    init() {
        this.setupToastContainer();
        this.setupGlobalListeners();
    }

    // Toast System
    setupToastContainer() {
        this.toastContainer = document.getElementById('toastContainer');
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toastContainer';
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }
    }

    showToast(message, type = 'info', options = {}) {
        const {
            duration = 5000,
            action = null,
            onAction = null,
            dismissible = true
        } = options;

        const toast = this.createToast(message, type, action, onAction, dismissible);
        this.toastContainer.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismissToast(toast);
            }, duration);
        }

        return toast;
    }

    createToast(message, type, action, onAction, dismissible) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon toast-icon-${type}">
                ${icon}
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
                ${action ? `<button class="toast-action">${action}</button>` : ''}
            </div>
            ${dismissible ? `
                <button class="toast-close" aria-label="Cerrar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            ` : ''}
            <div class="toast-progress"></div>
        `;

        // Event listeners
        if (dismissible) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.dismissToast(toast));
        }

        if (action && onAction) {
            const actionBtn = toast.querySelector('.toast-action');
            actionBtn.addEventListener('click', () => {
                onAction();
                this.dismissToast(toast);
            });
        }

        // Dismiss on click (except action button)
        toast.addEventListener('click', (e) => {
            if (!e.target.closest('.toast-action') && !e.target.closest('.toast-close')) {
                this.dismissToast(toast);
            }
        });

        return toast;
    }

    getToastIcon(type) {
        const icons = {
            success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>`,
            warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>`,
            danger: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`,
            info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`
        };
        return icons[type] || icons.info;
    }

    dismissToast(toast) {
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Modal System
    showModal(content, options = {}) {
        const {
            title = '',
            size = 'medium',
            dismissible = true,
            onClose = null
        } = options;

        const modal = this.createModal(content, title, size, dismissible, onClose);
        document.body.appendChild(modal);

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });

        // Focus trap
        this.trapFocus(modal);

        return modal;
    }

    createModal(content, title, size, dismissible, onClose) {
        const modal = document.createElement('div');
        modal.className = `modal modal-${size}`;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        if (title) modal.setAttribute('aria-labelledby', 'modal-title');

        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                ${title ? `
                    <div class="modal-header">
                        <h2 id="modal-title" class="modal-title">${title}</h2>
                        ${dismissible ? `
                            <button class="modal-close" aria-label="Cerrar">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        // Event listeners
        if (dismissible) {
            const backdrop = modal.querySelector('.modal-backdrop');
            const closeBtn = modal.querySelector('.modal-close');

            backdrop.addEventListener('click', () => this.dismissModal(modal, onClose));
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.dismissModal(modal, onClose));
            }

            // Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.dismissModal(modal, onClose);
                }
            });
        }

        return modal;
    }

    dismissModal(modal, onClose) {
        modal.classList.add('hide');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            if (onClose) onClose();
        }, 300);
    }

    // Confirm Dialog
    confirmDialog(options = {}) {
        const {
            title = 'Confirmar',
            message = '¿Estás seguro?',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'default' // 'default', 'danger', 'warning'
        } = options;

        return new Promise((resolve) => {
            const content = `
                <div class="confirm-dialog">
                    <div class="confirm-message">${message}</div>
                    <div class="confirm-actions">
                        <button class="btn-secondary" data-action="cancel">${cancelText}</button>
                        <button class="btn-cta ${type === 'danger' ? 'btn-danger' : ''}" data-action="confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            const modal = this.showModal(content, {
                title,
                size: 'small',
                dismissible: false
            });

            // Handle actions
            modal.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    this.dismissModal(modal);
                    resolve(true);
                } else if (action === 'cancel') {
                    this.dismissModal(modal);
                    resolve(false);
                }
            });
        });
    }

    // Focus Management
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        });

        firstElement?.focus();
    }

    // Loading States
    showLoading(element, text = 'Cargando...') {
        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <span class="loading-text">${text}</span>
            </div>
        `;

        element.style.position = 'relative';
        element.appendChild(loader);
        
        return loader;
    }

    hideLoading(element) {
        const loader = element.querySelector('.loading-overlay');
        if (loader) {
            loader.remove();
        }
    }

    // Form Utilities
    validateForm(form) {
        const errors = [];
        const requiredFields = form.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                errors.push(`${field.name || field.id} es requerido`);
                field.classList.add('error');
            } else {
                field.classList.remove('error');
            }
        });

        return { isValid: errors.length === 0, errors };
    }

    // Animation Utilities
    fadeIn(element, duration = 300) {
        element.style.opacity = 0;
        element.style.transition = `opacity ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.opacity = 1;
        });
    }

    fadeOut(element, duration = 300) {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = 0;
        
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    }

    slideUp(element, duration = 300) {
        element.style.height = element.offsetHeight + 'px';
        element.style.transition = `height ${duration}ms ease`;
        element.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            element.style.height = '0px';
        });
        
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    }

    slideDown(element, duration = 300) {
        element.style.display = 'block';
        const height = element.scrollHeight;
        element.style.height = '0px';
        element.style.transition = `height ${duration}ms ease`;
        element.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            element.style.height = height + 'px';
        });
        
        setTimeout(() => {
            element.style.height = 'auto';
            element.style.overflow = 'visible';
        }, duration);
    }

    // Global Event Listeners
    setupGlobalListeners() {
        // Click ripple effect for buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn, .btn-cta, .btn-secondary')) {
                this.createRipple(e);
            }
        });

        // Auto-dismiss alerts after interaction
        document.addEventListener('click', (e) => {
            if (e.target.closest('.alert.auto-dismiss')) {
                setTimeout(() => {
                    this.fadeOut(e.target.closest('.alert'));
                }, 3000);
            }
        });
    }

    createRipple(event) {
        const button = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
        circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
        circle.classList.add('ripple');

        const ripple = button.getElementsByClassName('ripple')[0];
        if (ripple) {
            ripple.remove();
        }

        button.appendChild(circle);
    }
}

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.UI = new UI();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}

// Add ripple effect CSS if not already present
if (!document.querySelector('#ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
        .btn, .btn-cta, .btn-secondary {
            position: relative;
            overflow: hidden;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        [data-theme="dark"] .loading-overlay {
            background: rgba(0, 0, 0, 0.8);
        }
        
        .loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-3);
        }
        
        .loading-text {
            color: var(--text);
            font-size: var(--fs-sm);
        }
    `;
    document.head.appendChild(style);
}

// Initialize global UI instance
window.UI = new UI();
