/**
 * RecuerdaMe - Location Module
 * Geolocation handling and geofence calculations
 */

// Location tracking state
let locationWatchId = null;
let isTrackingLocation = false;
let lastKnownPosition = null;

// Geolocation options
const LOCATION_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000 // 30 seconds
};

/**
 * Share current location with family
 * @param {number} homeLat - Home latitude for geofence calculation
 * @param {number} homeLng - Home longitude for geofence calculation
 * @param {number} radiusMeters - Safe radius in meters
 * @param {string} familyId - Family ID
 * @param {string} uid - User ID
 */
async function shareLocation(homeLat, homeLng, radiusMeters, familyId, uid) {
    if (!navigator.geolocation) {
        showToast('Geolocalización no soportada en este navegador', 'error');
        return;
    }
    
    // Show loading state
    const shareBtn = document.querySelector('[onclick*="shareLocation"]');
    if (shareBtn) {
        shareBtn.disabled = true;
        shareBtn.innerHTML = '<i class="bi bi-geo-alt spin me-2"></i>Obteniendo ubicación...';
    }
    
    try {
        const position = await getCurrentPosition();
        const { latitude, longitude, accuracy } = position.coords;
        
        // Calculate if outside safe radius
        const distance = calculateDistance(latitude, longitude, homeLat, homeLng);
        const isOutside = distance > radiusMeters;
        
        // Send location to server
        const locationData = {
            familyId,
            uid,
            latitude,
            longitude,
            accuracy: Math.round(accuracy || 0),
            outside: isOutside,
            timestamp: new Date().toISOString()
        };
        
        const response = await fetch('/api/location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(locationData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            lastKnownPosition = { latitude, longitude, accuracy };
            
            if (isOutside) {
                showToast(`Ubicación compartida - Fuera del área segura (${Math.round(distance)}m)`, 'warning', 5000);
            } else {
                showToast('Ubicación compartida dentro del área segura', 'success', 3000);
            }
            
            // Update map if available
            if (typeof renderUserLocation === 'function') {
                renderUserLocation(latitude, longitude, accuracy);
            }
        } else {
            throw new Error(result.error || 'Error guardando ubicación');
        }
        
    } catch (error) {
        console.error('Error sharing location:', error);
        
        if (error.code === error.PERMISSION_DENIED) {
            showToast('Acceso a ubicación denegado. Por favor permite el acceso en la configuración del navegador.', 'error', 8000);
        } else if (error.code === error.TIMEOUT) {
            showToast('Tiempo de espera agotado. Intenta nuevamente.', 'warning');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
            showToast('Ubicación no disponible. Verifica que el GPS esté activado.', 'warning');
        } else {
            showToast('Error compartiendo ubicación: ' + error.message, 'error');
        }
    } finally {
        // Restore button state
        if (shareBtn) {
            shareBtn.disabled = false;
            shareBtn.innerHTML = '<i class="bi bi-geo-alt me-2"></i>Compartir Ubicación';
        }
    }
}

/**
 * Start continuous location tracking (while app is open)
 * @param {number} homeLat - Home latitude
 * @param {number} homeLng - Home longitude
 * @param {number} radiusMeters - Safe radius
 * @param {string} familyId - Family ID
 * @param {string} uid - User ID
 * @param {number} intervalSeconds - Update interval in seconds
 */
function startLocationTracking(homeLat, homeLng, radiusMeters, familyId, uid, intervalSeconds = 30) {
    if (!navigator.geolocation) {
        showToast('Geolocalización no disponible', 'error');
        return;
    }
    
    if (isTrackingLocation) {
        stopLocationTracking();
        return;
    }
    
    isTrackingLocation = true;
    
    // Request permission first
    navigator.geolocation.getCurrentPosition(
        (position) => {
            showToast('Seguimiento de ubicación iniciado', 'success');
            
            // Start watching position
            locationWatchId = navigator.geolocation.watchPosition(
                (position) => {
                    handleLocationUpdate(position, homeLat, homeLng, radiusMeters, familyId, uid);
                },
                (error) => {
                    console.error('Location tracking error:', error);
                    handleLocationError(error);
                },
                {
                    ...LOCATION_OPTIONS,
                    maximumAge: intervalSeconds * 1000
                }
            );
            
            // Update UI
            updateTrackingButton(true);
        },
        (error) => {
            isTrackingLocation = false;
            handleLocationError(error);
        },
        LOCATION_OPTIONS
    );
}

/**
 * Stop continuous location tracking
 */
function stopLocationTracking() {
    if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
    }
    
    isTrackingLocation = false;
    updateTrackingButton(false);
    showToast('Seguimiento de ubicación detenido', 'info');
}

/**
 * Handle location update from watch position
 * @param {GeolocationPosition} position 
 * @param {number} homeLat 
 * @param {number} homeLng 
 * @param {number} radiusMeters 
 * @param {string} familyId 
 * @param {string} uid 
 */
