// Event handlers - centralized setup with AppState support
import { showSponsorLoginModal, showSponsorRegistrationModal } from '../ui/modal.mjs';
import { createGuideCardHTML } from '../ui/guide-renderer.mjs';
import { getText } from '../utils/language-utils.mjs';
import { normalizeLocationToCode, compareLocations, convertPrefectureNameToCode } from '../utils/location-utils.mjs';

// 検索結果を保存するグローバル配列
let filteredGuides = [];

// 言語切替機能（app-init.mjsから要求されるため追加）
export function wireLanguageSwitcher() {
    console.log('🌐 Language switcher wired');
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

// スポンサーボタンの設定（app-init.mjsから要求されるため追加）
export function wireSponsorButtons() {
    console.log('🏢 Sponsor buttons wired');
    const sponsorLoginBtn = document.getElementById('sponsorLoginBtn');
    if (sponsorLoginBtn) {
        sponsorLoginBtn.addEventListener('click', () => showSponsorLoginModal());
    }
    const sponsorRegBtn = document.getElementById('sponsorRegBtn');
    if (sponsorRegBtn) {
        sponsorRegBtn.addEventListener('click', () => showSponsorRegistrationModal());
    }
}

// Global guide detail function – opens guide detail page with auth check
async function showGuideDetailModalById(guideId) {
    console.log('🔍 Opening guide detail for ID:', guideId);

    // Check tourist authentication status
    const touristAuth = sessionStorage.getItem('touristAuth');
    const touristAuthTimestamp = sessionStorage.getItem('touristAuthTimestamp');

    // Check if auth exists and is not too old (1 hour limit)
    const isAuthValid = touristAuth && touristAuthTimestamp &&
        (Date.now() - parseInt(touristAuthTimestamp)) < (60 * 60 * 1000);

    if (!isAuthValid) {
        console.log('❌ Tourist not authenticated or auth expired - showing registration prompt');
        showTouristRegistrationPrompt(guideId);
        return;
    }

    console.log('✅ Tourist authenticated - proceeding to guide details');

    try {
        // Detect current page language and use appropriate detail page
        const isEnglish = window.location.pathname.includes('-en.html');
        const detailPage = isEnglish ? 'guide-detail-en.html' : 'guide-detail.html';
        const detailUrl = `${detailPage}?id=${guideId}`;

        console.log(`🌐 Detected language: ${isEnglish ? 'English' : 'Japanese'}, opening ${detailPage}`);
        window.open(detailUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

    } catch (error) {
        console.error('❌ Error opening guide details:', error);
        const errorMsg = getText('ガイド詳細を開けませんでした。もう一度お試しください。', 'Could not open guide details. Please try again.');
        alert(errorMsg);
    }
}

// Show tourist registration prompt - redirect to new registration system
function showTouristRegistrationPrompt(guideId) {
    // Store guide ID for return after registration
    sessionStorage.setItem('returnToGuideId', guideId);

    // Show simple alert and redirect to complete registration system
    const msg = getText(
        'ガイド詳細をご覧いただくには観光客登録が必要です。\n\n登録は無料で、安全にガイドとやり取りできます。\n今すぐ登録ページに移動しますか？',
        'Tourist registration is required to view guide details.\n\nRegistration is free and allows you to safely communicate with guides.\nWould you like to go to the registration page now?'
    );
    const shouldRedirect = confirm(msg);

    if (shouldRedirect) {
        // Detect current page language and redirect to appropriate registration page
        const isEnglish = window.location.pathname.includes('-en.html');
        const registrationPage = isEnglish ? 'tourist-registration-simple-en.html' : 'tourist-registration-simple.html';

        console.log(`🌐 Redirecting to ${registrationPage}`);
        window.location.href = registrationPage;
    }
}

// Make function globally available
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
        'chinese_traditional': ['chinese', 'zh-tw', '中国語（繁体）', '繁体中文'],
        'korean': ['korean', 'ko', '韓国語', 'kor'],
        'thai': ['thai', 'th', 'タイ語'],
        'vietnamese': ['vietnamese', 'vi', 'ベトナム語'],
        'indonesian': ['indonesian', 'id', 'インドネシア語'],
        'tagalog': ['tagalog', 'tl', 'タガログ語'],
        'hindi': ['hindi', 'hi', 'ヒンディー語'],
        'spanish': ['spanish', 'es', 'スペイン語'],
        'french': ['french', 'fr', 'フランス語'],
        'german': ['german', 'de', 'ドイツ語'],
        'italian': ['italian', 'it', 'イタリア語'],
        'portuguese': ['portuguese', 'pt', 'ポルトガル語'],
        'russian': ['russian', 'ru', 'ロシア語'],
        'arabic': ['arabic', 'ar', 'アラビア語'],
        '日本語': ['japanese', 'ja', '日本語', 'japan'],
        '英語': ['english', 'en', '英語', 'eng'],
        '中国語': ['chinese', 'zh', '中国語', 'chn'],
        '韓国語': ['korean', 'ko', '韓国語', 'kor']
    };
    return languageMapping[selectedValue] || [selectedValue];
}

