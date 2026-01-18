// TomoTrip Application Initialization - CSP Compliant  
// Consolidated from inline scripts in index.html

// IMMEDIATE TEST: This should appear first in browser console
console.log('🔥 URGENT TEST: app-init.mjs is executing!');

import { setupEventListeners, wireSponsorButtons, wireLanguageSwitcher } from './events/event-handlers.mjs?v=20251119-entry-fix';
// import './emergency-buttons.mjs'; // COMMENTED OUT - FILE MISSING, CAUSING MODULE LOAD FAILURE
import { renderGuideCards, updateGuideCounters } from './ui/guide-renderer.mjs';
// ✅ 修正済み検索機能をインポート
import { executeSearch } from './search/search-filter.mjs';
import { defaultGuideData } from './data/default-guides.mjs'; // Import for fallback when API returns no results
import AppState from './state/app-state.mjs';
import { setupLocationNames } from './locations/location-setup.mjs';
import { log, isIframe, shouldSuppressLogs } from './utils/logger.mjs';
import { APP_CONFIG } from '../../env/app-config.mjs';
import { generatePrefectureOptions } from './ui/prefecture-selector.mjs';
import './admin/guide-management.mjs';

// Early detection for Replit preview iframe to suppress footer emergency logs
const isReplitIframe = isIframe && !APP_CONFIG.ALLOW_IFRAME_LOG;

// Suppress footer emergency scripts in iframe context
if (isReplitIframe) {
    // Block any footer emergency script execution
    window.FOOTER_EMERGENCY_DISABLED = true;
    log.debug('🔇 Iframe context detected - footer emergency scripts disabled');
}

