// [TomoTrip] Guide Registration v2 - External JavaScript Module
console.log('[TomoTrip] guide-registration-v2.js loaded');

// Global state management - window.TT_STATE で統一
window.TT_STATE = {
    phoneSessionId: null,
    isEmailValid: false
};

// Phone number formatting utility
function formatPhoneNumber(phone) {
    // Remove all non-digits
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Convert Japanese mobile numbers to international format
    if (digitsOnly.startsWith('090') || digitsOnly.startsWith('080') || digitsOnly.startsWith('070')) {
        if (digitsOnly.length === 11) {
            return '+81' + digitsOnly.slice(1); // Remove leading 0 and add +81
        }
    }
    
    // If already international format
    if (digitsOnly.startsWith('81') && digitsOnly.length === 12) {
        return '+' + digitsOnly;
    }
    
    return null; // Invalid format
}
        // Document type handling and photo preview
        function setupDocumentUpload() {
            const documentType = document.getElementById('documentType');
            const singleUpload = document.getElementById('singleUpload');
            const dualUpload = document.getElementById('dualUpload');
            
            documentType.addEventListener('change', function() {
                const selectedType = this.value;
                
                // Clear previous files when changing type
                document.getElementById('documentFile').value = '';
                document.getElementById('documentFront').value = '';
                document.getElementById('documentBack').value = '';
                document.getElementById('documentPreview').style.display = 'none';
                document.getElementById('frontPreview').style.display = 'none';
                document.getElementById('backPreview').style.display = 'none';
                
                if (selectedType === 'drivers_license' || selectedType === 'insurance_card') {
                    // Show dual upload for front/back
                    singleUpload.style.display = 'none';
                    dualUpload.style.display = 'block';
                } else {
                    // Show single upload
                    singleUpload.style.display = 'block';
                    dualUpload.style.display = 'none';
                }
            });
            
            // Setup preview for single document
            setupImagePreview('documentFile', 'documentPreview', 'previewImage');
            
            // Setup preview for dual documents
            setupImagePreview('documentFront', 'frontPreview', 'frontImage');
            setupImagePreview('documentBack', 'backPreview', 'backImage');
            
            // Setup profile photo preview
            setupImagePreview('profilePhoto', 'profilePreview', 'profileImage');
        }
        
        function setupImagePreview(inputId, previewId, imageId) {
            const input = document.getElementById(inputId);
            const preview = document.getElementById(previewId);
            const image = document.getElementById(imageId);
            
            if (!input || !preview || !image) return;
            
            input.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    // Validate file size (5MB max)
                    if (file.size > 5 * 1024 * 1024) {
                        showToast('ファイルサイズが大きすぎます（最大5MB）', 'error');
                        input.value = '';
                        return;
                    }
                    
                    // Validate file type
                    if (!file.type.match('image.*')) {
                        showToast('画像ファイルを選択してください', 'error');
                        input.value = '';
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        image.src = e.target.result;
                        preview.style.display = 'block';
                        showToast('画像がアップロードされました', 'success');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Initialize all event listeners when DOM is ready
        function initializeApp() {
            console.log('[TomoTrip] initializeApp called');
            console.log('[TomoTrip] TT_STATE object:', window.TT_STATE);
            
            // Call all initialization functions - 引数なし、window.TT_STATE を直接参照
            initializePrefectureSelect();
            setupDocumentUpload();
            initializeEmailValidation();
            initializePhoneVerification();
            initializeFormSubmission();
            initializeCancelButton();
            
            console.log('[TomoTrip] All features initialized successfully');
        }

        // Email validation initialization
        function initializeEmailValidation() {
            console.log('[TomoTrip] initializeEmailValidation called, TT_STATE =', window.TT_STATE);
            const emailInput = document.getElementById('guideEmail');
            const emailFeedback = document.getElementById('emailFeedback');
            
            if (!emailInput || !emailFeedback) {
                console.error('[TomoTrip] Email validation: Required elements not found');
                return;
            }
            
            console.log('[TomoTrip] Email validation initialized');
            
            emailInput.addEventListener('blur', async function() {
                console.log('🔍 Email blur event triggered, checking:', this.value);
                const email = this.value.trim();
                
                // Clear previous feedback
                emailFeedback.innerHTML = '';
                emailInput.classList.remove('is-valid', 'is-invalid');
                
                if (!email) {
                    console.log('⚠️ Email field is empty, skipping validation');
                    return;
                }
                
                // Basic email format validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    console.log('❌ Invalid email format:', email);
                    emailInput.classList.add('is-invalid');
                    emailFeedback.innerHTML = '<span class="text-danger"><i class="bi bi-x-circle me-1"></i>有効なメールアドレスを入力してください</span>';
                    window.TT_STATE.isEmailValid = false;
                    return;
                }
                
                // Check availability with server
                console.log('📡 Checking email availability with API:', email);
                try {
                    emailFeedback.innerHTML = '<span class="text-muted"><i class="bi bi-hourglass-split me-1"></i>確認中...</span>';
                    
                    const response = await fetch(`/api/guides/check-email?email=${encodeURIComponent(email)}`);
                    const result = await response.json();
                    
                    console.log('📥 API response:', result);
                    
                    if (result.success) {
                        if (result.available) {
                            console.log('✅ Email is available');
                            emailInput.classList.add('is-valid');
                            emailFeedback.innerHTML = '<span class="text-success"><i class="bi bi-check-circle me-1"></i>このメールアドレスは使用可能です</span>';
                            window.TT_STATE.isEmailValid = true;
                        } else {
                            console.log('❌ Email is already registered');
                            emailInput.classList.add('is-invalid');
                            emailFeedback.innerHTML = '<span class="text-danger"><i class="bi bi-x-circle me-1"></i>このメールアドレスは既に登録されています</span>';
                            window.TT_STATE.isEmailValid = false;
                        }
                    }
                } catch (error) {
                    console.error('❌ Email check error:', error);
                    emailFeedback.innerHTML = '<span class="text-warning"><i class="bi bi-exclamation-triangle me-1"></i>メールアドレスの確認に失敗しました</span>';
                    window.TT_STATE.isEmailValid = false;
                }
            });
        
            // Clear feedback when user starts typing again
            emailInput.addEventListener('input', function() {
                if (emailFeedback.innerHTML) {
                    emailFeedback.innerHTML = '';
                    emailInput.classList.remove('is-valid', 'is-invalid');
                    window.TT_STATE.isEmailValid = false;
                }
            });
        }

        // Phone verification initialization
        function initializePhoneVerification() {
            console.log('[TomoTrip] initializePhoneVerification called, TT_STATE =', window.TT_STATE);
            const sendBtn = document.getElementById('sendVerificationCode');
            if (!sendBtn) {
                console.error('[TomoTrip] Phone verification: sendVerificationCode button not found');
                return;
            }
            
            console.log('[TomoTrip] Phone verification initialized');
            
            sendBtn.addEventListener('click', async function() {
                const phone = document.getElementById('guidePhone').value;
                if (!phone) {
                    showToast('電話番号を入力してください', 'error');
                    return;
                }
                
                // Convert Japanese phone number to international format
                const formattedPhone = formatPhoneNumber(phone);
                if (!formattedPhone) {
                    showToast('有効な電話番号を入力してください（例：090-1234-5678）', 'error');
                    return;
                }
                
                // Disable button and show loading
                const sendBtn = this;
                sendBtn.disabled = true;
                sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>送信中...';
                
                try {
                    const response = await fetch('/api/guides/send-verification', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ phoneNumber: formattedPhone })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showToast(result.message || 'SMS認証コードを送信しました', 'success');
                        document.getElementById('verificationCodeArea').style.display = 'block';
                        
                        // Lock phone input after successful send
                        document.getElementById('guidePhone').readOnly = true;
                        
                        // Show simulation code if available (development mode)
                        if (result.simulationCode) {
                            showToast(`開発モード: 認証コードは ${result.simulationCode} です`, 'info');
                        }
                    } else {
                        showToast(result.message || 'SMS送信に失敗しました', 'error');
                    }
                } catch (error) {
                    console.error('SMS送信エラー:', error);
                    showToast('ネットワークエラーが発生しました', 'error');
                } finally {
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = '<i class="bi bi-send me-1"></i>認証コード送信';
                }
            });

            document.getElementById('verifyPhone').addEventListener('click', async function() {
                const phoneInput = document.getElementById('guidePhone').value;
                const phone = formatPhoneNumber(phoneInput);
                const code = document.getElementById('verificationCode').value;
                
                if (!phone) {
                    showToast('有効な電話番号を入力してください', 'error');
                    return;
                }
                
                if (!code) {
                    showToast('認証コードを入力してください', 'error');
                    return;
                }
                
                // Disable button and show loading
                const verifyBtn = this;
                let verificationResult;
                verifyBtn.disabled = true;
                verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>認証中...';
                
                try {
                    const response = await fetch('/api/guides/verify-phone', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ phoneNumber: phone, code })
                    });
                    
                    verificationResult = await response.json();
                    
                    if (verificationResult.success) {
                        console.log('[TomoTrip] before setting phoneSessionId, TT_STATE =', window.TT_STATE);
                        window.TT_STATE.phoneSessionId = verificationResult.sessionId;
                        console.log('[TomoTrip] after setting phoneSessionId, TT_STATE =', window.TT_STATE);
                        showToast(verificationResult.message || '電話認証が完了しました！', 'success');
                        verifyBtn.classList.remove('btn-primary');
                        verifyBtn.classList.add('btn-success');
                        verifyBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>認証完了';
                        verifyBtn.disabled = true;
                    } else {
                        showToast(verificationResult.message || '認証コードが正しくありません', 'error');
                    }
                } catch (error) {
                    console.error('認証エラー:', error);
                    showToast('ネットワークエラーが発生しました', 'error');
                } finally {
                    if (!verificationResult?.success) {
                        verifyBtn.disabled = false;
                        verifyBtn.innerHTML = '<i class="bi bi-shield-check me-1"></i>認証確認';
                    }
                }
            });
        }
        
        // Toast notification system with field scroll
        function showToast(message, type = 'info', fieldId = null) {
            // Remove existing toasts
            const existingToasts = document.querySelectorAll('.toast-container');
            existingToasts.forEach(toast => toast.remove());
            
            // Scroll to and highlight field if specified
            if (fieldId) {
                scrollToField(fieldId);
            }
            
            const toastColor = {
                'success': 'bg-success',
                'error': 'bg-danger',
                'info': 'bg-info',
                'warning': 'bg-warning'
            }[type] || 'bg-info';
            
            const toastIcon = {
                'success': 'check-circle-fill',
                'error': 'exclamation-triangle-fill',
                'info': 'info-circle-fill',
                'warning': 'exclamation-triangle-fill'
            }[type] || 'info-circle-fill';
            
            const toastHTML = `
                <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 2000;">
                    <div class="toast show ${toastColor} text-white" role="alert">
                        <div class="toast-body">
                            <i class="bi bi-${toastIcon} me-2"></i>${message}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', toastHTML);
            
            // Auto-remove after 4 seconds
            setTimeout(() => {
                const toastContainer = document.querySelector('.toast-container');
                if (toastContainer) {
                    toastContainer.remove();
                }
            }, 4000);
        }

        // Field scroll and highlight function
        function scrollToField(fieldId) {
            const field = document.getElementById(fieldId);
            if (!field) return;
            
            // Remove existing highlights
            document.querySelectorAll('.field-error-highlight').forEach(el => {
                el.classList.remove('field-error-highlight');
            });
            
            // Scroll to field with smooth animation
            field.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
            
            // Add highlight class
            field.classList.add('field-error-highlight');
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                field.classList.remove('field-error-highlight');
            }, 3000);
            
            // Focus the field if it's an input
            setTimeout(() => {
                if (field.tagName === 'INPUT' || field.tagName === 'SELECT' || field.tagName === 'TEXTAREA') {
                    field.focus();
                }
            }, 500);
        }

        // Process server validation errors
        function processServerError(errorMessage) {
            // Extract field name from error message pattern: "必須フィールドが不足しています: fieldName"
            const fieldMatch = errorMessage.match(/必須フィールドが不足しています:\s*(\w+)/);
            if (fieldMatch) {
                const fieldName = fieldMatch[1];
                showToast(errorMessage, 'error', fieldName);
                return;
            }
            
            // Check for other field-specific errors
            const fieldMappings = {
                'guideName': ['ガイド名', '名前'],
                'phoneNumber': ['電話番号', '電話'],
                'guideEmail': ['メール', 'メールアドレス'],
                'documentType': ['証明書', '身分証明書'],
                'guideLanguages': ['言語', '対応言語'],
                'guideSessionRate': ['料金', 'セッション料金']
            };
            
            for (const [fieldId, keywords] of Object.entries(fieldMappings)) {
                if (keywords.some(keyword => errorMessage.includes(keyword))) {
                    showToast(errorMessage, 'error', fieldId);
                    return;
                }
            }
            
            // Default error without field scroll
            showToast(errorMessage, 'error');
        }
        
        // Document upload handling placeholder
        function handleDocumentUpload(inputElement) {
            const files = inputElement.files;
            if (files && files.length > 0) {
                showToast(`${files.length}個のファイルが選択されました`, 'info');
                // TODO: Implement actual file upload to API
            }
        }
        
        
        // Initialize prefecture selection
        async function initializePrefectureSelect() {
            console.log('[TomoTrip] initializePrefectureSelect called');
            try {
                const { generatePrefectureOptions } = await import('/assets/js/ui/prefecture-selector.mjs');
                const locationSelect = document.getElementById('guideLocation');
                if (locationSelect) {
                    const optionsHTML = generatePrefectureOptions();
                    locationSelect.innerHTML = optionsHTML;
                    console.log('✅ Prefecture options initialized');
                    console.log('📋 Option count:', locationSelect.options.length);
                    console.log('🔍 First 3 options:', Array.from(locationSelect.options).slice(0, 3).map(opt => opt.text));
                }
            } catch (error) {
                console.error('❌ Failed to load prefecture options:', error);
                // Fallback to basic options
                document.getElementById('guideLocation').innerHTML = `
                    <option value="">活動地域を選択してください</option>
                    <option value="tokyo">東京都</option>
                    <option value="osaka">大阪府</option>
                    <option value="kyoto">京都府</option>
                `;
            }
        }
        
        // Beautiful Registration Complete Modal
        function showRegistrationCompleteModal(guideId, guideName, selectedLanguages, sessionRate) {
            // Create modal HTML
            const modalHTML = `
                <div class="modal fade" id="registrationCompleteModal" tabindex="-1" aria-hidden="true" style="z-index: 3000;">
                    <div class="modal-dialog modal-dialog-centered modal-lg">
                        <div class="modal-content" style="border: none; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                            <div class="modal-body p-0" style="border-radius: 20px; overflow: hidden; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                                <!-- Header Section -->
                                <div class="text-center py-5 px-4" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);">
                                    <div class="mb-4">
                                        <div class="success-icon-container" style="display: inline-block; animation: bounce 1s ease-in-out;">
                                            <i class="bi bi-check-circle-fill" style="font-size: 4rem; color: #00E676; text-shadow: 0 0 20px rgba(0,230,118,0.5);"></i>
                                        </div>
                                    </div>
                                    <h2 class="text-white fw-bold mb-3" style="text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                                        🎉 ガイド登録完了！
                                    </h2>
                                    <p class="text-white-50 mb-0" style="font-size: 1.1rem;">
                                        ガイド情報の登録が正常に完了しました
                                    </p>
                                </div>
                                
                                <!-- Guide Info Section -->
                                <div class="px-5 py-4" style="background: rgba(255,255,255,0.95);">
                                    <div class="row g-3 mb-4">
                                        <div class="col-md-6">
                                            <div class="d-flex align-items-center">
                                                <div class="me-3" style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                                    <i class="bi bi-person-circle text-white"></i>
                                                </div>
                                                <div>
                                                    <small class="text-muted">ガイド名</small>
                                                    <div class="fw-bold">${guideName}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="d-flex align-items-center">
                                                <div class="me-3" style="width: 40px; height: 40px; background: linear-gradient(135deg, #ff6b6b, #ee5a24); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                                    <i class="bi bi-currency-yen text-white"></i>
                                                </div>
                                                <div>
                                                    <small class="text-muted">セッション料金</small>
                                                    <div class="fw-bold">¥${Number(sessionRate).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="d-flex align-items-center">
                                                <div class="me-3" style="width: 40px; height: 40px; background: linear-gradient(135deg, #00d2ff, #3a7bd5); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                                    <i class="bi bi-translate text-white"></i>
                                                </div>
                                                <div>
                                                    <small class="text-muted">対応言語</small>
                                                    <div class="fw-bold">${selectedLanguages.join(', ')}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="d-flex align-items-center">
                                                <div class="me-3" style="width: 40px; height: 40px; background: linear-gradient(135deg, #a8e6cf, #88d8c0); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                                    <i class="bi bi-key text-white"></i>
                                                </div>
                                                <div>
                                                    <small class="text-muted">ガイドID</small>
                                                    <div class="fw-bold font-monospace">${guideId}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="alert alert-success border-0" style="background: linear-gradient(135deg, #d4edda, #c3e6cb); border-radius: 15px;">
                                        <i class="bi bi-info-circle me-2"></i>
                                        <strong>次にやること：</strong> ダッシュボードで配当やランクを確認したり、プロフィール情報を編集できます。
                                    </div>
                                </div>
                                
                                <!-- Action Buttons -->
                                <div class="p-4" style="background: #f8f9fa;">
                                    <div class="row g-3">
                                        <div class="col-12">
                                            <button type="button" class="btn btn-lg w-100 py-3" onclick="redirectToDashboard('${guideId}')" 
                                                    style="background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 15px; color: white; font-weight: 600; box-shadow: 0 8px 20px rgba(102,126,234,0.3); transition: all 0.3s ease;"
                                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 30px rgba(102,126,234,0.4)'"
                                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 20px rgba(102,126,234,0.3)'">
                                                <i class="bi bi-speedometer2 me-2"></i>
                                                ダッシュボードを開く
                                            </button>
                                        </div>
                                        <div class="col-md-6">
                                            <button type="button" class="btn btn-outline-secondary btn-lg w-100 py-3" onclick="redirectToEditPage('${guideId}')" 
                                                    style="border: 2px solid #6c757d; border-radius: 15px; font-weight: 600; transition: all 0.3s ease;"
                                                    onmouseover="this.style.backgroundColor='#6c757d'; this.style.color='white'"
                                                    onmouseout="this.style.backgroundColor='transparent'; this.style.color='#6c757d'">
                                                <i class="bi bi-pencil-square me-2"></i>
                                                プロフィール編集
                                            </button>
                                        </div>
                                        <div class="col-md-6">
                                            <button type="button" class="btn btn-outline-secondary btn-lg w-100 py-3" onclick="redirectToMainPage()" 
                                                    style="border: 2px solid #6c757d; border-radius: 15px; font-weight: 600; transition: all 0.3s ease;"
                                                    onmouseover="this.style.backgroundColor='#6c757d'; this.style.color='white'"
                                                    onmouseout="this.style.backgroundColor='transparent'; this.style.color='#6c757d'">
                                                <i class="bi bi-house me-2"></i>
                                                ホームページ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <style>
                @keyframes bounce {
                    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
                    40%, 43% { transform: translate3d(0,-30px,0); }
                    70% { transform: translate3d(0,-15px,0); }
                    90% { transform: translate3d(0,-4px,0); }
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translate3d(0, 40px, 0);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(0, 0, 0);
                    }
                }
                
                .modal.show .modal-dialog {
                    animation: fadeInUp 0.5s ease-out;
                }
                </style>
            `;
            
            // Remove existing modal if any
            const existingModal = document.getElementById('registrationCompleteModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('registrationCompleteModal'), {
                backdrop: 'static',
                keyboard: false
            });
            modal.show();
        }
        
        function redirectToDashboard(guideId) {
            window.location.href = `guide-dashboard.html?id=${guideId}`;
        }
        
        function redirectToEditPage(guideId) {
            window.location.href = `guide-edit.html?id=${guideId}`;
        }
        
        function redirectToMainPage() {
            // Close modal first
            const modal = bootstrap.Modal.getInstance(document.getElementById('registrationCompleteModal'));
            if (modal) modal.hide();
            
            // Redirect back to main page with immediate refresh
            if (window.opener && window.opener.refreshGuideData) {
                // If opened from main page, refresh it and close this window
                console.log('🔄 Triggering immediate guide data refresh');
                window.opener.refreshGuideData();
                // Also trigger a visual refresh notification
                if (window.opener.showNewGuideNotification) {
                    window.opener.showNewGuideNotification(1);
                }
                setTimeout(() => window.close(), 500);
            } else if (window.opener) {
                // Force full page reload to ensure new data is fetched
                window.opener.location.reload();
                setTimeout(() => window.close(), 500);
            } else {
                // Redirect to root with cache-busting parameters
                console.log('🏠 Redirecting to main page with refresh');
                window.location.href = '/?refresh=new_guide&t=' + Date.now();
            }
        }

        // Form submission initialization
        function initializeFormSubmission() {
            console.log('[TomoTrip] initializeFormSubmission called, TT_STATE =', window.TT_STATE);
            const form = document.getElementById('guideRegistrationForm');
            console.log('[TomoTrip] form element =', form);
            if (!form) {
                console.error('[TomoTrip] guideRegistrationForm not found in DOM');
                return;
            }
            
            form.addEventListener('submit', async function(e) {
                console.log('[TomoTrip] submit handler START, TT_STATE =', window.TT_STATE);
                e.preventDefault();
                
                if (!window.TT_STATE.phoneSessionId) {
                    showToast('電話認証を完了してください', 'error', 'phoneNumber');
                    return;
                }
                
                // ✅ [CANONICAL VALIDATION] Validate required fields: name and price
                const guideNameInput = document.getElementById('guideName');
                const guideName = guideNameInput ? guideNameInput.value.trim() : '';
                if (!guideName) {
                    showToast('ガイド名は必須です', 'error', 'guideName');
                    return;
                }
                
                const guideSessionRateInput = document.getElementById('guideSessionRate');
                const guideSessionRate = guideSessionRateInput ? parseFloat(guideSessionRateInput.value) : 0;
                if (!guideSessionRate || guideSessionRate <= 0) {
                    showToast('料金は1以上を入力してください', 'error', 'guideSessionRate');
                    return;
                }
                
                console.log('✅ [VALIDATION] Name and price validated:', { guideName, guideSessionRate });

                // Validate document upload based on type
                const documentType = document.getElementById('documentType').value;
                if (!documentType) {
                    showToast('証明書タイプを選択してください', 'error', 'documentType');
                    return;
                }
                
                if (documentType === 'drivers_license' || documentType === 'insurance_card') {
                    // Dual upload validation
                    const frontFile = document.getElementById('documentFront').files[0];
                    const backFile = document.getElementById('documentBack').files[0];
                    
                    if (!frontFile) {
                        showToast('証明書の表面写真をアップロードしてください', 'error', 'documentFront');
                        return;
                    }
                    if (!backFile) {
                        showToast('証明書の裏面写真をアップロードしてください', 'error', 'documentBack');
                        return;
                    }
                } else {
                    // Single upload validation
                    const documentFile = document.getElementById('documentFile').files[0];
                    if (!documentFile) {
                        showToast('証明書をアップロードしてください', 'error', 'documentFile');
                        return;
                    }
                }
                
                // Disable submit button
                const submitBtn = document.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>登録中...';
                
                try {
                    // Check if profile photo already uploaded
                    let profileImageUrl = sessionStorage.getItem(`profileImageUrl_${window.TT_STATE.phoneSessionId}`);
                    
                    // Upload profile photo only if not already uploaded
                    const profilePhotoFile = document.getElementById('profilePhoto').files[0];
                    if (profilePhotoFile && !profileImageUrl) {
                        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>プロフィール写真アップロード中...';
                        
                        const photoFormData = new FormData();
                        photoFormData.append('sessionId', window.TT_STATE.phoneSessionId);
                        photoFormData.append('profilePhoto', profilePhotoFile);
                        
                        const uploadResponse = await fetch('/api/guides/upload-profile-photo', {
                            method: 'POST',
                            body: photoFormData
                        });
                        
                        console.log('📡 Upload response status:', uploadResponse.status);
                        console.log('📡 Upload response headers:', [...uploadResponse.headers.entries()]);
                        
                        if (!uploadResponse.ok) {
                            console.error('Upload failed with status:', uploadResponse.status);
                            const errorText = await uploadResponse.text();
                            console.error('Error response:', errorText);
                            showToast('プロフィール写真のアップロードに失敗しました', 'error');
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = originalText;
                            return;
                        }
                        
                        let uploadResult;
                        try {
                            const responseText = await uploadResponse.text();
                            console.log('📡 Raw response:', responseText.substring(0, 500));
                            uploadResult = JSON.parse(responseText);
                        } catch (parseError) {
                            console.error('❌ JSON parse error:', parseError);
                            console.error('❌ Response was not valid JSON');
                            showToast('プロフィール写真のアップロードに失敗しました', 'error');
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = originalText;
                            return;
                        }
                        
                        if (!uploadResult.success) {
                            console.error('Upload result not successful:', uploadResult);
                            showToast('プロフィール写真のアップロードに失敗しました', 'error');
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = originalText;
                            return;
                        }
                        
                        console.log('✅ Profile photo uploaded:', uploadResult.profileImageUrl);
                        
                        // Store uploaded photo URL in session storage
                        profileImageUrl = uploadResult.profileImageUrl;
                        sessionStorage.setItem(`profileImageUrl_${window.TT_STATE.phoneSessionId}`, profileImageUrl);
                    } else if (profileImageUrl) {
                        console.log('✅ Using previously uploaded profile photo:', profileImageUrl);
                    }
                    
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>登録中...';
                    
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData);
                    
                    // Add profile image URL if uploaded
                    if (profileImageUrl) {
                        data.profileImageUrl = profileImageUrl;
                        console.log('📸 Including profileImageUrl in registration:', profileImageUrl);
                    }
                    
                    // Get selected languages
                    const languageSelect = document.getElementById('guideLanguages');
                    const selectedLanguages = Array.from(languageSelect.selectedOptions).map(option => option.value);
                    data.guideLanguages = selectedLanguages;
                    
                    // Set registration language (Japanese version)
                    data.registrationLanguage = 'ja';
                    
                    console.log('Complete guide registration data:', data);
                    console.log('FormData keys:', Object.keys(data));
                    
                    const response = await fetch('/api/guides/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            sessionId: window.TT_STATE.phoneSessionId,
                            guideData: data
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showToast(result.message || 'ガイド登録が完了しました！', 'success');
                        
                        // Show beautiful success modal with edit option
                        setTimeout(() => {
                            showRegistrationCompleteModal(result.guideId, data.guideName, selectedLanguages, data.guideSessionRate);
                        }, 1000);
                    } else {
                        // Handle duplicate email error specifically
                        if (result.error === 'DUPLICATE_EMAIL') {
                            showToast('このメールアドレスは既に登録されています。別のメールアドレスをご使用ください。', 'error', 'guideEmail');
                        } else {
                            processServerError(result.message || '登録に失敗しました');
                        }
                    }
                } catch (error) {
                    console.error('[TomoTrip] Error in submit handler:', error);
                    console.error('[TomoTrip] Error stack:', error.stack);
                    showToast('ネットワークエラーが発生しました', 'error');
                    alert('ガイド登録処理中にエラーが発生しました。コンソールログを確認してください。');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            });
            
            console.log('[TomoTrip] Form submission initialized');
        }

        // Cancel button initialization  
        function initializeCancelButton() {
            console.log('[TomoTrip] initializeCancelButton called');
            const cancelBtn = document.getElementById('cancelRegistrationBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    cancelRegistration();
                });
                console.log('[TomoTrip] Cancel button initialized');
            }
        }

        // Cancel registration function
        function cancelRegistration() {
            if (confirm('登録を中止しますか？入力したデータは保存されません。')) {
                // Always redirect to main Japanese page
                window.location.href = '/index.html';
            }
        }
        
        // Initialize app when DOM is ready

// DOM 状態に応じて必ず initializeApp が呼ばれるようにする
if (document.readyState === 'loading') {
    console.log('[TomoTrip] DOM is loading, adding DOMContentLoaded listener');
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    console.log('[TomoTrip] DOM already loaded, calling initializeApp immediately');
    initializeApp();
}
