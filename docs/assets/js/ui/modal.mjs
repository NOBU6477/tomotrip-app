// Modal utilities - Bootstrap integration with safety checks

// Bootstrap safety check
function getBootstrap() {
    if (typeof window !== 'undefined' && window.bootstrap?.Modal) {
        return window.bootstrap;
    }
    console.warn('Bootstrap Modal not available - modal actions will be skipped');
    return null;
}

// Element existence check
function ensureElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Modal element #${id} not found in DOM`);
    }
    return element;
}

// Show sponsor login modal
export function showSponsorLoginModal() {
    const bs = getBootstrap();
    const element = ensureElement('sponsorLoginModal');
    
    if (!bs || !element) {
        console.warn('Cannot show login modal - Bootstrap or element missing');
        return;
    }

    try {
        const modal = new bs.Modal(element, { 
            backdrop: 'static', 
            keyboard: false 
        });
        modal.show();
        console.log('%cLogin modal shown', 'color: #007bff;');
    } catch (error) {
        console.error('Failed to show login modal:', error);
    }
}

// Show sponsor registration modal
export function showSponsorRegistrationModal() {
    const bs = getBootstrap();
    const element = ensureElement('sponsorRegistrationModal');
    
    if (!bs || !element) {
        console.warn('Cannot show registration modal - Bootstrap or element missing');
        return;
    }

    try {
        const modal = new bs.Modal(element, { 
            backdrop: 'static', 
            keyboard: false 
        });
        modal.show();
        console.log('%cRegistration modal shown', 'color: #007bff;');
    } catch (error) {
        console.error('Failed to show registration modal:', error);
    }
}

// Hide modal by ID
export function hideModal(modalId) {
    const bs = getBootstrap();
    const element = ensureElement(modalId);
    
    if (!bs || !element) return;

    try {
        const modal = bs.Modal.getInstance(element);
        if (modal) {
            modal.hide();
        }
    } catch (error) {
        console.error(`Failed to hide modal ${modalId}:`, error);
    }
}