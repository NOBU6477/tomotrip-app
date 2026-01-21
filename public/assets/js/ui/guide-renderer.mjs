// Guide rendering module - CSP compliant
// Removed defaultGuideData import to prevent duplicate rendering

// Import language utilities for proper localization
import { localizeLanguageArray, localizeSpecialtyArray, isEnglishPage, getText } from '../utils/language-utils.mjs';

// ✅ NEW: 都道府県正規化をインポート
import { normalizePrefecture } from '../utils/location-utils.mjs';

// ✅ NEW: 検索状態管理モジュール
import { saveStateBeforeDetail } from '../utils/search-state.mjs';

// ✅ NEW: ページネーションデバッグモジュール
import { detectDuplicateIds, validateCounterDisplay, logPaginationState, isDebugMode } from '../utils/pagination-debug.mjs';

// スケーラブルペジネーションのインポートと初期化
let paginationSystem = null;

// 大量データ対応の最適化されたガイドカード描画関数
export async function renderGuideCards(guidesToRender = null, usePagination = true, resetPagination = true) {
    // Use provided guides, or fall back based on filter state
    let guides;
    
    if (guidesToRender !== null) {
        // Explicit guides provided - use them even if empty (for filtered results)
        guides = guidesToRender;
        console.log('🎯 Using provided guides:', guides.length);
    } else {
        // No explicit guides - use filtered guides or all guides
        const appState = window.AppState;
        if (appState?.isFiltered && appState?.filteredGuides != null) {
            guides = appState.filteredGuides;
            console.log('🔍 Using filtered guides from AppState:', guides.length);
        } else {
            guides = appState?.guides ?? [];
            console.log('📦 Using all guides from AppState:', guides.length);
        }
    }
    
    // 🔧 Fix: Only reset currentPage when explicitly requested via resetPagination
    if (window.AppState && resetPagination) {
        window.AppState.currentPage = 1;
        console.log('🔄 Reset currentPage to 1 (resetPagination=true)');
    }
    
    // スケーラブルペジネーションシステムの初期化
    if (usePagination && guides.length > 12) {
        // ✅ FIXED: Wait for async pagination initialization to complete
        await initializePaginationSystem(guides, resetPagination);
        return; // ペジネーション使用時は早期リターン
    }
    
    // ✅ CRITICAL FIX: 12件以下でもpaginationSystemを更新（次ページボタン混入防止）
    if (window.paginationSystem) {
        window.paginationSystem.setFilteredData(guides);
        console.log(`📊 [PAGINATION] Low count: setFilteredData with ${guides.length} guides, totalPages: ${window.paginationSystem.totalPages}`);
        
        // ページネーションを非表示（1ページ以下なので）
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) paginationContainer.innerHTML = '';
    }
    
    // 少数のガイドの場合は従来通りの表示
    console.log('📊 Render kickoff:', {count: guides.length, currentPage: window.AppState?.currentPage});
    renderAllGuideCards(guides);
}

// ペジネーションシステムの初期化
async function initializePaginationSystem(guides, resetPagination = true) {
    // ✅ FIX: ページネーション有効フラグを即座に設定（async importの前）
    window.paginationEnabled = true;
    
    // ✅ CRITICAL FIX: フィルタ中はfullGuideListを上書きしない
    // fullGuideListは不変のマスターデータ、フィルタ適用後のデータで上書きしてはいけない
    const isFiltered = window.AppState?.isFiltered || false;
    
    if (window.AppState && !isFiltered) {
        // フィルタ適用中でない場合のみfullGuideListを更新
        window.AppState.fullGuideList = [...guides];
        window.AppState.paginationSourceList = [...guides]; // ✅ NEW: ページネーション統一ソース
        console.log(`📊 [PAGINATION] fullGuideList & paginationSourceList stored: ${guides.length} guides (not filtered)`);
    } else {
        // フィルタ中はpaginationSourceListをフィルタ結果に設定
        window.AppState.paginationSourceList = [...guides];
        console.log(`📊 [PAGINATION] paginationSourceList set to filtered: ${guides.length}, fullGuideList preserved: ${window.AppState?.fullGuideList?.length || 0}`);
    }
    
    // ✅ 新しいペジネーションシステムが必要な場合のみ作成
    const needsNewSystem = !paginationSystem;
    
    if (needsNewSystem) {
        const { ScalablePagination } = await import('./scalable-pagination.mjs');
        
        paginationSystem = new ScalablePagination({
            itemsPerPage: 12,
            maxVisiblePages: 5,
            container: '#paginationContainer',
            onPageLoad: (pageItems, currentPage, totalPages) => {
                // ✅ FIX: paginationSourceList を唯一の参照元として使用
                const paginationSourceList = window.AppState?.paginationSourceList || 
                                              window.AppState?.filteredGuides || 
                                              window.AppState?.fullGuideList || [];
                const isFiltered = window.AppState?.isFiltered || false;
                
                // ✅ CRITICAL: paginationSourceList.length を常に使用
                const total = paginationSourceList.length;
                const pageSize = 12;
                const startIndex = (currentPage - 1) * pageSize;
                const endIndex = Math.min(startIndex + pageSize, total);
                
                console.log(`📊 [PAGINATION] Page ${currentPage}/${totalPages}:`, {
                    isFiltered,
                    sourceListLength: total,
                    startIndex: startIndex + 1,
                    endIndex,
                    pageItemsCount: pageItems.length
                });
                
                // ✅ ガードレール: paginationSystemのfilteredDataとAppStateが同期しているか確認
                if (window.paginationSystem && window.paginationSystem.filteredData.length !== total) {
                    console.warn(`⚠️ [PAGINATION SYNC WARNING] paginationSystem.filteredData (${window.paginationSystem.filteredData.length}) !== paginationSourceList (${total})`);
                }
                
                // ページのカードを描画
                renderPageCards(pageItems, startIndex + 1, endIndex, total);
            }
        });
        
        window.setPaginationSystem(paginationSystem);
        ensurePaginationContainers();
    }
    
    // ✅ CRITICAL FIX: フィルタ状態に応じて適切なメソッドを使用
    if (isFiltered) {
        // フィルタ中はsetFilteredDataを使用（page 1にリセット）
        paginationSystem.setFilteredData(guides);
        console.log(`📊 [PAGINATION] setFilteredData called with ${guides.length} filtered guides`);
    } else if (resetPagination || needsNewSystem) {
        // 全データをセット（page 1にリセット）
        paginationSystem.setData(guides);
    } else {
        // データを更新しつつ現在のページを維持
        paginationSystem.updateData(guides);
    }
    
    paginationSystem.renderPagination();
    paginationSystem.updatePageInfo();
    
    // ✅ CRITICAL FIX: 現在のページを表示、totalはpaginationSourceListから取得
    const currentPage = paginationSystem.currentPage;
    const pageItems = paginationSystem.getCurrentPageItems();
    
    // ✅ paginationSourceListを統一的に使用
    const paginationSourceList = window.AppState?.paginationSourceList || guides;
    const total = paginationSourceList.length;
    
    const pageSize = 12;
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, total);
    renderPageCards(pageItems, startIndex, endIndex, total);
    
    console.log(`✅ Pagination system initialized: ${guides.length} guides, ${paginationSystem.getState().totalPages} pages, isFiltered: ${isFiltered}`);
}

