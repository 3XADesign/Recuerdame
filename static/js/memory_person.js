/**
 * MEMORY PERSON - JavaScript Module
 * Handles the individual person view with photo gallery management
 */

class MemoryPerson {
    constructor() {
        this.pageData = null;
        this.person = null;
        this.photos = [];
        this.selectedPhotoIndex = null;
        this.cropInstance = null;
        this.uploadQueue = [];
        this.isUploading = false;
        
        this.init();
    }

    async init() {
        try {
            // Get page data
            const pageDataElement = document.getElementById('pageData');
            this.pageData = pageDataElement ? JSON.parse(pageDataElement.textContent) : {};
            
            if (!this.pageData.personId) {
                throw new Error('No se encontró ID de persona');
            }
            
            // Initialize UI
            this.initializeEventListeners();
            
            // Load person data
            await this.loadPersonData();
            
        } catch (error) {
            console.error('Error initializing MemoryPerson:', error);
            this.showError('Error al inicializar la página');
        }
    }

    initializeEventListeners() {
        // Edit person button
        const editPersonBtn = document.getElementById('editPersonBtn');
        editPersonBtn?.addEventListener('click', () => this.openEditPersonModal());

        // Photo upload
        const uploadBtn = document.getElementById('uploadPhotoBtn');
        const fileInput = document.getElementById('photoFileInput');
        
        uploadBtn?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => this.handleFileSelection(e));

        // Drop zone
        const dropZone = document.getElementById('photoGallery');
        this.setupDropZone(dropZone);

        // Edit person modal
        this.setupEditPersonModal();
        
        // Photo crop modal
        this.setupPhotoCropModal();
        
        // Caption edit modal
        this.setupCaptionModal();

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    setupDropZone(dropZone) {
        if (!dropZone) return;

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.type.startsWith('image/')
            );
            