async function handleLocationUpdate(position, homeLat, homeLng, radiusMeters, familyId, uid) {
    const { latitude, longitude, accuracy } = position.coords;
    
    // Calculate distance from home
    const distance = calculateDistance(latitude, longitude, homeLat, homeLng);
    const isOutside = distance > radiusMeters;
    
    // Only send to server if significant change or geofence violation
    const shouldUpdate = !lastKnownPosition || 
                        calculateDistance(latitude, longitude, lastKnownPosition.latitude, lastKnownPosition.longitude) > 50 ||
                        isOutside;
    
    if (shouldUpdate) {
        try {
            const locationData = {
                familyId,
                uid,
                latitude,
                longitude,
                accuracy: Math.round(accuracy || 0),
                outside: isOutside,
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch('/api/location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(locationData)
            });
            
            if (response.ok) {
                lastKnownPosition = { latitude, longitude, accuracy };
                
                // Update map if available
                if (typeof renderUserLocation === 'function') {
                    renderUserLocation(latitude, longitude, accuracy);
                }
                
                // Show alert if outside safe area
                if (isOutside) {
                    showGeofenceAlert(distance, radiusMeters);
                }
            }
            
        } catch (error) {
            console.error('Error updating location:', error);
        }
    }
}

/**
 * Show geofence violation alert
 * @param {number} distance - Current distance from home
 * @param {number} radius - Safe radius
 */
function showGeofenceAlert(distance, radius) {
    const overage = Math.round(distance - radius);
    showToast(
        `⚠️ Fuera del área segura por ${overage}m. La familia ha sido notificada.`, 
        'warning', 
        8000
    );
    
    // Vibrate if supported
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
    }
    
    // Play notification sound (optional)
    playNotificationSound();
}

/**
 * Handle geolocation errors
 * @param {GeolocationPositionError} error 
 */
function handleLocationError(error) {
    let message;
    
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = 'Acceso a ubicación denegado. Por favor permite el acceso en la configuración.';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Información de ubicación no disponible. Verifica que el GPS esté activado.';
            break;
        case error.TIMEOUT:
            message = 'Tiempo de espera agotado obteniendo la ubicación.';
            break;
        default:
            message = 'Error desconocido obteniendo la ubicación.';
            break;
    }
    
    showToast(message, 'error', 6000);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const toRad = (x) => x * Math.PI / 180;
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

/**
 * Get current position as Promise
 * @returns {Promise<GeolocationPosition>}
 */
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, LOCATION_OPTIONS);
    });
}

/**
 * Update tracking button UI
 * @param {boolean} isTracking 
 */
function updateTrackingButton(isTracking) {
    const trackingBtn = document.querySelector('[onclick*="startLocationTracking"], [onclick*="stopLocationTracking"]');
    if (!trackingBtn) return;
    
    if (isTracking) {
        trackingBtn.classList.remove('btn-outline-primary');
        trackingBtn.classList.add('btn-success');
        trackingBtn.innerHTML = '<i class="bi bi-stop-circle me-2"></i>Detener Seguimiento';
        trackingBtn.onclick = stopLocationTracking;
    } else {
        trackingBtn.classList.remove('btn-success');
        trackingBtn.classList.add('btn-outline-primary');
        trackingBtn.innerHTML = '<i class="bi bi-play-circle me-2"></i>Iniciar Seguimiento';
    }
}

/**
 * Play notification sound for geofence alerts
 */
function playNotificationSound() {
    try {
        // Create audio context for notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        // Silently fail if audio context is not available
        console.log('Audio notification not available');
    }
}

/**
 * Check if location services are enabled
 * @returns {Promise<boolean>}
 */
async function checkLocationPermission() {
    if (!navigator.permissions) {
        return false;
    }
    
    try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state === 'granted';
    } catch (error) {
        return false;
    }
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance
 */
function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)}m`;
    } else {
        return `${(meters / 1000).toFixed(1)}km`;
    }
}

/**
 * Get location accuracy description
 * @param {number} accuracy - Accuracy in meters
 * @returns {string} Description
 */
function getAccuracyDescription(accuracy) {
    if (accuracy <= 10) return 'Muy precisa';
    if (accuracy <= 50) return 'Precisa';
    if (accuracy <= 100) return 'Moderada';
    return 'Aproximada';
}

// Export functions for global use
window.shareLocation = shareLocation;
window.startLocationTracking = startLocationTracking;
window.stopLocationTracking = stopLocationTracking;
window.calculateDistance = calculateDistance;
window.getCurrentPosition = getCurrentPosition;
window.checkLocationPermission = checkLocationPermission;
window.formatDistance = formatDistance;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (isTrackingLocation) {
        stopLocationTracking();
    }
});