// ✅ NEW: ページカードを描画する専用関数（スライス済みアイテム用）
function renderPageCards(pageItems, startNum, endNum, total) {
    let container = document.getElementById('guidesContainer') || 
                    document.getElementById('guide-list') || 
                    document.getElementById('guideCardsContainer') ||
                    document.querySelector('.guide-cards-container .row');
    
    if (!container) {
        const searchResultsRow = document.querySelector('section#search-results .row');
        if (searchResultsRow) {
            container = searchResultsRow;
            container.id = 'guidesContainer';
        }
    }
    
    if (!container) {
        console.error('❌ Unable to find guidesContainer');
        return;
    }
    
    if (!Array.isArray(pageItems) || pageItems.length === 0) {
        container.innerHTML = '<div class="text-center p-4"><p class="text-muted">ガイドが見つかりません</p></div>';
        updateGuideCounters(0, total);
        return;
    }
    
    console.log(`🎨 [RENDER PAGE] Rendering ${pageItems.length} cards (${startNum}-${endNum} of ${total})`);
    
    // ✅ DEBUG: 重複ID検知
    detectDuplicateIds(pageItems, 'renderPageCards');
    
    // ✅ DEBUG: カウンター整合性チェック
    validateCounterDisplay(startNum, endNum, total, 'renderPageCards');
    
    const cardsHTML = pageItems.map(guide => createGuideCardHTML(guide)).join('');
    container.innerHTML = cardsHTML;
    
    // ✅ FIX: 件数表示は startNum-endNum / total で計算
    updateGuideCountersWithRange(startNum, endNum, total);
    
    setupViewDetailsEventListeners();
    
    console.log(`✅ Rendered ${pageItems.length} cards: ${startNum}-${endNum}件表示中 (${total}件中)`);
}

// ペジネーション用コンテナを確保
function ensurePaginationContainers() {
    // ページ情報コンテナ
    let pageInfo = document.getElementById('pageInfo');
    if (!pageInfo) {
        pageInfo = document.createElement('div');
        pageInfo.id = 'pageInfo';
        
        const guidesContainer = document.getElementById('guidesContainer');
        const parentContainer = guidesContainer?.parentElement;
        if (parentContainer) {
            parentContainer.insertBefore(pageInfo, guidesContainer);
        }
    }
    
    // ペジネーションコンテナ
    let paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationContainer';
        paginationContainer.className = 'mt-4';
        
        const guidesContainer = document.getElementById('guidesContainer');
        const parentContainer = guidesContainer?.parentElement;
        if (parentContainer) {
            parentContainer.appendChild(paginationContainer);
        }
    }
}

