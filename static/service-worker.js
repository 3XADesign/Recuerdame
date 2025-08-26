/**
 * Service Worker para RecuerdaMe
 * Maneja caché, notificaciones y funcionalidad offline
 */

const CACHE_NAME = 'recuerdame-v1.0.0';
const STATIC_CACHE_NAME = 'recuerdame-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'recuerdame-dynamic-v1.0.0';

// Archivos para cachear inmediatamente
const STATIC_FILES = [
    '/',
    '/static/css/00-tokens.css',
    '/static/css/01-base.css',
    '/static/css/02-layout.css',
    '/static/css/03-components/buttons.css',
    '/static/css/03-components/cards.css',
    '/static/css/03-components/forms.css',
    '/static/css/03-components/modals.css',
    '/static/css/03-components/navigation.css',
    '/static/css/04-pages/onboarding.css',
    '/static/css/04-pages/home.css',
    '/static/css/04-pages/memories.css',
    '/static/css/04-pages/map.css',
    '/static/css/dark.css',
    '/static/js/app.js',
    '/static/js/ui.js',
    '/static/js/api.js',
    '/static/js/auth.js',
    '/static/js/location.js',
    '/static/js/maps.js',
    '/static/js/fcm.js',
    '/static/icons/icon-192x192.png',
    '/static/icons/icon-512x512.png',
    '/static/manifest.json',
    '/onboarding',
    '/home'
];

// URLs que siempre deben ir a la red
const NETWORK_ONLY = [
    '/api/',
    '/auth/',
    '/admin/'
];

// URLs que pueden funcionar offline con caché
const CACHE_FIRST = [
    '/static/',
    '/icons/',
    '/images/'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Eliminar cachés antiguos
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName.startsWith('recuerdame-')) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorar requests no GET
    if (request.method !== 'GET') {
        return;
    }
    
    // Ignorar requests a otros dominios
    if (url.origin !== location.origin) {
        return;
    }
    
    // Estrategia de caché basada en la URL
    if (isNetworkOnly(url.pathname)) {
        // Solo red para APIs
        event.respondWith(networkOnly(request));
    } else if (isCacheFirst(url.pathname)) {
        // Caché primero para assets estáticos
        event.respondWith(cacheFirst(request));
    } else {
        // Network first para páginas
        event.respondWith(networkFirst(request));
    }
});

// Manejo de notificaciones push
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push message received');
    
    let data = {};
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'RecuerdaMe', body: event.data.text() };
        }
    }
    
    const options = {
        title: data.title || 'RecuerdaMe',
        body: data.body || 'Nueva notificación',
        icon: data.icon || '/static/icons/icon-192x192.png',
        badge: '/static/icons/badge-72x72.png',
        image: data.image,
        data: data.data || {},
        tag: data.tag || 'default',
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [],
        vibrate: data.vibrate || [200, 100, 200],
        timestamp: Date.now()
    };
    
    event.waitUntil(
        self.registration.showNotification(options.title, options)
    );
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');
    
    const notification = event.notification;
    const data = notification.data;
    
    notification.close();
    
    let url = '/';
    
    // Determinar URL según el tipo de notificación
    if (data.type === 'memory_reminder' && data.memoryId) {
        url = `/memory/${data.memoryId}`;
    } else if (data.type === 'location_alert') {
        url = '/map';
    } else if (data.type === 'family_invitation') {
        url = '/family/join';
    } else if (data.url) {
        url = data.url;
    }
    
    // Abrir o enfocar ventana
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Buscar ventana abierta con la URL
                for (const client of clientList) {
                    if (client.url.includes(url) && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Abrir nueva ventana
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// Manejo de acciones de notificación
self.addEventListener('notificationaction', (event) => {
    console.log('Service Worker: Notification action clicked', event.action);
    
    const notification = event.notification;
    const data = notification.data;
    
    notification.close();
    
    // Manejar acciones específicas
    switch (event.action) {
        case 'view':
            event.waitUntil(handleViewAction(data));
            break;
        case 'dismiss':
            // Solo cerrar la notificación
            break;
        case 'reply':
            event.waitUntil(handleReplyAction(data));
            break;
        default:
            event.waitUntil(handleDefaultAction(data));
    }
});

// Manejo de sincronización en background
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync', event.tag);
    
    if (event.tag === 'background-location-sync') {
        event.waitUntil(syncLocationData());
    } else if (event.tag === 'background-memory-sync') {
        event.waitUntil(syncMemoryData());
    }
});