// Dynamic guide data loading from API with error handling and caching
async function loadGuidesFromAPI() {
    // Detect current page language for filtering (declare once for entire function)
    const isEnglish = window.location.pathname.includes('index-en.html');
    const currentLang = isEnglish ? 'en' : 'ja';

    try {
        // Add timeout and cache-busting for reliability
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // ⚡ 5秒に短縮して遅延を解決

        const response = await fetch(`/api/guides?lang=${currentLang}&${new Date().getTime()}`, {
            signal: controller.signal,
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Validate API response structure
        if (!result || typeof result !== 'object') {
            throw new Error('Invalid API response format');
        }

        if (result.success && Array.isArray(result.guides)) {
            // Client-side language filtering as safety measure

            // Filter guides by registrationLanguage on client side (safety check)
            const filteredByLang = result.guides.filter(guide => {
                const guideRegLang = guide.registrationLanguage || 'ja';
                return guideRegLang === currentLang;
            });

            console.log(`🌐 Client-side filter: ${filteredByLang.length}/${result.guides.length} guides match ${currentLang} language`);

            // Language mapping helper
            const languageMap = {
                'japanese': '日本語',
                'english': '英語',
                'chinese': '中国語',
                'korean': '韓国語',
                'spanish': 'スペイン語',
                'french': 'フランス語',
                'german': 'ドイツ語',
                'italian': 'イタリア語',
                'portuguese': 'ポルトガル語',
                '日本語': '日本語',
                '英語': '英語'
            };

            // Convert server format to frontend format  
            const apiGuides = filteredByLang.map(guide => {
                // Handle languages - keep API format for filtering compatibility
                let processedLanguages = [];

                // Process API response languages field
                if (Array.isArray(guide.languages) && guide.languages.length > 0) {
                    // Filter out empty strings and null values
                    const cleanLanguages = guide.languages.filter(lang => lang && lang.trim());
                    if (cleanLanguages.length > 0) {
                        // Keep original API format for filter compatibility
                        processedLanguages = cleanLanguages;
                    }
                } else {
                    // Default fallback
                    processedLanguages = ['japanese'];
                }

                // Normalize location data - use actual location from API now
                const locationData = guide.location || (currentLang === 'en' ? 'Tokyo, Japan' : '東京都 東京');

                // Use language-specific fallback text
                const defaultIntro = currentLang === 'en' ?
                    'I will guide you to the best local highlights' :
                    '地域の魅力をご案内します';

                // Use profileImageUrl if available, fallback to profilePhoto
                const imageUrl = guide.profileImageUrl ||
                    (guide.profilePhoto ? `/uploads/${guide.profilePhoto}` : '/assets/img/guides/default-1.svg');

                return {
                    id: guide.id,
                    name: guide.name,
                    city: locationData,
                    location: locationData,
                    rating: guide.averageRating ? parseFloat(guide.averageRating) : 4.8,
                    price: parseInt(guide.sessionRate || 0),
                    sessionRate: parseInt(guide.sessionRate || 0),
                    image: imageUrl,
                    photo: imageUrl,
                    profileImageUrl: guide.profileImageUrl, // Keep original for reference
                    languages: processedLanguages,
                    // Process specialties string from API
                    specialties: guide.specialties ?
                        (typeof guide.specialties === 'string' ? guide.specialties.split(/[,・・]/).map(s => s.trim()).filter(s => s) : guide.specialties) :
                        [],
                    tags: guide.specialties ?
                        (typeof guide.specialties === 'string' ? guide.specialties.split(/[,・・]/).map(s => s.trim()).filter(s => s) : guide.specialties) :
                        [],
                    availability: guide.availability || 'weekdays',
                    experience: guide.experience || 'intermediate',
                    introduction: guide.introduction || defaultIntro,
                    description: guide.introduction || defaultIntro,
                    email: guide.email,
                    phone: guide.phone,
                    status: guide.status || 'approved',
                    registeredAt: guide.registeredAt
                };
            });

            console.log(`✅ Loaded ${apiGuides.length} guides from API`);

            // Sort to put newest guides first (top-left positioning)
            const approvedGuides = apiGuides
                .filter(guide => guide.status === 'approved')
                .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));

            console.log(`📋 API Guides (newest first):`, approvedGuides.map(g => ({
                name: g.name,
                registeredAt: g.registeredAt,
                languages: g.languages,
                price: g.price
            })));

            // Use API guides exclusively when available (no merging with defaults)
            const deduplicatedApiGuides = removeDuplicateGuides(approvedGuides);

            // If API returned empty results, fall back to default guides for this language
            if (deduplicatedApiGuides.length === 0) {
                console.log('📋 API returned 0 guides - using filtered default guides as fallback');
                const filteredDefaults = defaultGuideData.filter(guide => {
                    const guideRegLang = guide.registrationLanguage || 'ja';
                    return guideRegLang === currentLang;
                });
                console.log(`🔄 Fallback: Using ${filteredDefaults.length} default guides for language: ${currentLang}`);
                return filteredDefaults;
            }

            // Performance warning for very large guide lists
            if (deduplicatedApiGuides.length > 100) {
                console.warn(`⚠️ Large guide list (${deduplicatedApiGuides.length} guides) - performance optimizations active`);
            }

            console.log(`🎯 Using API guides: ${deduplicatedApiGuides.length} guides`);
            return deduplicatedApiGuides;
        }

        console.log('📋 API returned no results - using filtered default guides as fallback');
        // Fallback to filtered default guides when API returns no results
        const filteredDefaults = defaultGuideData.filter(guide => {
            const guideRegLang = guide.registrationLanguage || 'ja';
            return guideRegLang === currentLang;
        });
        console.log(`🔄 Fallback: Using ${filteredDefaults.length} default guides for language: ${currentLang}`);
        return filteredDefaults;

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('❌ API request timeout - server may be slow');
        } else {
            console.error('❌ Error loading guides from API:', error);
        }
        // ✅ FIX: エラー時はnullを返し、呼び出し元で現在のデータを保持
        console.log('📋 API error - returning null to preserve current data');
        return null;
    }
}

// Remove duplicate guides based on ID only (email uniqueness enforced by API)
function removeDuplicateGuides(guides) {
    const seen = new Set();
    return guides.filter(guide => {
        // Only check ID for duplicates (API now enforces unique emails)
        if (!guide.id) {
            return true; // Keep guides without ID (like default guides)
        }
        if (seen.has(guide.id)) {
            console.warn(`⚠️ Duplicate guide ID detected: ${guide.id} (${guide.name})`);
            return false;
        }
        seen.add(guide.id);
        return true;
    });
}