// 全ガイドカードの描画（既存の機能）
function renderAllGuideCards(guides) {
    // Try multiple ways to find the container - support both old and new IDs
    let container = document.getElementById('guidesContainer') || 
                    document.getElementById('guide-list') || 
                    document.getElementById('guideCardsContainer') ||
                    document.querySelector('.guide-cards-container .row');
    
    // Fallback: Try to find by section structure
    if (!container) {
        const searchResultsRow = document.querySelector('section#search-results .row');
        if (searchResultsRow) {
            container = searchResultsRow;
            container.id = 'guidesContainer';
        }
    }
    
    // Fallback: Search for specific empty rows that might be our container
    if (!container) {
        const emptyRow = Array.from(document.querySelectorAll('.row')).find(row => 
            row.innerHTML.includes('populated') || (row.id.includes('List') === false && row.children.length === 0)
        );
        
        if (emptyRow) {
            container = emptyRow;
            container.id = 'guidesContainer';
        }
    }
    
    if (!container) {
        console.warn('⚠️ No suitable container found for guide cards. Attempting to find any available row.');
        container = document.querySelector('.row:not(#chatRow)');
    }
    
    if (!container) {
        console.error('❌ Unable to find guidesContainer - no suitable parent found');
        return;
    }
    
    if (!Array.isArray(guides) || guides.length === 0) {
        console.warn('⚠️ No guides to render');
        // 🔧 FIX: フィルター処理中かどうかを確認して適切なメッセージを表示
        const isFilteringInProgress = window.AppState?.isFiltered;
        const filteringMsg = getText('フィルター処理中...', 'Filtering...');
        const noGuidesMsg = getText('ガイドが見つかりません', 'No guides found');
        const message = isFilteringInProgress ? 
            `<div class="text-center p-4"><div class="spinner-border spinner-border-sm me-2" role="status"></div><p class="text-muted mt-2">${filteringMsg}</p></div>` :
            `<div class="text-center p-4"><p class="text-muted">${noGuidesMsg}</p></div>`;
        
        // 短い遅延を設けて、フィルター処理の完了を待つ
        if (isFilteringInProgress) {
            setTimeout(() => {
                // フィルター処理が完了しても結果が空の場合のみ「見つかりません」を表示
                if (container && (!Array.isArray(guides) || guides.length === 0)) {
                    const noMatchMsg = getText('条件に一致するガイドが見つかりません', 'No guides match your criteria');
                    container.innerHTML = `<div class="text-center p-4"><p class="text-muted">${noMatchMsg}</p></div>`;
                }
            }, 300);
            container.innerHTML = message;
        } else {
            container.innerHTML = message;
        }
        
        updateGuideCounters(0, window.AppState?.guides?.length || 0);
        return;
    }
    
    console.log(`🎨 Rendering ${guides.length} guide cards`, guides.map(g => g.name || g.guideName || 'Unknown'));
    
    // 🔧 Fix: Clamp currentPage to valid range before slicing
    const pageSize = 12; // Standard page size
    const totalPages = Math.max(1, Math.ceil(guides.length / pageSize));
    let currentPage = Math.min(Math.max(1, window.AppState?.currentPage || 1), totalPages);
    
    // Update AppState if currentPage was clamped
    if (window.AppState && window.AppState.currentPage !== currentPage) {
        console.log(`🔧 Clamping currentPage from ${window.AppState.currentPage} to ${currentPage}`);
        window.AppState.currentPage = currentPage;
    }
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Slice guides for current page
    const guidesForPage = guides.slice(startIndex, endIndex);
    
    // 🔧 Emergency fix: If guidesForPage is empty but guides exist, reset to page 1
    if (guidesForPage.length === 0 && guides.length > 0) {
        console.warn(`⚠️ Emergency reset: Page ${currentPage} resulted in empty guides, resetting to page 1`);
        currentPage = 1;
        if (window.AppState) window.AppState.currentPage = 1;
        const newStartIndex = (currentPage - 1) * pageSize;
        const newEndIndex = newStartIndex + pageSize;
        guidesForPage.splice(0, 0, ...guides.slice(newStartIndex, newEndIndex));
    }
    
    // ✅ FIX: 全体数は guides.length（渡された全リスト）を使う
    const total = guides.length;
    const actualEndIndex = Math.min(endIndex, total);
    
    console.log(`📄 Pagination: page ${currentPage}/${totalPages}, showing ${guidesForPage.length} of ${total} guides (${startIndex + 1}-${actualEndIndex})`);
    
    // Performance optimization for large guide lists
    if (guidesForPage.length > 30) {
        console.log('📊 Large guide page detected, using optimized rendering');
        renderGuideCardsOptimized(guidesForPage, container);
    } else {
        // Standard rendering for current page
        const cardsHTML = guidesForPage.map(guide => createGuideCardHTML(guide)).join('');
        container.innerHTML = cardsHTML;
    }
    
    // ✅ FIX: 範囲付きカウンター更新（startIndex+1 〜 actualEndIndex / total）
    // ⚠️ ペジネーション有効時はこの関数でのカウンター更新をスキップ（renderPageCardsが正確に更新する）
    if (!window.paginationEnabled) {
        updateGuideCountersWithRange(startIndex + 1, actualEndIndex, total);
    } else {
        console.log('⏭️ renderAllGuideCards counter update skipped - paginationEnabled=true');
    }
    
    // Setup view details event listeners
    setupViewDetailsEventListeners();
    
    // Update pagination display
    updatePaginationDisplay(currentPage, guides.length, pageSize);
    
    console.log(`✅ Rendered ${guidesForPage.length} guide cards for page ${currentPage} of ${Math.ceil(guides.length / pageSize)}`);
}

