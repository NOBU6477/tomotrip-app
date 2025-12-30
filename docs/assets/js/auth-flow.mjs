/**
 * Authentication Flow Management for TomoTrip
 * Handles sponsor login, dashboard access, and registration flow
 */

class AuthFlowManager {
    constructor() {
        this.isLoggedIn = this.checkLoginStatus();
        this.userType = this.getUserType();
        this.initializeAuthFlow();
    }

    /**
     * Check if user is logged in (checking localStorage for auth status)
     */
    checkLoginStatus() {
        const authStatus = localStorage.getItem('tomotrip_auth_status');
        const authExpiry = localStorage.getItem('tomotrip_auth_expiry');
        
        if (authStatus && authExpiry) {
            const now = new Date().getTime();
            const expiry = parseInt(authExpiry);
            
            if (now < expiry) {
                return true;
            } else {
                // Clear expired auth
                this.clearAuthData();
                return false;
            }
        }
        return false;
    }

    /**
     * Get user type from localStorage
     */
    getUserType() {
        return localStorage.getItem('tomotrip_user_type') || null;
    }

    /**
     * Initialize authentication flow handlers
     */
    initializeAuthFlow() {
        this.setupDashboardButton();
        this.setupSponsorLoginFlow();
        this.setupRegistrationFlow();
    }

