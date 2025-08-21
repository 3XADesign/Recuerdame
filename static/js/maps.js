/**
 * RecuerdaMe - Maps Module
 * Google Maps integration for family location tracking
 */

// Global map variables
let map;
let userMarker;
let accuracyCircle;
let homeMarker;
let safeCircle;
let followTimer;
let familyData;

// Store marker classes
let AdvancedMarkerElement = null;
let PinElement = null;

// Map configuration
const MAP_CONFIG = {
    defaultZoom: 15,
    followZoom: 17,
    styles: [
        {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
        }
    ],
    options: {
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative'
    }
};

/**
 * Initialize Google Maps
 * Called by Google Maps API callback
 */
async function initializeGoogleMaps() {
    console.log('🗺️ Inicializando Google Maps...');
    
    try {
        // Load required libraries
        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement: AMarker, PinElement: Pin } = await google.maps.importLibrary("marker");
        
        // Store classes globally
        AdvancedMarkerElement = AMarker;
        PinElement = Pin;
        
        // Initialize map
        initializeMap();
        
    } catch (error) {
        console.error('❌ Error cargando Google Maps:', error);
        showMapError('Error cargando el mapa. Verifica la configuración de la API.');
    }
}

/**
 * Initialize the map with basic configuration
 */
function initializeMap() {

/**
 * Refresh user location from server
 */
async function refreshUserLocation() {
    if (!familyData) return;
    
    const refreshBtn = document.getElementById('btnRefresh');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin me-2"></i>Actualizando...';
    }
    
    try {
        const response = await fetch(`/api/last-location?familyId=${familyData.familyId}&uid=demo-user-123`);
        const data = await response.json();
        
        if (data.success && data.location) {
            const { latitude, longitude, accuracy, timestamp, isOutsideSafeRadius } = data.location;
            
            // Update user marker
            await renderUserLocation(latitude, longitude, accuracy);
            
            // Update status badge
            updateLocationStatus(isOutsideSafeRadius, timestamp);
            
            showToast('Ubicación actualizada', 'success', 2000);
        } else {
            updateLocationStatus(null, null);
            showToast('No hay ubicación disponible', 'info');
        }
        
    } catch (error) {
        console.error('Error refreshing location:', error);
        showToast('Error actualizando ubicación', 'error');
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-2"></i>Refrescar';
        }
    }
}

/**
 * Render user location on map
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} accuracy - GPS accuracy in meters
 */