// Update pagination display elements
function updatePaginationDisplay(currentPage, totalGuides, pageSize) {
    const totalPages = Math.ceil(totalGuides / pageSize);
    
    // Update page info
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        const pageText = getText(`ページ ${currentPage}`, `Page ${currentPage}`);
        pageInfo.textContent = pageText;
    }
    
    // Update display range
    const displayRange = document.getElementById('displayRange');
    if (displayRange) {
        const startIndex = (currentPage - 1) * pageSize + 1;
        const endIndex = Math.min(currentPage * pageSize, totalGuides);
        displayRange.textContent = `${startIndex}-${endIndex}`;
    }
    
    // Update pagination buttons
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.classList.toggle('disabled', currentPage === 1);
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.classList.toggle('disabled', currentPage === totalPages);
    }
    
    console.log(`📄 Pagination updated: page ${currentPage}/${totalPages}, showing ${totalGuides} total guides`);
}

// Optimized rendering for large guide lists (50+ guides)
function renderGuideCardsOptimized(guides, container) {
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Batch process in chunks to avoid blocking UI
    const CHUNK_SIZE = 10;
    let index = 0;
    
    function renderChunk() {
        const endIndex = Math.min(index + CHUNK_SIZE, guides.length);
        
        for (let i = index; i < endIndex; i++) {
            const cardHTML = createGuideCardHTML(guides[i]);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cardHTML;
            fragment.appendChild(tempDiv.firstElementChild);
        }
        
        index = endIndex;
        
        if (index < guides.length) {
            // Schedule next chunk
            requestAnimationFrame(renderChunk);
        } else {
            // All chunks processed, update container
            container.innerHTML = '';
            container.appendChild(fragment);
            
            // Setup event listeners after all cards are rendered
            setupViewDetailsEventListeners();
        }
    }
    
    renderChunk();
}

// ✅ NEW: 範囲指定でカウンターを更新（ページネーション用）
export function updateGuideCountersWithRange(startNum, endNum, total) {
    const guideCounterElement = document.getElementById('guideCounter');
    const totalGuideCounterElement = document.getElementById('totalGuideCounter');
    
    console.log(`[DEBUG COUNTERS] updateGuideCountersWithRange: ${startNum}-${endNum} of ${total}`);
    
    if (guideCounterElement && totalGuideCounterElement) {
        const isEnglish = window.location.pathname.includes('index-en.html');
        
        if (isEnglish) {
            guideCounterElement.textContent = `${startNum}-${endNum} shown (${total} total)`;
            totalGuideCounterElement.textContent = `Total: ${total} guides registered`;
        } else {
            if (total === 0) {
                guideCounterElement.textContent = `0件表示中`;
            } else {
                guideCounterElement.textContent = `${startNum}-${endNum}件表示中 (${total}件中)`;
            }
            totalGuideCounterElement.textContent = `全体: ${total}名のガイドが登録済み`;
        }
        
        console.log(`✅ Counters updated: ${startNum}-${endNum} shown (${total} total)`);
    }
}

// Update guide counters for display - 🔧 完全修正版
export function updateGuideCounters(displayedCount, totalCount) {
    // ✅ FIX: ペジネーション有効時はこの関数をスキップ（onPageLoadで正確に更新済み）
    if (window.paginationEnabled) {
        console.log('⏭️ updateGuideCounters skipped - paginationEnabled=true');
        return;
    }
    
    // ✅ FIX: fullGuideListを優先的に使用
    const fullListTotal = window.AppState?.fullGuideList?.length ?? 
                          window.AppState?.originalGuides?.length ?? 0;
    const safeTotal = totalCount ?? fullListTotal;
    const safeDisplayed = displayedCount || 0;
    
    // 範囲表示に委譲（1-displayedCount / total）
    updateGuideCountersWithRange(1, safeDisplayed, safeTotal);
}

// Setup event listeners for view details, bookmark, and compare buttons
export function setupViewDetailsEventListeners() {
    console.log('🔧 Setting up view details, bookmark, and compare event listeners...');
    
    // Setup view details buttons - using the updated class name
    const viewDetailButtons = document.querySelectorAll('.view-detail-btn');
    console.log(`Found ${viewDetailButtons.length} view details buttons`);
    
    viewDetailButtons.forEach((btn, index) => {
        // Remove existing listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        const guideId = newBtn.getAttribute('data-guide-id');
        
        if (guideId) {
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 View Details clicked for guide:', guideId);
                
                if (window.showGuideDetailModalById) {
                    window.showGuideDetailModalById(guideId);
                } else if (window.viewGuideDetail) {
                    window.viewGuideDetail(guideId, e);
                } else {
                    console.warn('❌ Guide detail function not available');
                    // Fallback: same-window navigation (not new window)
                    const isEnglish = window.location.pathname.includes('-en.html');
                    const detailPage = isEnglish ? 'guide-detail-en.html' : 'guide-detail.html';
                    window.location.href = `${detailPage}?id=${guideId}`;
                }
            });
            console.log(`✅ Setup view detail button ${index + 1} for guide ID: ${guideId}`);
        } else {
            console.warn(`⚠️ View detail button ${index + 1} missing guide ID`);
        }
    });
    
    // Setup bookmark buttons
    const bookmarkButtons = document.querySelectorAll('.bookmark-btn');
    console.log(`Found ${bookmarkButtons.length} bookmark buttons`);
    
    bookmarkButtons.forEach((btn, index) => {
        // Remove existing listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        const guideId = newBtn.getAttribute('data-guide-id');
        
        if (guideId) {
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔖 Bookmark clicked for guide:', guideId);
                
                toggleBookmark(guideId);
                // Re-render guide cards to update button states WITHOUT resetting pagination
                if (window.AppState && window.AppState.guides) {
                    const usePagination = window.AppState.guides.length > 12;
                    renderGuideCards(window.AppState.guides, usePagination, false);
                }
            });
            console.log(`✅ Setup bookmark button ${index + 1} for guide ID: ${guideId}`);
        } else {
            console.warn(`⚠️ Bookmark button ${index + 1} missing guide ID`);
        }
    });
    
    // Setup compare buttons - Use delegation via button-setup.js
    // ✅ 比較ボタンはbutton-setup.jsの委譲ハンドラーで処理されるため、ここでは設定しない
    // これにより、ボタンの視覚的フィードバック（色変更）が正しく動作する
    const compareButtons = document.querySelectorAll('.compare-btn');
    console.log(`Found ${compareButtons.length} compare buttons (handled by button-setup.js delegation)`);
}