/** Main application initialization function - TDZ safe with AppState */
async function appInit() {
    console.log('🎯 appInit called - starting initialization');
    log.ok('🌴 TomoTrip Application Starting...');

    // Check for refresh parameters from registration completion
    const urlParams = new URLSearchParams(window.location.search);
    const shouldRefresh = urlParams.get('refresh');
    const isNewGuide = shouldRefresh === 'new_guide';

    if (shouldRefresh) {
        console.log('🔄 Page loaded with refresh parameter:', shouldRefresh);
        // Clean URL after processing
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 1) Load guides dynamically from API + default data
    const guides = await loadGuidesFromAPI();

    // Clear any localStorage differences that might affect guide count
    localStorage.removeItem('registeredGuides');
    localStorage.removeItem('guideFilters');

    console.log('🎯 Environment Data Sync:', {
        guides: guides.length,
        source: 'API-only (no default merging)',
        localStorage_cleared: true
    });

    // 2) Initialize centralized state BEFORE any function calls - prevents TDZ
    // Force clear localStorage/sessionStorage environment differences
    if (window.location.search.includes('clear-cache')) {
        localStorage.clear();
        sessionStorage.clear();
        console.log('🧹 Storage cleared due to clear-cache parameter');
    }

    AppState.guides = guides;
    AppState.originalGuides = [...guides]; // Keep original for reset
    AppState.pageSize = 12; // Fixed pageSize for all environments
    AppState.currentPage = 1;
    AppState.filters = {}; // Reset filters to default

    // Ensure AppState is available globally
    window.AppState = AppState;
    const state = AppState;

    // 3) Setup location names in AppState
    setupLocationNames(state);

    // 4) Initialize prefecture selector
    await initializePrefectureSelector();

    // 5) Setup event listeners only - DISABLE LEGACY RENDERING to prevent duplicates
    setupEventListeners(state);

    // 🔧 FIX: ensure container exists before rendering
    const container = document.getElementById('guidesContainer') || document.getElementById('guide-list') || document.getElementById('guideCardsContainer');
    if (!container) {
        console.warn('⚠️ guidesContainer not found in DOM, checking for fallback...');
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            const row = searchResults.querySelector('.row');
            if (row) {
                row.id = 'guidesContainer';
                console.log('✅ Fallback: Found row in search-results and assigned guidesContainer');
            }
        }
    }

    // ✅ FIXED: Wait for DOM to be fully ready before rendering guides
    setTimeout(async () => {
        console.log('🎯 Starting guide rendering with delay for DOM readiness');
        // ✅ FIXED: await を追加してレンダリング完了を待つ
        await renderGuideCards(guides, true, true);
        // displayGuides is now integrated with renderGuideCards - no separate call needed
        // displayGuides(1, state); // DISABLED - causes container conflicts
    }, 500); // Small delay to ensure DOM is fully loaded

    // Setup button handlers
    wireSponsorButtons();
    wireLanguageSwitcher();

    // 5) Setup adaptive refresh intervals based on guide count
    const refreshInterval = guides.length > 50 ? 60000 : 30000; // Slower refresh for large lists
    console.log(`⏰ Setting refresh interval to ${refreshInterval / 1000} seconds`);

    setInterval(async () => {
        await refreshGuideData();
    }, refreshInterval);

    // 6) Show notification if loaded after new guide registration
    if (isNewGuide) {
        setTimeout(() => {
            showNewGuideNotification(1, true); // Show with registration message
        }, 1000);
    }

    // Initialize prefecture selector  
    initializePrefectureSelector();

    // 🔧 FIX: Setup search button AFTER modules are loaded to fix timing issue
    console.log('🔧 Setting up search button after module initialization...');
    setTimeout(() => {
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            // Remove any existing listeners to prevent duplicates
            searchBtn.removeEventListener('click', handleModuleSearchClick);
            searchBtn.addEventListener('click', handleModuleSearchClick);
            console.log('✅ Search button setup completed after module load');
        } else {
            console.warn('⚠️ Search button not found during module initialization');
        }
    }, 100); // Small delay to ensure button-setup.js has run

    // ✅ executeSearchをグローバルに登録
    window.executeSearch = executeSearch;
    console.log('✅ window.executeSearch registered globally');

    log.ok('✅ Application initialized successfully with dynamic guide data');
}

