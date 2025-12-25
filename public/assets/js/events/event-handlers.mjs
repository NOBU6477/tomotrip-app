// Event handlers - centralized setup with AppState support
import { showSponsorLoginModal, showSponsorRegistrationModal } from '../ui/modal.mjs';
import { createGuideCardHTML } from '../ui/guide-renderer.mjs';
import { getText } from '../utils/language-utils.mjs';
import { normalizeLocationToCode, compareLocations, convertPrefectureNameToCode } from '../utils/location-utils.mjs';

// 言語切替機能
export function wireLanguageSwitcher() {
    const langToggle = document.getElementById('languageToggle');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            const currentPath = window.location.pathname;
            const isEnglish = currentPath.includes('-en.html') || currentPath.includes('index-en.html');
            const newPath = isEnglish ? 'index.html' : 'index-en.html';
            window.location.href = newPath;
        });
    }
}

// スポンサーボタンの設定
export function wireSponsorButtons() {
    const sponsorLoginBtn = document.getElementById('sponsorLoginBtn');
    if (sponsorLoginBtn) {
        sponsorLoginBtn.addEventListener('click', () => showSponsorLoginModal());
    }
    const sponsorRegBtn = document.getElementById('sponsorRegBtn');
    if (sponsorRegBtn) {
        sponsorRegBtn.addEventListener('click', () => showSponsorRegistrationModal());
    }
}

// Show tourist registration prompt
function showTouristRegistrationPrompt(guideId) {
    sessionStorage.setItem('returnToGuideId', guideId);
    const msg = getText(
        'ガイド詳細をご覧いただくには観光客登録が必要です。\n\n登録は無料で、安全にガイドとやり取りできます。\n今すぐ登録ページに移動しますか？',
        'Tourist registration is required to view guide details.\n\nRegistration is free and allows you to safely communicate with guides.\nWould you like to go to the registration page now?'
    );
    const shouldRedirect = confirm(msg);
    if (shouldRedirect) {
        const isEnglish = window.location.pathname.includes('-en.html');
        const registrationPage = isEnglish ? 'tourist-registration-simple-en.html' : 'tourist-registration-simple.html';
        window.location.href = registrationPage;
    }
}

// Global guide detail function
export async function showGuideDetailModalById(guideId) {
    const touristAuth = sessionStorage.getItem('touristAuth');
    const touristAuthTimestamp = sessionStorage.getItem('touristAuthTimestamp');
    const isAuthValid = touristAuth && touristAuthTimestamp &&
        (Date.now() - parseInt(touristAuthTimestamp)) < (60 * 60 * 1000);

    if (!isAuthValid) {
        showTouristRegistrationPrompt(guideId);
        return;
    }

    try {
        const isEnglish = window.location.pathname.includes('-en.html');
        const detailPage = isEnglish ? 'guide-detail-en.html' : 'guide-detail.html';
        const detailUrl = `${detailPage}?id=${guideId}`;
        window.open(detailUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    } catch (error) {
        console.error('❌ Error opening guide details:', error);
        alert(getText('ガイド詳細を開けませんでした。', 'Could not open guide details.'));
    }
}

// Make globally available
window.showGuideDetailModalById = showGuideDetailModalById;
window.redirectToRegistration = function(guideId) {
    sessionStorage.setItem('returnToGuideId', guideId);
    const isEnglish = window.location.pathname.includes('-en.html');
    const registrationPage = isEnglish ? 'tourist-registration-simple-en.html' : 'tourist-registration-simple.html';
    window.location.href = registrationPage;
};

function normalizeLanguage(selectedValue) {
    const languageMapping = {
        'japanese': ['japanese', 'ja', '日本語', 'japan'],
        'english': ['english', 'en', '英語', 'eng'],
        'chinese': ['chinese', 'zh', '中国語', 'chn'],
        'korean': ['korean', 'ko', '韓国語', 'kor']
    };
    return languageMapping[selectedValue] || [selectedValue];
}

// Search and Filter
export async function filterGuides() {
    const state = window.AppState;
    if (!state || !state.guides) return;

    state.currentPage = 1;
    const locVal = document.getElementById('locationFilter')?.value || '';
    const langVal = document.getElementById('languageFilter')?.value || '';
    const priceVal = document.getElementById('priceFilter')?.value || '';
    const keyword = document.getElementById('keywordInput')?.value?.trim().toLowerCase() || '';

    let results = [...state.guides];

    if (locVal) {
        results = results.filter(g => g.location === locVal || convertPrefectureNameToCode(locVal) === g.location || compareLocations(g.location, locVal));
    }
    if (langVal) {
        const norms = normalizeLanguage(langVal);
        results = results.filter(g => Array.isArray(g.languages) && g.languages.some(l => norms.some(n => l.toLowerCase().includes(n.toLowerCase()))));
    }
    if (priceVal) {
        results = results.filter(g => {
            const p = parseInt(g.sessionRate || g.price || '0', 10);
            if (priceVal === 'budget') return p >= 6000 && p <= 10000;
            if (priceVal === 'premium') return p >= 10001 && p <= 20000;
            if (priceVal === 'luxury') return p >= 20001;
            return true;
        });
    }
    if (keyword) {
        results = results.filter(g => `${g.name} ${g.guideName} ${g.introduction}`.toLowerCase().includes(keyword));
    }

    state.filteredGuides = results;
    state.isFiltered = true;

    if (window.renderGuideCards) window.renderGuideCards(results, true, true);
}

window.resetFilters = function() {
    const state = document.getElementById('locationFilter');
    const lang = document.getElementById('languageFilter');
    const price = document.getElementById('priceFilter');
    const key = document.getElementById('keywordInput');
    if (state) state.value = '';
    if (lang) lang.value = '';
    if (price) price.value = '';
    if (key) key.value = '';
    
    const appState = window.AppState;
    if (!appState || !appState.originalGuides) return;
    appState.guides = [...appState.originalGuides];
    appState.isFiltered = false;
    appState.currentPage = 1;
    if (window.renderGuideCards) window.renderGuideCards(appState.guides, true, true);
};

export function setupEventListeners(state) {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            filterGuides();
        });
    }

    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.resetFilters();
        });
    }
}
