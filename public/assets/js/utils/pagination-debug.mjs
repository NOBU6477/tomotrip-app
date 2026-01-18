/**
 * ページネーション・フィルタ回帰テスト用デバッグモジュール
 * 
 * 本番影響なし：window.__TT_DEBUG = true のときのみ動作
 * 
 * 使用方法：
 * 1. ブラウザコンソールで window.__TT_DEBUG = true
 * 2. ページをリロード
 * 3. 操作してログを確認
 */

const DEBUG_PREFIX = '[TT-DEBUG]';

/**
 * デバッグモードが有効かチェック
 */
export function isDebugMode() {
    return typeof window !== 'undefined' && window.__TT_DEBUG === true;
}

/**
 * ページネーション状態をログ出力
 * @param {string} context - 呼び出し元コンテキスト（例：'afterFilter', 'pageChange', 'refresh'）
 * @param {Object} options - 追加オプション
 */
export function logPaginationState(context, options = {}) {
    if (!isDebugMode()) return;
    
    const state = window.AppState || {};
    const paginationSystem = window.paginationSystem;
    
    const isFiltered = state.isFiltered || false;
    const sourceList = isFiltered ? (state.filteredGuides || []) : (state.fullGuideList || []);
    const total = sourceList.length;
    const currentPage = paginationSystem?.currentPage || state.currentPage || 1;
    const perPage = paginationSystem?.guidesPerPage || 12;
    const totalPages = Math.ceil(total / perPage);
    const sliceStart = (currentPage - 1) * perPage;
    const sliceEnd = Math.min(sliceStart + perPage, total);
    
    console.log(`
${DEBUG_PREFIX} context=${context}
  isFilterActive=${isFiltered}
  total=${total}
  currentPage=${currentPage}
  perPage=${perPage}
  totalPages=${totalPages}
  sourceList=${isFiltered ? 'filtered' : 'full'}
  sliceStart=${sliceStart}
  sliceEnd=${sliceEnd}
  displayRange=${sliceStart + 1}-${sliceEnd} / ${total}
`);
    
    if (options.showFilters) {
        const locationFilter = document.getElementById('locationFilter')?.value || '';
        const languageFilter = document.getElementById('languageFilter')?.value || '';
        const priceFilter = document.getElementById('priceFilter')?.value || '';
        const keyword = document.getElementById('searchKeyword')?.value || '';
        
        console.log(`${DEBUG_PREFIX} Active Filters:
  location=${locationFilter || '(none)'}
  language=${languageFilter || '(none)'}
  price=${priceFilter || '(none)'}
  keyword=${keyword || '(none)'}
`);
    }
    
    return {
        isFiltered,
        total,
        currentPage,
        perPage,
        totalPages,
        sliceStart,
        sliceEnd,
        sourceList: isFiltered ? 'filtered' : 'full'
    };
}

/**
 * 表示ガイドの重複IDを検知
 * @param {Array} guides - 表示するガイドの配列
 * @param {string} context - 呼び出し元コンテキスト
 * @returns {boolean} 重複がある場合true
 */
export function detectDuplicateIds(guides, context = 'render') {
    if (!isDebugMode()) return false;
    
    if (!guides || !Array.isArray(guides) || guides.length === 0) {
        console.log(`${DEBUG_PREFIX} [${context}] No guides to check for duplicates`);
        return false;
    }
    
    const ids = guides.map((g, index) => {
        return g.id || g.email || `index-${index}`;
    });
    
    const seen = new Set();
    const duplicates = [];
    
    ids.forEach((id, index) => {
        if (seen.has(id)) {
            duplicates.push({ id, index, guide: guides[index] });
        } else {
            seen.add(id);
        }
    });
    
    if (duplicates.length > 0) {
        console.error(`${DEBUG_PREFIX} [${context}] ❌ DUPLICATE IDs DETECTED!`, duplicates);
        return true;
    }
    
    console.log(`${DEBUG_PREFIX} [${context}] ✅ No duplicates (${guides.length} guides checked)`);
    return false;
}

/**
 * カウンター表示の整合性をチェック
 * @param {number} start - 表示開始番号
 * @param {number} end - 表示終了番号
 * @param {number} total - 総件数
 * @param {string} context - 呼び出し元コンテキスト
 * @returns {boolean} 不整合がある場合true
 */
