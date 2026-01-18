// Event handlers - centralized setup with AppState support
console.log('✅ LOADED: event-handlers.mjs v=20260118-2');
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

// ✅ 言語正規化マッピング（表記ゆれ吸収）
const LANGUAGE_MAPPING = {
    'japanese': ['日本語', 'japanese', 'ja', 'japan', 'jpn'],
    'english': ['英語', 'english', 'en', 'eng'],
    'chinese': ['中国語', 'chinese', 'zh', 'chn', 'mandarin'],
    'korean': ['韓国語', 'korean', 'ko', 'kor']
};

function normalizeLanguageValue(value) {
    if (!value) return null;
    const lower = String(value).toLowerCase().trim();
    for (const [key, variants] of Object.entries(LANGUAGE_MAPPING)) {
        if (variants.some(v => v.toLowerCase() === lower)) {
            return key;
        }
    }
    return lower;
}

function guideMatchesLanguage(guide, selectedLang) {
    if (!selectedLang) return true;
    const normalizedFilter = normalizeLanguageValue(selectedLang);
    if (!normalizedFilter) return true;
    
    // ✅ guide.languages または guide.guideLanguages を取得
    let languages = guide.languages || guide.guideLanguages || [];
    if (typeof languages === 'string') {
        languages = languages.split(',').map(s => s.trim());
    }
    if (!Array.isArray(languages)) {
        console.log(`[LANG] Guide ${guide.name || guide.guideName} has no languages array`);
        return false;
    }
    
    // 各言語を正規化して比較
    const result = languages.some(lang => {
        const normalizedLang = normalizeLanguageValue(lang);
        return normalizedLang === normalizedFilter;
    });
    
    console.log(`[LANG] Guide: ${guide.name || guide.guideName}, langs: [${languages.join(',')}], filter: ${selectedLang} → ${normalizedFilter}, match: ${result}`);
    
    return result;
}

// ✅ 統合フィルタ関数 - fullGuideListに対してフィルタを適用
export async function filterGuides() {
    console.log('[FILTER] ============ filterGuides() CALLED ============');
    
    const state = window.AppState;
    if (!state) {
        console.error('[FILTER] ERROR: window.AppState is null/undefined');
        return;
    }
    
    // ✅ フィルタ元は必ず fullGuideList（不変のマスターデータ）
    const fullList = state.fullGuideList || state.originalGuides || state.guides || [];
    
    const locVal = document.getElementById('locationFilter')?.value || '';
    const langVal = document.getElementById('languageFilter')?.value || '';
    const priceVal = document.getElementById('priceFilter')?.value || '';
    const keyword = document.getElementById('keywordInput')?.value?.trim().toLowerCase() || '';
    
    // ✅ フィルタ条件をAppStateに保存（30秒リフレッシュ時の再適用用）
    state.activeFilters = { location: locVal, language: langVal, price: priceVal, keyword: keyword };
    
    console.log(`[FILTER] START fullGuideList: ${fullList.length}, lang: "${langVal}", loc: "${locVal}", price: "${priceVal}"`);
    
    let results = [...fullList];
    
    // 地域フィルタ
    if (locVal) {
        results = results.filter(g => 
            g.location === locVal || 
            convertPrefectureNameToCode(locVal) === g.location || 
            compareLocations(g.location, locVal)
        );
    }
    
    // ✅ 言語フィルタ（正規化マッピング使用）
    if (langVal) {
        results = results.filter(g => guideMatchesLanguage(g, langVal));
    }
    
    // 価格フィルタ
    if (priceVal) {
        results = results.filter(g => {
            const p = parseInt(g.sessionRate || g.price || '0', 10);
            if (priceVal === 'budget') return p >= 6000 && p <= 10000;
            if (priceVal === 'premium') return p >= 10001 && p <= 20000;
            if (priceVal === 'luxury') return p >= 20001;
            return true;
        });
    }
    
    // キーワードフィルタ
    if (keyword) {
        results = results.filter(g => 
            `${g.name || ''} ${g.guideName || ''} ${g.introduction || ''}`.toLowerCase().includes(keyword)
        );
    }
    
    const hasActiveFilter = !!(locVal || langVal || priceVal || keyword);
    
    console.log(`[FILTER RESULT] filteredGuides length: ${results.length}, hasActiveFilter: ${hasActiveFilter}`);
    
    // ✅ AppState を更新（guides も更新して他の読み取り箇所との整合性を保つ）
    state.filteredGuides = results;
    state.guides = results; // ✅ CRITICAL: 他のレンダーパスとの整合性のため
    state.isFiltered = hasActiveFilter;
    state.currentPage = 1; // フィルタ後は必ず1ページ目
    
    // ✅ 唯一の描画パス: renderFilteredGuides() を呼び出す（フォールバック付き）
    if (window.renderFilteredGuides) {
        console.log('[FILTER] Calling renderFilteredGuides() with', results.length, 'guides');
        await window.renderFilteredGuides(results);
    } else if (window.renderGuideCards) {
        // フォールバック：renderFilteredGuidesがまだ利用不可の場合
        console.log('[FILTER] Fallback: Using renderGuideCards() with', results.length, 'guides');
        await window.renderGuideCards(results, true, true);
    } else {
        console.error('[FILTER] ERROR: No render function available');
    }
}

// ✅ 外部から呼び出せるようにグローバル化
window.filterGuides = filterGuides;

// ✅ フィルタリセット関数
window.resetFilters = async function() {
    console.log('[RESET] ============ resetFilters() CALLED ============');
    
    // フィルタUI をリセット
    const locEl = document.getElementById('locationFilter');
    const langEl = document.getElementById('languageFilter');
    const priceEl = document.getElementById('priceFilter');
    const keyEl = document.getElementById('keywordInput');
    if (locEl) locEl.value = '';
    if (langEl) langEl.value = '';
    if (priceEl) priceEl.value = '';
    if (keyEl) keyEl.value = '';
    
    const appState = window.AppState;
    if (!appState) return;
    
    // ✅ fullGuideList から復元（不変のマスターデータ）
    const fullList = appState.fullGuideList || appState.originalGuides || [];
    
    console.log(`[RESET] Restoring ${fullList.length} guides from fullGuideList`);
    
    appState.filteredGuides = [...fullList];
    appState.isFiltered = false;
    appState.currentPage = 1;
    appState.activeFilters = { location: '', language: '', price: '', keyword: '' };
    
    // ✅ 通常の描画パス（フィルタなし）で描画
    if (window.renderGuideCards) {
        await window.renderGuideCards(fullList, true, true);
    }
    
    console.log('[RESET] ============ resetFilters() COMPLETE ============');
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
