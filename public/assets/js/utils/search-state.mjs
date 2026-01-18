/**
 * 検索状態管理モジュール - Search State Manager
 * ガイド一覧 ↔ 詳細ページ間の検索状態保持を実現
 * 
 * 保存する状態:
 * - region: 活動地域
 * - language: 言語
 * - price: 価格帯
 * - keyword: キーワード
 * - page: ページ番号
 * - scrollY: スクロール位置
 * - timestamp: 保存時刻（デバッグ用）
 */

const STORAGE_KEY = 'guideSearchState';
const URL_PARAMS = ['region', 'lang', 'price', 'q', 'page'];

/**
 * 現在の検索状態を取得
 * @returns {Object} 検索状態オブジェクト
 */
export function getCurrentSearchState() {
    const state = {
        region: document.getElementById('locationFilter')?.value || '',
        language: document.getElementById('languageFilter')?.value || '',
        price: document.getElementById('priceFilter')?.value || '',
        keyword: document.getElementById('searchKeyword')?.value || '',
        page: window.paginationSystem?.currentPage || window.AppState?.currentPage || 1,
        scrollY: window.scrollY || 0,
        timestamp: Date.now()
    };
    
    console.log('📋 [SEARCH STATE] getCurrentSearchState:', state);
    return state;
}

/**
 * 検索状態が有効か（何か条件が設定されているか）
 * @param {Object} state - 検索状態オブジェクト
 * @returns {boolean}
 */
export function hasActiveSearchState(state) {
    if (!state) return false;
    return !!(state.region || state.language || state.price || state.keyword || state.page > 1);
}

/**
 * 検索状態をsessionStorageに保存
 * @param {Object} state - 検索状態オブジェクト
 */
export function saveSearchState(state = null) {
    const stateToSave = state || getCurrentSearchState();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    console.log('💾 [SEARCH STATE] Saved to sessionStorage:', stateToSave);
}

/**
 * sessionStorageから検索状態を読み込み（10分の有効期限チェック付き）
 * @returns {Object|null} 検索状態オブジェクト（なければ or 期限切れはnull）
 */
export function loadSearchState() {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        
        const state = JSON.parse(stored);
        
        // ✅ 10分の有効期限チェック
        const elapsed = Date.now() - (state.timestamp || 0);
        const maxAge = 10 * 60 * 1000; // 10分
        
        if (elapsed > maxAge) {
            console.log('📋 [SEARCH STATE] Saved state expired:', { elapsed, maxAge });
            sessionStorage.removeItem(STORAGE_KEY);
            return null;
        }
        
        console.log('📂 [SEARCH STATE] Loaded from sessionStorage:', state);
        return state;
    } catch (e) {
        console.error('❌ [SEARCH STATE] Failed to parse stored state:', e);
        return null;
    }
}

/**
 * 検索状態をクリア
 */
export function clearSearchState() {
    sessionStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ [SEARCH STATE] Cleared from sessionStorage');
}

/**
 * 検索状態をURLクエリに変換
 * @param {Object} state - 検索状態オブジェクト
 * @returns {string} URLクエリ文字列（?付き、または空文字）
 */
export function stateToUrlQuery(state) {
    if (!state) return '';
    
    const params = new URLSearchParams();
    if (state.region) params.set('region', state.region);
    if (state.language) params.set('lang', state.language);
    if (state.price) params.set('price', state.price);
    if (state.keyword) params.set('q', state.keyword);
    if (state.page && state.page > 1) params.set('page', state.page.toString());
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
}

/**
 * URLクエリから検索状態を解析
 * @param {string} search - location.searchの値
 * @returns {Object|null} 検索状態オブジェクト（パラメータがなければnull）
 */
export function parseUrlQuery(search = window.location.search) {
    if (!search) return null;
    
    const params = new URLSearchParams(search);
    const hasParams = URL_PARAMS.some(key => params.has(key));
    
    if (!hasParams) return null;
    
    const state = {
        region: params.get('region') || '',
        language: params.get('lang') || '',
        price: params.get('price') || '',
        keyword: params.get('q') || '',
        page: parseInt(params.get('page') || '1', 10),
        scrollY: 0,
        timestamp: Date.now()
    };
    
    console.log('🔗 [SEARCH STATE] Parsed from URL:', state);
    return state;
}

/**
 * 検索状態をフォームUIに反映
 * @param {Object} state - 検索状態オブジェクト
 */
