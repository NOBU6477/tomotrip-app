// Build ID external script - CSP compliant
window.APP_BUILD_ID = 'TomoTrip-v2026.01.16-PAGINATION-FIX';
console.info('%c[TomoTrip] BUILD ID:', 'color: #ff6b35; font-weight: bold;', window.APP_BUILD_ID, 'Host:', location.host);

// Environment type detection
const envType = location.hostname === 'localhost' ? 'LOCAL' : 
               location.host.includes('.replit.dev') ? 'REPLIT-DEV' : 
               location.host.includes('replit.com') ? 'REPLIT-PREVIEW' : 'PRODUCTION';

console.info('%c[Environment]:', 'color: #007bff;', envType, location.href);