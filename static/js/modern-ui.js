/**
 * RecuerdaMe - Modern UI System 2.0
 * Sistema moderno de interfaz con temas, animaciones y accesibilidad
 */

// Estado global de la aplicación moderna
window.RecuerdaMeModern = {
    currentTheme: 'light',
    isHighContrast: false,
    isDarkMode: false,
    toastContainer: null,
    observers: {},
    animations: new Map(),
    lastFocusedElement: null
};

/**
 * Inicialización principal del sistema moderno
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeModernThemeSystem();
    initializeModernComponents();
    initializeAnimationSystem();
    initializeAccessibilityEnhancements();
    initializeGestureSupport();
    initializePerformanceOptimizations();
    
    console.log('🚀 RecuerdaMe Modern UI 2.0 initialized');
});

/**
 * ==========================================
 * SISTEMA DE TEMAS MODERNO
 * ==========================================
 */

function initializeModernThemeSystem() {
    // Detectar preferencias del sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('recuerdame-theme') || 'auto';
    applyTheme(savedTheme);
    
    // Escuchar cambios en preferencias del sistema
    prefersDark.addEventListener('change', (e) => {
        if (RecuerdaMeModern.currentTheme === 'auto') {
            applySystemTheme();
        }
    });
    
    prefersReducedMotion.addEventListener('change', (e) => {
        document.documentElement.classList.toggle('reduce-motion', e.matches);
    });
    
    // Aplicar reducción de movimiento inicial
    if (prefersReducedMotion.matches) {
        document.documentElement.classList.add('reduce-motion');
    }
    
    // Inicializar controles de tema
    initializeThemeControls();
}

function applyTheme(theme) {
    const html = document.documentElement;
    
    // Limpiar temas anteriores
    html.removeAttribute('data-theme');
    RecuerdaMeModern.isDarkMode = false;
    RecuerdaMeModern.isHighContrast = false;
    
    switch(theme) {
        case 'dark':
            html.setAttribute('data-theme', 'dark');
            RecuerdaMeModern.isDarkMode = true;
            break;
        case 'high-contrast':
            html.setAttribute('data-theme', 'high-contrast');
            RecuerdaMeModern.isHighContrast = true;
            break;
        case 'auto':
            applySystemTheme();
            break;
        default:
            // Light mode (default)
            break;
    }
    
    RecuerdaMeModern.currentTheme = theme;
    localStorage.setItem('recuerdame-theme', theme);
    
    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme, isDark: RecuerdaMeModern.isDarkMode, isHighContrast: RecuerdaMeModern.isHighContrast }
    }));
}

function applySystemTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        RecuerdaMeModern.isDarkMode = true;
    } else {
        document.documentElement.removeAttribute('data-theme');
        RecuerdaMeModern.isDarkMode = false;
    }
}

function initializeThemeControls() {
    // Botón de contraste existente
    const contrastBtn = document.getElementById('toggleContrast');
    if (contrastBtn) {
        contrastBtn.addEventListener('click', () => {
            const newTheme = RecuerdaMeModern.isHighContrast ? 'light' : 'high-contrast';
            applyTheme(newTheme);
            showToast('Tema cambiado', 'success');
        });
    }
    
    // Crear selector de tema si no existe
    createThemeSelector();
}

function createThemeSelector() {
    const navbar = document.querySelector('.navbar .d-flex');
    if (!navbar) return;
    
    const themeSelector = document.createElement('div');
    themeSelector.className = 'dropdown';
    themeSelector.innerHTML = `
        <button class="btn btn-ghost btn-circle" id="themeDropdown" data-bs-toggle="dropdown" aria-expanded="false" title="Cambiar tema">
            <i class="bi bi-palette"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="themeDropdown">
            <li><button class="dropdown-item" data-theme="light"><i class="bi bi-sun me-2"></i>Claro</button></li>
            <li><button class="dropdown-item" data-theme="dark"><i class="bi bi-moon me-2"></i>Oscuro</button></li>
            <li><button class="dropdown-item" data-theme="high-contrast"><i class="bi bi-circle-half me-2"></i>Alto Contraste</button></li>
            <li><button class="dropdown-item" data-theme="auto"><i class="bi bi-gear me-2"></i>Automático</button></li>
        </ul>
    `;
    
    navbar.insertBefore(themeSelector, navbar.firstChild);
    
    // Event listeners para opciones de tema
    themeSelector.querySelectorAll('[data-theme]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.target.closest('[data-theme]').dataset.theme;
            applyTheme(theme);
            showToast(`Tema ${theme} activado`, 'success');
        });
    });
}

