/**
 * Settings Module - RecuerdaMe
 * Maneja toda la funcionalidad de la página de ajustes
 */

class SettingsManager {
    constructor() {
        this.currentUser = null;
        this.currentFamily = null;
        this.init();
    }

    async init() {
        console.log('🔧 Inicializando módulo Settings...');
        
        // Cargar datos iniciales
        await this.loadUserData();
        
        // Inicializar componentes
        this.initProfile();
        this.initPreferences();
        this.initNotifications();
        this.initFamily();
        this.initPrivacy();
        this.initSession();
        
        // Inicializar modal de código de invitación
        this.initInviteModal();
        
        console.log('✅ Settings inicializado correctamente');
    }

    async loadUserData() {
        try {
            // TODO: Cargar datos reales del usuario desde la API
            // const response = await api.get('/api/user/profile');
            // this.currentUser = response.data;
            
            // Usar datos mock por ahora
            this.currentUser = {
                uid: 'demo-user-123',
                displayName: document.getElementById('displayName')?.value || 'María García',
                email: document.getElementById('email')?.value || 'maria@example.com',
                phone: document.getElementById('phone')?.value || '+34 612 345 678',
                photoUrl: null
            };
        } catch (error) {
            console.error('Error cargando datos del usuario:', error);
            ui.toast('Error cargando perfil', 'error');
        }
    }

    // ===== PERFIL =====
    