// ✅ 修正: executeSearchを使用するfilterGuides関数
export async function filterGuides() {
    console.log('🔍 Running guide filters via executeSearch...');

    if (window.executeSearch && typeof window.executeSearch === 'function') {
        try {
            await window.executeSearch();
            return;
        } catch (error) {
            console.error('❌ executeSearch failed, falling back to legacy filter:', error);
        }
    }

    const state = window.AppState;
    if (!state || !state.guides || state.guides.length === 0) {
        console.warn('❌ No guides available for filtering.');
        return;
    }

    if (state.currentPage && state.currentPage > 1) {
        state.currentPage = 1;
    }

    const locationFilter = document.getElementById('locationFilter');
    const languageFilter = document.getElementById('languageFilter');
    const priceFilter = document.getElementById('priceFilter');
    const keywordInput = document.getElementById('keywordInput');

    const selectedLocation = locationFilter?.value || '';
    const selectedLanguage = languageFilter?.value || '';
    const selectedPrice = priceFilter?.value || '';
    const keyword = keywordInput?.value?.trim().toLowerCase() || '';

    let currentFilteredGuides = [...state.guides];

    if (selectedLocation) {
        currentFilteredGuides = currentFilteredGuides.filter(guide => {
            const guideLocation = guide.location || '';
            const matches = guideLocation === selectedLocation || 
                          convertPrefectureNameToCode(selectedLocation) === guideLocation ||
                          guideLocation.toLowerCase().includes(selectedLocation.toLowerCase()) ||
                          compareLocations(guideLocation, selectedLocation);
            return matches;
        });
    }

    if (selectedLanguage) {
        currentFilteredGuides = currentFilteredGuides.filter(guide => {
            const languages = guide.languages || [];
            const normalizedLanguages = normalizeLanguage(selectedLanguage);
            if (Array.isArray(languages)) {
                return languages.some(lang => normalizedLanguages.some(mapped => 
                    lang.toLowerCase().includes(mapped.toLowerCase()) || mapped.toLowerCase().includes(lang.toLowerCase())
                ));
            }
            return false;
        });
    }

    if (selectedPrice) {
        currentFilteredGuides = currentFilteredGuides.filter(guide => {
            const price = parseInt(guide.sessionRate || guide.price || '0', 10) || 0;
            switch (selectedPrice) {
                case 'budget': return price >= 6000 && price <= 10000;
                case 'premium': return price >= 10001 && price <= 20000;
                case 'luxury': return price >= 20001;
                default: return true;
            }
        });
    }

    if (keyword) {
        currentFilteredGuides = currentFilteredGuides.filter(guide => {
            const searchText = `${guide.name} ${guide.guideName} ${guide.introduction} ${guide.location}`.toLowerCase();
            return searchText.includes(keyword);
        });
    }

    state.filteredGuides = currentFilteredGuides;
    state.isFiltered = true;
    state.currentPage = 1;

    if (window.renderGuideCards) {
        window.renderGuideCards(currentFilteredGuides, true, true);
    }

    if (window.updateGuideCounters) {
        window.updateGuideCounters(currentFilteredGuides.length, state.originalGuides?.length || state.guides.length);
    }
}

window.resetFilters = function() {
    console.log('🔄 Resetting all filters...');
    const locationFilter = document.getElementById('locationFilter');
    const languageFilter = document.getElementById('languageFilter');
    const priceFilter = document.getElementById('priceFilter');
    const keywordInput = document.getElementById('keywordInput');

    if (locationFilter) locationFilter.value = '';
    if (languageFilter) languageFilter.value = '';
    if (priceFilter) priceFilter.value = '';
    if (keywordInput) keywordInput.value = '';

    if (window.AppState && window.AppState.originalGuides) {
        window.AppState.guides = [...window.AppState.originalGuides];
        window.AppState.isFiltered = false;
        window.AppState.filteredGuides = null;
        window.AppState.currentPage = 1;
        if (window.renderGuideCards) {
            window.renderGuideCards(window.AppState.guides, true, true);
        }
    }
};

export function setupEventListeners(state) {
    console.log('🔧 Setting up event listeners...');
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
