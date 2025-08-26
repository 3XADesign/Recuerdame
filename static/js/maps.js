/**
 * Maps.js - Google Maps integration
 * Handles map initialization, styling, and location features
 */

class Maps {
    constructor() {
        this.map = null;
        this.markers = new Map();
        this.circles = new Map();
        this.isInitialized = false;
        this.currentTheme = 'light';
        this.userMarker = null;
        this.infoWindow = null;
    }

    // Initialize Google Maps
    async initialize(containerId = 'map', options = {}) {
        if (!window.google || !window.google.maps) {
            throw new Error('Google Maps API not loaded');
        }

        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Map container '${containerId}' not found`);
        }

        const defaultOptions = {
            center: { lat: 40.7128, lng: -74.0060 },
            zoom: 16,
            styles: this.getMapStyles(),
            disableDefaultUI: true,
            gestureHandling: 'greedy',
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false
        };

        this.map = new google.maps.Map(container, { ...defaultOptions, ...options });
        this.infoWindow = new google.maps.InfoWindow();
        this.isInitialized = true;

        this.setupEventListeners();
        console.log('Google Maps initialized');

        return this.map;
    }

    // Map styles for light/dark themes
    getMapStyles(theme = null) {
        const currentTheme = theme || this.getCurrentTheme();
        
        if (currentTheme === 'dark') {
            return [
                { elementType: 'geometry', stylers: [{ color: '#1a1b20' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1b20' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#d59563' }]
                },
                {
                    featureType: 'poi',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#d59563' }]
                },
                {
                    featureType: 'poi.park',
                    elementType: 'geometry',
                    stylers: [{ color: '#263c3f' }]
                },
                {
                    featureType: 'poi.park',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#6b9a76' }]
                },
                {
                    featureType: 'road',
                    elementType: 'geometry',
                    stylers: [{ color: '#2a2b30' }]
                },
                {
                    featureType: 'road',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#212a37' }]
                },
                {
                    featureType: 'road',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#9ca5b3' }]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'geometry',
                    stylers: [{ color: '#746855' }]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#1f2835' }]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#f3d19c' }]
                },
                {
                    featureType: 'transit',
                    elementType: 'geometry',
                    stylers: [{ color: '#2f3948' }]
                },
                {
                    featureType: 'transit.station',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#d59563' }]
                },
                {
                    featureType: 'water',
                    elementType: 'geometry',
                    stylers: [{ color: '#16bcb8' }]
                },
                {
                    featureType: 'water',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#515c6d' }]
                },
                {
                    featureType: 'water',
                    elementType: 'labels.text.stroke',
                    stylers: [{ color: '#17263c' }]
                }
            ];
        } else {
            return [
                {
                    featureType: 'poi.business',
                    stylers: [{ visibility: 'off' }]
                },
                {
                    featureType: 'poi.medical',
                    stylers: [{ visibility: 'on' }]
                },
                {
                    featureType: 'poi.school',
                    stylers: [{ visibility: 'on' }]
                },
                {
                    featureType: 'poi.government',
                    stylers: [{ visibility: 'on' }]
                },
                {
                    featureType: 'transit.station',
                    stylers: [{ visibility: 'simplified' }]
                },
                {
                    featureType: 'water',
                    elementType: 'geometry',
                    stylers: [{ color: '#16bcb8' }]
                }
            ];
        }
    }

    // Update map theme
    updateTheme(theme) {
        if (!this.isInitialized) return;
        
        this.currentTheme = theme;
        this.map.setOptions({ styles: this.getMapStyles(theme) });
    }

    // Get current theme
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    // Add marker
    addMarker(id, position, options = {}) {
        const defaultOptions = {
            position,
            map: this.map,
            icon: this.getMarkerIcon(options.type || 'default'),
            title: options.title || '',
            animation: google.maps.Animation.DROP
        };

        const marker = new google.maps.Marker({ ...defaultOptions, ...options });
        this.markers.set(id, marker);

        // Add click listener
        if (options.onClick || options.infoContent) {
            marker.addListener('click', () => {
                if (options.onClick) {
                    options.onClick(marker);
                }
                if (options.infoContent) {
                    this.showInfoWindow(marker, options.infoContent);
                }
            });
        }

        return marker;
    }

    // Remove marker
    removeMarker(id) {
        const marker = this.markers.get(id);
        if (marker) {
            marker.setMap(null);
            this.markers.delete(id);
        }
    }

    // Update marker position
    updateMarker(id, position, animate = true) {
        const marker = this.markers.get(id);
        if (marker) {
            if (animate) {
                this.animateMarkerTo(marker, position);
            } else {
                marker.setPosition(position);
            }
        }
    }

    // Animate marker movement
    animateMarkerTo(marker, newPosition) {
        const start = marker.getPosition();
        const end = new google.maps.LatLng(newPosition.lat, newPosition.lng);
        
        let step = 0;
        const numSteps = 50;
        const stepLat = (end.lat() - start.lat()) / numSteps;
        const stepLng = (end.lng() - start.lng()) / numSteps;

        const animate = () => {
            step++;
            const lat = start.lat() + (stepLat * step);
            const lng = start.lng() + (stepLng * step);
            
            marker.setPosition(new google.maps.LatLng(lat, lng));
            
            if (step < numSteps) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    // Get marker icons
    getMarkerIcon(type) {
        const icons = {
            user: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#16bcb8',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3
            },
            family: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: '#4c5377',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
            },
            safe: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: '#18a05e',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
            },
            warning: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: '#e2a100',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
            },
            danger: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: '#d64545',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
            }
        };
        
        return icons[type] || icons.user;
    }

    // Add safety circle
    addSafetyCircle(id, center, radius, options = {}) {
        const defaultOptions = {
            center,
            radius,
            map: this.map,
            fillColor: '#18a05e',
            fillOpacity: 0.1,
            strokeColor: '#18a05e',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            strokeDasharray: [10, 5]
        };

        const circle = new google.maps.Circle({ ...defaultOptions, ...options });
        this.circles.set(id, circle);
        
        return circle;
    }

    // Remove circle
    removeCircle(id) {
        const circle = this.circles.get(id);
        if (circle) {
            circle.setMap(null);
            this.circles.delete(id);
        }
    }

    // Update circle
    updateCircle(id, options) {
        const circle = this.circles.get(id);
        if (circle) {
            circle.setOptions(options);
        }
    }

    // Show info window
    showInfoWindow(marker, content) {
        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
    }

    // Hide info window
    hideInfoWindow() {
        this.infoWindow.close();
    }

    // Center map on location
    centerOn(position, zoom = null) {
        if (!this.isInitialized) return;
        
        this.map.setCenter(position);
        if (zoom !== null) {
            this.map.setZoom(zoom);
        }
    }

    // Fit bounds to include all markers
    fitToMarkers() {
        if (this.markers.size === 0) return;
        
        const bounds = new google.maps.LatLngBounds();
        this.markers.forEach(marker => {
            bounds.extend(marker.getPosition());
        });
        
        this.map.fitBounds(bounds);
    }

    // Get current map bounds
    getBounds() {
        return this.map.getBounds();
    }

    // Get current map center
    getCenter() {
        return this.map.getCenter();
    }

    // Get current zoom level
    getZoom() {
        return this.map.getZoom();
    }

    // Setup event listeners
    setupEventListeners() {
        // Theme change listener
        document.addEventListener('themeChanged', (e) => {
            this.updateTheme(e.detail.theme);
        });

        // Map click listener
        this.map.addListener('click', (event) => {
            this.hideInfoWindow();
            this.onMapClick(event);
        });

        // Map bounds change listener
        this.map.addListener('bounds_changed', () => {
            this.onBoundsChanged();
        });
    }

    // Event handlers (can be overridden)
    onMapClick(event) {
        console.log('Map clicked at:', event.latLng.lat(), event.latLng.lng());
    }

    onBoundsChanged() {
        // Handle bounds change
    }

    // Utility methods
    distanceBetween(pos1, pos2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.degreesToRadians(pos2.lat - pos1.lat);
        const dLng = this.degreesToRadians(pos2.lng - pos1.lng);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.degreesToRadians(pos1.lat)) * 
                  Math.cos(this.degreesToRadians(pos2.lat)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // Distance in meters
    }

    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Cleanup
    destroy() {
        this.markers.forEach(marker => marker.setMap(null));
        this.circles.forEach(circle => circle.setMap(null));
        this.markers.clear();
        this.circles.clear();
        
        if (this.infoWindow) {
            this.infoWindow.close();
        }
        
        this.map = null;
        this.isInitialized = false;
    }
}

// Global map instance
window.Maps = new Maps();

// Global initialization function for Google Maps callback
window.initializeMap = function() {
    console.log('Google Maps API loaded');
    // Maps will be initialized when needed
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Maps;
}
