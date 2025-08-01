// Service Worker for Mounjaro Tracker PWA
// Provides offline functionality and caching

const CACHE_NAME = 'mounjaro-tracker-v1';
const STATIC_CACHE_NAME = 'mounjaro-static-v1';
const DATA_CACHE_NAME = 'mounjaro-data-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  './',
  './index.html',
  './styles/main.css',
  './styles/mobile.css',
  './js/app.js',
  './js/data.js',
  './js/charts.js',
  './js/import.js',
  './js/utils.js',
  './manifest.json'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DATA_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached files or fetch from network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (url.origin === location.origin) {
    // Same-origin requests
    if (request.destination === 'document') {
      // HTML documents - network first, fallback to cache
      event.respondWith(networkFirstStrategy(request));
    } else {
      // Static assets - cache first
      event.respondWith(cacheFirstStrategy(request));
    }
  } else {
    // External requests - network only
    event.respondWith(fetch(request));
  }
});

// Network first strategy (for HTML documents)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: Network request failed, trying cache');
  }
  
  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cache, return offline page or error
  return new Response('Offline - App not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain'
    })
  });
}

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch resource', request.url, error);
    
    // Return a fallback response for failed requests
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Background sync for data persistence
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('Service Worker: Syncing offline data...');
    
    // Get pending data from IndexedDB or cache
    const pendingData = await getPendingData();
    
    if (pendingData && pendingData.length > 0) {
      // Process pending data
      for (const item of pendingData) {
        try {
          await processDataItem(item);
          await removePendingDataItem(item.id);
        } catch (error) {
          console.error('Service Worker: Failed to sync data item', item, error);
        }
      }
      
      // Notify clients about successful sync
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'DATA_SYNCED',
          count: pendingData.length
        });
      });
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Get pending data (placeholder - would use IndexedDB in real implementation)
async function getPendingData() {
  // This would typically read from IndexedDB
  // For now, return empty array
  return [];
}

// Process individual data item
async function processDataItem(item) {
  // This would typically send data to a server
  console.log('Service Worker: Processing data item', item);
}

// Remove processed data item
async function removePendingDataItem(id) {
  // This would typically remove from IndexedDB
  console.log('Service Worker: Removing processed data item', id);
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'Time for your Mounjaro dose!',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-96x96.png',
    tag: 'medication-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'log-medication',
        title: 'Log Medication',
        icon: './icons/icon-96x96.png'
      },
      {
        action: 'snooze',
        title: 'Remind Later',
        icon: './icons/icon-96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Mounjaro Reminder', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  const { action, notification } = event;
  
  event.notification.close();
  
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window' });
      
      if (action === 'log-medication') {
        // Open app to medication tab
        const urlToOpen = new URL('./#medication', self.location.origin).href;
        
        const existingClient = clients.find(client => 
          client.url === urlToOpen || client.url === self.location.origin
        );
        
        if (existingClient) {
          await existingClient.focus();
          existingClient.postMessage({ type: 'OPEN_MEDICATION_TAB' });
        } else {
          await self.clients.openWindow(urlToOpen);
        }
      } else if (action === 'snooze') {
        // Schedule another notification (would need backend support)
        console.log('Service Worker: Snoozing notification');
      } else {
        // Default action - open the app
        const urlToOpen = new URL('./', self.location.origin).href;
        
        const existingClient = clients.find(client => 
          client.url.startsWith(self.location.origin)
        );
        
        if (existingClient) {
          await existingClient.focus();
        } else {
          await self.clients.openWindow(urlToOpen);
        }
      }
    })()
  );
});

// Message handling from main app
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  console.log('Service Worker: Message received', type, data);
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_DATA':
      // Cache important data
      cacheData(data);
      break;
      
    case 'REQUEST_SYNC':
      // Request background sync
      self.registration.sync.register('background-sync-data');
      break;
      
    default:
      console.log('Service Worker: Unknown message type', type);
  }
});

// Cache important data
async function cacheData(data) {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/cached-data', response);
    console.log('Service Worker: Data cached successfully');
  } catch (error) {
    console.error('Service Worker: Failed to cache data', error);
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'data-backup') {
    event.waitUntil(performDataBackup());
  }
});

// Perform periodic data backup
async function performDataBackup() {
  try {
    console.log('Service Worker: Performing periodic data backup');
    
    // Get current data from cache or storage
    const cache = await caches.open(DATA_CACHE_NAME);
    const response = await cache.match('/cached-data');
    
    if (response) {
      const data = await response.json();
      
      // Perform backup operations
      console.log('Service Worker: Backing up data', data);
      
      // This would typically send data to a backup service
    }
  } catch (error) {
    console.error('Service Worker: Periodic backup failed', error);
  }
}

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker: Error occurred', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Unhandled promise rejection', event.reason);
});

console.log('Service Worker: Script loaded');