// Initialize prefecture selector with 47 prefectures + remote islands
function initializePrefectureSelector() {
    const locationFilter = document.getElementById('locationFilter');
    if (locationFilter) {
        locationFilter.innerHTML = generatePrefectureOptions();
        console.log('✅ Prefecture selector initialized with 47 prefectures + remote islands');
    }
}

// Refresh guide data and update display (enhanced with retry mechanism)
async function refreshGuideData(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Refreshing guide data (attempt ${attempt}/${maxRetries})`);

            // Reload API guides
            const apiGuides = await loadGuidesFromAPI();

            // ✅ FIX: APIエラー時（null）は現在のデータを保持
            if (apiGuides === null) {
                console.log('⚠️ API returned null - preserving current guide data');
                return false;
            }

            // ✅ FIX: 空配列の場合も現在のデータを保持（APIが一時的に空を返す場合）
            if (!apiGuides || apiGuides.length === 0) {
                console.log('⚠️ API returned empty list - preserving current guide data');
                return false;
            }

            // ✅ NEW: fullGuideList を更新（不変のマスターデータ）
            AppState.fullGuideList = [...apiGuides];
            AppState.originalGuides = [...apiGuides];
            
            console.log(`📊 [REFRESH] fullGuideList updated: ${apiGuides.length} guides`);

            // 🔧 FIX: フィルター状態を保持してレンダリング
            if (typeof renderGuideCards === 'function') {
                // ✅ フィルターが適用されている場合は、新しいfullGuideListに対してフィルターを再適用
                if (AppState.isFiltered && typeof window.filterGuides === 'function') {
                    console.log('🔧 Re-applying filters to updated fullGuideList');
                    // ✅ フィルタ条件はactiveFiltersに保存されているので、filterGuidesが再利用する
                    await window.filterGuides();
                } else {
                    // フィルタなしの場合は全データを表示
                    AppState.guides = [...apiGuides];
                    // ✅ usePagination=trueでページネーションを維持, resetPagination=falseで現在ページを保持
                    renderGuideCards(apiGuides, true, false);
                }
            }

            console.log(`✅ Guide data refreshed successfully: ${apiGuides.length} total guides (API-only)`);
            return true; // Success

        } catch (error) {
            console.error(`❌ Error refreshing guide data (attempt ${attempt}):`, error);

            if (attempt < maxRetries) {
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            } else {
                console.error('❌ Failed to refresh guide data after all retries');
            }
        }
    }

    return false; // All attempts failed
}


// Show notification for newly added guides
function showNewGuideNotification(count, isRegistrationComplete = false, customMessage = null) {
    const notification = document.createElement('div');
    notification.className = 'toast-container position-fixed top-0 end-0 p-3';
    notification.style.zIndex = '9999';

    const message = customMessage ||
        (isRegistrationComplete
            ? 'ガイド登録が完了しました！新しいガイドカードが追加されました。'
            : `${count}名の新しいガイドが追加されました！`);

    const icon = isRegistrationComplete
        ? 'bi-check-circle-fill text-success'
        : 'bi-person-plus-fill text-success';

    notification.innerHTML = `
        <div class="toast show" role="alert" style="background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white;">
            <div class="toast-header" style="background: rgba(255,255,255,0.1); border: none; color: white;">
                <i class="bi ${icon} me-2"></i>
                <strong class="me-auto">TomoTrip</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body" style="color: white;">
                ${message}
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 7000);
}

// Make functions globally available for guide edit page and registration completion
window.refreshGuideData = refreshGuideData;
window.showNewGuideNotification = showNewGuideNotification;
window.renderGuideCards = renderGuideCards;

// Export pagination system globally for search integration
window.getPaginationSystem = function() {
    return window.paginationSystem;
};

window.setPaginationSystem = function(system) {
    window.paginationSystem = system;
};

// Debug: Module loading confirmation
console.log('🚀 app-init.mjs module loaded');

// Call initialization when module loads
if (document.readyState === 'loading') {
    console.log('⏰ DOM loading - waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', appInit);
} else {
    console.log('⏰ DOM ready - calling appInit immediately');
    appInit();
}

