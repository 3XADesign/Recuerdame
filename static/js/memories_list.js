/**
 * MEMORIES LIST - JavaScript Module
 * Handles the person list view with search, filters, and person creation
 */

class MemoriesList {
    constructor() {
        this.pageData = null;
        this.persons = [];
        this.filteredPersons = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        
        this.init();
    }

    async init() {
        try {
            // Get page data
            const pageDataElement = document.getElementById('pageData');
            this.pageData = pageDataElement ? JSON.parse(pageDataElement.textContent) : {};
            
            // Initialize UI
            this.initializeEventListeners();
            
            // Load persons
            await this.loadPersons();
        } catch (error) {
            console.error('Error initializing MemoriesList:', error);
            this.showError('Error al inicializar la página');
        }
    }

    initializeEventListeners() {
        // Add person button
        const addPersonBtn = document.getElementById('addPersonBtn');
        addPersonBtn?.addEventListener('click', () => this.openAddPersonModal());

        // Search input
        const searchInput = document.getElementById('searchInput');
        searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Filter chips
        const filterChips = document.querySelectorAll('.chip[data-filter]');
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => this.handleFilterChange(chip.dataset.filter));
        });

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        clearFiltersBtn?.addEventListener('click', () => this.clearFilters());

        // Modal close buttons
        const closeModalBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        closeModalBtn?.addEventListener('click', () => this.closeAddPersonModal());
        cancelBtn?.addEventListener('click', () => this.closeAddPersonModal());

        // Modal overlay click
        const modalOverlay = document.getElementById('addPersonModal');
        modalOverlay?.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeAddPersonModal();
            }
        });

        // Add person form
        const addPersonForm = document.getElementById('addPersonForm');
        addPersonForm?.addEventListener('submit', (e) => this.handleAddPerson(e));

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    async loadPersons() {
        try {
            this.showLoadingState();
            
            const response = await fetch(`/api/persons?familyId=${this.pageData.familyId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.persons = data.persons || [];
            
            this.applyFilters();
            this.renderPersons();
            
        } catch (error) {
            console.error('Error loading persons:', error);
            this.showError('Error al cargar las personas');
        }
    }

    handleSearch(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.applyFilters();
        this.renderPersons();
    }

    handleFilterChange(filter) {
        // Update active filter chip
        document.querySelectorAll('.chip[data-filter]').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.filter === filter);
            chip.setAttribute('aria-checked', chip.dataset.filter === filter);
        });

        this.currentFilter = filter;
        this.applyFilters();
        this.renderPersons();
    }

    applyFilters() {
        this.filteredPersons = this.persons.filter(person => {
            // Search filter
            if (this.searchQuery) {
                const searchText = `${person.name} ${person.relationship}`.toLowerCase();
                if (!searchText.includes(this.searchQuery)) {
                    return false;
                }
            }

            // Category filter
            switch (this.currentFilter) {
                case 'favorites':
                    return person.favorite;
                case 'recent':
                    // Consider recent as created in last 7 days
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(person.createdAt) > weekAgo;
                default:
                    return true;
            }
        });
    }

    renderPersons() {
        const gridContainer = document.getElementById('personsGrid');
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');
        const noResultsState = document.getElementById('noResultsState');

        // Hide all states first
        [loadingState, emptyState, noResultsState].forEach(element => {
            element?.classList.add('hidden');
        });

        if (this.persons.length === 0) {
            // No persons at all
            emptyState?.classList.remove('hidden');
            this.clearGrid();
            return;
        }

        if (this.filteredPersons.length === 0) {
            // No results for current search/filter
            noResultsState?.classList.remove('hidden');
            this.clearGrid();
            return;
        }

        // Render person cards
        this.clearGrid();
        
        this.filteredPersons.forEach((person, index) => {
            const cardElement = this.createPersonCard(person, index);
            gridContainer.appendChild(cardElement);
        });
    }

    createPersonCard(person, index) {
        const card = document.createElement('div');
        card.className = 'person-card card-pill';
        card.setAttribute('data-tone', this.getCardTone(index));
        card.setAttribute('role', 'listitem');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${person.name}, ${person.relationship}`);

        card.innerHTML = `
            <button class="person-favorite-btn ${person.favorite ? 'active' : ''}" 
                    aria-label="${person.favorite ? 'Quitar de' : 'Agregar a'} favoritos"
                    data-person-id="${person.id}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" 
                             stroke="currentColor" stroke-width="2" ${person.favorite ? 'fill="currentColor"' : ''}/>
                </svg>
            </button>
            
            <div class="person-avatar">
                ${person.photoUrl 
                    ? `<img src="${person.photoUrl}" alt="${person.name}" loading="lazy">`
                    : `<div class="person-avatar-initial">${person.name.charAt(0).toUpperCase()}</div>`
                }
            </div>
            
            <h3 class="person-name">${this.escapeHtml(person.name)}</h3>
            
            ${person.relationship 
                ? `<p class="person-relationship">${this.escapeHtml(person.relationship)}</p>`
                : ''
            }
            
            <div class="person-actions">
                <button class="btn-secondary btn-small edit-person-btn" data-person-id="${person.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/>
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Editar
                </button>
            </div>
        `;

        // Add event listeners
        this.addCardEventListeners(card, person);

        return card;
    }

    addCardEventListeners(card, person) {
        // Card click - navigate to person detail
        const cardClickHandler = (e) => {
            // Don't navigate if clicking on buttons
            if (e.target.closest('button')) return;
            
            window.location.href = `/memories/${person.id}`;
        };

        card.addEventListener('click', cardClickHandler);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                cardClickHandler(e);
            }
        });

        // Favorite button
        const favoriteBtn = card.querySelector('.person-favorite-btn');
        favoriteBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(person.id);
        });

        // Edit button
        const editBtn = card.querySelector('.edit-person-btn');
        editBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editPerson(person.id);
        });
    }

    getCardTone(index) {
        const tones = ['primary', 'secondary', 'accent', 'warning'];
        return tones[index % tones.length];
    }

    async toggleFavorite(personId) {
        try {
            const response = await fetch(`/api/persons/${personId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    familyId: this.pageData.familyId,
                    favorite: !this.getPersonById(personId)?.favorite
                })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar favorito');
            }

            // Update local data
            const person = this.getPersonById(personId);
            if (person) {
                person.favorite = !person.favorite;
                this.applyFilters();
                this.renderPersons();
                
                // Show feedback
                const message = person.favorite ? 'Agregado a favoritos' : 'Quitado de favoritos';
                this.showToast(message, 'success');
            }

        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.showToast('Error al actualizar favorito', 'error');
        }
    }

    editPerson(personId) {
        // Navigate to person detail page for editing
        window.location.href = `/memories/${personId}`;
    }

    openAddPersonModal() {
        const modal = document.getElementById('addPersonModal');
        modal?.classList.remove('hidden');
        
        // Focus first input
        const firstInput = modal?.querySelector('input');
        setTimeout(() => firstInput?.focus(), 100);
    }

    closeAddPersonModal() {
        const modal = document.getElementById('addPersonModal');
        modal?.classList.add('hidden');
        
        // Reset form
        const form = document.getElementById('addPersonForm');
        form?.reset();
    }

    async handleAddPerson(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const personData = {
            familyId: this.pageData.familyId,
            name: formData.get('name') || document.getElementById('personName')?.value?.trim(),
            relationship: formData.get('relationship') || document.getElementById('personRelationship')?.value?.trim(),
            notes: formData.get('notes') || document.getElementById('personNotes')?.value?.trim(),
            favorite: formData.get('favorite') === 'on' || document.getElementById('personFavorite')?.checked
        };

        // Validation
        if (!personData.name || personData.name.length < 2) {
            this.showToast('El nombre debe tener al menos 2 caracteres', 'error');
            return;
        }

        if (personData.name.length > 60) {
            this.showToast('El nombre no puede tener más de 60 caracteres', 'error');
            return;
        }

        if (personData.relationship && personData.relationship.length > 24) {
            this.showToast('La relación no puede tener más de 24 caracteres', 'error');
            return;
        }

        try {
            this.showLoading('Creando persona...');
            
            const response = await fetch('/api/persons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(personData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al crear persona');
            }

            const result = await response.json();
            
            this.showToast('Persona creada exitosamente', 'success');
            this.closeAddPersonModal();
            
            // Reload persons list
            await this.loadPersons();
            
        } catch (error) {
            console.error('Error creating person:', error);
            this.showToast(error.message || 'Error al crear persona', 'error');
        } finally {
            this.hideLoading();
        }
    }

    clearFilters() {
        this.searchQuery = '';
        this.currentFilter = 'all';
        
        // Reset UI
        document.getElementById('searchInput').value = '';
        this.handleFilterChange('all');
    }

    handleKeydown(event) {
        // Close modal on Escape
        if (event.key === 'Escape') {
            const modal = document.getElementById('addPersonModal');
            if (!modal?.classList.contains('hidden')) {
                this.closeAddPersonModal();
            }
        }
    }

    // Utility methods
    getPersonById(id) {
        return this.persons.find(person => person.id === id);
    }

    clearGrid() {
        const gridContainer = document.getElementById('personsGrid');
        // Remove all person cards but keep state elements
        const personCards = gridContainer?.querySelectorAll('.person-card');
        personCards?.forEach(card => card.remove());
    }

    showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');
        const noResultsState = document.getElementById('noResultsState');

        loadingState?.classList.remove('hidden');
        emptyState?.classList.add('hidden');
        noResultsState?.classList.add('hidden');
        
        this.clearGrid();
    }

    showError(message) {
        console.error('MemoriesList Error:', message);
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Use global UI toast if available
        if (window.UI && window.UI.showToast) {
            window.UI.showToast(message, type);
        } else {
            // Fallback to alert
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
    window.memoriesList = new MemoriesList();
});

// Global functions for backwards compatibility
window.addPerson = () => window.memoriesList?.openAddPersonModal();