export function validateCounterDisplay(start, end, total, context = 'counter') {
    if (!isDebugMode()) return false;
    
    const errors = [];
    
    if (start < 1) {
        errors.push(`start (${start}) < 1`);
    }
    if (end < start) {
        errors.push(`end (${end}) < start (${start}) - 逆転!`);
    }
    if (end > total) {
        errors.push(`end (${end}) > total (${total})`);
    }
    if (start > total && total > 0) {
        errors.push(`start (${start}) > total (${total})`);
    }
    
    if (errors.length > 0) {
        console.error(`${DEBUG_PREFIX} [${context}] ❌ COUNTER INCONSISTENCY!`, errors);
        console.error(`${DEBUG_PREFIX} Display: ${start}-${end} / ${total}`);
        return true;
    }
    
    console.log(`${DEBUG_PREFIX} [${context}] ✅ Counter OK: ${start}-${end} / ${total}`);
    return false;
}

/**
 * ソースリストの一本化を検証
 * @param {Array} usedList - 実際に使用されたリスト
 * @param {string} context - 呼び出し元コンテキスト
 */
export function validateSourceList(usedList, context = 'source') {
    if (!isDebugMode()) return;
    
    const state = window.AppState || {};
    const isFiltered = state.isFiltered || false;
    const expectedList = isFiltered ? state.filteredGuides : state.fullGuideList;
    
    if (usedList === expectedList) {
        console.log(`${DEBUG_PREFIX} [${context}] ✅ Source list correct: ${isFiltered ? 'filteredGuides' : 'fullGuideList'}`);
    } else if (usedList && expectedList && usedList.length === expectedList.length) {
        const allMatch = usedList.every((g, i) => g.id === expectedList[i]?.id);
        if (allMatch) {
            console.log(`${DEBUG_PREFIX} [${context}] ✅ Source list content matches (copied reference)`);
        } else {
            console.error(`${DEBUG_PREFIX} [${context}] ❌ Source list content MISMATCH!`);
        }
    } else {
        console.error(`${DEBUG_PREFIX} [${context}] ❌ Source list MISMATCH!`, {
            usedLength: usedList?.length,
            expectedLength: expectedList?.length,
            isFiltered
        });
    }
}

/**
 * フィルタ結果に不正なガイドが含まれていないかチェック
 * @param {Array} guides - フィルタ後のガイド配列
 * @param {Object} filters - 適用されたフィルタ条件
 * @param {string} context - 呼び出し元コンテキスト
 */
export function validateFilterResults(guides, filters, context = 'filter') {
    if (!isDebugMode()) return;
    
    if (!guides || !filters) return;
    
    const violations = [];
    
    guides.forEach((guide, index) => {
        if (filters.language) {
            const guideLanguages = (guide.languages || []).map(l => 
                typeof l === 'string' ? l.toLowerCase() : ''
            ).join(',');
            
            const filterLang = filters.language.toLowerCase();
            const hasLanguage = guideLanguages.includes(filterLang) ||
                guideLanguages.includes('英語') && (filterLang === 'english' || filterLang === '英語') ||
                guideLanguages.includes('english') && (filterLang === 'english' || filterLang === '英語');
            
            if (!hasLanguage && filters.language !== '') {
                violations.push({
                    index,
                    guide: guide.name,
                    reason: `Language mismatch: expected "${filters.language}", has "${guideLanguages}"`
                });
            }
        }
    });
    
    if (violations.length > 0) {
        console.error(`${DEBUG_PREFIX} [${context}] ❌ FILTER VIOLATIONS!`, violations);
    } else {
        console.log(`${DEBUG_PREFIX} [${context}] ✅ All ${guides.length} guides match filter criteria`);
    }
}

/**
 * テストサマリーを出力
 */
export function printTestSummary() {
    if (!isDebugMode()) return;
    
    console.log(`
${DEBUG_PREFIX} ========================================
${DEBUG_PREFIX} テスト結果サマリー
${DEBUG_PREFIX} ========================================
${DEBUG_PREFIX} デバッグモード: ON
${DEBUG_PREFIX} 
${DEBUG_PREFIX} テストケース確認方法:
${DEBUG_PREFIX} TC1: 初期表示 → 2ページ目 → 1ページ目
${DEBUG_PREFIX} TC2: フィルタON（英語）→ 次ページ
${DEBUG_PREFIX} TC3: フィルタON（地域×英語）→ 次ページ
${DEBUG_PREFIX} TC4: 2ページ目で条件変更（再検索）
${DEBUG_PREFIX} TC5: フィルタ中に条件追加
${DEBUG_PREFIX} TC6: リセット後の整合性
${DEBUG_PREFIX} TC7: 30秒更新後の保持
${DEBUG_PREFIX} 
${DEBUG_PREFIX} ❌ エラーがあれば console.error で表示
${DEBUG_PREFIX} ✅ 問題なければ console.log で表示
${DEBUG_PREFIX} ========================================
`);
}

if (typeof window !== 'undefined') {
    window.__TT_DEBUG_UTILS = {
        logPaginationState,
        detectDuplicateIds,
        validateCounterDisplay,
        validateSourceList,
        validateFilterResults,
        printTestSummary,
        isDebugMode
    };
}