/**
 * ==========================================
 * COMPONENTES MODERNOS
 * ==========================================
 */

function initializeModernComponents() {
    initializeModernCards();
    initializeToastSystem();
    initializeSkeletonLoaders();
    initializeBottomNavigation();
    initializeQuickActions();
    initializeFamilyCards();
}

function initializeModernCards() {
    // Añadir efectos hover modernos a cards existentes
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        if (!card.classList.contains('no-hover')) {
            card.classList.add('hover-lift');
        }
    });
    
    // Convertir cards existentes al sistema moderno
    upgradeExistingCards();
}

function upgradeExistingCards() {
    const oldCards = document.querySelectorAll('.card:not(.modern-card)');
    oldCards.forEach(card => {
        card.classList.add('modern-card', 'animate-fade-in');
        
        // Añadir borde superior de gradiente si no existe
        if (!card.querySelector('.card-gradient-border')) {
            const border = document.createElement('div');
            border.className = 'card-gradient-border';
            border.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: var(--gradient-primary);
                border-radius: var(--radius-xl) var(--radius-xl) 0 0;
            `;
            card.style.position = 'relative';
            card.insertBefore(border, card.firstChild);
        }
    });
}

/**
 * ==========================================
 * SISTEMA DE TOASTS MODERNO
 * ==========================================
 */

function initializeToastSystem() {
    // Crear contenedor de toasts si no existe
    if (!document.querySelector('.toast-container-modern')) {
        const container = document.createElement('div');
        container.className = 'toast-container-modern';
        container.style.cssText = `
            position: fixed;
            top: var(--space-6);
            right: var(--space-6);
            z-index: var(--z-toast);
            pointer-events: none;
        `;
        document.body.appendChild(container);
        RecuerdaMeModern.toastContainer = container;
    }
}

function showToast(message, type = 'info', duration = 4000) {
    if (!RecuerdaMeModern.toastContainer) {
        initializeToastSystem();
    }
    
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.style.pointerEvents = 'auto';
    
    const icons = {
        success: 'bi-check-circle',
        error: 'bi-x-circle',
        warning: 'bi-exclamation-triangle',
        info: 'bi-info-circle'
    };
    
    toast.innerHTML = `
        <div class="d-flex align-items-center gap-3">
            <i class="bi ${icons[type] || icons.info} fs-5"></i>
            <span class="flex-grow-1">${message}</span>
            <button class="btn btn-ghost btn-sm" onclick="this.closest('.notification-toast').remove()">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `;
    
    RecuerdaMeModern.toastContainer.appendChild(toast);
    
    // Animación de entrada
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Auto-remove
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
    
    return toast;
}

/**
 * ==========================================
 * SISTEMA DE ANIMACIONES
 * ==========================================
 */

function initializeAnimationSystem() {
    // Intersection Observer para animaciones al hacer scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    RecuerdaMeModern.observers.scroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                // Añadir animación según la clase
                if (element.classList.contains('animate-on-scroll')) {
                    element.classList.add('animate-fade-in');
                }
                
                if (element.classList.contains('stagger-animation')) {
                    animateStaggered(element);
                }
                
                // Parar observando una vez animado
                RecuerdaMeModern.observers.scroll.unobserve(element);
            }
        });
    }, observerOptions);
    
    // Observar elementos con animaciones
    document.querySelectorAll('.animate-on-scroll, .stagger-animation').forEach(el => {
        RecuerdaMeModern.observers.scroll.observe(el);
    });
}

function animateStaggered(container) {
    const children = container.children;
    Array.from(children).forEach((child, index) => {
        setTimeout(() => {
            child.classList.add('animate-slide-in');
        }, index * 100);
    });
}

/**
 * ==========================================
 * MEJORAS DE ACCESIBILIDAD
 * ==========================================
 */

function initializeAccessibilityEnhancements() {
    // Mejorar navegación por teclado
    enhanceKeyboardNavigation();
    
    // Añadir skip links
    addSkipLinks();
    
    // Mejorar anuncios para lectores de pantalla
    enhanceScreenReaderAnnouncements();
    
    // Focus management
    initializeFocusManagement();
}

function enhanceKeyboardNavigation() {
    // Permitir navegación con teclas de flecha en grids
    document.querySelectorAll('[role="grid"], .family-grid, .dashboard-grid').forEach(grid => {
        grid.addEventListener('keydown', handleGridNavigation);
    });
    
    // Cerrar dropdowns con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                const dropdown = bootstrap.Dropdown.getInstance(menu.previousElementSibling);
                if (dropdown) dropdown.hide();
            });
        }
    });
}

function handleGridNavigation(e) {
    const grid = e.currentTarget;
    const focusableElements = grid.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
    
    let newIndex = currentIndex;
    
    switch(e.key) {
        case 'ArrowRight':
            newIndex = Math.min(currentIndex + 1, focusableElements.length - 1);
            break;
        case 'ArrowLeft':
            newIndex = Math.max(currentIndex - 1, 0);
            break;
        case 'ArrowDown':
            // Asumiendo 3 columnas en desktop
            const cols = window.innerWidth > 768 ? 3 : 1;
            newIndex = Math.min(currentIndex + cols, focusableElements.length - 1);
            break;
        case 'ArrowUp':
            const colsUp = window.innerWidth > 768 ? 3 : 1;
            newIndex = Math.max(currentIndex - colsUp, 0);
            break;
        default:
            return;
    }
    
    e.preventDefault();
    focusableElements[newIndex]?.focus();
}

function addSkipLinks() {
    if (document.querySelector('.skip-link')) return;
    
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Saltar al contenido principal';
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Asegurar que el main content tenga el ID correcto
    const main = document.querySelector('main');
    if (main && !main.id) {
        main.id = 'main-content';
    }
}

function enhanceScreenReaderAnnouncements() {
    // Crear región live para anuncios
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'sr-announcements';
    document.body.appendChild(liveRegion);
    
    // Función para anunciar cambios
    window.announceToScreenReader = function(message) {
        const region = document.getElementById('sr-announcements');
        if (region) {
            region.textContent = message;
            setTimeout(() => region.textContent = '', 1000);
        }
    };
}

function initializeFocusManagement() {
    // Capturar último elemento enfocado antes de modales
    document.addEventListener('show.bs.modal', (e) => {
        RecuerdaMeModern.lastFocusedElement = document.activeElement;
    });
    
    // Restaurar focus al cerrar modales
    document.addEventListener('hidden.bs.modal', (e) => {
        if (RecuerdaMeModern.lastFocusedElement) {
            RecuerdaMeModern.lastFocusedElement.focus();
            RecuerdaMeModern.lastFocusedElement = null;
        }
    });
}

/**
 * ==========================================
 * SOPORTE PARA GESTOS
 * ==========================================
 */

function initializeGestureSupport() {
    // Swipe para navegación en móviles
    let startX = 0;
    let startY = 0;
    
    document.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        if (!startX || !startY) return;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        
        const diffX = startX - endX;
        const diffY = startY - endY;
        
        // Swipe horizontal (más de 50px y principalmente horizontal)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // Swipe left - siguiente sección
                handleSwipeLeft();
            } else {
                // Swipe right - sección anterior
                handleSwipeRight();
            }
        }
        
        startX = 0;
        startY = 0;
    }, { passive: true });
}

function handleSwipeLeft() {
    // Implementar navegación hacia adelante
    const currentSection = getCurrentSection();
    navigateToNextSection(currentSection);
}

function handleSwipeRight() {
    // Implementar navegación hacia atrás
    const currentSection = getCurrentSection();
    navigateToPreviousSection(currentSection);
}

function getCurrentSection() {
    // Determinar sección actual basada en la URL o contenido visible
    const path = window.location.pathname;
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('memories')) return 'memories';
    if (path.includes('reminders')) return 'reminders';
    if (path.includes('alerts')) return 'alerts';
    return 'dashboard';
}

function navigateToNextSection(current) {
    const sections = ['dashboard', 'memories', 'reminders', 'alerts'];
    const currentIndex = sections.indexOf(current);
    const nextIndex = (currentIndex + 1) % sections.length;
    
    // Navegar solo si hay un cambio
    if (nextIndex !== currentIndex) {
        window.location.href = `/${sections[nextIndex]}`;
    }
}

function navigateToPreviousSection(current) {
    const sections = ['dashboard', 'memories', 'reminders', 'alerts'];
    const currentIndex = sections.indexOf(current);
    const prevIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1;
    
    // Navegar solo si hay un cambio
    if (prevIndex !== currentIndex) {
        window.location.href = `/${sections[prevIndex]}`;
    }
}

/**
 * ==========================================
 * OPTIMIZACIONES DE RENDIMIENTO
 * ==========================================
 */

function initializePerformanceOptimizations() {
    // Lazy loading para imágenes
    initializeLazyLoading();
    
    // Debouncing para eventos de resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 250);
    });
    
    // Preload de rutas críticas
    preloadCriticalRoutes();
}

function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

function handleResize() {
    // Recalcular layouts si es necesario
    // Actualizar variables CSS dependientes del viewport
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}

function preloadCriticalRoutes() {
    const criticalRoutes = ['/dashboard', '/memories', '/reminders'];
    
    criticalRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
    });
}

/**
 * ==========================================
 * COMPONENTES ESPECÍFICOS
 * ==========================================
 */

function initializeBottomNavigation() {
    // Solo en móviles
    if (window.innerWidth <= 768) {
        createBottomNavigation();
    }
}

function createBottomNavigation() {
    if (document.querySelector('.bottom-nav')) return;
    
    const bottomNav = document.createElement('nav');
    bottomNav.className = 'bottom-nav';
    bottomNav.innerHTML = `
        <div class="bottom-nav-items">
            <a href="/dashboard" class="bottom-nav-item ${window.location.pathname === '/dashboard' ? 'active' : ''}">
                <i class="bi bi-geo-alt bottom-nav-icon"></i>
                <span class="bottom-nav-label">Ubicación</span>
            </a>
            <a href="/memories" class="bottom-nav-item ${window.location.pathname === '/memories' ? 'active' : ''}">
                <i class="bi bi-people bottom-nav-icon"></i>
                <span class="bottom-nav-label">Recuerdos</span>
            </a>
            <a href="/reminders" class="bottom-nav-item ${window.location.pathname === '/reminders' ? 'active' : ''}">
                <i class="bi bi-alarm bottom-nav-icon"></i>
                <span class="bottom-nav-label">Recordatorios</span>
            </a>
            <a href="/alerts" class="bottom-nav-item ${window.location.pathname === '/alerts' ? 'active' : ''}">
                <i class="bi bi-exclamation-triangle bottom-nav-icon"></i>
                <span class="bottom-nav-label">Alertas</span>
            </a>
        </div>
    `;
    
    document.body.appendChild(bottomNav);
    
    // Añadir padding al body para evitar que el contenido se oculte
    document.body.style.paddingBottom = '80px';
}

function initializeQuickActions() {
    // Mejorar quick actions existentes
    const quickActions = document.querySelectorAll('.quick-action');
    quickActions.forEach(action => {
        action.classList.add('hover-lift');
        
        // Añadir feedback táctil
        action.addEventListener('click', () => {
            action.style.transform = 'scale(0.95)';
            setTimeout(() => action.style.transform = '', 150);
        });
    });
}

function initializeFamilyCards() {
    // Actualizar cards de familia existentes
    const familyCards = document.querySelectorAll('.family-member-card, .person-card');
    familyCards.forEach(card => {
        card.classList.add('hover-lift', 'animate-on-scroll');
        
        // Añadir indicadores de estado modernos
        enhanceFamilyCardStatus(card);
    });
}

function enhanceFamilyCardStatus(card) {
    const statusIndicator = card.querySelector('.status-indicator');
    if (statusIndicator) {
        // Añadir animación de pulso para alertas
        if (statusIndicator.classList.contains('alert')) {
            statusIndicator.classList.add('pulse');
        }
    }
}

/**
 * ==========================================
 * SKELETON LOADERS
 * ==========================================
 */

function initializeSkeletonLoaders() {
    // Crear skeleton loaders para contenido dinámico
    window.showSkeleton = function(container, type = 'card') {
        const skeleton = createSkeleton(type);
        container.innerHTML = skeleton;
    };
    
    window.hideSkeleton = function(container, content) {
        container.style.opacity = '0';
        setTimeout(() => {
            container.innerHTML = content;
            container.style.opacity = '1';
        }, 150);
    };
}

function createSkeleton(type) {
    const skeletons = {
        card: `
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width: 80%;"></div>
        `,
        familyCard: `
            <div class="d-flex gap-3 p-3">
                <div class="skeleton skeleton-avatar"></div>
                <div class="flex-grow-1">
                    <div class="skeleton skeleton-title" style="width: 60%;"></div>
                    <div class="skeleton skeleton-text" style="width: 40%;"></div>
                </div>
            </div>
        `,
        list: `
            ${Array(3).fill(`
                <div class="d-flex gap-3 mb-3">
                    <div class="skeleton skeleton-avatar"></div>
                    <div class="flex-grow-1">
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text" style="width: 70%;"></div>
                    </div>
                </div>
            `).join('')}
        `
    };
    
    return skeletons[type] || skeletons.card;
}

/**
 * ==========================================
 * UTILIDADES EXPORTADAS
 * ==========================================
 */

// Exportar funciones útiles al scope global
window.ModernUI = {
    showToast,
    applyTheme,
    announceToScreenReader,
    showSkeleton,
    hideSkeleton
};

// Alias para compatibilidad
window.showToast = showToast;