// Toggle bookmark functionality
function toggleBookmark(guideId) {
    const bookmarkedGuides = JSON.parse(localStorage.getItem('bookmarkedGuides') || '[]');
    // ✅ UUID対応 + 正規化: すべてを文字列として比較・保存
    const id = String(guideId);
    
    // ✅ 正規化: 既存のIDを文字列に変換して重複チェック
    const normalizedList = bookmarkedGuides.map(b => String(b));
    const exists = normalizedList.includes(id);
    
    let updatedBookmarks;
    if (exists) {
        // Remove from bookmarks (正規化済みリストから削除)
        updatedBookmarks = bookmarkedGuides.filter(b => String(b) !== id);
        console.log('❌ Guide removed from bookmarks:', guideId);
        
        if (typeof safeShowToast === 'function') {
            const removeMsg = getText('ブックマークから削除しました', 'Removed from bookmarks');
            safeShowToast(removeMsg, 'info');
        }
    } else {
        // Add to bookmarks and de-duplicate
        updatedBookmarks = [...new Set([...normalizedList, id])];
        console.log('✅ Guide added to bookmarks:', guideId);
        
        if (typeof safeShowToast === 'function') {
            const addMsg = getText('ブックマークに追加しました', 'Added to bookmarks');
            safeShowToast(addMsg, 'warning');
        }
    }
    
    localStorage.setItem('bookmarkedGuides', JSON.stringify(updatedBookmarks));
    
    // ✅ カスタムイベントを発火して管理センターを更新
    window.dispatchEvent(new Event('bookmarkChanged'));
}

// ⚠️ DEPRECATED: Toggle comparison functionality (moved to button-setup.js)
// This function is kept for backward compatibility but is no longer used
// All comparison logic is now handled by button-setup.js > handleCompareClick()
function toggleComparison(guideId) {
    console.warn('⚠️ toggleComparison called from deprecated location. Use handleCompareClick in button-setup.js instead.');
    // No-op to prevent duplicate toast messages
    // The actual functionality is in button-setup.js > handleCompareClick()
}

// 延長対応バッジのHTML生成
function getExtensionBadgeHTML(guide) {
  // ✅ [DEBUG] extensionPolicy 確認ログ
  console.log(`🏷️ [EXTENSION] guide.id=${guide.id}, extensionPolicy="${guide.extensionPolicy}", canExtend="${guide.canExtend}", extension="${guide.extension}"`);
  
  // ✅ extensionPolicy を正規化（大文字/小文字両対応）
  const rawPolicy = guide.extensionPolicy;
  let normalizedPolicy = null;
  
  if (rawPolicy !== undefined && rawPolicy !== null && rawPolicy !== '') {
    const upper = String(rawPolicy).toUpperCase();
    if (upper === 'OK') normalizedPolicy = 'ok';
    else if (upper === 'CONSULT' || upper === 'ASK') normalizedPolicy = 'ask';
    else if (upper === 'NG' || upper === 'NO') normalizedPolicy = 'no';
    else normalizedPolicy = String(rawPolicy).toLowerCase();
  }
  
  // legacy fallback: extensionPolicy が未設定の場合のみ
  if (!normalizedPolicy) {
    if (guide.canExtend === true || guide.extension === true) {
      normalizedPolicy = 'ok';
    } else if (guide.canExtend === false || guide.extension === false) {
      normalizedPolicy = 'no';
    }
  }
  
  // 未設定の場合は表示しない
  if (!normalizedPolicy) {
    console.log(`🏷️ [EXTENSION] No policy set, hiding badge`);
    return '';
  }
  
  const isEn = typeof isEnglishPage === 'function' ? isEnglishPage() : false;
  
  const badges = {
    ok: {
      text: isEn ? 'Extension OK' : '延長OK',
      color: 'bg-info'
    },
    ask: {
      text: isEn ? 'Extension: Ask' : '延長:要相談',
      color: 'bg-warning text-dark'
    },
    no: {
      text: isEn ? 'No Extension' : '延長不可',
      color: 'bg-light text-muted'
    }
  };
  
  const badge = badges[normalizedPolicy] || null;
  
  // 未知の値の場合は表示しない
  if (!badge) {
    console.log(`🏷️ [EXTENSION] Unknown policy "${normalizedPolicy}", hiding badge`);
    return '';
  }
  
  console.log(`🏷️ [EXTENSION] Showing badge: ${badge.text}`);
  
  // 深夜対応バッジ（オプション）- 大文字/小文字両対応
  const rawLateNight = guide.lateNightPolicy;
  const lateNight = rawLateNight && String(rawLateNight).toUpperCase() === 'OK';
  const lateNightBadge = lateNight 
    ? `<span class="badge bg-dark me-1" style="font-size:.65rem"><i class="bi bi-moon"></i> ${isEn ? 'Late OK' : '深夜OK'}</span>`
    : '';
  
  return `<div class="mb-1">
    <span class="badge ${badge.color} me-1" style="font-size:.65rem"><i class="bi bi-clock-history"></i> ${badge.text}</span>
    ${lateNightBadge}
  </div>`;
}