// Manejo de compartir archivos
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    if (url.pathname === '/share-target' && event.request.method === 'POST') {
        event.respondWith(handleShareTarget(event.request));
    }
});

// Estrategias de caché

// Solo red
async function networkOnly(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.error('Network request failed:', error);
        throw error;
    }
}

// Caché primero
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        if (networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache first failed:', error);
        
        // Fallback a caché si falla la red
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Red primero
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Network first failed, trying cache:', error);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback para páginas principales
        if (request.destination === 'document') {
            const fallbackResponse = await caches.match('/');
            if (fallbackResponse) {
                return fallbackResponse;
            }
        }
        
        throw error;
    }
}

// Utilidades

function isNetworkOnly(pathname) {
    return NETWORK_ONLY.some(pattern => pathname.startsWith(pattern));
}

function isCacheFirst(pathname) {
    return CACHE_FIRST.some(pattern => pathname.startsWith(pattern));
}

// Handlers de notificaciones

async function handleViewAction(data) {
    let url = data.url || '/';
    
    const clients = await self.clients.matchAll({ type: 'window' });
    
    for (const client of clients) {
        if (client.url.includes(url)) {
            return client.focus();
        }
    }
    
    return self.clients.openWindow(url);
}

async function handleReplyAction(data) {
    // TODO: Implementar respuesta rápida
    console.log('Reply action not implemented yet');
}

async function handleDefaultAction(data) {
    return handleViewAction(data);
}

// Sincronización de datos

async function syncLocationData() {
    try {
        // TODO: Sincronizar datos de ubicación pendientes
        console.log('Syncing location data...');
    } catch (error) {
        console.error('Location sync failed:', error);
    }
}

async function syncMemoryData() {
    try {
        // TODO: Sincronizar recuerdos pendientes
        console.log('Syncing memory data...');
    } catch (error) {
        console.error('Memory sync failed:', error);
    }
}

// Manejo de compartir archivos
async function handleShareTarget(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const title = formData.get('title') || '';
        const text = formData.get('text') || '';
        const url = formData.get('url') || '';
        
        // Redirigir a la página de crear recuerdo con los datos
        const params = new URLSearchParams();
        if (title) params.set('title', title);
        if (text) params.set('description', text);
        if (url) params.set('url', url);
        
        let redirectUrl = '/memories/create';
        if (params.toString()) {
            redirectUrl += '?' + params.toString();
        }
        
        // Si hay archivo, almacenarlo temporalmente
        if (file && file.size > 0) {
            // TODO: Manejar archivo compartido
            console.log('Shared file:', file.name, file.type, file.size);
        }
        
        return Response.redirect(redirectUrl, 302);
    } catch (error) {
        console.error('Share target error:', error);
        return Response.redirect('/memories/create', 302);
    }
}

// Limpieza periódica de caché
setInterval(async () => {
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const requests = await cache.keys();
        
        // Mantener solo los últimos 50 elementos en caché dinámico
        if (requests.length > 50) {
            const requestsToDelete = requests.slice(0, requests.length - 50);
            await Promise.all(
                requestsToDelete.map(request => cache.delete(request))
            );
            console.log('Service Worker: Cleaned old cache entries');
        }
    } catch (error) {
        console.error('Cache cleanup failed:', error);
    }
}, 30 * 60 * 1000); // Cada 30 minutos
