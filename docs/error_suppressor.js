// Complete error suppression for Replit interface errors
// Network error handling for ERR_NETWORK_CHANGED
window.addEventListener('error', function(e) {
    if (e.message && e.message.includes('ERR_NETWORK_CHANGED')) {
        console.log('🔄 Network changed, implementing retry logic...');
        setTimeout(() => {
            if (window.location.pathname === '/') {
                window.location.reload();
            }
        }, 2000);
        return;
    }
});

(function() {
    'use strict';
    
    // Disable Service Worker completely to prevent sw.js 404 errors
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
            }
        });
    }
    
    // Override all console methods to suppress Replit errors
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
    };
    
    const suppressedTerms = [
        'Could not find run command',
        'run command',
        'LaunchDarkly',
        'workspace_iframe',
        'Failed to load resource',

        'iframe',
        'replit.com',
        'stalwart',
        'WebGL',
        'GroupMarkerNotSet',
        'Unrecognized feature',
        'CenterDisplay',
        'crbug.com',
        'webglcontextlost',
        'enable-unsafe-swiftshader',
        'software WebGL',

        'WebSocket connection to',
        'net::ERR_NETWORK_IO_SUSPENDED',
        'Uncaught (in promise) Timeout',
        'Allow attribute will take precedence',
        'Automatic fallback to software WebGL',
        'A0203000D4200000',
        'A0F02F00D4200000',
        'A0502F00D4200000',
        'eval.kirk.platform.replit.com',
        'graphql_subscriptions',
        'events.launchdarkly',
        'sp.replit.com/v1/isi',
        'stallwart: failed ping',
        'ambient-light-sensor',
        'battery',
        'execution-while-not-rendered',
        'execution-while-out-of-viewport',
        'layout-animations',
        'legacy-image-formats',
        'navigation-override',
        'oversized-images',
        'publickey-credentials',
        'speaker-selection',
        'unoptimized-images',
        'unsized-media',
        'pointer-lock',
        'allow-downloads-without-user-activation',
        'sandbox',
        'beacon.js',
        'frame-ancestors',
        'The CSP directive'
    ];
    
    function shouldSuppress(message) {
        const msgStr = String(message || '');
        return suppressedTerms.some(term => msgStr.includes(term));
    }
    
    console.error = function(...args) {
        if (!shouldSuppress(args[0])) {
            originalConsole.error.apply(console, args);
        }
    };
    
    console.warn = function(...args) {
        if (!shouldSuppress(args[0])) {
            originalConsole.warn.apply(console, args);
        }
    };
    
    // Suppress window error events
    window.addEventListener('error', function(e) {
        if (shouldSuppress(e.message)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
    
    // Suppress unhandled promise rejections
    window.addEventListener('unhandledrejection', function(e) {
        if (shouldSuppress(e.reason)) {
            e.preventDefault();
            return false;
        }
    });
    
})();