export function applyStateToUI(state) {
    if (!state) return;
    
    console.log('🔧 [SEARCH STATE] Applying state to UI:', state);
    
    const locationFilter = document.getElementById('locationFilter');
    const languageFilter = document.getElementById('languageFilter');
    const priceFilter = document.getElementById('priceFilter');
    const searchKeyword = document.getElementById('searchKeyword');
    
    if (locationFilter && state.region) {
        locationFilter.value = state.region;
        console.log('  ✓ locationFilter =', state.region);
    }
    if (languageFilter && state.language) {
        languageFilter.value = state.language;
        console.log('  ✓ languageFilter =', state.language);
    }
    if (priceFilter && state.price) {
        priceFilter.value = state.price;
        console.log('  ✓ priceFilter =', state.price);
    }
    if (searchKeyword && state.keyword) {
        searchKeyword.value = state.keyword;
        console.log('  ✓ searchKeyword =', state.keyword);
    }
}

/**
 * 検索状態を復元し、フィルタを再実行
 * @param {Object} state - 検索状態オブジェクト
 * @param {Function} filterCallback - フィルタ実行関数（window.filterGuides）
 * @param {Function} goToPageCallback - ページ移動関数（paginationSystem.goToPage）
 * @returns {boolean} 復元が行われたか
 */
export function restoreSearchState(state, filterCallback, goToPageCallback) {
    if (!state || !hasActiveSearchState(state)) {
        console.log('📋 [SEARCH STATE] No active state to restore');
        return false;
    }
    
    console.log('🔄 [SEARCH STATE] Restoring search state:', state);
    
    applyStateToUI(state);
    
    if (filterCallback && typeof filterCallback === 'function') {
        console.log('🔍 [SEARCH STATE] Calling filter callback...');
        filterCallback();
    }
    
    if (state.page > 1 && goToPageCallback && typeof goToPageCallback === 'function') {
        console.log(`📄 [SEARCH STATE] Restoring page ${state.page}...`);
        setTimeout(() => {
            goToPageCallback(state.page);
        }, 100);
    }
    
    if (state.scrollY > 0) {
        console.log(`📜 [SEARCH STATE] Restoring scroll position ${state.scrollY}...`);
        setTimeout(() => {
            window.scrollTo(0, state.scrollY);
        }, 300);
    }
    
    return true;
}

/**
 * 詳細ページから戻ったかどうかを判定
 * @returns {boolean}
 */
export function isReturningFromDetail() {
    const state = loadSearchState();
    if (!state || !state.timestamp) return false;
    
    const elapsed = Date.now() - state.timestamp;
    const maxAge = 10 * 60 * 1000;
    
    const isReturning = elapsed < maxAge && hasActiveSearchState(state);
    console.log('🔙 [SEARCH STATE] isReturningFromDetail:', isReturning, { elapsed, maxAge });
    return isReturning;
}

/**
 * 「詳細を見る」クリック時に呼び出す
 * 現在の検索状態を保存してから詳細ページへ遷移
 */
export function saveStateBeforeDetail() {
    const state = getCurrentSearchState();
    saveSearchState(state);
    console.log('💾 [SEARCH STATE] State saved before navigating to detail');
}

/**
 * 一覧ページ読み込み時に呼び出す
 * URLクエリまたはsessionStorageから状態を復元
 * @param {Function} filterCallback - フィルタ実行関数
 * @param {Function} goToPageCallback - ページ移動関数
 * @returns {boolean} 復元が行われたか
 */
export function initSearchStateOnLoad(filterCallback, goToPageCallback) {
    console.log('🚀 [SEARCH STATE] initSearchStateOnLoad called');
    
    let state = parseUrlQuery();
    
    if (!state || !hasActiveSearchState(state)) {
        state = loadSearchState();
    }
    
    if (state && hasActiveSearchState(state)) {
        return restoreSearchState(state, filterCallback, goToPageCallback);
    }
    
    console.log('📋 [SEARCH STATE] No state to restore on load');
    return false;
}

window.SearchState = {
    getCurrentSearchState,
    hasActiveSearchState,
    saveSearchState,
    loadSearchState,
    clearSearchState,
    stateToUrlQuery,
    parseUrlQuery,
    applyStateToUI,
    restoreSearchState,
    isReturningFromDetail,
    saveStateBeforeDetail,
    initSearchStateOnLoad
};

export default {
    getCurrentSearchState,
    hasActiveSearchState,
    saveSearchState,
    loadSearchState,
    clearSearchState,
    stateToUrlQuery,
    parseUrlQuery,
    applyStateToUI,
    restoreSearchState,
    isReturningFromDetail,
    saveStateBeforeDetail,
    initSearchStateOnLoad
};
