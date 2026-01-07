// Unified Button Setup - CSP Compliant
// Centralized event handler setup for all main buttons

/**
 * Setup all main application buttons with consistent event handling
 * Call this function after DOM is loaded to ensure all buttons work
 */
function setupAllButtons() {
    console.log('🔧 Setting up all button event handlers...');
    
    // Setup Dashboard Button
    setupDashboardButton();
    
    // Setup Login Dropdown
    setupLoginDropdown();
    
    // Setup Direct Login Buttons
    setupDirectLoginButtons();
    
    // Setup Search Button and Reset Button
    setupSearchButton();
    setupResetButton();
    
    // Setup Contact Button
    setupContactButton();
    
    // Setup Register Button (Header)
    setupRegisterButton();
    
    // Setup Management Center Buttons
    setupManagementButtons();
    
    // Setup Guide Card Management Buttons (delegated event handling)
    setupGuideCardButtons();
    
    // Setup Admin Mode Toggle Button
    setupAdminModeToggle();
    
    // Setup filter input event listeners for real-time feedback
    setupFilterInputListeners();
    
    console.log('✅ All button event handlers setup complete');
}

/**
 * Setup Reset Button - Clears all filters
 */
function setupResetButton() {
    const resetBtn = document.getElementById('resetBtn');
    
    if (resetBtn) {
        resetBtn.removeEventListener('click', handleResetClick);
        resetBtn.addEventListener('click', handleResetClick);
        console.log('✅ Reset button handler attached');
    } else {
        console.warn('⚠️ Reset button not found');
    }
}

function handleResetClick(e) {
    e.preventDefault();
    console.log('🔄 Reset button clicked - clearing all filters');
    
    try {
        // Clear all filter inputs
        const locationFilter = document.getElementById('locationFilter');
        const languageFilter = document.getElementById('languageFilter');
        const priceFilter = document.getElementById('priceFilter');
        const keywordInput = document.getElementById('keywordInput');
        
        if (locationFilter) locationFilter.value = '';
        if (languageFilter) languageFilter.value = '';
        if (priceFilter) priceFilter.value = '';
        if (keywordInput) keywordInput.value = '';
        
        // Use global reset function if available
        if (window.resetFilters && typeof window.resetFilters === 'function') {
            window.resetFilters();
            console.log('✅ window.resetFilters() called successfully');
        } else if (window.AppState && window.AppState.originalGuides && window.renderGuideCards) {
            // Fallback: render all guides
            window.renderGuideCards(window.AppState.originalGuides);
            console.log('✅ Fallback reset completed');
        } else {
            console.warn('⚠️ Reset function not available');
        }
    } catch (error) {
        console.error('❌ Reset button error:', error);
        alert('フィルターのリセットに失敗しました。');
    }
}

/**
 * Setup Filter Input Event Listeners for real-time feedback
 */
function setupFilterInputListeners() {
    console.log('🔧 Setting up filter input listeners...');
    
    // Add change event listeners to filter inputs for instant feedback
    const locationFilter = document.getElementById('locationFilter');
    const languageFilter = document.getElementById('languageFilter');
    const priceFilter = document.getElementById('priceFilter');
    
    if (locationFilter) {
        locationFilter.addEventListener('change', () => {
            console.log('📍 Location filter changed:', locationFilter.value);
        });
    }
    
    if (languageFilter) {
        languageFilter.addEventListener('change', () => {
            console.log('🗣️ Language filter changed:', languageFilter.value);
        });
    }
    
    if (priceFilter) {
        priceFilter.addEventListener('change', () => {
            console.log('💰 Price filter changed:', priceFilter.value);
        });
    }
    
    console.log('✅ Filter input listeners setup complete');
}

/**
 * Setup Dashboard Button - Opens Management Center
 */
function setupDashboardButton() {
    const dashboardBtn = document.getElementById('dashboardBtn');
    
    if (dashboardBtn) {
        // Remove any existing listeners to prevent duplicates
        dashboardBtn.removeEventListener('click', handleDashboardClick);
        dashboardBtn.addEventListener('click', handleDashboardClick);
        console.log('✅ Dashboard button handler attached');
    } else {
        console.warn('⚠️ Dashboard button not found');
    }
    
    // Setup Sponsor Edit Button
    const sponsorEditBtn = document.getElementById('sponsorEditBtn');
    if (sponsorEditBtn) {
        sponsorEditBtn.addEventListener('click', handleSponsorEditClick);
        console.log('✅ Sponsor edit button handler attached');
    }
}