async function renderUserLocation(lat, lng, accuracy) {
    const position = { lat, lng };
    
    // Create or update user marker
    if (!userMarker && AdvancedMarkerElement) {
        // Create custom pin
        const pin = new PinElement({
            background: '#dc2626',
            glyphColor: '#ffffff',
            borderColor: '#ffffff',
            scale: 1.2
        });
        
        userMarker = new AdvancedMarkerElement({
            position: position,
            map: map,
            title: familyData.userName || 'Usuario',
            content: pin.element,
            zIndex: 2000
        });
        
        // Add info window (fallback for older browsers)
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="text-center">
                    <h6 class="mb-1">${familyData.userName || 'Usuario'}</h6>
                    <small class="text-muted">Última ubicación conocida</small>
                </div>
            `
        });
        
        userMarker.addListener('click', () => {
            infoWindow.open(map, userMarker);
        });
    } else {
        userMarker.setPosition(position);
    }
    
    // Create or update accuracy circle
    const accuracyRadius = Math.max(accuracy || 30, 10);
    if (!accuracyCircle) {
        accuracyCircle = new google.maps.Circle({
            map: map,
            center: position,
            radius: accuracyRadius,
            strokeColor: '#dc2626',
            strokeOpacity: 0.5,
            strokeWeight: 1,
            fillColor: '#dc2626',
            fillOpacity: 0.1,
            clickable: false
        });
    } else {
        accuracyCircle.setCenter(position);
        accuracyCircle.setRadius(accuracyRadius);
    }
    
    // Center map on user location
    map.panTo(position);
    
    // Adjust zoom if needed
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(position);
    bounds.extend(homeMarker.getPosition());
    
    if (!map.getBounds() || !map.getBounds().contains(position)) {
        map.fitBounds(bounds, { padding: 50 });
    }
}

/**
 * Toggle safe radius circle visibility
 */
function toggleSafeRadius() {
    if (!safeCircle) return;
    
    const isVisible = safeCircle.getVisible();
    safeCircle.setVisible(!isVisible);
    
    const toggleBtn = document.getElementById('btnToggleRadius');
    if (toggleBtn) {
        if (isVisible) {
            toggleBtn.classList.remove('btn-outline-secondary');
            toggleBtn.classList.add('btn-secondary');
            toggleBtn.innerHTML = '<i class="bi bi-shield-slash me-2"></i>Radio Oculto';
        } else {
            toggleBtn.classList.remove('btn-secondary');
            toggleBtn.classList.add('btn-outline-secondary');
            toggleBtn.innerHTML = '<i class="bi bi-shield-check me-2"></i>Radio Seguro';
        }
    }
    
    showToast(isVisible ? 'Radio seguro oculto' : 'Radio seguro visible', 'info', 1500);
}

/**
 * Toggle follow mode (real-time location tracking)
 */
function toggleFollowMode() {
    const followBtn = document.getElementById('btnFollow');
    if (!followBtn) return;
    
    if (followTimer) {
        // Stop following
        clearInterval(followTimer);
        followTimer = null;
        
        followBtn.classList.remove('btn-success');
        followBtn.classList.add('btn-outline-secondary');
        followBtn.innerHTML = '<i class="bi bi-crosshair me-2"></i><span class="follow-text">Seguir</span>';
        
        showToast('Seguimiento en tiempo real desactivado', 'info');
    } else {
        // Start following
        followTimer = setInterval(refreshUserLocation, 10000); // Every 10 seconds
        
        followBtn.classList.remove('btn-outline-secondary');
        followBtn.classList.add('btn-success');
        followBtn.innerHTML = '<i class="bi bi-stop-circle me-2"></i><span class="follow-text">Detener</span>';
        
        showToast('Seguimiento en tiempo real activado', 'success');
        
        // Initial refresh
        refreshUserLocation();
    }
}

/**
 * Update location status badge
 * @param {boolean|null} isOutside - Whether user is outside safe area
 * @param {string|null} timestamp - Last update timestamp
 */
function updateLocationStatus(isOutside, timestamp) {
    const statusBadge = document.getElementById('statusBadge');
    const lastUpdate = document.getElementById('lastUpdate');
    
    if (!statusBadge || !lastUpdate) return;
    
    if (isOutside === null) {
        // No location data
        statusBadge.className = 'badge text-bg-secondary';
        statusBadge.innerHTML = '<i class="bi bi-question-circle me-1"></i>Sin ubicación';
        lastUpdate.textContent = 'Actualizado: --:--';
    } else if (isOutside) {
        // Outside safe area
        statusBadge.className = 'badge text-bg-warning';
        statusBadge.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Fuera del área segura';
        lastUpdate.textContent = `Actualizado: ${formatTime(timestamp)}`;
        
        // Pulse animation for attention
        statusBadge.classList.add('animate-pulse');
        setTimeout(() => statusBadge.classList.remove('animate-pulse'), 3000);
    } else {
        // Inside safe area
        statusBadge.className = 'badge text-bg-success';
        statusBadge.innerHTML = '<i class="bi bi-shield-check me-1"></i>Dentro del área segura';
        lastUpdate.textContent = `Actualizado: ${formatTime(timestamp)}`;
    }
}

/**
 * Show map error message
 * @param {string} message - Error message
 */
function showMapError(message) {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
            <i class="bi bi-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
            <h4 class="text-muted mb-2">Error en el Mapa</h4>
            <p class="text-muted mb-3">${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">
                <i class="bi bi-arrow-clockwise me-2"></i>
                Recargar Página
            </button>
        </div>
    `;
}

/**
 * Get current map bounds for server queries
 * @returns {Object|null} Bounds object
 */
function getCurrentMapBounds() {
    if (!map) return null;
    
    const bounds = map.getBounds();
    if (!bounds) return null;
    
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    return {
        north: ne.lat(),
        east: ne.lng(),
        south: sw.lat(),
        west: sw.lng()
    };
}

/**
 * Cleanup function for page unload
 */
function cleanupMap() {
    if (followTimer) {
        clearInterval(followTimer);
        followTimer = null;
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupMap);

// CSS for spinning refresh icon
const style = document.createElement('style');
style.textContent = `
    .spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Export functions for global use
window.initializeGoogleMaps = initializeGoogleMaps;
window.initializeMap = initializeMap;
window.refreshUserLocation = refreshUserLocation;
window.renderUserLocation = renderUserLocation;
window.toggleSafeRadius = toggleSafeRadius;
window.toggleFollowMode = toggleFollowMode;
