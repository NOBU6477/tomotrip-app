// Management Center Functions - CSP Compliant
// All management-related inline scripts moved to external file

// Use global locationNames (defined in app-init.js) - no local declaration

// Management Center Functions
function showManagementCenter() {
    console.log('📊 Opening Management Center from management.js...');
    const managementModal = new bootstrap.Modal(document.getElementById('managementModal'));
    managementModal.show();
    
    // Load data after modal is shown to ensure DOM is ready
    setTimeout(() => {
        loadManagementData();
    }, 100);
}

// グローバルに公開してindex.htmlの関数を上書き
window.showManagementCenter = showManagementCenter;

// ✅ イベントリスナー重複登録を防ぐフラグ
let managementListenersAttached = false;

// ✅ localStorage データ正規化関数（UUID対応）
window.migrateStorageFormats = function() {
    console.log('🔄 Starting localStorage migration for UUID compatibility...');
    
    // ブックマークの正規化
    try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedGuides') || '[]');
        const validBookmarks = bookmarks
            .map(id => String(id))
            .filter(id => {
                // UUID形式または有効な文字列のみ保持（数値やnullを除外）
                const isValid = id && id !== 'null' && id !== 'undefined' && 
                               (id.includes('-') || id.length > 10);
                if (!isValid) {
                    console.warn('⚠️ Removing invalid bookmark ID:', id);
                }
                return isValid;
            });
        
        // 重複削除
        const uniqueBookmarks = [...new Set(validBookmarks)];
        localStorage.setItem('bookmarkedGuides', JSON.stringify(uniqueBookmarks));
        console.log(`✅ Bookmarks migrated: ${bookmarks.length} → ${uniqueBookmarks.length}`);
    } catch (e) {
        console.error('❌ Bookmark migration failed:', e);
    }
    
    // 比較リストの正規化
    try {
        const comparisons = JSON.parse(localStorage.getItem('comparisonGuides') || '[]');
        const validComparisons = comparisons
            .map(id => String(id))
            .filter(id => {
                // UUID形式または有効な文字列のみ保持（数値やnullを除外）
                const isValid = id && id !== 'null' && id !== 'undefined' && 
                               (id.includes('-') || id.length > 10);
                if (!isValid) {
                    console.warn('⚠️ Removing invalid comparison ID:', id);
                }
                return isValid;
            });
        
        // 重複削除
        const uniqueComparisons = [...new Set(validComparisons)];
        localStorage.setItem('comparisonGuides', JSON.stringify(uniqueComparisons));
        console.log(`✅ Comparisons migrated: ${comparisons.length} → ${uniqueComparisons.length}`);
    } catch (e) {
        console.error('❌ Comparison migration failed:', e);
    }
    
    console.log('✅ localStorage migration complete');
};

async function loadManagementData() {
    // ✅ マイグレーション実行（最初に一度のみ）
    if (window.migrateStorageFormats) {
        window.migrateStorageFormats();
    }
    
    // ✅ イベントリスナーを一度だけ登録（重複防止）
    if (!managementListenersAttached) {
        window.addEventListener('bookmarkChanged', function() {
            console.log('🔄 Bookmark change detected, reloading management data...');
            loadBookmarksList();
        });
        
        window.addEventListener('comparisonChanged', function() {
            console.log('🔄 Comparison change detected, reloading management data...');
            loadComparisonList();
        });
        
        managementListenersAttached = true;
        console.log('✅ Management event listeners attached (one-time setup)');
    }
    
    // ガイドデータが読み込まれるまで待機（正しい引数で統一されたwaitForGuideDataを使用）
    if (window.waitForGuideData) {
        await window.waitForGuideData(5000); // maxWaitTime=5000ms
    } else {
        await waitForGuideData(10, 500); // maxRetries=10, delay=500ms
    }
    
    loadBookmarksList();
    loadComparisonList();
    loadBookingsList();
    loadSettingsData();
}