// Location mapping for display - unified to prevent conflicts with language support
if (!window.locationNames) {
    const currentLang = window.location.pathname.includes('index-en.html') ? 'en' : 'ja';

    if (currentLang === 'en') {
        window.locationNames = {
            hokkaido: "Hokkaido", aomori: "Aomori", iwate: "Iwate", miyagi: "Miyagi", akita: "Akita", yamagata: "Yamagata", fukushima: "Fukushima",
            ibaraki: "Ibaraki", tochigi: "Tochigi", gunma: "Gunma", saitama: "Saitama", chiba: "Chiba", tokyo: "Tokyo", kanagawa: "Kanagawa",
            niigata: "Niigata", toyama: "Toyama", ishikawa: "Ishikawa", fukui: "Fukui", yamanashi: "Yamanashi", nagano: "Nagano", gifu: "Gifu", shizuoka: "Shizuoka", aichi: "Aichi",
            mie: "Mie", shiga: "Shiga", kyoto: "Kyoto", osaka: "Osaka", hyogo: "Hyogo", nara: "Nara", wakayama: "Wakayama",
            tottori: "Tottori", shimane: "Shimane", okayama: "Okayama", hiroshima: "Hiroshima", yamaguchi: "Yamaguchi", tokushima: "Tokushima", kagawa: "Kagawa", ehime: "Ehime", kochi: "Kochi",
            fukuoka: "Fukuoka", saga: "Saga", nagasaki: "Nagasaki", kumamoto: "Kumamoto", oita: "Oita", miyazaki: "Miyazaki", kagoshima: "Kagoshima", okinawa: "Okinawa",
            ogasawara: "Ogasawara Islands", izu: "Izu Islands", sado: "Sado Island", awaji: "Awaji Island", yakushima: "Yakushima", amami: "Amami Oshima", ishigaki: "Ishigaki Island", miyako: "Miyako Island"
        };
    } else {
        window.locationNames = {
            hokkaido: "北海道", aomori: "青森県", iwate: "岩手県", miyagi: "宮城県", akita: "秋田県", yamagata: "山形県", fukushima: "福島県",
            ibaraki: "茨城県", tochigi: "栃木県", gunma: "群馬県", saitama: "埼玉県", chiba: "千葉県", tokyo: "東京都", kanagawa: "神奈川県",
            niigata: "新潟県", toyama: "富山県", ishikawa: "石川県", fukui: "福井県", yamanashi: "山梨県", nagano: "長野県", gifu: "岐阜県", shizuoka: "静岡県", aichi: "愛知県",
            mie: "三重県", shiga: "滋賀県", kyoto: "京都府", osaka: "大阪府", hyogo: "兵庫県", nara: "奈良県", wakayama: "和歌山県",
            tottori: "鳥取県", shimane: "島根県", okayama: "岡山県", hiroshima: "広島県", yamaguchi: "山口県", tokushima: "徳島県", kagawa: "香川県", ehime: "愛媛県", kochi: "高知県",
            fukuoka: "福岡県", saga: "佐賀県", nagasaki: "長崎県", kumamoto: "熊本県", oita: "大分県", miyazaki: "宮崎県", kagoshima: "鹿児島県", okinawa: "沖縄県",
            ogasawara: "小笠原諸島", izu: "伊豆諸島", sado: "佐渡島", awaji: "淡路島", yakushima: "屋久島", amami: "奄美大島", ishigaki: "石垣島", miyako: "宮古島"
        };
    }
    console.log('%cLocationNames Object Initialized:', 'color: #28a745;', Object.keys(window.locationNames).length, 'locations', `(${currentLang})`);
}

// ✅ 修正: async関数として宣言
async function handleModuleSearchClick(e) {
    e.preventDefault();
    console.log('🔍 Module search button clicked');

    try {
        if (window.executeSearch && typeof window.executeSearch === 'function') {
            console.log('✅ Calling window.executeSearch from module handler');
            await window.executeSearch();
        } else {
            console.error('❌ window.executeSearch not available in module handler');
            console.log('Available window functions:', Object.keys(window).filter(k => k.includes('filter')));
        }
    } catch (error) {
        console.error('❌ Error in module search handler:', error);
    }
}

// Remove all global state variables - managed by AppState now
// All display functions moved to event-handlers.mjs to prevent conflicts