// HTMLを1枚のガイドカードとして組み立てる（重複タイトルや画像404を解消）
export function createGuideCardHTML(guide) {
  // 表示用の名前（日本語ページなら guide.name 優先、英語ページなら guide.guideName 優先）
  const defaultNameJa = 'ガイド';
  const defaultNameEn = 'Guide';
  const isEn = typeof isEnglishPage === 'function' ? isEnglishPage() : false;

  const nameToShow = isEn
    ? (guide.guideName || guide.name || defaultNameEn)
    : (guide.name || guide.guideName || defaultNameJa);

  // 画像（profileImageUrl優先、フォールバックとしてprofilePhoto、最後にデフォルト）
  // ✅ FIX: デフォルト画像をガイドIDに基づいてバリエーションを持たせる
  const defaultImageIndex = ((guide.id?.charCodeAt(0) || 1) % 5) + 1; // 1-5のバリエーション
  const defaultImage = `/assets/img/guides/default-${defaultImageIndex}.svg`;
  
  const photoSrc = guide.profileImageUrl
    ? guide.profileImageUrl
    : (guide.profilePhoto?.profileImageUrl
      ? guide.profilePhoto.profileImageUrl
      : (guide.profilePhoto
        ? (String(guide.profilePhoto).startsWith('http') ? guide.profilePhoto : `/uploads/${guide.profilePhoto}`)
        : defaultImage));

  // 価格表記
  const priceNum = Number(guide.sessionRate || guide.guideSessionRate || guide.price || 0);
  const priceText = !isNaN(priceNum) && priceNum > 0
    ? `¥${priceNum.toLocaleString('ja-JP')}`
    : '¥0';

  // 地域名（✅ 英語コード→日本語正規化を適用）
  // FIX: 大文字小文字を無視してマッピングを検索
  const locationNames = window.locationNames || {};
  const locationKey = guide.location ? String(guide.location).toLowerCase() : '';
  let rawLocation = locationNames[locationKey] || guide.location || '';
  // 日本語ページの場合は都道府県を正規化
  const locationText = !isEn ? normalizePrefecture(rawLocation) : rawLocation;

  // 言語・専門分野（配列でない可能性にも対応）
  let langs = Array.isArray(guide.languages)
    ? guide.languages
    : (guide.languages ? String(guide.languages).split(',') : []);
  
  // 言語をローカライズ（日本語版では日本語表示、英語版では英語表示）
  const currentLocale = isEn ? 'en' : 'ja';
  if (typeof localizeLanguageArray === 'function') {
    langs = localizeLanguageArray(langs, currentLocale);
  }
  
  let specialties = Array.isArray(guide.specialties)
    ? guide.specialties
    : (guide.specialties ? String(guide.specialties).split(',').map(s => s.trim()) : []);
  
  // 専門分野をローカライズ
  if (typeof localizeSpecialtyArray === 'function') {
    specialties = localizeSpecialtyArray(specialties, currentLocale);
  }

  // ボタン文言
  const viewDetailsText = typeof getText === 'function'
    ? getText('詳細を見る', 'View Details')
    : (isEn ? 'View Details' : '詳細を見る');

  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card h-100 guide-card" data-guide-id="${guide.id}"
           style="border-radius:15px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,.08);">
        <img src="${photoSrc}" class="card-img-top"
             style="height:200px; object-fit:cover;"
             alt="${nameToShow}"
             onerror="this.src='assets/img/guides/default-1.svg';">

        <div class="card-body d-flex flex-column">
          <!-- タイトルは1つだけ（重複表示を解消） -->
          <h5 class="card-title mb-1">${nameToShow}</h5>

          <div class="mb-2">
            ${locationText ? `<span class="badge bg-primary me-1">${locationText}</span>` : ''}
          </div>

          <div class="mb-1">
            ${langs.map(l => `<span class="badge bg-success me-1" style="font-size:.75rem">${l}</span>`).join('')}
          </div>

          <div class="mb-1">
            ${specialties.map(s => `<span class="badge bg-secondary me-1" style="font-size:.75rem">${s}</span>`).join('')}
          </div>

          ${getExtensionBadgeHTML(guide)}

          <p class="card-text text-muted small mb-2">${guide.introduction || ''}</p>

          <div class="d-flex justify-content-between align-items-center mt-auto">
            <span class="fw-bold">${priceText}</span>
            <button type="button"
                    class="btn btn-outline-primary btn-sm view-detail-btn"
                    data-guide-id="${guide.id}">
              ${viewDetailsText}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Duplicate function removed - using the one at line 168

// Function removed - using the exported version at line 188

// Handle view details button click with authentication check
function handleViewDetailsClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const guideId = event.currentTarget.getAttribute('data-guide-id');
    
    if (!guideId) {
        console.error('❌ No guide ID found on clicked button');
        return;
    }
    
    console.log('🔍 View details clicked for guide:', guideId);
    
    // Check tourist authentication status
    checkTouristAuthAndRedirect(guideId);
}

