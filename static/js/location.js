/**
 * Location.js - Geolocation and location tracking utilities
 * Handles GPS, location permissions, and safety zone monitoring
 */

class Location {
    constructor() {
        this.currentPosition = null;
        this.watchId = null;
        this.isTracking = false;
        this.lastUpdateTime = null;
        this.safetyZones = new Map();
        this.locationHistory = [];
        this.maxHistorySize = 50;
        
        this.options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000 // 1 minute
        };
    }

    // Check if geolocation is supported
    isSupported() {
        return 'geolocation' in navigator;
    }

    // Request location permission
    async requestPermission() {
        if (!this.isSupported()) {
            throw new Error('Geolocalización no soportada en este dispositivo');
        }

        // Check current permission status
        if ('permissions' in navigator) {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            if (permission.state === 'denied') {
                throw new Error('Permisos de ubicación denegados');
            }
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('Location permission granted');
                    resolve(position);
                },
                (error) => {
                    this.handleGeolocationError(error);
                    reject(error);
                },
                this.options
            );
        });
    }

    // Get current position once
    async getCurrentPosition() {
        if (!this.isSupported()) {
            throw new Error('Geolocalización no soportada');
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.updateCurrentPosition(position);
                    resolve(this.formatPosition(position));
                },
                (error) => {
                    this.handleGeolocationError(error);
                    reject(error);
                },
                this.options
            );
        });
    }

    // Start continuous location tracking
    async startTracking() {
        if (!this.isSupported()) {
            throw new Error('Geolocalización no soportada');
        }

        if (this.isTracking) {
            console.log('Location tracking already active');
            return;
        }

        try {
            // First get permission
            await this.requestPermission();

            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    this.updateCurrentPosition(position);
                    this.onLocationUpdate(this.formatPosition(position));
                },
                (error) => {
                    this.handleGeolocationError(error);
                    this.onLocationError(error);
                },
                this.options
            );

            this.isTracking = true;
            console.log('Location tracking started');
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('locationTrackingStarted'));
            
        } catch (error) {
            console.error('Failed to start location tracking:', error);
            throw error;
        }
    }

    // Stop location tracking
    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        this.isTracking = false;
        console.log('Location tracking stopped');
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('locationTrackingStopped'));
    }

    // Update current position
    updateCurrentPosition(position) {
        this.currentPosition = position;
        this.lastUpdateTime = Date.now();
        
        // Add to history
        this.locationHistory.push({
            position: this.formatPosition(position),
            timestamp: this.lastUpdateTime
        });
        
        // Limit history size
        if (this.locationHistory.length > this.maxHistorySize) {
            this.locationHistory.shift();
        }
        
        // Check safety zones
        this.checkSafetyZones(position);
    }

    // Format position object
    formatPosition(position) {
        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
        };
    }

    // Handle geolocation errors
    handleGeolocationError(error) {
        let message = 'Error de ubicación';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Permisos de ubicación denegados';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Ubicación no disponible';
                break;
            case error.TIMEOUT:
                message = 'Tiempo de espera agotado para obtener ubicación';
                break;
            default:
                message = 'Error desconocido de ubicación';
                break;
        }
        
        console.error('Geolocation error:', message, error);
        
        if (window.UI) {
            UI.showToast(message, 'warning');
        }
    }

    // Safety zones management
    addSafetyZone(id, center, radius, name = '') {
        this.safetyZones.set(id, {
            id,
            center,
            radius,
            name,
            isInside: false
        });
        
        console.log(`Safety zone '${name}' added:`, { center, radius });
    }

    removeSafetyZone(id) {
        this.safetyZones.delete(id);
        console.log(`Safety zone '${id}' removed`);
    }

    updateSafetyZone(id, updates) {
        const zone = this.safetyZones.get(id);
        if (zone) {
            Object.assign(zone, updates);
        }
    }

    // Check if current position is within safety zones
    checkSafetyZones(position) {
        if (!position) return;
        
        this.safetyZones.forEach(zone => {
            const distance = this.calculateDistance(
                position.coords.latitude,
                position.coords.longitude,
                zone.center.lat,
                zone.center.lng
            );
            
            const wasInside = zone.isInside;
            const isInside = distance <= zone.radius;
            zone.isInside = isInside;
            
            // Check for zone transitions
            if (wasInside && !isInside) {
                this.onExitSafetyZone(zone, distance);
            } else if (!wasInside && isInside) {
                this.onEnterSafetyZone(zone, distance);
            }
        });
    }

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = this.degreesToRadians(lat2 - lat1);
        const dLng = this.degreesToRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.degreesToRadians(lat1)) * 
                  Math.cos(this.degreesToRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Get location status
    getLocationStatus() {
        const zones = Array.from(this.safetyZones.values());
        const insideAnyZone = zones.some(zone => zone.isInside);
        
        if (insideAnyZone) {
            return 'safe';
        } else if (zones.length > 0) {
            // Check if close to any zone (within 50m)
            const isNearZone = zones.some(zone => {
                if (!this.currentPosition) return false;
                
                const distance = this.calculateDistance(
                    this.currentPosition.coords.latitude,
                    this.currentPosition.coords.longitude,
                    zone.center.lat,
                    zone.center.lng
                );
                
                return distance <= zone.radius + 50;
            });
            
            return isNearZone ? 'warning' : 'danger';
        }
        
        return 'unknown';
    }

    // Get current position data
    getCurrentPositionData() {
        if (!this.currentPosition) return null;
        
        return {
            ...this.formatPosition(this.currentPosition),
            status: this.getLocationStatus(),
            lastUpdate: this.lastUpdateTime
        };
    }

    // Get location history
    getLocationHistory(limit = null) {
        const history = [...this.locationHistory];
        return limit ? history.slice(-limit) : history;
    }

    // Event handlers (can be overridden)
    onLocationUpdate(position) {
        console.log('Location updated:', position);
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('locationUpdate', {
            detail: { position, status: this.getLocationStatus() }
        }));
        
        // Send to server if API is available
        if (window.API) {
            window.API.updateLocation(position.latitude, position.longitude)
                .catch(error => console.error('Failed to send location to server:', error));
        }
    }

    onLocationError(error) {
        console.error('Location error:', error);
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('locationError', {
            detail: { error }
        }));
    }

    onEnterSafetyZone(zone, distance) {
        console.log(`Entered safety zone: ${zone.name || zone.id}`);
        
        if (window.UI) {
            UI.showToast(`Entraste en zona segura: ${zone.name || 'Zona de seguridad'}`, 'success');
        }
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('enterSafetyZone', {
            detail: { zone, distance }
        }));
    }

    onExitSafetyZone(zone, distance) {
        console.log(`Exited safety zone: ${zone.name || zone.id}`);
        
        if (window.UI) {
            UI.showToast(`Saliste de zona segura: ${zone.name || 'Zona de seguridad'}`, 'warning');
        }
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('exitSafetyZone', {
            detail: { zone, distance }
        }));
    }

    // Utility methods
    isLocationStale(maxAge = 300000) { // 5 minutes
        if (!this.lastUpdateTime) return true;
        return Date.now() - this.lastUpdateTime > maxAge;
    }

    getAccuracyStatus() {
        if (!this.currentPosition) return 'unknown';
        
        const accuracy = this.currentPosition.coords.accuracy;
        if (accuracy <= 10) return 'high';
        if (accuracy <= 50) return 'medium';
        return 'low';
    }

    // Mock location for testing
    setMockLocation(latitude, longitude) {
        const mockPosition = {
            coords: {
                latitude,
                longitude,
                accuracy: 5,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
            },
            timestamp: Date.now()
        };
        
        this.updateCurrentPosition(mockPosition);
        this.onLocationUpdate(this.formatPosition(mockPosition));
    }
}

// Global location instance
window.Location = new Location();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Location;
}