// ガイドデータの読み込み完了を待機する関数
async function waitForGuideData(maxRetries = 10, delay = 500) {
    console.log('🔄 Waiting for guide data to load...');
    
    for (let i = 0; i < maxRetries; i++) {
        const appState = window.AppState;
        const guides = appState?.originalGuides || appState?.guides || [];
        
        if (guides.length > 0) {
            console.log('✅ Guide data loaded:', guides.length, 'guides available');
            return guides;
        }
        
        console.log(`⏳ Waiting for guide data... (attempt ${i + 1}/${maxRetries})`);
        
        // ローディング表示を更新
        updateLoadingStatus(i + 1, maxRetries);
        
        // 待機
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.warn('⚠️ Guide data not loaded after maximum retries, proceeding anyway');
    return [];
}

// ローディング状態の表示
function updateLoadingStatus(attempt, maxAttempts) {
    const bookmarksList = document.getElementById('bookmarksList');
    const comparisonList = document.getElementById('comparisonList');
    
    const loadingHTML = `
        <div class="col-12 text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted mt-2">データ読込中... (${attempt}/${maxAttempts})</p>
        </div>
    `;
    
    if (bookmarksList) bookmarksList.innerHTML = loadingHTML;
    if (comparisonList) comparisonList.innerHTML = loadingHTML;
}

function loadBookmarksList() {
    // ✅ 直接localStorage読み取り（UUID対応）
    const bookmarkedGuides = JSON.parse(localStorage.getItem('bookmarkedGuides') || '[]');
    const bookmarksList = document.getElementById('bookmarksList');
    
    console.log('📋 Loading bookmarks:', { bookmarkedGuides, count: bookmarkedGuides.length });
    
    if (bookmarkedGuides.length === 0) {
        bookmarksList.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-bookmark text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-3">保存されたガイドはありません</p>
                <p class="small text-muted">ガイドカードの<i class="bi bi-bookmark"></i>ボタンをクリックして保存してください</p>
            </div>
        `;
        return;
    }
    
    // ガイドデータを複数のソースから取得（フォールバック機能付き）
    const allGuides = window.AppState?.originalGuides || window.AppState?.guides || window.guidesData || [];
    console.log('📋 All guides for bookmarks:', allGuides.length);
    
    // APIから直接ガイドデータを取得するフォールバック
    if (allGuides.length === 0) {
        console.warn('⚠️ No guide data in AppState, trying API fallback...');
        fetch('/api/guides')
            .then(res => res.json())
            .then(result => {
                console.log('📋 API response:', result);
                if (result && result.success && Array.isArray(result.guides)) {
                    // APIガイドデータでブックマークリストを再作成
                    loadBookmarksListWithGuides(bookmarkedGuides, result.guides);
                } else {
                    console.error('❌ Invalid API response format');
                }
            })
            .catch(err => console.error('❌ API fallback failed:', err));
        return;
    }
    // ✅ FIX: ブックマーク表示を修正 - UUID対応（文字列比較のみ）
    const bookmarkCards = [];
    for (const guideId of bookmarkedGuides) {
        const guide = allGuides.find(g => String(g.id) === String(guideId));
        if (!guide) {
            console.warn('⚠️ Bookmarked guide not found:', guideId);
            continue;
        }
        
        bookmarkCards.push(`
            <div class="col-md-6 mb-3">
                <div class="card h-100">
                    <div class="row g-0">
                        <div class="col-4">
                            <img src="${guide.profilePhoto ? `/uploads/${guide.profilePhoto}` : '/assets/img/guides/default-1.svg'}" class="img-fluid rounded-start h-100" style="object-fit: cover;" alt="ガイド" onerror="this.src='/assets/img/guides/default-1.svg'">
                        </div>
                        <div class="col-8">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-1">${guide.name || guide.guideName || 'ガイド'}</h6>
                                <p class="card-text small text-muted mb-2">${window.locationNames?.[guide.location] || guide.location || guide.city || '東京'}</p>
                                <p class="card-text"><strong>¥${Number(guide?.price || guide?.sessionRate || guide?.guideSessionRate || 0).toLocaleString()}</strong></p>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-outline-primary btn-sm" data-action="show-guide-detail" data-guide-id="${guide.id}">詳細</button>
                                    <button class="btn btn-outline-danger btn-sm" data-action="remove-bookmark" data-guide-id="${guide.id}">削除</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    
    bookmarksList.innerHTML = bookmarkCards.length > 0 ? bookmarkCards.join('') : `
        <div class="col-12 text-center py-5">
            <i class="bi bi-bookmark text-muted" style="font-size: 3rem;"></i>
            <p class="text-muted mt-3">保存されたガイドはありません</p>
            <p class="small text-muted">ガイドカードの<i class="bi bi-bookmark"></i>ボタンをクリックして保存してください</p>
        </div>
    `;
    
    console.log('✅ Bookmarks loaded:', bookmarkCards.length, 'guides displayed');
    
    // Setup event listeners for dynamically created buttons
    setupManagementEventListeners();
}

// APIガイドデータでブックマークリストを作成するフォールバック関数
function loadBookmarksListWithGuides(bookmarkedGuides, allGuides) {
    const bookmarksList = document.getElementById('bookmarksList');
    
    // ✅ FIX: APIガイドデータでブックマーク表示を修正（UUID対応）
    const bookmarkCards = [];
    for (const guideId of bookmarkedGuides) {
        const guide = allGuides.find(g => String(g.id) === String(guideId));
        if (!guide) {
            console.warn('⚠️ Bookmarked guide not found:', guideId);
            continue;
        }
        
        bookmarkCards.push(`
            <div class="col-md-6 mb-3">
                <div class="card h-100">
                    <div class="row g-0">
                        <div class="col-4">
                            <img src="${guide.profilePhoto ? `/uploads/${guide.profilePhoto}` : '/assets/img/guides/default-1.svg'}" class="img-fluid rounded-start h-100" style="object-fit: cover;" alt="ガイド" onerror="this.src='/assets/img/guides/default-1.svg'">
                        </div>
                        <div class="col-8">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-1">${guide.name || guide.guideName || 'ガイド'}</h6>
                                <p class="card-text small text-muted mb-2">${guide.location || guide.city || '東京'}</p>
                                <p class="card-text"><strong>¥${Number(guide?.price || guide?.sessionRate || guide?.guideSessionRate || 0).toLocaleString()}</strong></p>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-outline-primary btn-sm" data-action="show-guide-detail" data-guide-id="${guide.id}">詳細</button>
                                    <button class="btn btn-outline-danger btn-sm" data-action="remove-bookmark" data-guide-id="${guide.id}">削除</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    
    bookmarksList.innerHTML = bookmarkCards.length > 0 ? bookmarkCards.join('') : `
        <div class="col-12 text-center py-5">
            <i class="bi bi-bookmark text-muted" style="font-size: 3rem;"></i>
            <p class="text-muted mt-3">保存されたガイドはありません</p>
            <p class="small text-muted">ガイドカードの<i class="bi bi-bookmark"></i>ボタンをクリックして保存してください</p>
        </div>
    `;
    
    console.log('✅ API Bookmarks loaded:', bookmarkCards.length, 'guides displayed');
    setupManagementEventListeners();
}

function loadComparisonList() {
    // ✅ 直接localStorage読み取り（UUID対応）
    const comparisonGuides = JSON.parse(localStorage.getItem('comparisonGuides') || '[]');
    const comparisonList = document.getElementById('comparisonList');
    
    console.log('📊 Loading comparisons:', { comparisonGuides, count: comparisonGuides.length });
    
    if (comparisonGuides.length === 0) {
        comparisonList.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-graph-up text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-3">比較中のガイドはありません</p>
                <p class="small text-muted">ガイドカードの<i class="bi bi-bar-chart"></i>ボタンをクリックして比較に追加してください</p>
            </div>
        `;
        return;
    }
    
    // ガイドデータを複数のソースから取得（フォールバック機能付き）
    const allGuides = window.AppState?.originalGuides || window.AppState?.guides || window.guidesData || [];
    console.log('📊 All guides for comparison:', allGuides.length);
    
    // APIから直接ガイドデータを取得するフォールバック
    if (allGuides.length === 0) {
        console.warn('⚠️ No guide data in AppState, trying API fallback...');
        fetch('/api/guides')
            .then(res => res.json())
            .then(result => {
                console.log('📊 API response:', result);
                if (result && result.success && Array.isArray(result.guides)) {
                    // APIガイドデータで比較リストを再作成
                    loadComparisonListWithGuides(comparisonGuides, result.guides);
                } else {
                    console.error('❌ Invalid API response format');
                }
            })
            .catch(err => console.error('❌ API fallback failed:', err));
        return;
    }
    // ✅ FIX: 比較リストの表示を修正 - UUID対応（文字列比較のみ）
    const comparisonCards = [];
    for (const guideId of comparisonGuides) {
        const guide = allGuides.find(g => String(g.id) === String(guideId));
        if (!guide) {
            console.warn('⚠️ Comparison guide not found:', guideId);
            continue;
        }
        
        comparisonCards.push(`
            <div class="col-md-4 mb-3">
                <div class="card h-100 border-success">
                    <img src="${guide.profilePhoto ? `/uploads/${guide.profilePhoto}` : '/assets/img/guides/default-1.svg'}" class="card-img-top" style="height: 120px; object-fit: cover;" alt="ガイド" onerror="this.src='/assets/img/guides/default-1.svg'">
                    <div class="card-body p-3 d-flex flex-column">
                        <h6 class="card-title mb-1">${guide.name || guide.guideName || 'ガイド'}</h6>
                        <p class="card-text small text-muted mb-1">${window.locationNames?.[guide.location] || guide.location || guide.city || '東京'}</p>
                        <p class="card-text small mb-2"><span class="text-warning">★</span> ${guide.rating || guide.averageRating || '4.8'}</p>
                        <p class="card-text mb-3"><strong>¥${Number(guide?.price || guide?.sessionRate || guide?.guideSessionRate || 0).toLocaleString()}</strong></p>
                        <div class="mt-auto">
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-primary btn-sm" data-action="show-guide-detail" data-guide-id="${guide.id}">
                                    <i class="bi bi-info-circle me-1"></i>詳細
                                </button>
                                <button class="btn btn-outline-danger btn-sm" data-action="remove-from-comparison" data-guide-id="${guide.id}">
                                    <i class="bi bi-x me-1"></i>比較から除外
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    
    comparisonList.innerHTML = comparisonCards.length > 0 ? comparisonCards.join('') : `
        <div class="col-12 text-center py-5">
            <i class="bi bi-bar-chart text-muted" style="font-size: 3rem;"></i>
            <p class="text-muted mt-3">比較中のガイドはありません</p>
            <p class="small text-muted">ガイドカードの<i class="bi bi-check2-square"></i>ボタンをクリックして追加してください</p>
        </div>
    `;
    
    console.log('✅ Comparisons loaded:', comparisonCards.length, 'guides displayed');
    
    // Setup event listeners for dynamically created buttons
    setupManagementEventListeners();
}

// APIガイドデータで比較リストを作成するフォールバック関数
function loadComparisonListWithGuides(comparisonGuides, allGuides) {
    const comparisonList = document.getElementById('comparisonList');
    
    // ✅ FIX: APIガイドデータで比較表示を修正（UUID対応）
    const comparisonCards = [];
    for (const guideId of comparisonGuides) {
        const guide = allGuides.find(g => String(g.id) === String(guideId));
        if (!guide) {
            console.warn('⚠️ Comparison guide not found:', guideId);
            continue;
        }
        
        comparisonCards.push(`
            <div class="col-md-4 mb-3">
                <div class="card h-100 border-success">
                    <img src="${guide.profilePhoto ? `/uploads/${guide.profilePhoto}` : '/assets/img/guides/default-1.svg'}" class="card-img-top" style="height: 120px; object-fit: cover;" alt="ガイド" onerror="this.src='/assets/img/guides/default-1.svg'">
                    <div class="card-body p-3 d-flex flex-column">
                        <h6 class="card-title mb-1">${guide.name || guide.guideName || 'ガイド'}</h6>
                        <p class="card-text small text-muted mb-1">${guide.location || guide.city || '東京'}</p>
                        <p class="card-text small mb-2"><span class="text-warning">★</span> ${guide.rating || guide.averageRating || '4.8'}</p>
                        <p class="card-text mb-3"><strong>¥${Number(guide?.price || guide?.sessionRate || guide?.guideSessionRate || 0).toLocaleString()}</strong></p>
                        <div class="mt-auto">
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-primary btn-sm" data-action="show-guide-detail" data-guide-id="${guide.id}">
                                    <i class="bi bi-info-circle me-1"></i>詳細
                                </button>
                                <button class="btn btn-outline-danger btn-sm" data-action="remove-from-comparison" data-guide-id="${guide.id}">
                                    <i class="bi bi-x me-1"></i>比較から除外
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    
    comparisonList.innerHTML = comparisonCards.length > 0 ? comparisonCards.join('') : `
        <div class="col-12 text-center py-5">
            <i class="bi bi-bar-chart text-muted" style="font-size: 3rem;"></i>
            <p class="text-muted mt-3">比較中のガイドはありません</p>
            <p class="small text-muted">ガイドカードの<i class="bi bi-check2-square"></i>ボタンをクリックして追加してください</p>
        </div>
    `;
    
    console.log('✅ API Comparisons loaded:', comparisonCards.length, 'guides displayed');
    setupManagementEventListeners();
}

function loadBookingsList() {
    const userBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
    const bookingsList = document.getElementById('bookingsList');
    
    if (userBookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-calendar3 text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-3">予約履歴はありません</p>
            </div>
        `;
        return;
    }
    
    // Sort bookings by date (newest first)
    const sortedBookings = userBookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
    
    bookingsList.innerHTML = sortedBookings.map(booking => {
        const statusBadge = {
            'pending': '<span class="badge bg-warning">予約中</span>',
            'confirmed': '<span class="badge bg-success">確定</span>',
            'completed': '<span class="badge bg-info">完了</span>',
            'cancelled': '<span class="badge bg-danger">キャンセル</span>'
        };
        
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-2">
                            <img src="attached_assets/image_1754398586272.png" class="img-fluid rounded-circle" style="width: 60px; height: 60px; object-fit: cover;" alt="ガイド">
                        </div>
                        <div class="col-md-6">
                            <h6 class="mb-1">${booking.guideName || 'ガイド名'}</h6>
                            <p class="mb-1 text-muted small">予約ID: #${booking.id || 'N/A'}</p>
                            <p class="mb-0 small">日時: ${booking.date || ''} ${booking.time || ''} (${booking.duration || 0}時間)</p>
                        </div>
                        <div class="col-md-2 text-center">
                            <strong>${booking.totalPrice}</strong>
                        </div>
                        <div class="col-md-2 text-center">
                            ${statusBadge[booking.status] || '<span class="badge bg-secondary">不明</span>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function loadSettingsData() {
    // Load user settings from localStorage
    const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    
    // Populate form fields
    if (userSettings.notifications !== undefined) {
        const notificationCheckbox = document.getElementById('notificationSettings');
        if (notificationCheckbox) notificationCheckbox.checked = userSettings.notifications;
    }
    
    if (userSettings.language) {
        const languageSelect = document.getElementById('languageSettings');
        if (languageSelect) languageSelect.value = userSettings.language;
    }
    
    if (userSettings.currency) {
        const currencySelect = document.getElementById('currencySettings');
        if (currencySelect) currencySelect.value = userSettings.currency;
    }
}

// Setup event listeners for management center buttons
function setupManagementEventListeners() {
    // Remove existing listeners to prevent duplicates
    const buttons = document.querySelectorAll('[data-action]');
    buttons.forEach(button => {
        button.removeEventListener('click', handleManagementAction);
        button.addEventListener('click', handleManagementAction);
    });
    
    // Setup image error handling for CSP compliance
    setTimeout(() => {
        const images = document.querySelectorAll('img[data-fallback]');
        images.forEach(img => {
            img.addEventListener('error', function() {
                if (this.src !== this.dataset.fallback) {
                    this.src = this.dataset.fallback;
                    console.log('Image fallback applied');
                }
            });
            img.addEventListener('load', function() {
                console.log('Image loaded successfully');
            });
        });
    }, 100);
}

// Handle management center button actions
function handleManagementAction(event) {
    const action = event.target.getAttribute('data-action');
    const guideId = event.target.getAttribute('data-guide-id');
    
    switch (action) {
        case 'show-guide-detail':
            if (typeof showGuideDetailModal === 'function') {
                showGuideDetailModal(parseInt(guideId));
            }
            break;
        case 'remove-bookmark':
            if (typeof removeBookmark === 'function') {
                removeBookmark(parseInt(guideId));
            }
            break;
        case 'remove-from-comparison':
            if (typeof removeFromComparison === 'function') {
                removeFromComparison(parseInt(guideId));
            }
            break;
    }
}

// Clear all data functions
function clearAllBookmarks() {
    if (confirm('すべてのブックマークを削除しますか？')) {
        localStorage.removeItem('bookmarkedGuides');
        loadBookmarksList();
        
        // Update all bookmark button states
        if (typeof updateBookmarkButtons === 'function') {
            updateBookmarkButtons();
        }
        
        // Show success toast
        if (typeof safeShowToast === 'function') {
            safeShowToast('すべてのブックマークを削除しました', 'info');
        }
        
        console.log('All bookmarks cleared');
    }
}

function clearAllComparisons() {
    if (confirm('すべての比較データを削除しますか？')) {
        localStorage.removeItem('comparisonGuides');
        loadComparisonList();
        
        // Update all comparison button states
        if (typeof updateComparisonButtons === 'function') {
            updateComparisonButtons();
        }
        
        // Show success toast
        if (typeof safeShowToast === 'function') {
            safeShowToast('すべての比較データを削除しました', 'info');
        }
        
        console.log('All comparisons cleared');
    }
}

function clearAllBookings() {
    if (confirm('すべての予約履歴を削除しますか？')) {
        localStorage.removeItem('userBookings');
        loadBookingsList();
        console.log('All bookings cleared');
    }
}

function saveSettings() {
    const settings = {
        notifications: document.getElementById('notificationSettings')?.checked || false,
        language: document.getElementById('languageSettings')?.value || 'ja',
        currency: document.getElementById('currencySettings')?.value || 'JPY'
    };
    
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    // Show success message
    const toast = new bootstrap.Toast(document.getElementById('settingsToast'));
    toast.show();
    
    console.log('Settings saved:', settings);
}

// Update all bookmark button states across the page
function updateBookmarkButtons() {
    const bookmarkedGuides = JSON.parse(localStorage.getItem('bookmarkedGuides') || '[]');
    
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
        const guideId = btn.getAttribute('data-guide-id');
        const isBookmarked = bookmarkedGuides.includes(parseInt(guideId)) || bookmarkedGuides.includes(guideId);
        
        if (isBookmarked) {
            btn.classList.remove('btn-outline-warning');
            btn.classList.add('btn-warning');
            btn.innerHTML = '<i class="bi bi-bookmark-fill"></i> <span class="ms-1">保存済み</span>';
        } else {
            btn.classList.remove('btn-warning');
            btn.classList.add('btn-outline-warning');
            btn.innerHTML = '<i class="bi bi-bookmark"></i> <span class="ms-1">ブックマーク</span>';
        }
    });
    
    console.log('🔄 Updated all bookmark buttons');
}

// Update all comparison button states across the page
function updateComparisonButtons() {
    const comparisonGuides = JSON.parse(localStorage.getItem('comparisonGuides') || '[]');
    
    document.querySelectorAll('.compare-btn').forEach(btn => {
        const guideId = btn.getAttribute('data-guide-id');
        const isCompared = comparisonGuides.includes(parseInt(guideId)) || comparisonGuides.includes(guideId);
        
        if (isCompared) {
            btn.classList.remove('btn-outline-success');
            btn.classList.add('btn-success');
            btn.innerHTML = '<i class="bi bi-check2-square-fill"></i> <span class="ms-1">比較中</span>';
        } else {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-outline-success');
            btn.innerHTML = '<i class="bi bi-check2-square"></i> <span class="ms-1">比較</span>';
        }
    });
    
    console.log('🔄 Updated all comparison buttons');
}

// Make functions globally available
window.updateBookmarkButtons = updateBookmarkButtons;
window.updateComparisonButtons = updateComparisonButtons;