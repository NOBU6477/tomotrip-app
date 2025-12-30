// Service Worker and Cache Cleanup Script
// Run this in console of both editor and separate tab to sync environments

console.log('🧹 Starting complete Service Worker and cache cleanup...');

// Clear all service workers
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('Found', registrations.length, 'service worker registrations');
        registrations.forEach(registration => registration.unregister());
        console.log('✅ All Service Workers unregistered');
    });
} else {
    console.log('✅ No Service Worker support');
}

// Clear all caches
caches.keys().then(cacheNames => {
    console.log('Found', cacheNames.length, 'caches to clear');
    return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}).then(() => {
    console.log('✅ All caches cleared');
});

// Clear storage
localStorage.clear();
sessionStorage.clear();
console.log('✅ localStorage and sessionStorage cleared');

// Force reload after cleanup
setTimeout(() => {
    console.log('🔄 Reloading page...');
    location.reload(true);
}, 1000);