    /**
     * Setup dashboard button behavior
     */
    setupDashboardButton() {
        const dashboardBtn = document.getElementById('dashboardBtn');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleDashboardAccess();
            });

            // Update button appearance based on auth status
            this.updateDashboardButtonState();
        }
    }

    /**
     * Handle dashboard access based on login status
     */
    handleDashboardAccess() {
        if (this.isLoggedIn && this.userType === 'sponsor') {
            // Check if user is admin/operations team or regular store owner
            const storeLogin = localStorage.getItem('storeLogin');
            if (storeLogin) {
                // Regular store owner - redirect to individual store dashboard
                window.location.href = 'store-dashboard.html';
            } else {
                // Admin/operations team - redirect to operations dashboard
                window.location.href = 'sponsor-dashboard.html';
            }
        } else {
            // Show login prompt modal
            this.showLoginPromptModal();
        }
    }

    /**
     * Update dashboard button visual state
     */
    updateDashboardButtonState() {
        const dashboardBtn = document.getElementById('dashboardBtn');
        if (dashboardBtn) {
            if (this.isLoggedIn && this.userType === 'sponsor') {
                dashboardBtn.style.opacity = '1';
                dashboardBtn.style.cursor = 'pointer';
                dashboardBtn.title = dashboardBtn.title.replace('ログインが必要です', '').replace('Login Required', '');
            } else {
                dashboardBtn.style.opacity = '0.6';
                dashboardBtn.style.cursor = 'not-allowed';
                const isJapanese = document.documentElement.lang === 'ja' || 
                                  document.querySelector('html[lang="ja"]') || 
                                  window.location.pathname.includes('index.html') || 
                                  !window.location.pathname.includes('index-en.html');
                dashboardBtn.title += isJapanese ? ' (協賛店ログインが必要です)' : ' (Sponsor Login Required)';
            }
        }
    }

    /**
     * Setup sponsor login flow from dropdown
     */
    setupSponsorLoginFlow() {
        const sponsorLoginBtn = document.getElementById('sponsorLoginBtn');
        if (sponsorLoginBtn) {
            sponsorLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSponsorLoginModal();
            });
        }
    }

    /**
     * Setup registration flow
     */
    setupRegistrationFlow() {
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', (e) => {
                // Registration modal will be handled by existing modal system
                // but we can track registration completion here
            });
        }
    }

    /**
     * Show login prompt modal for dashboard access
     */
    showLoginPromptModal() {
        const isJapanese = document.documentElement.lang === 'ja' || 
                          document.querySelector('html[lang="ja"]') || 
                          window.location.pathname.includes('index.html') || 
                          !window.location.pathname.includes('index-en.html');

        const modalHTML = `
            <div class="modal fade" id="loginPromptModal" tabindex="-1" aria-hidden="true" style="z-index: 9999;">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 450px;">
                    <div class="modal-content" style="border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                        <div class="modal-header border-0 pb-0">
                            <h5 class="modal-title fw-bold text-primary">
                                ${isJapanese ? 'ダッシュボードアクセス' : 'Dashboard Access'}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center pt-2">
                            <div class="mb-4">
                                <i class="bi bi-shield-lock" style="font-size: 3rem; color: #007bff;"></i>
                            </div>
                            <h6 class="mb-3">
                                ${isJapanese ? 
                                  'ダッシュボードにアクセスするには協賛店としてログインする必要があります。' : 
                                  'You need to login as a sponsor to access the dashboard.'}
                            </h6>
                            <p class="text-muted mb-4 small">
                                ${isJapanese ? 
                                  'まだアカウントをお持ちでない場合は、まず協賛店登録を行ってください。' : 
                                  'If you don\'t have an account yet, please register as a sponsor first.'}
                            </p>
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" style="padding: 12px; border-radius: 8px;" id="sponsorLoginBtn">
                                    <i class="bi bi-person-check me-2"></i>${isJapanese ? '協賛店ログイン' : 'Sponsor Login'}
                                </button>
                                <button class="btn btn-outline-success" style="padding: 12px; border-radius: 8px;" id="sponsorRegistrationBtn">
                                    <i class="bi bi-person-plus me-2"></i>${isJapanese ? '協賛店登録' : 'Sponsor Registration'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('loginPromptModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup button event listeners
        setTimeout(() => {
            const loginBtn = document.getElementById('sponsorLoginBtn');
            const registrationBtn = document.getElementById('sponsorRegistrationBtn');
            
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    bootstrap.Modal.getInstance(document.getElementById('loginPromptModal')).hide();
                    this.showSponsorLoginModal();
                });
            }
            
            if (registrationBtn) {
                registrationBtn.addEventListener('click', () => {
                    bootstrap.Modal.getInstance(document.getElementById('loginPromptModal')).hide();
                    // Direct navigation to registration page with cache busting
                    window.location.href = 'sponsor-registration.html?v=' + Date.now();
                });
            }
        }, 100);

        // Show modal with proper configuration
        const modal = new bootstrap.Modal(document.getElementById('loginPromptModal'), {
            backdrop: 'static',  // Prevent backdrop click close
            keyboard: true,      // Allow ESC key close
            focus: true
        });
        modal.show();
        
        // Ensure proper z-index layering
        setTimeout(() => {
            const modalElement = document.getElementById('loginPromptModal');
            const backdrop = document.querySelector('.modal-backdrop');
            if (modalElement) {
                modalElement.style.zIndex = '9999';
            }
            if (backdrop) {
                backdrop.style.zIndex = '9998';
            }
        }, 100);
    }

    /**
     * Show sponsor login modal
     */
    showSponsorLoginModal() {
        const isJapanese = document.documentElement.lang === 'ja' || 
                          document.querySelector('html[lang="ja"]') || 
                          window.location.pathname.includes('index.html') || 
                          !window.location.pathname.includes('index-en.html');

        const modalHTML = `
            <div class="modal fade" id="sponsorLoginModal" tabindex="-1" aria-hidden="true" style="z-index: 9999;">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 450px;">
                    <div class="modal-content" style="border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-shop"></i> ${isJapanese ? '協賛店ログイン' : 'Sponsor Login'}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="sponsorLoginForm">
                                <div class="mb-3">
                                    <label for="sponsorEmail" class="form-label">
                                        ${isJapanese ? 'メールアドレス' : 'Email Address'}
                                    </label>
                                    <input type="email" class="form-control" id="sponsorEmail" required>
                                </div>
                                <div class="mb-3">
                                    <label for="sponsorPassword" class="form-label">
                                        ${isJapanese ? 'パスワード' : 'Password'}
                                    </label>
                                    <input type="password" class="form-control" id="sponsorPassword" required>
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="rememberMe">
                                    <label class="form-check-label" for="rememberMe">
                                        ${isJapanese ? 'ログイン状態を保持' : 'Remember me'}
                                    </label>
                                </div>
                                <div class="d-grid">
                                    <button type="submit" class="btn btn-primary">
                                        ${isJapanese ? 'ログイン' : 'Login'}
                                    </button>
                                </div>
                            </form>
                            <hr>
                            <div class="text-center">
                                <p class="mb-2">
                                    ${isJapanese ? 'まだアカウントをお持ちでない方' : 'Don\'t have an account?'}
                                </p>
                                <button class="btn btn-outline-success" id="loginModalRegisterBtn">
                                    ${isJapanese ? '協賛店登録' : 'Register as Sponsor'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('sponsorLoginModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup form handler and registration button
        document.getElementById('sponsorLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSponsorLogin();
        });

        // Setup registration button in login modal
        setTimeout(() => {
            const registerBtn = document.getElementById('loginModalRegisterBtn');
            if (registerBtn) {
                registerBtn.addEventListener('click', () => {
                    bootstrap.Modal.getInstance(document.getElementById('sponsorLoginModal')).hide();
                    window.location.href = 'sponsor-registration.html';
                });
            }
        }, 100);

        // Show modal with proper configuration
        const modal = new bootstrap.Modal(document.getElementById('sponsorLoginModal'), {
            backdrop: 'static',
            keyboard: true,
            focus: true
        });
        modal.show();
        
        // Ensure proper z-index layering
        setTimeout(() => {
            const modalElement = document.getElementById('sponsorLoginModal');
            const backdrop = document.querySelector('.modal-backdrop');
            if (modalElement) {
                modalElement.style.zIndex = '9999';
            }
            if (backdrop) {
                backdrop.style.zIndex = '9998';
            }
        }, 100);
    }

    /**
     * Show sponsor registration modal
     */
    showSponsorRegistrationModal() {
        const isJapanese = document.documentElement.lang === 'ja' || 
                          document.querySelector('html[lang="ja"]') || 
                          window.location.pathname.includes('index.html') || 
                          !window.location.pathname.includes('index-en.html');

        const modalHTML = `
            <div class="modal fade" id="sponsorRegistrationModal" tabindex="-1" aria-hidden="true" style="z-index: 9999;">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
                    <div class="modal-content" style="border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-shop-window"></i> ${isJapanese ? '協賛店登録' : 'Sponsor Registration'}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="sponsorRegistrationForm">
                                <div class="mb-3">
                                    <label for="storeName" class="form-label">
                                        ${isJapanese ? '店舗名' : 'Store Name'} *
                                    </label>
                                    <input type="text" class="form-control" id="storeName" required>
                                </div>
                                <div class="mb-3">
                                    <label for="storeEmail" class="form-label">
                                        ${isJapanese ? 'メールアドレス' : 'Email Address'} *
                                    </label>
                                    <input type="email" class="form-control" id="storeEmail" required>
                                </div>
                                <div class="mb-3">
                                    <label for="storePhone" class="form-label">
                                        ${isJapanese ? '電話番号' : 'Phone Number'} *
                                    </label>
                                    <input type="tel" class="form-control" id="storePhone" required>
                                </div>
                                <div class="mb-3">
                                    <label for="storePassword" class="form-label">
                                        ${isJapanese ? 'パスワード' : 'Password'} *
                                    </label>
                                    <input type="password" class="form-control" id="storePassword" required>
                                </div>
                                <div class="mb-3">
                                    <label for="storePasswordConfirm" class="form-label">
                                        ${isJapanese ? 'パスワード確認' : 'Confirm Password'} *
                                    </label>
                                    <input type="password" class="form-control" id="storePasswordConfirm" required>
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="agreeTerms" required>
                                    <label class="form-check-label" for="agreeTerms">
                                        ${isJapanese ? '利用規約に同意します' : 'I agree to the terms of service'}
                                    </label>
                                </div>
                                <div class="d-grid">
                                    <button type="submit" class="btn btn-success">
                                        ${isJapanese ? '登録' : 'Register'}
                                    </button>
                                </div>
                            </form>
                            <hr>
                            <div class="text-center">
                                <p class="mb-2">
                                    ${isJapanese ? 'すでにアカウントをお持ちの方' : 'Already have an account?'}
                                </p>
                                <button class="btn btn-outline-primary" onclick="authFlowManager.showSponsorLoginModal(); bootstrap.Modal.getInstance(document.getElementById('sponsorRegistrationModal')).hide();">
                                    ${isJapanese ? 'ログイン' : 'Login'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('sponsorRegistrationModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup form handler
        document.getElementById('sponsorRegistrationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSponsorRegistration();
        });

        // Show modal with proper configuration
        const modal = new bootstrap.Modal(document.getElementById('sponsorRegistrationModal'), {
            backdrop: 'static',
            keyboard: true,
            focus: true
        });
        modal.show();
        
        // Ensure proper z-index layering
        setTimeout(() => {
            const modalElement = document.getElementById('sponsorRegistrationModal');
            const backdrop = document.querySelector('.modal-backdrop');
            if (modalElement) {
                modalElement.style.zIndex = '9999';
            }
            if (backdrop) {
                backdrop.style.zIndex = '9998';
            }
        }, 100);
    }

    /**
     * Handle sponsor login form submission
     */
    async handleSponsorLogin() {
        const email = document.getElementById('sponsorEmail').value;
        const password = document.getElementById('sponsorPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        try {
            // Show loading state
            const submitBtn = document.querySelector('#sponsorLoginForm button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = document.documentElement.lang === 'ja' ? 'ログイン中...' : 'Logging in...';

            // Simulate login API call (replace with actual API)
            await this.simulateApiCall();

            // Set auth status
            this.setAuthData('sponsor', rememberMe);

            // Update UI
            this.updateDashboardButtonState();

            // Close modal and redirect
            bootstrap.Modal.getInstance(document.getElementById('sponsorLoginModal')).hide();
            
            // Show success message
            this.showToast(
                document.documentElement.lang === 'ja' ? 'ログインしました' : 'Logged in successfully',
                'success'
            );

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'sponsor-dashboard.html';
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
            this.showToast(
                document.documentElement.lang === 'ja' ? 'ログインに失敗しました' : 'Login failed',
                'error'
            );
        }
    }

    /**
     * Registration disabled - Contact for account creation
     */
    async handleSponsorRegistration() {
        const storeName = document.getElementById('storeName').value;
        const email = document.getElementById('storeEmail').value;
        const phone = document.getElementById('storePhone').value;
        const password = document.getElementById('storePassword').value;
        const passwordConfirm = document.getElementById('storePasswordConfirm').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validate passwords match
        if (password !== passwordConfirm) {
            this.showToast(
                document.documentElement.lang === 'ja' ? 'パスワードが一致しません' : 'Passwords do not match',
                'error'
            );
            return;
        }

        if (!agreeTerms) {
            this.showToast(
                document.documentElement.lang === 'ja' ? '利用規約に同意してください' : 'Please agree to the terms of service',
                'error'
            );
            return;
        }

        try {
            // Show loading state
            const submitBtn = document.querySelector('#sponsorRegistrationForm button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = document.documentElement.lang === 'ja' ? '登録中...' : 'Registering...';

            // Simulate registration API call
            await this.simulateApiCall();

            // Set auth status (automatically log in after registration)
            this.setAuthData('sponsor', true);

            // Update UI
            this.updateDashboardButtonState();

            // Close modal and redirect
            bootstrap.Modal.getInstance(document.getElementById('sponsorRegistrationModal')).hide();
            
            // Show success message
            this.showToast(
                document.documentElement.lang === 'ja' ? '登録が完了しました' : 'Registration completed successfully',
                'success'
            );

            // Store registration info and redirect to individual store dashboard
            localStorage.setItem('storeLogin', JSON.stringify({
                storeName: storeName,
                email: email,
                loginTime: new Date().toISOString(),
                userType: 'store_owner'
            }));

            // Redirect to store dashboard for individual store management
            setTimeout(() => {
                window.location.href = 'store-dashboard.html';
            }, 1000);

        } catch (error) {
            console.error('Registration error:', error);
            this.showToast(
                document.documentElement.lang === 'ja' ? '登録に失敗しました' : 'Registration failed',
                'error'
            );
        } finally {
            // Reset button state
            const submitBtn = document.querySelector('#sponsorRegistrationForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }

    /**
     * Set authentication data in localStorage
     */
    setAuthData(userType, rememberMe) {
        const expiry = rememberMe ? 
            new Date().getTime() + (30 * 24 * 60 * 60 * 1000) : // 30 days
            new Date().getTime() + (24 * 60 * 60 * 1000); // 1 day

        localStorage.setItem('tomotrip_auth_status', 'true');
        localStorage.setItem('tomotrip_user_type', userType);
        localStorage.setItem('tomotrip_auth_expiry', expiry.toString());

        this.isLoggedIn = true;
        this.userType = userType;
    }

    /**
     * Clear authentication data
     */
    clearAuthData() {
        localStorage.removeItem('tomotrip_auth_status');
        localStorage.removeItem('tomotrip_user_type');
        localStorage.removeItem('tomotrip_auth_expiry');

        this.isLoggedIn = false;
        this.userType = null;
    }

    /**
     * Simulate API call
     */
    async simulateApiCall() {
        return new Promise(resolve => {
            setTimeout(resolve, 1500);
        });
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Create toast if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        const toastId = 'toast-' + Date.now();
        const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';

        const toastHTML = `
            <div id="${toastId}" class="toast ${bgClass} text-white" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        const toast = new bootstrap.Toast(document.getElementById(toastId));
        toast.show();

        // Remove toast after it's hidden
        document.getElementById(toastId).addEventListener('hidden.bs.toast', function () {
            this.remove();
        });
    }
}

// Initialize auth flow manager
let authFlowManager;
document.addEventListener('DOMContentLoaded', () => {
    authFlowManager = new AuthFlowManager();
});

export { AuthFlowManager };