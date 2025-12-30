// TomoTrip Conditional Logger - Replit IDE noise suppression
import { APP_CONFIG } from '../../../env/app-config.mjs';

// Check if running in top window (not in Replit preview iframe)
const isTopWindow = window.top === window.self;

// Determine if logging should be allowed
function canLog() {
    if (!APP_CONFIG.DEBUG_LOG) return false;          // Debug logs disabled by default
    if (!isTopWindow && !APP_CONFIG.ALLOW_IFRAME_LOG) return false; // Suppress iframe logs
    return true;
}

// Export conditional logging functions
export const log = {
    info: (...args) => { if (canLog()) console.info(...args); },
    warn: (...args) => { if (canLog()) console.warn(...args); },
    error: (...args) => { if (canLog()) console.error(...args); },
    debug: (...args) => { if (canLog()) console.log(...args); },
    ok: (...args) => { if (canLog()) console.log('%c✅', 'color: #28a745;', ...args); }
};

// Environment detection helper
export const isIframe = !isTopWindow;
export const isProduction = !APP_CONFIG.DEBUG_LOG;
export const shouldSuppressLogs = isIframe || isProduction;