            if (files.length > 0) {
                this.processFiles(files);
            }
        });
    }

    setupEditPersonModal() {
        const modal = document.getElementById('editPersonModal');
        const closeBtn = document.getElementById('closeEditModalBtn');
        const cancelBtn = document.getElementById('cancelEditBtn');
        const form = document.getElementById('editPersonForm');

        closeBtn?.addEventListener('click', () => this.closeEditPersonModal());
        cancelBtn?.addEventListener('click', () => this.closeEditPersonModal());
        
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEditPersonModal();
            }
        });

        form?.addEventListener('submit', (e) => this.handleEditPerson(e));
    }

    setupPhotoCropModal() {
        const modal = document.getElementById('photoCropModal');
        const closeBtn = document.getElementById('closeCropModalBtn');
        const cancelBtn = document.getElementById('cancelCropBtn');
        const saveBtn = document.getElementById('saveCropBtn');

        closeBtn?.addEventListener('click', () => this.closeCropModal());
        cancelBtn?.addEventListener('click', () => this.closeCropModal());
        saveBtn?.addEventListener('click', () => this.saveCroppedPhoto());
        
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCropModal();
            }
        });
    }

    setupCaptionModal() {
        const modal = document.getElementById('captionModal');
        const closeBtn = document.getElementById('closeCaptionModalBtn');
        const cancelBtn = document.getElementById('cancelCaptionBtn');
        const saveBtn = document.getElementById('saveCaptionBtn');

        closeBtn?.addEventListener('click', () => this.closeCaptionModal());
        cancelBtn?.addEventListener('click', () => this.closeCaptionModal());
        saveBtn?.addEventListener('click', () => this.saveCaption());
        
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCaptionModal();
            }
        });
    }

    async loadPersonData() {
        try {
            this.showLoadingState();
            
            // Load person details
            const personResponse = await fetch(`/api/persons/${this.pageData.personId}`);
            if (!personResponse.ok) {
                throw new Error('Error al cargar datos de la persona');
            }
            
            this.person = await personResponse.json();
            
            // Load photos
            const photosResponse = await fetch(`/api/persons/${this.pageData.personId}/photos`);
            if (!photosResponse.ok) {
                throw new Error('Error al cargar fotos');
            }
            
            const photosData = await photosResponse.json();
            this.photos = photosData.photos || [];
            
            this.renderPersonData();
            this.renderPhotoGallery();
            
        } catch (error) {
            console.error('Error loading person data:', error);
            this.showError(error.message);
        }
    }

    renderPersonData() {
        // Update page title
        document.title = `${this.person.name} - RecuerdaMe`;
        
        // Update person header
        const nameElement = document.getElementById('personName');
        const relationshipElement = document.getElementById('personRelationship');
        const avatarElement = document.getElementById('personAvatar');
        
        if (nameElement) nameElement.textContent = this.person.name;
        if (relationshipElement) {
            relationshipElement.textContent = this.person.relationship || '';
            relationshipElement.style.display = this.person.relationship ? 'block' : 'none';
        }
        
        if (avatarElement) {
            if (this.person.photoUrl) {
                avatarElement.innerHTML = `<img src="${this.person.photoUrl}" alt="${this.person.name}">`;
            } else {
                avatarElement.innerHTML = `<div class="person-avatar-initial">${this.person.name.charAt(0).toUpperCase()}</div>`;
            }
        }

        // Update notes
        const notesElement = document.getElementById('personNotes');
        if (notesElement) {
            if (this.person.notes && this.person.notes.trim()) {
                notesElement.innerHTML = `<p>${this.escapeHtml(this.person.notes)}</p>`;
                notesElement.style.display = 'block';
            } else {
                notesElement.style.display = 'none';
            }
        }
    }

    renderPhotoGallery() {
        const gallery = document.getElementById('photoGallery');
        const emptyState = document.getElementById('emptyPhotosState');
        
        if (!gallery) return;

        // Clear existing photos
        const existingPhotos = gallery.querySelectorAll('.photo-item');
        existingPhotos.forEach(photo => photo.remove());

        if (this.photos.length === 0) {
            emptyState?.classList.remove('hidden');
            return;
        }

        emptyState?.classList.add('hidden');

        this.photos.forEach((photo, index) => {
            const photoElement = this.createPhotoElement(photo, index);
            gallery.appendChild(photoElement);
        });
    }

    createPhotoElement(photo, index) {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.setAttribute('data-photo-id', photo.id);
        photoItem.setAttribute('data-index', index);
        
        photoItem.innerHTML = `
            <div class="photo-container">
                <img src="${photo.thumbnailUrl || photo.url}" 
                     alt="${photo.caption || 'Foto de ' + this.person.name}"
                     loading="lazy">
                
                <div class="photo-overlay">
                    <div class="photo-actions">
                        <button class="photo-action-btn view-photo-btn" 
                                aria-label="Ver foto completa"
                                data-index="${index}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </button>
                        
                        <button class="photo-action-btn edit-caption-btn" 
                                aria-label="Editar descripción"
                                data-index="${index}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/>
                                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </button>
                        
                        <button class="photo-action-btn delete-photo-btn" 
                                aria-label="Eliminar foto"
                                data-index="${index}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            ${photo.caption 
                ? `<p class="photo-caption">${this.escapeHtml(photo.caption)}</p>`
                : ''
            }
        `;

        // Add event listeners
        this.addPhotoEventListeners(photoItem, index);

        return photoItem;
    }

    addPhotoEventListeners(photoItem, index) {
        const viewBtn = photoItem.querySelector('.view-photo-btn');
        const editBtn = photoItem.querySelector('.edit-caption-btn');
        const deleteBtn = photoItem.querySelector('.delete-photo-btn');

        viewBtn?.addEventListener('click', () => this.viewPhoto(index));
        editBtn?.addEventListener('click', () => this.editPhotoCaption(index));
        deleteBtn?.addEventListener('click', () => this.deletePhoto(index));

        // Click on photo to view
        const img = photoItem.querySelector('img');
        img?.addEventListener('click', () => this.viewPhoto(index));
    }

    async handleFileSelection(event) {
        const files = Array.from(event.target.files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (files.length > 0) {
            await this.processFiles(files);
        }
        
        // Reset input
        event.target.value = '';
    }

    async processFiles(files) {
        // Check photo limit
        const availableSlots = 6 - this.photos.length;
        if (files.length > availableSlots) {
            this.showToast(`Solo puedes agregar ${availableSlots} foto(s) más. Máximo 6 fotos por persona.`, 'warning');
            files = files.slice(0, availableSlots);
        }

        if (files.length === 0) return;

        for (const file of files) {
            await this.processFile(file);
        }
    }

    async processFile(file) {
        try {
            // Validate file
            if (!file.type.startsWith('image/')) {
                throw new Error('Solo se permiten archivos de imagen');
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB
                throw new Error('El archivo es demasiado grande. Máximo 10MB.');
            }

            // Read file
            const fileDataUrl = await this.readFileAsDataURL(file);
            
            // Open crop modal
            this.openCropModal(fileDataUrl, file);

        } catch (error) {
            console.error('Error processing file:', error);
            this.showToast(error.message, 'error');
        }
    }

    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    openCropModal(imageDataUrl, originalFile) {
        const modal = document.getElementById('photoCropModal');
        const cropContainer = document.getElementById('cropContainer');
        
        if (!modal || !cropContainer) return;

        // Create image element
        cropContainer.innerHTML = '<img id="cropImage" style="max-width: 100%;">';
        const cropImage = document.getElementById('cropImage');
        cropImage.src = imageDataUrl;

        modal.classList.remove('hidden');

        // Initialize cropper after image loads
        cropImage.onload = () => {
            if (this.cropInstance) {
                this.cropInstance.destroy();
            }

            // Use a simple cropper implementation or Cropper.js if available
            this.cropInstance = this.initializeCropper(cropImage);
        };

        // Store original file
        this.currentFile = originalFile;
    }

    initializeCropper(imageElement) {
        // If Cropper.js is available, use it
        if (window.Cropper) {
            return new Cropper(imageElement, {
                aspectRatio: 1, // Square aspect ratio
                viewMode: 1,
                responsive: true,
                autoCropArea: 0.8,
                background: false,
                zoomable: true,
                scalable: true,
                rotatable: true
            });
        } else {
            // Fallback: basic crop functionality
            console.warn('Cropper.js not available, using basic crop');
            return {
                getCroppedCanvas: () => {
                    // Return the original image canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = imageElement.naturalWidth;
                    canvas.height = imageElement.naturalHeight;
                    ctx.drawImage(imageElement, 0, 0);
                    return canvas;
                },
                destroy: () => {}
            };
        }
    }

    closeCropModal() {
        const modal = document.getElementById('photoCropModal');
        modal?.classList.add('hidden');
        
        if (this.cropInstance) {
            this.cropInstance.destroy();
            this.cropInstance = null;
        }
    }

    async saveCroppedPhoto() {
        if (!this.cropInstance) return;

        try {
            this.showLoading('Procesando foto...');

            // Get cropped canvas
            const canvas = this.cropInstance.getCroppedCanvas({
                width: 800,
                height: 800,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });

            // Convert to WebP
            const webpBlob = await this.canvasToWebPBlob(canvas, 0.85);
            
            // Upload photo
            await this.uploadPhoto(webpBlob);
            
            this.closeCropModal();
            this.showToast('Foto agregada exitosamente', 'success');

        } catch (error) {
            console.error('Error saving cropped photo:', error);
            this.showToast('Error al procesar la foto', 'error');
        } finally {
            this.hideLoading();
        }
    }

    canvasToWebPBlob(canvas, quality = 0.8) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/webp', quality);
        });
    }

    async uploadPhoto(blob) {
        const formData = new FormData();
        formData.append('photo', blob, 'photo.webp');
        formData.append('familyId', this.pageData.familyId);

        const response = await fetch(`/api/persons/${this.pageData.personId}/photos`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al subir foto');
        }

        const result = await response.json();
        
        // Add to local photos array
        this.photos.push(result.photo);
        this.renderPhotoGallery();
    }

    viewPhoto(index) {
        // Simple lightbox implementation
        const photo = this.photos[index];
        if (!photo) return;

        // Create lightbox
        const lightbox = document.createElement('div');
        lightbox.className = 'photo-lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-overlay">
                <div class="lightbox-content">
                    <button class="lightbox-close" aria-label="Cerrar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
                            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                    <img src="${photo.url}" alt="${photo.caption || 'Foto de ' + this.person.name}">
                    ${photo.caption ? `<p class="lightbox-caption">${this.escapeHtml(photo.caption)}</p>` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(lightbox);

        // Event listeners
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const overlay = lightbox.querySelector('.lightbox-overlay');

        closeBtn.addEventListener('click', () => this.closeLightbox(lightbox));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeLightbox(lightbox);
            }
        });

        // Keyboard navigation
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeLightbox(lightbox);
            } else if (e.key === 'ArrowLeft' && index > 0) {
                this.closeLightbox(lightbox);
                this.viewPhoto(index - 1);
            } else if (e.key === 'ArrowRight' && index < this.photos.length - 1) {
                this.closeLightbox(lightbox);
                this.viewPhoto(index + 1);
            }
        };

        document.addEventListener('keydown', keyHandler);
        lightbox._keyHandler = keyHandler;
    }

    closeLightbox(lightbox) {
        if (lightbox._keyHandler) {
            document.removeEventListener('keydown', lightbox._keyHandler);
        }
        lightbox.remove();
    }

    editPhotoCaption(index) {
        const photo = this.photos[index];
        if (!photo) return;

        this.selectedPhotoIndex = index;
        
        const modal = document.getElementById('captionModal');
        const textArea = document.getElementById('captionText');
        
        if (textArea) {
            textArea.value = photo.caption || '';
        }
        
        modal?.classList.remove('hidden');
        setTimeout(() => textArea?.focus(), 100);
    }

    closeCaptionModal() {
        const modal = document.getElementById('captionModal');
        modal?.classList.add('hidden');
        this.selectedPhotoIndex = null;
    }

    async saveCaption() {
        if (this.selectedPhotoIndex === null) return;

        const photo = this.photos[this.selectedPhotoIndex];
        const textArea = document.getElementById('captionText');
        const newCaption = textArea?.value?.trim() || '';

        try {
            const response = await fetch(`/api/persons/${this.pageData.personId}/photos/${photo.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    familyId: this.pageData.familyId,
                    caption: newCaption
                })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar descripción');
            }

            // Update local data
            photo.caption = newCaption;
            this.renderPhotoGallery();
            this.closeCaptionModal();
            
            this.showToast('Descripción actualizada', 'success');

        } catch (error) {
            console.error('Error updating caption:', error);
            this.showToast('Error al actualizar descripción', 'error');
        }
    }

    async deletePhoto(index) {
        const photo = this.photos[index];
        if (!photo) return;

        if (!confirm('¿Estás seguro de que quieres eliminar esta foto?')) {
            return;
        }

        try {
            const response = await fetch(`/api/persons/${this.pageData.personId}/photos/${photo.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    familyId: this.pageData.familyId
                })
            });

            if (!response.ok) {
                throw new Error('Error al eliminar foto');
            }

            // Remove from local array
            this.photos.splice(index, 1);
            this.renderPhotoGallery();
            
            this.showToast('Foto eliminada', 'success');

        } catch (error) {
            console.error('Error deleting photo:', error);
            this.showToast('Error al eliminar foto', 'error');
        }
    }

    openEditPersonModal() {
        const modal = document.getElementById('editPersonModal');
        
        // Populate form with current data
        document.getElementById('editPersonName').value = this.person.name;
        document.getElementById('editPersonRelationship').value = this.person.relationship || '';
        document.getElementById('editPersonNotes').value = this.person.notes || '';
        document.getElementById('editPersonFavorite').checked = this.person.favorite || false;
        
        modal?.classList.remove('hidden');
        
        // Focus first input
        setTimeout(() => document.getElementById('editPersonName')?.focus(), 100);
    }

    closeEditPersonModal() {
        const modal = document.getElementById('editPersonModal');
        modal?.classList.add('hidden');
    }

    async handleEditPerson(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const personData = {
            familyId: this.pageData.familyId,
            name: formData.get('name')?.trim(),
            relationship: formData.get('relationship')?.trim(),
            notes: formData.get('notes')?.trim(),
            favorite: formData.get('favorite') === 'on'
        };

        // Validation
        if (!personData.name || personData.name.length < 2) {
            this.showToast('El nombre debe tener al menos 2 caracteres', 'error');
            return;
        }

        try {
            this.showLoading('Actualizando persona...');
            
            const response = await fetch(`/api/persons/${this.pageData.personId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(personData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al actualizar persona');
            }

            // Update local data
            Object.assign(this.person, personData);
            this.renderPersonData();
            this.closeEditPersonModal();
            
            this.showToast('Persona actualizada exitosamente', 'success');
            
        } catch (error) {
            console.error('Error updating person:', error);
            this.showToast(error.message || 'Error al actualizar persona', 'error');
        } finally {
            this.hideLoading();
        }
    }

    handleKeydown(event) {
        // Close modals on Escape
        if (event.key === 'Escape') {
            const modals = ['editPersonModal', 'photoCropModal', 'captionModal'];
            for (const modalId of modals) {
                const modal = document.getElementById(modalId);
                if (modal && !modal.classList.contains('hidden')) {
                    switch (modalId) {
                        case 'editPersonModal':
                            this.closeEditPersonModal();
                            break;
                        case 'photoCropModal':
                            this.closeCropModal();
                            break;
                        case 'captionModal':
                            this.closeCaptionModal();
                            break;
                    }
                    break;
                }
            }
        }
    }

    // Utility methods
    showLoadingState() {
        // Implementation for loading state
    }

    showError(message) {
        console.error('MemoryPerson Error:', message);
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        if (window.UI && window.UI.showToast) {
            window.UI.showToast(message, type);
        } else {
            alert(message);
        }
    }

    showLoading(message = 'Cargando...') {
        if (window.UI && window.UI.showLoading) {
            window.UI.showLoading(message);
        }
    }

    hideLoading() {
        if (window.UI && window.UI.hideLoading) {
            window.UI.hideLoading();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.memoryPerson = new MemoryPerson();
});

// Global functions for backwards compatibility
window.uploadPhoto = () => document.getElementById('photoFileInput')?.click();
window.editPerson = () => window.memoryPerson?.openEditPersonModal();
