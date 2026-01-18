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
    // PRIORITY: localStorage first (persistent on mobile), then sessionStorage (legacy)
    const touristAuth = localStorage.getItem('touristAuth') || sessionStorage.getItem('touristAuth');
    const touristAuthTimestamp = localStorage.getItem('touristAuthTimestamp') || sessionStorage.getItem('touristAuthTimestamp');
    const isRegisteredTourist = localStorage.getItem('isRegisteredTourist');
    const touristLogin = localStorage.getItem('touristLogin');
    
    // Auth is valid if we have any persistent auth data, or recent session auth
    const hasValidTimestampAuth = touristAuth && touristAuthTimestamp &&
        (Date.now() - parseInt(touristAuthTimestamp)) < (7 * 24 * 60 * 60 * 1000); // 7 days for localStorage
    const hasPersistentAuth = isRegisteredTourist === 'true' || touristLogin;
    const isAuthValid = hasValidTimestampAuth || hasPersistentAuth;
    
    // Mobile debug logging
    console.log('📱 [AUTH CHECK] showGuideDetailModalById:', {
        guideId,
        touristAuth,
        touristAuthTimestamp,
        isRegisteredTourist,
        touristLogin: !!touristLogin,
        hasValidTimestampAuth,
        hasPersistentAuth,
        isAuthValid
    });

    if (!isAuthValid) {
        console.log('📱 [AUTH CHECK] Auth invalid - showing registration prompt');
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

// ✅ 言語正規化マッピング（表記ゆれ完全対応 v2026.01.18）
// 原因分析: ガイドのlanguagesに「英語」「english」「English」「EN」など混在
// 対応一覧:
//   日本語 → japanese: 日本語, japanese, Japanese, JAPANESE, ja, JP, jpn, japan
//   英語   → english:  英語, english, English, ENGLISH, en, EN, eng, ENG, us english
//   中国語 → chinese:  中国語, chinese, Chinese, CHINESE, zh, ZH, chn, CHN, mandarin
//   韓国語 → korean:   韓国語, korean, Korean, KOREAN, ko, KO, kor, KOR
const LANGUAGE_MAPPING = {
    'japanese': ['日本語', 'japanese', 'ja', 'jp', 'jpn', 'japan', 'にほんご'],
    'english': ['英語', 'english', 'en', 'eng', 'us english', 'us-english', 'えいご'],
    'chinese': ['中国語', 'chinese', 'zh', 'chn', 'mandarin', 'cn', 'ちゅうごくご'],
    'korean': ['韓国語', 'korean', 'ko', 'kor', 'kr', 'かんこくご']
};

/**
 * 単一言語値を正規化キー（japanese/english/chinese/korean）に変換
 * 大文字小文字、全角半角、余分な空白を吸収
 * @param {string} value - 正規化対象の言語値
 * @returns {string|null} 正規化後の言語キー
 */
function normalizeLanguageValue(value) {
    if (!value) return null;
    // 大文字小文字正規化 + トリム + 全角→半角スペース変換
    const lower = String(value).toLowerCase().trim().replace(/　/g, ' ');
    
    for (const [key, variants] of Object.entries(LANGUAGE_MAPPING)) {
        if (variants.some(v => v.toLowerCase() === lower)) {
            return key;
        }
    }
    // マッチしなかった場合は小文字化した値をそのまま返す
    return lower;
}

/**
 * ガイドのlanguages配列/文字列を正規化済み配列に変換
 * カンマ区切り、スラッシュ区切り、空白区切りすべて対応
 * @param {Array|string} languages - ガイドの言語データ
 * @returns {string[]} 正規化済みの言語キー配列
 */
function normalizeGuideLanguages(languages) {
    if (!languages) return [];
    
    let langArray = languages;
    
    // 文字列の場合：カンマ、スラッシュ、「・」で分割
    if (typeof languages === 'string') {
        langArray = languages.split(/[,\/・、]+/).map(s => s.trim()).filter(Boolean);
    }
    
    if (!Array.isArray(langArray)) return [];
    
    // 各言語を正規化
    return langArray
        .map(lang => normalizeLanguageValue(lang))
        .filter(Boolean);
}

/**
 * ガイドが選択言語に対応しているかチェック（正規化済み同士で比較）
 * @param {Object} guide - ガイドオブジェクト
 * @param {string} selectedLang - フィルタで選択された言語値
 * @returns {boolean} マッチするかどうか
 */
function guideMatchesLanguage(guide, selectedLang) {
    // フィルタ値なし or 'all' の場合は全件マッチ
    if (!selectedLang || selectedLang === '' || selectedLang === 'all' || selectedLang === 'すべて') {
        return true;
    }
    
    // フィルタ値を正規化
    const selectedNormalized = normalizeLanguageValue(selectedLang);
    if (!selectedNormalized) return true;
    
    // ガイドの言語を取得（複数フィールド対応）
    const rawLanguages = guide.languages || guide.guideLanguages || [];
    
    // ガイド側の言語を正規化
    const guideNormalized = normalizeGuideLanguages(rawLanguages);
    
    // 正規化済み同士で完全一致チェック
    const result = guideNormalized.includes(selectedNormalized);
    
    return result;
}

/**
 * [LANG DUMP] 全ガイドの言語データをログ出力（デバッグ用）
 * 1回だけ呼び出して言語データの実態を可視化
 */
function dumpLanguageData(guides, filterValue) {
    console.log('========== [LANG DUMP] START ==========');
    console.log(`[LANG DUMP] Total guides: ${guides.length}, Filter value: "${filterValue}"`);
    console.log(`[LANG DUMP] Filter normalized to: "${normalizeLanguageValue(filterValue)}"`);
    
    let matchCount = 0;
    guides.forEach((g, i) => {
        const rawLangs = g.languages || g.guideLanguages || [];
        const normalizedLangs = normalizeGuideLanguages(rawLangs);
        const matches = guideMatchesLanguage(g, filterValue);
        if (matches) matchCount++;
        
        console.log(`[LANG DUMP] #${i+1} name="${g.name || g.guideName}" rawLangs=${JSON.stringify(rawLangs)} normalizedLangs=[${normalizedLangs.join(',')}] match=${matches}`);
    });
    
    console.log(`[LANG DUMP] Expected matches: ${matchCount} guides`);
    console.log('========== [LANG DUMP] END ==========');
}

// ✅ 統合フィルタ関数 - fullGuideListに対してフィルタを適用
// 修正日: 2026-01-18
// 修正内容:
//   1. [LANG DUMP]でガイドの言語データの実態を可視化
//   2. normalizeGuideLanguages()でガイド側の言語も100%正規化
//   3. guideMatchesLanguage()で正規化済み同士を比較
//   4. ページネーション同期を確実に（goToPage(1)使用）
//   5. カウンター表示をフィルタ結果件数に統一
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
    
    // ✅ [LANG DUMP] 言語データの実態を1回だけログ出力（言語フィルタ使用時のみ）
    if (langVal) {
        dumpLanguageData(fullList, langVal);
    }
    
    let results = [...fullList];
    
    // 地域フィルタ
    if (locVal) {
        results = results.filter(g => 
            g.location === locVal || 
            convertPrefectureNameToCode(locVal) === g.location || 
            compareLocations(g.location, locVal)
        );
    }
    
    // ✅ 言語フィルタ（正規化済み同士で比較）
    if (langVal) {
        console.log(`[FILTER] Applying language filter: "${langVal}" → normalized: "${normalizeLanguageValue(langVal)}"`);
        results = results.filter(g => guideMatchesLanguage(g, langVal));
        console.log(`[FILTER] After language filter: ${results.length} guides remain`);
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
    
    // ✅ AppState を更新（すべての参照箇所との整合性を確保）
    state.filteredGuides = results;
    state.guides = results; // ✅ CRITICAL: 他のレンダーパスとの整合性のため
    state.isFiltered = hasActiveFilter;
    state.currentPage = 1; // フィルタ後は必ず1ページ目
    state.filteredTotal = results.length; // ✅ カウンター表示用
    state.paginationSourceList = results; // ✅ NEW: ページネーションが参照する統一リスト
    
    console.log(`[PAGINATION SYNC] paginationSourceList set to ${results.length} guides (isFiltered: ${hasActiveFilter})`)
    
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
    appState.guides = [...fullList]; // ✅ CRITICAL: 他のレンダーパスとの整合性のため
    appState.isFiltered = false;
    appState.currentPage = 1;
    appState.activeFilters = { location: '', language: '', price: '', keyword: '' };
    appState.paginationSourceList = [...fullList]; // ✅ NEW: ページネーションが参照する統一リスト
    
    console.log(`[PAGINATION SYNC] paginationSourceList reset to ${fullList.length} guides (full list)`)
    
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