    initProfile() {
        const changeAvatarBtn = document.getElementById('changeAvatarBtn');
        const avatarInput = document.getElementById('avatarInput');
        const saveProfileBtn = document.getElementById('saveProfileBtn');

        if (changeAvatarBtn && avatarInput) {
            changeAvatarBtn.addEventListener('click', () => {
                avatarInput.click();
            });

            avatarInput.addEventListener('change', (e) => {
                this.handleAvatarChange(e);
            });
        }

        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                this.saveProfile();
            });
        }

        // Validación en tiempo real
        const displayNameInput = document.getElementById('displayName');
        if (displayNameInput) {
            displayNameInput.addEventListener('input', (e) => {
                this.validateDisplayName(e.target.value);
            });
        }
    }

    async handleAvatarChange(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            ui.toast('Por favor selecciona una imagen válida', 'error');
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            ui.toast('La imagen es demasiado grande (máximo 5MB)', 'error');
            return;
        }

        try {
            ui.toast('Subiendo imagen...', 'info');
            
            // Recortar imagen a cuadrado
            const croppedBlob = await this.cropImageToSquare(file);
            
            // Obtener URL firmada para subida
            const uploadData = await api.post('/api/profile/avatar', {});
            
            // Subir imagen a Storage
            await this.uploadImage(croppedBlob, uploadData.signedUrl);
            
            // Actualizar perfil con nueva URL
            await api.post('/api/profile', {
                photoUrl: uploadData.publicUrl
            });
            
            // Actualizar UI
            this.updateAvatarDisplay(uploadData.publicUrl);
            this.currentUser.photoUrl = uploadData.publicUrl;
            
            ui.toast('Foto actualizada correctamente', 'success');
            
        } catch (error) {
            console.error('Error subiendo avatar:', error);
            ui.toast('Error al subir la imagen', 'error');
        }
    }

    async cropImageToSquare(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                const size = Math.min(img.width, img.height);
                canvas.width = 300;
                canvas.height = 300;
                
                const offsetX = (img.width - size) / 2;
                const offsetY = (img.height - size) / 2;
                
                ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, 300, 300);
                
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    async uploadImage(blob, signedUrl) {
        const response = await fetch(signedUrl, {
            method: 'PUT',
            body: blob,
            headers: {
                'Content-Type': 'image/jpeg'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error subiendo imagen');
        }
    }

    updateAvatarDisplay(photoUrl) {
        const avatarDisplay = document.getElementById('avatarDisplay');
        if (avatarDisplay) {
            avatarDisplay.innerHTML = `<img src="${photoUrl}" alt="Avatar">`;
        }
    }

    validateDisplayName(name) {
        const saveBtn = document.getElementById('saveProfileBtn');
        const isValid = name.length >= 2 && name.length <= 60;
        
        if (saveBtn) {
            saveBtn.disabled = !isValid;
        }
        
        return isValid;
    }

    async saveProfile() {
        const displayName = document.getElementById('displayName')?.value;
        const phone = document.getElementById('phone')?.value;
        
        if (!this.validateDisplayName(displayName)) {
            ui.toast('El nombre debe tener entre 2 y 60 caracteres', 'error');
            return;
        }
        
        try {
            await api.post('/api/profile', {
                displayName,
                phone
            });
            
            this.currentUser.displayName = displayName;
            this.currentUser.phone = phone;
            
            ui.toast('Perfil actualizado correctamente', 'success');
        } catch (error) {
            console.error('Error guardando perfil:', error);
            ui.toast('Error al guardar el perfil', 'error');
        }
    }

    // ===== PREFERENCIAS =====
    
    initPreferences() {
        this.initDarkModeToggle();
        this.initHighContrastToggle();
        this.initLanguageSelect();
        this.initTextSizeSelect();
    }

    initDarkModeToggle() {
        const toggle = document.getElementById('darkModeToggle');
        if (!toggle) return;

        // Leer estado actual
        const isDark = localStorage.getItem('theme') === 'dark' ||
                      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        this.updateToggleState(toggle, isDark);

        toggle.addEventListener('click', () => {
            const newState = !toggle.classList.contains('active');
            this.updateToggleState(toggle, newState);
            this.applyTheme(newState ? 'dark' : 'light');
        });

        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle.click();
            }
        });
    }

    initHighContrastToggle() {
        const toggle = document.getElementById('highContrastToggle');
        if (!toggle) return;

        // Leer estado actual
        const isHighContrast = localStorage.getItem('highContrast') === 'true';
        this.updateToggleState(toggle, isHighContrast);

        toggle.addEventListener('click', () => {
            const newState = !toggle.classList.contains('active');
            this.updateToggleState(toggle, newState);
            this.applyHighContrast(newState);
        });

        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle.click();
            }
        });
    }

    initLanguageSelect() {
        const select = document.getElementById('languageSelect');
        if (!select) return;

        // Establecer idioma actual
        const currentLang = localStorage.getItem('language') || 'es';
        select.value = currentLang;

        select.addEventListener('change', (e) => {
            this.applyLanguage(e.target.value);
        });
    }

    initTextSizeSelect() {
        const select = document.getElementById('textSizeSelect');
        if (!select) return;

        // Establecer tamaño actual
        const currentSize = localStorage.getItem('textSize') || 'normal';
        select.value = currentSize;

        select.addEventListener('change', (e) => {
            this.applyTextSize(e.target.value);
        });
    }

    updateToggleState(toggle, isActive) {
        toggle.classList.toggle('active', isActive);
        toggle.setAttribute('aria-checked', isActive.toString());
    }

    applyTheme(theme) {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        console.log(`🎨 Tema aplicado: ${theme}`);
    }

    applyHighContrast(enabled) {
        localStorage.setItem('highContrast', enabled.toString());
        document.documentElement.classList.toggle('high-contrast', enabled);
        console.log(`♿ Alto contraste: ${enabled ? 'activado' : 'desactivado'}`);
    }

    applyLanguage(language) {
        localStorage.setItem('language', language);
        // TODO: Implementar cambio de idioma real
        console.log(`🌍 Idioma cambiado a: ${language}`);
        ui.toast(`Idioma cambiado a ${language === 'es' ? 'Español' : 'English'}`, 'info');
    }

    applyTextSize(size) {
        localStorage.setItem('textSize', size);
        document.documentElement.classList.toggle('text-lg', size === 'large');
        console.log(`🔤 Tamaño de texto: ${size}`);
    }

    // ===== NOTIFICACIONES =====
    
    initNotifications() {
        const enableBtn = document.getElementById('enableNotificationsBtn');
        const testBtn = document.getElementById('testNotificationBtn');

        if (enableBtn) {
            enableBtn.addEventListener('click', () => {
                this.enableNotifications();
            });
        }

        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.testNotification();
            });
        }

        // Verificar estado inicial
        this.updateNotificationStatus();
    }

    async enableNotifications() {
        try {
            // Verificar soporte
            if (!('Notification' in window) || !('serviceWorker' in navigator)) {
                ui.toast('Las notificaciones no están soportadas en este navegador', 'error');
                return;
            }

            // Solicitar permiso
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                // Obtener token FCM
                const token = await this.getFCMToken();
                
                if (token) {
                    // Suscribir en el servidor
                    await api.post('/api/notifications/subscribe', { token });
                    ui.toast('Notificaciones activadas correctamente', 'success');
                } else {
                    ui.toast('Error obteniendo token de notificaciones', 'error');
                }
            } else {
                ui.toast('Permisos de notificación denegados', 'error');
            }

            this.updateNotificationStatus();
            
        } catch (error) {
            console.error('Error activando notificaciones:', error);
            ui.toast('Error al activar notificaciones', 'error');
        }
    }

    async getFCMToken() {
        try {
            // TODO: Implementar FCM real
            // const messaging = firebase.messaging();
            // return await messaging.getToken();
            
            // Mock por ahora
            return 'demo-fcm-token-' + Date.now();
        } catch (error) {
            console.error('Error obteniendo token FCM:', error);
            return null;
        }
    }

    async testNotification() {
        try {
            await api.post('/api/notifications/test', {});
            ui.toast('Notificación de prueba enviada', 'success');
        } catch (error) {
            console.error('Error enviando notificación de prueba:', error);
            ui.toast('Error al enviar notificación de prueba', 'error');
        }
    }

    updateNotificationStatus() {
        const statusDot = document.getElementById('notificationStatusDot');
        const statusText = document.getElementById('notificationStatusText');
        const enableBtn = document.getElementById('enableNotificationsBtn');

        const isEnabled = Notification.permission === 'granted';

        if (statusDot) {
            statusDot.classList.toggle('active', isEnabled);
        }

        if (statusText) {
            statusText.textContent = isEnabled ? 'Suscrito' : 'No suscrito';
        }

        if (enableBtn) {
            enableBtn.textContent = isEnabled ? 'Notificaciones activas' : 'Permitir notificaciones';
            enableBtn.disabled = isEnabled;
        }
    }

    // ===== FAMILIA =====
    
    initFamily() {
        const familySelect = document.getElementById('familySelect');
        const pickLocationBtn = document.getElementById('pickLocationBtn');
        const safeRadiusSlider = document.getElementById('safeRadius');
        const radiusValue = document.getElementById('radiusValue');
        const saveFamilyBtn = document.getElementById('saveFamilySettingsBtn');
        const showInviteBtn = document.getElementById('showInviteCodeBtn');

        if (familySelect) {
            familySelect.addEventListener('change', (e) => {
                this.switchFamily(e.target.value);
            });
        }

        if (pickLocationBtn) {
            pickLocationBtn.addEventListener('click', () => {
                this.pickLocationOnMap();
            });
        }

        if (safeRadiusSlider && radiusValue) {
            safeRadiusSlider.addEventListener('input', (e) => {
                radiusValue.textContent = `${e.target.value}m`;
            });
        }

        if (saveFamilyBtn) {
            saveFamilyBtn.addEventListener('click', () => {
                this.saveFamilySettings();
            });
        }

        if (showInviteBtn) {
            showInviteBtn.addEventListener('click', () => {
                this.showInviteCode();
            });
        }
    }

    async switchFamily(familyId) {
        try {
            await api.post('/api/family/switch', { familyId });
            
            // Recargar página para obtener nuevos datos de familia
            window.location.reload();
            
        } catch (error) {
            console.error('Error cambiando familia:', error);
            ui.toast('Error al cambiar de familia', 'error');
        }
    }

    pickLocationOnMap() {
        // Navegar al mapa en modo selección
        window.location.href = '/map?pick=home';
    }

    async saveFamilySettings() {
        const homeLat = parseFloat(document.getElementById('homeLat')?.value);
        const homeLng = parseFloat(document.getElementById('homeLng')?.value);
        const safeRadius = parseInt(document.getElementById('safeRadius')?.value);

        // Validaciones
        if (isNaN(homeLat) || isNaN(homeLng)) {
            ui.toast('Coordenadas de hogar inválidas', 'error');
            return;
        }

        if (safeRadius < 100 || safeRadius > 3000) {
            ui.toast('El radio seguro debe estar entre 100 y 3000 metros', 'error');
            return;
        }

        try {
            await api.post('/api/family/settings', {
                homeGeopoint: { lat: homeLat, lng: homeLng },
                safeRadiusMeters: safeRadius
            });
            
            ui.toast('Ajustes de familia guardados', 'success');
            
        } catch (error) {
            console.error('Error guardando ajustes de familia:', error);
            ui.toast('Error al guardar ajustes', 'error');
        }
    }

    async showInviteCode() {
        try {
            const response = await api.get('/api/invite/code');
            
            const modal = document.getElementById('inviteModal');
            const codeDisplay = document.getElementById('inviteCodeDisplay');
            const expiresDisplay = document.getElementById('inviteExpiresDisplay');

            if (codeDisplay) {
                codeDisplay.textContent = response.code;
            }

            if (expiresDisplay) {
                const expiresDate = new Date(response.expiresAt);
                expiresDisplay.textContent = `Expira el ${expiresDate.toLocaleDateString()} a las ${expiresDate.toLocaleTimeString()}`;
            }

            if (modal) {
                modal.classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('Error obteniendo código de invitación:', error);
            ui.toast('Error al generar código', 'error');
        }
    }

    initInviteModal() {
        const modal = document.getElementById('inviteModal');
        const closeBtn = document.getElementById('closeInviteModal');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        }

        if (modal) {
            // Cerrar al hacer clic fuera del modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    }

    // ===== PRIVACIDAD =====
    
    initPrivacy() {
        const exportBtn = document.getElementById('exportDataBtn');
        const deleteBtn = document.getElementById('deleteAccountBtn');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteAccount();
            });
        }
    }

    async exportData() {
        try {
            const response = await api.post('/api/account/export');
            
            // Crear archivo JSON para descarga
            const blob = new Blob([JSON.stringify(response, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recuerdame-datos-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            ui.toast('Datos exportados correctamente', 'success');
            
        } catch (error) {
            console.error('Error exportando datos:', error);
            ui.toast('Error al exportar datos', 'error');
        }
    }

    async deleteAccount() {
        const confirmed = await ui.confirmDialog({
            title: 'Eliminar cuenta',
            message: '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.',
            confirmText: 'Eliminar cuenta',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            await api.post('/api/account/delete');
            
            ui.toast('Solicitud de eliminación procesada', 'info');
            
            // Cerrar sesión después de la eliminación
            setTimeout(() => {
                this.logout();
            }, 2000);
            
        } catch (error) {
            console.error('Error eliminando cuenta:', error);
            ui.toast('Error al procesar eliminación', 'error');
        }
    }

    // ===== SESIÓN =====
    
    initSession() {
        const logoutBtn = document.getElementById('logoutBtn');
        const closeBtn = document.querySelector('[data-action="close"]');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeSettings();
            });
        }
    }

    async logout() {
        const confirmed = await ui.confirmDialog({
            title: 'Cerrar sesión',
            message: '¿Estás seguro de que quieres cerrar sesión?',
            confirmText: 'Cerrar sesión',
            cancelText: 'Cancelar'
        });

        if (!confirmed) return;

        try {
            await api.post('/api/auth/logout');
            
            // Limpiar almacenamiento local
            localStorage.removeItem('authToken');
            
            // Redirigir a inicio
            window.location.href = '/';
            
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            ui.toast('Error al cerrar sesión', 'error');
        }
    }

    closeSettings() {
        // Regresar a la página anterior o inicio
        if (document.referrer && document.referrer.includes(window.location.origin)) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});

// Exportar para uso en otros módulos
window.SettingsManager = SettingsManager;