// Tourist/Guide authentication check and redirect system
function checkTouristAuthAndRedirect(guideId) {
    console.log('🔐 Checking authentication for guide:', guideId);
    
    // Check if tourist is logged in (check sessionStorage first, then localStorage)
    const touristAuth = sessionStorage.getItem('touristAuth') || localStorage.getItem('touristAuth');
    const touristData = sessionStorage.getItem('touristData') || sessionStorage.getItem('touristRegistrationData') || localStorage.getItem('touristRegistrationData');
    
    // Check if guide is logged in
    const guideAuth = sessionStorage.getItem('guideAuth');
    const guideData = sessionStorage.getItem('guideData');
    
    // Debug: Log all storage values
    console.log('🔍 Auth check details:', {
        sessionAuth: sessionStorage.getItem('touristAuth'),
        localAuth: localStorage.getItem('touristAuth'),
        sessionData: sessionStorage.getItem('touristData'),
        sessionRegData: sessionStorage.getItem('touristRegistrationData'),
        localRegData: localStorage.getItem('touristRegistrationData'),
        guideAuth: guideAuth,
        guideData: guideData ? 'present' : 'null',
        finalTouristAuth: touristAuth,
        finalTouristData: touristData
    });
    
    // Allow access if user is logged in as either tourist or guide
    if (touristAuth || touristData || guideAuth || guideData) {
        if (touristAuth || touristData) {
            console.log('✅ Tourist is authenticated, redirecting to guide detail');
        } else {
            console.log('✅ Guide is authenticated, redirecting to guide detail');
        }
        // User is authenticated, proceed to guide detail page
        redirectToGuideDetail(guideId);
    } else {
        console.log('⚠️ Tourist not authenticated, showing registration prompt');
        // User is not authenticated, show registration modal
        showTouristRegistrationPrompt(guideId);
    }
}