function handleSponsorEditClick(e) {
    e.preventDefault();
    console.log('✏️ Sponsor edit button clicked');
    
    // Show modal to identify store owner
    const existingModal = document.getElementById('sponsorEditModal');
    if (existingModal) existingModal.remove();
    
    const modalHTML = `
        <div class="modal fade" id="sponsorEditModal" tabindex="-1" aria-hidden="true" style="z-index: 9999;">
            <div class="modal-dialog modal-dialog-centered" style="max-width: 450px;">
                <div class="modal-content" style="border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <div class="modal-header border-0" style="background: linear-gradient(135deg, #f0ad4e, #ec971f); color: white; border-radius: 15px 15px 0 0;">
                        <h5 class="modal-title fw-bold">
                            <i class="bi bi-pencil-square me-2"></i>協賛店編集ログイン
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="alert alert-warning mb-4">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>協賛店オーナー専用</strong><br>
                            登録時に使用したメールアドレスでログインしてください
                        </div>
                        
                        <form id="sponsorEditForm">
                            <div class="mb-3">
                                <label class="form-label fw-bold">登録メールアドレス</label>
                                <input type="email" class="form-control" id="sponsorEditEmail" placeholder="example@store.com" required style="border-radius: 10px; padding: 12px;">
                            </div>
                            <div class="mb-4">
                                <label class="form-label fw-bold">電話番号（確認用）</label>
                                <input type="tel" class="form-control" id="sponsorEditPhone" placeholder="090-1234-5678" required style="border-radius: 10px; padding: 12px;">
                            </div>
                            
                            <button type="submit" class="btn btn-warning w-100 fw-bold" style="border-radius: 10px; padding: 12px;">
                                <i class="bi bi-box-arrow-in-right me-2"></i>店舗編集画面へ
                            </button>
                        </form>
                        
                        <div class="text-center mt-3">
                            <a href="sponsor-registration.html" class="text-decoration-none">
                                <i class="bi bi-plus-circle me-1"></i>新規協賛店登録はこちら
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const form = document.getElementById('sponsorEditForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('sponsorEditEmail').value.trim().toLowerCase();
            const phone = document.getElementById('sponsorEditPhone').value.trim();
            
            try {
                const response = await fetch('/api/sponsor-stores');
                const stores = await response.json();
                
                const matchedStore = stores.find(s => 
                    s.email && s.email.toLowerCase() === email && 
                    s.phone && s.phone.replace(/[-\s]/g, '') === phone.replace(/[-\s]/g, '')
                );
                
                if (matchedStore) {
                    localStorage.setItem('currentSponsorStore', JSON.stringify({
                        id: matchedStore.id,
                        storeName: matchedStore.storeName,
                        email: matchedStore.email,
                        loginTime: Date.now()
                    }));
                    
                    const modal = bootstrap.Modal.getInstance(document.getElementById('sponsorEditModal'));
                    if (modal) modal.hide();
                    
                    window.location.href = 'store-dashboard.html?id=' + matchedStore.id;
                } else {
                    alert('登録情報が見つかりませんでした。メールアドレスと電話番号をご確認ください。');
                }
            } catch (error) {
                console.error('Store lookup error:', error);
                alert('エラーが発生しました。もう一度お試しください。');
            }
        });
    }
    
    const modal = new bootstrap.Modal(document.getElementById('sponsorEditModal'));
    modal.show();
}

function handleDashboardClick(e) {
    e.preventDefault();
    console.log('🏢 Dashboard button clicked - showing sponsor login');
    
    try {
        // Check if user is already authenticated for sponsor dashboard
        const sponsorAuth = localStorage.getItem('sponsorAuth');
        if (sponsorAuth) {
            const authData = JSON.parse(sponsorAuth);
            if (authData && authData.isAuthenticated && Date.now() < authData.expiresAt) {
                console.log('✅ Already authenticated, redirecting to dashboard');
                window.open('sponsor-dashboard.html', '_blank');
                return;
            }
        }
        
        // Show sponsor login modal using existing auth flow
        if (typeof window.showSponsorLoginModal === 'function') {
            console.log('✅ Using window.showSponsorLoginModal');
            window.showSponsorLoginModal();
        } else {
            console.log('🔧 Creating sponsor login modal manually');
            showSponsorLoginModalManual();
        }
    } catch (error) {
        console.error('❌ Dashboard button error:', error);
        alert('ダッシュボードアクセスに問題が発生しました。しばらくお待ちください。');
    }
}

function showSponsorLoginModalManual() {
    // Remove existing modal if present
    const existingModal = document.getElementById('sponsorLoginModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="modal fade" id="sponsorLoginModal" tabindex="-1" aria-hidden="true" style="z-index: 9999;">
            <div class="modal-dialog modal-dialog-centered" style="max-width: 450px;">
                <div class="modal-content" style="border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <div class="modal-header border-0" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 15px 15px 0 0;">
                        <h5 class="modal-title fw-bold">
                            <i class="bi bi-building me-2"></i>協賛店管理画面ログイン
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="alert alert-info mb-4">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>運営管理者専用</strong><br>
                            この画面は TomoTrip 運営チームのアクセス対象です
                        </div>
                        
                        <form id="sponsorLoginForm">
                            <div class="mb-3">
                                <label class="form-label fw-bold">管理者メールアドレス</label>
                                <input type="email" class="form-control" id="sponsorEmail" placeholder="admin@tomotrip.com" required style="border-radius: 10px; padding: 12px;">
                            </div>
                            <div class="mb-4">
                                <label class="form-label fw-bold">管理者パスワード</label>
                                <input type="password" class="form-control" id="sponsorPassword" placeholder="管理者パスワードを入力" required style="border-radius: 10px; padding: 12px;">
                            </div>
                            
                            <div class="alert alert-info small mb-3">
                                <strong>Note:</strong> Please use your administrator credentials to log in.
                            </div>
                            
                            <button type="submit" class="btn btn-primary w-100 fw-bold" style="border-radius: 10px; padding: 12px; background: linear-gradient(135deg, #667eea, #764ba2); border: none;">
                                <i class="bi bi-box-arrow-in-right me-2"></i>ログイン
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup form handler
    const form = document.getElementById('sponsorLoginForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('sponsorEmail').value;
            const password = document.getElementById('sponsorPassword').value;
            
            // TODO: Replace with proper server-side authentication
            // SECURITY: Never hardcode credentials in client code
            // Call server-side API endpoint for authentication
            alert('Authentication system is being upgraded. Please contact the administrator for access.');
            
            // Example of proper implementation (requires backend):
            // fetch('/api/auth/admin-login', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ email, password })
            // })
            // .then(response => response.json())
            // .then(data => {
            //     if (data.authenticated) {
            //         localStorage.setItem('sponsorAuth', JSON.stringify(data.authData));
            //         const modal = bootstrap.Modal.getInstance(document.getElementById('sponsorLoginModal'));
            //         if (modal) modal.hide();
            //         setTimeout(() => window.open('sponsor-dashboard.html', '_blank'), 300);
            //     } else {
            //         alert('Authentication failed. Please check your credentials.');
            //     }
            // });
        });
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('sponsorLoginModal'));
    modal.show();
}


/**
 * Setup Login Dropdown - Toggles custom dropdown visibility
 */
function setupLoginDropdown() {
    const loginDropdown = document.getElementById('loginDropdown');
    const customLoginDropdown = document.getElementById('customLoginDropdown');
    
    if (loginDropdown && customLoginDropdown) {
        // Remove any existing listeners to prevent duplicates
        loginDropdown.removeEventListener('click', handleLoginDropdownClick);
        loginDropdown.addEventListener('click', handleLoginDropdownClick);
        
        // Setup click outside to close dropdown
        document.removeEventListener('click', handleOutsideClick);
        document.addEventListener('click', handleOutsideClick);
        
        console.log('✅ Login dropdown handler attached');
    } else {
        console.warn('⚠️ Login dropdown or custom dropdown not found');
    }
}

function handleLoginDropdownClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const customLoginDropdown = document.getElementById('customLoginDropdown');
    if (customLoginDropdown) {
        const isVisible = customLoginDropdown.style.display === 'block';
        
        if (isVisible) {
            customLoginDropdown.style.display = 'none';
            console.log('🔽 Login dropdown closed');
        } else {
            customLoginDropdown.style.display = 'block';
            console.log('🔼 Login dropdown opened');
        }
    }
}

function handleOutsideClick(e) {
    const loginDropdown = document.getElementById('loginDropdown');
    const customLoginDropdown = document.getElementById('customLoginDropdown');
    
    if (loginDropdown && customLoginDropdown) {
        if (!loginDropdown.contains(e.target) && !customLoginDropdown.contains(e.target)) {
            customLoginDropdown.style.display = 'none';
        }
    }
}

/**
 * Setup Direct Login Buttons - Tourist and Guide login buttons in navbar
 */
function setupDirectLoginButtons() {
    const touristLoginBtn = document.getElementById('directTouristLoginBtn');
    const guideLoginBtn = document.getElementById('directGuideLoginBtn');
    
    if (touristLoginBtn) {
        touristLoginBtn.removeEventListener('click', handleDirectTouristLogin);
        touristLoginBtn.addEventListener('click', handleDirectTouristLogin);
        console.log('✅ Direct tourist login button handler attached');
    } else {
        console.warn('⚠️ Direct tourist login button not found');
    }
    
    if (guideLoginBtn) {
        guideLoginBtn.removeEventListener('click', handleDirectGuideLogin);
        guideLoginBtn.addEventListener('click', handleDirectGuideLogin);
        console.log('✅ Direct guide login button handler attached');
    } else {
        console.warn('⚠️ Direct guide login button not found');
    }
}

function handleDirectTouristLogin(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔐 Direct tourist login button clicked');
    
    // Clear any previous guide return destination (navbar login shouldn't redirect to guide)
    sessionStorage.removeItem('returnToGuideId');
    console.log('🧹 Cleared returnToGuideId for direct navbar login');
    
    try {
        // Show tourist login modal
        const touristLoginModal = document.getElementById('touristLoginModal');
        if (touristLoginModal) {
            const modal = new bootstrap.Modal(touristLoginModal);
            modal.show();
            console.log('✅ Tourist login modal opened');
        } else {
            console.error('❌ Tourist login modal not found');
            alert('ログインモーダルが見つかりません。');
        }
    } catch (error) {
        console.error('❌ Tourist login button error:', error);
        alert('ログインモーダルを開けませんでした。');
    }
}

function handleDirectGuideLogin(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔐 Direct guide login button clicked');
    
    // Clear any previous guide return destination (navbar login shouldn't redirect to guide)
    sessionStorage.removeItem('returnToGuideId');
    console.log('🧹 Cleared returnToGuideId for direct navbar login');
    
    try {
        // Show guide login modal
        const guideLoginModal = document.getElementById('guideLoginModal');
        if (guideLoginModal) {
            const modal = new bootstrap.Modal(guideLoginModal);
            modal.show();
            console.log('✅ Guide login modal opened');
        } else {
            console.error('❌ Guide login modal not found');
            alert('ログインモーダルが見つかりません。');
        }
    } catch (error) {
        console.error('❌ Guide login button error:', error);
        alert('ログインモーダルを開けませんでした。');
    }
}

/**
 * Setup Search Button - Triggers filtering functionality
 */
function setupSearchButton() {
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchBtn) {
        // Remove any existing listeners to prevent duplicates
        searchBtn.removeEventListener('click', handleSearchClick);
        searchBtn.addEventListener('click', handleSearchClick);
        console.log('✅ Search button handler attached');
    } else {
        console.warn('⚠️ Search button not found');
    }
}

async function handleSearchClick(e) {
    e.preventDefault();
    console.log('🔍 Search button clicked - using executeSearch');
    
    try {
        // ✅ 修正済みのexecuteSearchを使用
        if (window.executeSearch && typeof window.executeSearch === 'function') {
            await window.executeSearch();
            console.log('✅ window.executeSearch() called successfully');
        } else {
            console.warn('⚠️ window.executeSearch not available, using dynamic import');
            // 動的インポートでexecuteSearchを取得
            const { executeSearch } = await import('./assets/js/search/search-filter.mjs');
            window.executeSearch = executeSearch;
            await executeSearch();
        }
    } catch (error) {
        console.error('❌ Search button error:', error);
        alert('検索に失敗しました。もう一度お試しください。');
    }
}

function handleManualSearch() {
    console.log('🔍 Manual search triggered - delegating to main filter system');
    
    // Use the centralized filtering system from event-handlers.mjs
    // This prevents duplicate filter logic and ensures consistency
    try {
        // Try to use the main filterGuides function from AppState
        if (window.AppState?.filterGuides && typeof window.AppState.filterGuides === 'function') {
            console.log('✅ Using AppState.filterGuides()');
            window.AppState.filterGuides();
            return;
        }
        
        // Fallback to global filterGuides function
        if (window.filterGuides && typeof window.filterGuides === 'function') {
            console.log('✅ Using global filterGuides()');
            window.filterGuides();
            return;
        }
        
        console.warn('⚠️ No main filter function available - minimal fallback search');
        
        // Minimal fallback for basic search functionality
        const locationFilter = document.getElementById('locationFilter');
        const languageFilter = document.getElementById('languageFilter');
        const priceFilter = document.getElementById('priceFilter');
        
        if (!locationFilter && !languageFilter && !priceFilter) {
            console.warn('⚠️ No filter elements found');
            return;
        }
        
        // Show simple message to user
        const message = 'フィルター機能を読み込み中です。しばらくお待ちください。';
        if (document.querySelector('.toast-container')) {
            showToast(message, 'warning');
        } else {
            alert(message);
        }
        
    } catch (error) {
        console.error('❌ Manual search error:', error);
        alert('検索に失敗しました。ページを再読み込みしてください。');
    }
}

/**
 * Setup Contact Button - Opens contact functionality
 */
function setupContactButton() {
    const contactBtn = document.getElementById('contactBtn');
    
    if (contactBtn) {
        // Remove any existing listeners to prevent duplicates
        contactBtn.removeEventListener('click', handleContactClick);
        contactBtn.addEventListener('click', handleContactClick);
        console.log('✅ Contact button handler attached');
    } else {
        console.warn('⚠️ Contact button not found');
    }
}

function handleContactClick(e) {
    e.preventDefault();
    console.log('📞 Contact button clicked - opening Japanese contact page');
    
    try {
        // Always open the beautiful Japanese contact page
        window.open('chat.html', '_blank');
        console.log('✅ Japanese contact page opened');
    } catch (error) {
        console.error('❌ Contact button error:', error);
        // Fallback: show contact options
        showContactOptions();
    }
}

function showContactOptions() {
    const contactOptions = `
お問い合わせ方法を選択してください：

1. メール: support@tomotrip.com
2. 電話: 03-1234-5678 (平日 9:00-18:00)
3. チャット: サイト右下のチャットボタン

どちらをご希望ですか？
    `;
    
    if (confirm(contactOptions + '\n\nメールを開きますか？')) {
        window.location.href = 'mailto:support@tomotrip.com?subject=TomoTripお問い合わせ&body=お問い合わせ内容をこちらに記載してください。';
    }
}

/**
 * Setup Register Button - Opens registration options
 * ✅ FIXED (per Codex analysis): Re-enabled after cache issue diagnosis
 */
function setupRegisterButton() {
    const registerBtn = document.getElementById('registerBtn');
    
    if (registerBtn) {
        // Remove any existing listeners to prevent duplicates
        registerBtn.removeEventListener('click', handleRegisterClick);
        registerBtn.addEventListener('click', handleRegisterClick);
        console.log('✅ Register button handler attached (button-setup-v3.js)');
    } else {
        console.warn('⚠️ Register button not found');
    }
}

function handleRegisterClick(e) {
    e.preventDefault();
    console.log('📝 Register button clicked - showing registration choice');
    
    try {
        // Try to show registration choice first
        if (typeof window.showRegistrationChoice === 'function') {
            console.log('✅ Using window.showRegistrationChoice');
            window.showRegistrationChoice();
        } else if (typeof showRegistrationChoice === 'function') {
            console.log('✅ Using showRegistrationChoice');
            showRegistrationChoice();
        } else {
            // Manually create and show registration choice
            console.log('🔧 Creating registration choice manually');
            showRegistrationChoiceManual();
        }
    } catch (error) {
        console.error('❌ Register button error:', error);
        alert('新規登録機能に問題が発生しました。しばらくお待ちください。');
    }
}

function showRegistrationChoiceManual() {
    console.log('🔧 Showing registration choice manually');
    
    let formContainer = document.getElementById('registrationFormContainer');
    if (!formContainer) {
        console.warn('⚠️ Registration form container not found, creating one');
        // Create the container if it doesn't exist
        formContainer = document.createElement('div');
        formContainer.id = 'registrationFormContainer';
        formContainer.style.display = 'none';
        
        // Insert after the navigation
        const nav = document.querySelector('nav');
        if (nav && nav.parentNode) {
            nav.parentNode.insertBefore(formContainer, nav.nextSibling);
        } else {
            document.body.appendChild(formContainer);
        }
    }
    
    // Clear any existing content
    formContainer.innerHTML = '';
    
    // Detect current language using standardized method
    const getCurrentLang = () => {
        const pathname = window.location.pathname;
        return pathname.includes('index-en.html') ? 'en' : 'ja';
    };
    const isEnglish = getCurrentLang() === 'en';
    
    // Language-specific text
    const text = isEnglish ? {
        title: 'Select Registration Type',
        subtitle: 'Please choose the registration type that suits your needs',
        tourist: {
            title: 'Tourist Registration',
            desc: 'Register to use local guide services',
            badge: 'Individual'
        },
        guide: {
            title: 'Guide Registration',
            desc: 'Provide services to tourists as a local guide',
            badge: 'Freelance'
        },
        sponsor: {
            title: 'Sponsor Registration',
            desc: 'Register your shop or facility as a sponsor and promote to tourists',
            badge: 'Business'
        },
        cancel: 'Cancel'
    } : {
        title: '登録タイプを選択',
        subtitle: 'お客様の用途に合わせて適切な登録タイプをお選びください',
        tourist: {
            title: '観光客登録',
            desc: '地元ガイドサービスを利用するための登録です',
            badge: '個人向け'
        },
        guide: {
            title: 'ガイド登録',
            desc: '地元ガイドとして観光客にサービスを提供します',
            badge: 'フリーランス'
        },
        sponsor: {
            title: '協賛店登録',
            desc: 'お店や施設を協賛店として登録し、観光客にPRできます',
            badge: 'ビジネス向け'
        },
        cancel: 'キャンセル'
    };
    
    // Create registration choice content
    const choiceContent = `
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="choice-container" style="background: white; border-radius: 20px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15); margin: 2rem 0;">
                    <div class="choice-header" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 2rem; border-radius: 20px 20px 0 0; text-align: center;">
                        <h1><i class="bi bi-person-plus me-2"></i>${text.title}</h1>
                        <p class="mb-0">${text.subtitle}</p>
                    </div>
                    
                    <div class="choice-body" style="padding: 2.5rem;">
                        <div class="row g-4">
                            <!-- Tourist Registration -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card h-100 border-primary choice-card" style="cursor: pointer; border-radius: 15px; border-width: 2px; transition: transform 0.2s;" data-registration-type="tourist">
                                    <div class="card-body text-center p-4">
                                        <i class="bi bi-person-check text-primary mb-3" style="font-size: 3rem;"></i>
                                        <h6 class="fw-bold text-primary mb-2">${text.tourist.title}</h6>
                                        <p class="text-muted small mb-3">${text.tourist.desc}</p>
                                        <div class="mt-3">
                                            <span class="badge bg-primary">${text.tourist.badge}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Guide Registration -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card h-100 border-success choice-card" style="cursor: pointer; border-radius: 15px; border-width: 2px; transition: transform 0.2s;" data-registration-type="guide">
                                    <div class="card-body text-center p-4">
                                        <i class="bi bi-person-badge text-success mb-3" style="font-size: 3rem;"></i>
                                        <h6 class="fw-bold text-success mb-2">${text.guide.title}</h6>
                                        <p class="text-muted small mb-3">${text.guide.desc}</p>
                                        <div class="mt-3">
                                            <span class="badge bg-success">${text.guide.badge}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Sponsor Registration -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card h-100 border-warning choice-card" style="cursor: pointer; border-radius: 15px; border-width: 2px; transition: transform 0.2s;" data-registration-type="sponsor">
                                    <div class="card-body text-center p-4">
                                        <i class="bi bi-building text-warning mb-3" style="font-size: 3rem;"></i>
                                        <h6 class="fw-bold text-warning mb-2">${text.sponsor.title}</h6>
                                        <p class="text-muted small mb-3">${text.sponsor.desc}</p>
                                        <div class="mt-3">
                                            <span class="badge bg-warning">${text.sponsor.badge}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="text-center mt-4">
                            <button type="button" class="btn btn-outline-secondary" data-action="cancel" style="border-radius: 25px; padding: 12px 30px;">${text.cancel}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    
    formContainer.innerHTML = choiceContent;
    formContainer.style.display = 'block';
    
    // 🔥 CRITICAL: Attach handlers via JavaScript ONLY - NO onclick attributes (bypasses onclick caching)
    console.log('[TomoTrip] 🔥 Attaching event handlers to registration cards via data attributes...');
    
    // Use data attributes + addEventListener for clean event handling (no onclick interference)
    formContainer.addEventListener('click', function(e) {
        const registrationType = e.target.closest('[data-registration-type]')?.getAttribute('data-registration-type');
        const action = e.target.closest('[data-action]')?.getAttribute('data-action');
        
        if (registrationType === 'guide') {
            console.log('[TomoTrip] 🚀 GUIDE CARD CLICKED - calling handleGuideRegistrationClick');
            handleGuideRegistrationClick(e);
        } else if (registrationType === 'tourist') {
            console.log('[TomoTrip] 🚀 TOURIST CARD CLICKED - calling openTouristRegistration');
            openTouristRegistration();
        } else if (registrationType === 'sponsor') {
            console.log('[TomoTrip] 🚀 SPONSOR CARD CLICKED - calling handleSponsorRegistration');
            handleSponsorRegistration();
        } else if (action === 'cancel') {
            console.log('[TomoTrip] 🚀 CANCEL CLICKED - hiding registration choice');
            hideRegistrationChoice();
        }
    });
    
    console.log('[TomoTrip] ✅ Event handlers attached via data attributes - ready to handle clicks');
    
    // Scroll to the form container
    setTimeout(() => {
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    
    console.log('✅ Registration choice displayed manually');
}

// Helper functions for registration choices with language-aware routing
function openTouristRegistration() {
    console.log('🎯 Tourist registration selected - SAME WINDOW');
    hideRegistrationChoice();
    
    // Detect current language
    const getCurrentLang = () => {
        const pathname = window.location.pathname;
        return pathname.includes('index-en.html') ? 'en' : 'ja';
    };
    const currentLang = getCurrentLang();
    
    // Route to language-appropriate page
    const registrationPage = currentLang === 'en' 
        ? '/tourist-registration-simple-en.html' 
        : '/tourist-registration-simple.html';
    
    // Same-window redirect (fixes DevTools + interaction issues)
    window.location.href = registrationPage;
}

// NEW: Secure handler with cache bust parameter - SAME WINDOW redirect (fixes DevTools issue)
function handleGuideRegistrationClick(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    console.log('[TomoTrip] 🎯 handleGuideRegistrationClick triggered');
    hideRegistrationChoice();
    
    // Direct redirect to v2 with cache bust - SAME WINDOW (not new window)
    const cacheBust = Date.now();
    const url = `/guide-registration-v2.html?cb=${cacheBust}`;
    console.log('[TomoTrip] 🚀 Redirecting SAME WINDOW to:', url);
    
    // Use location.href for same-window redirect - no separate DevTools context
    window.location.href = url;
}

function openGuideRegistration() {
    console.log('[TomoTrip] openGuideRegistration called - SAME WINDOW redirect');
    hideRegistrationChoice();
    
    // Redirect in SAME WINDOW (fixes DevTools + email registration flow issues)
    const registrationPage = '/guide-registration-v2.html';
    const cacheBust = Date.now();
    const url = registrationPage + '?cb=' + cacheBust;
    
    console.log('[TomoTrip] openGuideRegistration - redirecting to:', url);
    
    // Direct same-window redirect - no separate DevTools context
    window.location.href = url;
}

function handleSponsorRegistration() {
    console.log('🎯 Sponsor registration selected - SAME WINDOW');
    hideRegistrationChoice();
    
    // Detect current language
    const getCurrentLang = () => {
        const pathname = window.location.pathname;
        return pathname.includes('index-en.html') ? 'en' : 'ja';
    };
    const currentLang = getCurrentLang();
    
    // Route to language-appropriate page
    const registrationPage = currentLang === 'en'
        ? '/sponsor-registration-en.html'
        : '/sponsor-registration.html';
    
    // Same-window redirect (fixes DevTools + interaction issues)
    window.location.href = registrationPage;
}

function hideRegistrationChoice() {
    console.log('🛑 Hiding registration choice');
    const formContainer = document.getElementById('registrationFormContainer');
    if (formContainer) {
        formContainer.style.display = 'none';
        formContainer.innerHTML = '';
        console.log('✅ Registration choice hidden');
    }
}


/**
 * Setup Management Center Buttons - Both desktop and mobile
 */
function setupManagementButtons() {
    const managementBtn = document.getElementById('managementBtn');
    const managementBtnMobile = document.getElementById('managementBtnMobile');
    
    [managementBtn, managementBtnMobile].forEach(btn => {
        if (btn && !btn.hasAttribute('data-handler-added')) {
            // Remove any existing listeners to prevent duplicates
            btn.removeEventListener('click', handleManagementClick);
            btn.addEventListener('click', handleManagementClick);
            btn.setAttribute('data-handler-added', 'true');
            console.log('✅ Management center button handler attached');
        }
    });
}

function handleManagementClick(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('🏆 Management center button clicked');
    
    try {
        // Use the dedicated management center function from management.js
        if (typeof showManagementCenter === 'function') {
            showManagementCenter();
            console.log('✅ Management center opened via showManagementCenter()');
        } else {
            // Fallback: try to load manually
            const managementModal = document.getElementById('managementModal');
            if (managementModal) {
                if (typeof loadManagementData === 'function') {
                    loadManagementData();
                }
                const modal = new bootstrap.Modal(managementModal);
                modal.show();
                console.log('✅ Management center opened via fallback');
            } else {
                console.error('❌ Management modal not found');
                alert('管理センターが見つかりません。ページをリロードしてください。');
            }
        }
    } catch (error) {
        console.error('❌ Management center error:', error);
        alert('管理センターの表示に問題が発生しました: ' + error.message);
    }
}

/**
 * Setup Guide Card Management Buttons - Bookmark and Compare (delegated event handling)
 */
// ✅ フラグで重複登録を防止
let guideCardButtonsSetup = false;

function setupGuideCardButtons() {
    // ✅ 既にセットアップ済みなら何もしない（重複防止）
    if (guideCardButtonsSetup) {
        console.log('ℹ️ Guide card button delegation already setup, skipping');
        return;
    }
    
    // Use delegated event handling since guide cards are dynamically generated
    document.addEventListener('click', function(e) {
        // Handle bookmark button clicks (use closest for better event targeting)
        const bookmarkBtn = e.target.closest('.bookmark-btn');
        if (bookmarkBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const guideId = bookmarkBtn.getAttribute('data-guide-id');
            handleBookmarkClick(guideId, bookmarkBtn);
            return; // ✅ 処理完了後はすぐに戻る
        }
        
        // Handle compare button clicks (use closest for better event targeting)
        const compareBtn = e.target.closest('.compare-btn');
        if (compareBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const guideId = compareBtn.getAttribute('data-guide-id');
            handleCompareClick(guideId, compareBtn);
            return; // ✅ 処理完了後はすぐに戻る
        }
    });
    
    // Setup admin checkbox delegation  
    document.addEventListener('change', function(event) {
        if (event.target.matches('input[data-action="toggle-selection"]')) {
            const guideId = event.target.getAttribute('data-guide-id');
            if (guideId && window.toggleGuideSelection) {
                window.toggleGuideSelection(guideId);
                console.log('✅ Admin checkbox toggled for guide:', guideId);
            }
        }
    });
    
    // ✅ セットアップ完了フラグを設定
    guideCardButtonsSetup = true;
    console.log('✅ Guide card button delegation setup complete (one-time)');
}

/**
 * Setup Admin Mode Toggle Button
 */
function setupAdminModeToggle() {
    const adminToggleBtn = document.getElementById('adminModeToggleBtn');
    
    if (adminToggleBtn) {
        adminToggleBtn.removeEventListener('click', handleAdminModeToggle);
        adminToggleBtn.addEventListener('click', handleAdminModeToggle);
        console.log('✅ Admin mode toggle button handler attached');
    } else {
        console.warn('⚠️ Admin mode toggle button not found');
    }
}

function handleAdminModeToggle(e) {
    e.preventDefault();
    console.log('⚙️ Admin mode toggle clicked');
    
    if (window.toggleAdminMode) {
        window.toggleAdminMode();
        console.log('✅ Admin mode toggled successfully');
    } else {
        console.error('❌ toggleAdminMode function not available');
        alert('管理者モード機能が利用できません。');
    }
}

function handleBookmarkClick(guideId, buttonElement) {
    console.log('⭐ Bookmark button clicked for guide:', guideId);
    
    try {
        // Get current bookmarks
        let bookmarkedGuides = JSON.parse(localStorage.getItem('bookmarkedGuides') || '[]');
        // ✅ UUID対応: 文字列のまま保存・比較
        const id = String(guideId);
        
        // Check if already bookmarked
        const isBookmarked = bookmarkedGuides.map(b => String(b)).includes(id);
        
        if (isBookmarked) {
            // Remove from bookmarks
            bookmarkedGuides = bookmarkedGuides.filter(b => String(b) !== id);
            buttonElement.classList.remove('btn-warning');
            buttonElement.classList.add('btn-outline-warning');
            console.log('📌 Guide removed from bookmarks');
        } else {
            // Add to bookmarks
            bookmarkedGuides.push(id);
            buttonElement.classList.remove('btn-outline-warning');
            buttonElement.classList.add('btn-warning');
            console.log('⭐ Guide added to bookmarks');
        }
        
        // Save to localStorage
        localStorage.setItem('bookmarkedGuides', JSON.stringify(bookmarkedGuides));
        
        // Show feedback
        const action = isBookmarked ? '削除しました' : '追加しました';
        safeShowToast(`ブックマークに${action}`, 'success');
        
        // ✅ カスタムイベントを発火して管理センターを更新
        window.dispatchEvent(new Event('bookmarkChanged'));
        
    } catch (error) {
        console.error('❌ Bookmark error:', error);
        safeShowToast('ブックマークの操作に失敗しました', 'error');
    }
}

function handleCompareClick(guideId, buttonElement) {
    console.log('✓ Compare button clicked for guide:', guideId);
    
    // ✅ Null safety check for buttonElement
    if (!buttonElement) {
        console.error('❌ Button element is null, cannot update visual state');
        return;
    }
    
    try {
        // Get current comparison list
        let comparisonGuides = JSON.parse(localStorage.getItem('comparisonGuides') || '[]');
        // ✅ UUID対応: 文字列のまま保存・比較
        const id = String(guideId);
        
        // Check if already in comparison
        const isInComparison = comparisonGuides.map(c => String(c)).includes(id);
        
        if (isInComparison) {
            // Remove from comparison
            comparisonGuides = comparisonGuides.filter(c => String(c) !== id);
            
            // ✅ Safe classList operations with null check
            if (buttonElement && buttonElement.classList) {
                buttonElement.classList.remove('btn-success');
                buttonElement.classList.add('btn-outline-success');
            }
            console.log('📊 Guide removed from comparison');
        } else {
            // Check comparison limit
            if (comparisonGuides.length >= 3) {
                safeShowToast('比較リストは最大3件までです', 'warning');
                return;
            }
            
            // Add to comparison
            comparisonGuides.push(id);
            
            // ✅ Safe classList operations with null check
            if (buttonElement && buttonElement.classList) {
                buttonElement.classList.remove('btn-outline-success');
                buttonElement.classList.add('btn-success');
            }
            console.log('✓ Guide added to comparison');
        }
        
        // Save to localStorage
        localStorage.setItem('comparisonGuides', JSON.stringify(comparisonGuides));
        
        // Show feedback
        const action = isInComparison ? '削除しました' : '追加しました';
        safeShowToast(`比較リストに${action}`, 'success');
        
        // ✅ カスタムイベントを発火して管理センターを更新
        window.dispatchEvent(new Event('comparisonChanged'));
        
    } catch (error) {
        console.error('❌ Compare error:', error);
        safeShowToast('比較リストの操作に失敗しました', 'error');
    }
}

// Safe wrapper for toast notifications
function safeShowToast(message, type = 'info') {
    if (typeof showToast === 'function') {
        return showToast(message, type);
    }
    // Fallback implementation
    return showToastFallback(message, type);
}

function showToast(message, type = 'info') {
    // Simple toast implementation
    const toastContainer = document.createElement('div');
    toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-size: 14px;
        max-width: 300px;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
    `;
    toastContainer.textContent = message;
    
    document.body.appendChild(toastContainer);
    
    // Show toast
    setTimeout(() => {
        toastContainer.style.opacity = '1';
        toastContainer.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide and remove toast
    setTimeout(() => {
        toastContainer.style.opacity = '0';
        toastContainer.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (toastContainer.parentNode) {
                toastContainer.parentNode.removeChild(toastContainer);
            }
        }, 300);
    }, 3000);
}

// Fallback toast implementation (alias for main implementation)
function showToastFallback(message, type = 'info') {
    return showToast(message, type);
}

/**
 * Initialize all buttons when DOM is ready
 */
function initializeButtons() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupAllButtons);
    } else {
        setupAllButtons();
    }
}

// Auto-initialize if this script is loaded
initializeButtons();

// Guide Login Handler
async function handleGuideLogin(event) {
    event.preventDefault();
    console.log('🔐 Guide login form submitted');
    
    const identifier = document.getElementById('guideIdentifier')?.value;
    const phone = document.getElementById('guidePhoneLogin')?.value;
    
    if (!identifier || !phone) {
        showToast('ガイドIDまたはメールアドレスと電話番号を入力してください', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/guides/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ identifier, phone })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Save guide data to session storage
            sessionStorage.setItem('guideAuth', 'true');
            sessionStorage.setItem('guideData', JSON.stringify(result.guide));
            
            console.log('✅ Guide login successful:', result.guide);
            showToast('ログインに成功しました', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('guideLoginModal'));
            if (modal) modal.hide();
            
            // Check if there's a guide detail page to return to
            const returnToGuideId = sessionStorage.getItem('returnToGuideId');
            if (returnToGuideId) {
                console.log('🔗 Redirecting to guide detail after login:', returnToGuideId);
                sessionStorage.removeItem('returnToGuideId'); // Clean up
                
                // Detect current page language and redirect to appropriate detail page
                const isEnglish = window.location.pathname.includes('-en.html');
                const detailPage = isEnglish ? '/guide-detail-en.html' : '/guide-detail.html';
                
                setTimeout(() => {
                    window.location.href = `${detailPage}?id=${returnToGuideId}`;
                }, 1000);
            } else {
                // Redirect to guide edit page
                setTimeout(() => {
                    window.location.href = `/guide-edit.html?id=${result.guide.id}`;
                }, 1000);
            }
        } else {
            console.error('❌ Guide login failed:', result.message);
            showToast(result.message || 'ログインに失敗しました', 'error');
        }
    } catch (error) {
        console.error('❌ Guide login error:', error);
        showToast('ログイン中にエラーが発生しました', 'error');
    }
}

// Tourist Login Handler
async function handleTouristLogin(event) {
    event.preventDefault();
    console.log('🔐 Tourist login form submitted');
    
    const email = document.getElementById('touristEmailLogin')?.value;
    const phone = document.getElementById('touristPhoneLogin')?.value;
    
    if (!email || !phone) {
        showToast('メールアドレスと電話番号を入力してください', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/tourists/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, phone })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Save tourist data to session storage
            sessionStorage.setItem('touristAuth', 'true');
            sessionStorage.setItem('touristData', JSON.stringify(result.tourist));
            
            console.log('✅ Tourist login successful:', result.tourist);
            showToast('ログインに成功しました', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('touristLoginModal'));
            if (modal) modal.hide();
            
            // Check if there's a guide to return to
            const returnToGuideId = sessionStorage.getItem('returnToGuideId');
            if (returnToGuideId) {
                console.log('🔗 Redirecting to guide detail after login:', returnToGuideId);
                sessionStorage.removeItem('returnToGuideId'); // Clean up
                
                // Detect current page language and redirect to appropriate detail page
                const isEnglish = window.location.pathname.includes('-en.html');
                const detailPage = isEnglish ? '/guide-detail-en.html' : '/guide-detail.html';
                
                setTimeout(() => {
                    window.location.href = `${detailPage}?id=${returnToGuideId}`;
                }, 1000);
            } else {
                // Reload page to update UI
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } else {
            console.error('❌ Tourist login failed:', result.message);
            showToast(result.message || 'ログインに失敗しました', 'error');
        }
    } catch (error) {
        console.error('❌ Tourist login error:', error);
        showToast('ログイン中にエラーが発生しました', 'error');
    }
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.setupAllButtons = setupAllButtons;
    window.handleDashboardClick = handleDashboardClick;
    window.handleLoginDropdownClick = handleLoginDropdownClick;
    window.handleSearchClick = handleSearchClick;
    window.handleContactClick = handleContactClick;
    window.handleRegisterClick = handleRegisterClick;
    window.showRegistrationChoice = showRegistrationChoiceManual;
    window.hideRegistrationChoice = hideRegistrationChoice;
    window.handleGuideLogin = handleGuideLogin;
    window.handleTouristLogin = handleTouristLogin;
}