// Show tourist registration prompt modal
function showTouristRegistrationPrompt(guideId) {
    // Create modal for tourist registration prompt
    const modalHTML = `
        <div class="modal fade" id="touristAuthModal" tabindex="-1" aria-labelledby="touristAuthModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="border-radius: 20px; border: none;">
                    <div class="modal-header" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 20px 20px 0 0;">
                        <h5 class="modal-title" id="touristAuthModalLabel">
                            <i class="bi bi-person-check me-2"></i>観光客登録が必要です
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="text-center mb-4">
                            <i class="bi bi-info-circle text-primary" style="font-size: 3rem;"></i>
                        </div>
                        
                        <p class="text-center mb-4">
                            ガイドの詳細情報を閲覧するには観光客登録が必要です。<br>
                            簡単な登録でガイドとの連絡やお気に入り機能をご利用いただけます。
                        </p>
                        
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary btn-lg" onclick="openTouristRegistrationWithReturn('${guideId}')" style="background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 15px;">
                                <i class="bi bi-person-plus me-2"></i>観光客登録を行う
                            </button>
                            <button class="btn btn-outline-secondary" data-bs-dismiss="modal" style="border-radius: 15px;">
                                キャンセル
                            </button>
                        </div>
                        
                        <div class="text-center mt-3">
                            <small class="text-muted">
                                既に登録済みの場合は<br>
                                <a href="#" onclick="showTouristLoginModal('${guideId}')" class="text-primary">こちらからログイン</a>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.getElementById('touristAuthModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('touristAuthModal'));
    modal.show();
}

// Redirect to guide detail page
function redirectToGuideDetail(guideId) {
    console.log('🔗 Redirecting to guide detail page for guide:', guideId);
    
    // ✅ NEW: 遷移前に検索状態を保存（モジュール使用）
    saveStateBeforeDetail();
    
    // Detect current page language and redirect to appropriate detail page
    const isEnglish = window.location.pathname.includes('-en.html');
    const detailPage = isEnglish ? '/guide-detail-en.html' : '/guide-detail.html';
    
    console.log(`🌐 Detected language: ${isEnglish ? 'English' : 'Japanese'}, redirecting to ${detailPage}`);
    window.location.href = `${detailPage}?id=${guideId}`;
}

// Global functions for tourist registration with return capability
window.openTouristRegistrationWithReturn = function(guideId) {
    console.log('🔗 Opening tourist registration with return to guide:', guideId);
    
    // Store the guide ID for return after registration
    sessionStorage.setItem('returnToGuideId', guideId);
    
    // Close the auth modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('touristAuthModal'));
    if (modal) {
        modal.hide();
    }
    
    // Open tourist registration page
    window.location.href = 'tourist-registration-simple.html';
};

window.showTouristLoginModal = function(guideId) {
    console.log('🔐 Showing tourist login modal for guide:', guideId);
    
    // Store guide ID for return after login
    sessionStorage.setItem('returnToGuideId', guideId);
    
    // Close the auth modal first
    const authModal = bootstrap.Modal.getInstance(document.getElementById('touristAuthModal'));
    if (authModal) {
        authModal.hide();
    }
    
    // Show the existing global tourist login modal instead of creating a new one
    const existingLoginModal = document.getElementById('touristLoginModal');
    if (existingLoginModal) {
        const modal = new bootstrap.Modal(existingLoginModal);
        modal.show();
        console.log('✅ Opened existing tourist login modal');
    } else {
        console.error('❌ Tourist login modal not found in page');
        // Fallback: redirect to home page where login modal exists
        alert('ログインするにはホームページに戻ります');
        window.location.href = '/';
    }
};

// ✅ NEW: フィルタ結果専用の描画関数 - 唯一の描画パス
export async function renderFilteredGuides(filteredGuides) {
    console.log('[RENDER] ============ renderFilteredGuides() CALLED ============');
    console.log('[RENDER] rendering guides from filteredGuides:', filteredGuides.length);
    
    const container = document.getElementById('guidesContainer') || 
                      document.getElementById('guide-list') || 
                      document.getElementById('guideCardsContainer') ||
                      document.querySelector('.guide-cards-container .row') ||
                      document.querySelector('section#search-results .row');
    
    if (!container) {
        console.error('[RENDER] ERROR: Container not found');
        return;
    }
    
    // ✅ フィルタ結果が0件の場合
    if (!filteredGuides || filteredGuides.length === 0) {
        const noMatchMsg = isEnglishPage() ? 'No guides match your criteria' : '条件に一致するガイドが見つかりません';
        container.innerHTML = `<div class="text-center p-4"><p class="text-muted">${noMatchMsg}</p></div>`;
        updateGuideCountersWithRange(0, 0, 0);
        
        // ページネーションを非表示
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) paginationContainer.innerHTML = '';
        
        console.log('[RENDER] No matching guides - displayed empty state');
        return;
    }
    
    const pageSize = 12;
    
    // ✅ AppState更新（ページネーションコールバックとの整合性のため）
    if (window.AppState) {
        window.AppState.currentPage = 1;
        window.AppState.filteredGuides = filteredGuides;
        window.AppState.guides = filteredGuides; // ✅ CRITICAL: 他のレンダーパスとの整合性
        window.AppState.paginationSourceList = filteredGuides; // ✅ NEW: ページネーション統一ソース
        window.AppState.isFiltered = true; // ✅ フィルタ状態を明示的に設定
    }
    
    // ✅ CRITICAL FIX: 常にpaginationSystemをフィルタ結果で更新
    // これにより次ページボタンが全体リストではなくフィルタ結果を参照する
    if (window.paginationSystem) {
        window.paginationSystem.setFilteredData(filteredGuides);
        console.log(`[PAGINATION] setFilteredData: ${filteredGuides.length} guides, totalPages: ${window.paginationSystem.totalPages}`);
    }
    
    // ✅ ページネーションシステムを使用（12件超の場合）
    if (filteredGuides.length > pageSize && window.paginationSystem) {
        console.log('[PAGINATION] using filtered list:', filteredGuides.length, 'guides');
        
        window.paginationSystem.renderPagination();
        window.paginationSystem.updatePageInfo();
        
        // ✅ goToPage(1)でコールバックを発火させて描画
        window.paginationSystem.goToPage(1);
        
        console.log(`[RENDER] Pagination initialized: ${filteredGuides.length} filtered guides`);
    } else {
        // ページネーション不要の場合（12件以下）
        const pageItems = filteredGuides.slice(0, pageSize);
        const cardsHTML = pageItems.map(guide => createGuideCardHTML(guide)).join('');
        container.innerHTML = cardsHTML;
        
        // ✅ 件数表示を更新
        updateGuideCountersWithRange(1, pageItems.length, filteredGuides.length);
        
        // イベントリスナー設定
        setupViewDetailsEventListeners();
        
        // ✅ ページネーションを非表示（1ページ以下なので不要）
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) paginationContainer.innerHTML = '';
        
        console.log(`[RENDER] Rendered ${pageItems.length} cards (no pagination needed, totalPages: ${window.paginationSystem?.totalPages || 0})`);
    }
    
    console.log('[RENDER] ============ renderFilteredGuides() COMPLETE ============');
}

// Make functions globally available for filter system
if (typeof window !== 'undefined') {
    window.renderGuideCards = renderGuideCards;
    window.updateGuideCounters = updateGuideCounters;
    window.setupViewDetailsEventListeners = setupViewDetailsEventListeners;
    window.createGuideCardHTML = createGuideCardHTML;  // Export for consistency
    window.checkTouristAuthAndRedirect = checkTouristAuthAndRedirect;
    window.redirectToGuideDetail = redirectToGuideDetail;
    window.renderFilteredGuides = renderFilteredGuides;  // ✅ NEW: フィルタ専用描画
}