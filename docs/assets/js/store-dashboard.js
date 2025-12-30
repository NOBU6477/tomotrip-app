// Store Dashboard JavaScript
// External file to comply with CSP (Content Security Policy)

// Language detection and translations
const urlParams = new URLSearchParams(window.location.search);
const isEnglish = urlParams.get('lang') === 'en';

const translations = {
    ja: {
        dashboard: '店舗管理画面',
        active: 'アクティブ',
        home: 'ホーム',
        logout: 'ログアウト',
        monthlyViews: '今月の閲覧数',
        monthlyBookings: '今月の予約',
        avgRating: '平均評価',
        reviews: 'レビュー数',
        storeProfile: '店舗プロフィール',
        bookingManagement: '予約管理',
        reviewTab: 'レビュー',
        analytics: '分析',
        storeInfo: '店舗情報',
        storeName: '店舗名',
        category: 'カテゴリ',
        description: '店舗説明',
        address: '住所',
        phone: '電話番号',
        email: 'メールアドレス',
        website: 'ウェブサイト',
        hours: '営業時間',
        storeImage: '店舗画像',
        changeImage: '画像を変更',
        observationInfo: '観光案内所情報',
        openDate: '開業日',
        activeGuides: 'アクティブガイド',
        programs: '体験プログラム',
        languages: '対応言語',
        monthlyStats: '今月の実績',
        bookingCount: '総予約数',
        satisfaction: '満足度',
        saveChanges: '変更を保存',
        errorLoadStore: '店舗データの読み込みに失敗しました。',
        errorNotOwner: 'この画面は協賛店専用です。',
        errorLoginData: 'ログインデータに問題があります。再度ログインしてください。',
        confirmLogout: 'ログアウトしますか？',
        errorNeedLogin: '店舗管理画面にアクセスするには協賛店登録またはログインが必要です。',
        noLoginInfo: 'ログイン情報が見つかりません。',
        savingProfile: '店舗プロフィールが保存されました。協賛店一覧へ移動します...',
        saveProfileError: '店舗プロフィールの保存に失敗しました。',
        imageUploadComing: '画像アップロード機能は開発中です。サポートにお問い合わせください。',
        promptBookingDate: '予約日時を入力してください (例: 2024-08-30 14:00)',
        promptCustomerName: 'お客様名を入力してください',
        promptGuestCount: '人数を入力してください',
        promptContact: '連絡先を入力してください',
        bookingAdded: '予約が追加されました。',
        promptFilter: 'フィルター条件を入力してください（確定/保留中/全て）',
        filterInProgress: 'フィルター機能は実装中です。',
        viewBookingDetail: '予約詳細を表示します',
        editBooking: '予約を編集します',
        confirmCancelBooking: '予約 {id} をキャンセルしますか？',
        bookingCancelled: '予約がキャンセルされました。',
        viewReviewDetail: 'レビューの詳細を表示します',
        promptReviewResponse: 'への返信を入力してください:',
        responseSent: '返信が送信されました。',
        categoryOptions: {
            restaurant: 'レストラン・飲食',
            tourism: '観光案内',
            culture: '文化体験',
            transportation: '交通・運輸',
            accommodation: '宿泊施設',
            shopping: 'ショッピング',
            other: 'その他'
        }
    },
    en: {
        dashboard: 'Store Dashboard',
        active: 'Active',
        home: 'Home',
        logout: 'Logout',
        monthlyViews: 'Monthly Views',
        monthlyBookings: 'Monthly Bookings',
        avgRating: 'Avg Rating',
        reviews: 'Reviews',
        storeProfile: 'Store Profile',
        bookingManagement: 'Booking Management',
        reviewTab: 'Reviews',
        analytics: 'Analytics',
        storeInfo: 'Store Information',
        storeName: 'Store Name',
        category: 'Category',
        description: 'Store Description',
        address: 'Address',
        phone: 'Phone Number',
        email: 'Email Address',
        website: 'Website',
        hours: 'Business Hours',
        storeImage: 'Store Image',
        changeImage: 'Change Image',
        observationInfo: 'Tourism Information',
        openDate: 'Opening Date',
        activeGuides: 'Active Guides',
        programs: 'Experience Programs',
        languages: 'Languages Supported',
        monthlyStats: 'Monthly Performance',
        bookingCount: 'Total Bookings',
        satisfaction: 'Satisfaction',
        saveChanges: 'Save Changes',
        errorLoadStore: 'Failed to load store data.',
        errorNotOwner: 'This page is for store owners only.',
        errorLoginData: 'Login data is corrupted. Please login again.',
        confirmLogout: 'Are you sure you want to logout?',
        errorNeedLogin: 'Please register or login to access the store dashboard.',
        noLoginInfo: 'Login information not found.',
        savingProfile: 'Profile saved successfully! Redirecting to sponsor list...',
        saveProfileError: 'Failed to save profile. Please try again.',
        imageUploadComing: 'Image upload feature coming soon! Please contact support for assistance.',
        promptBookingDate: 'Enter booking date and time (e.g., 2024-08-30 14:00)',
        promptCustomerName: 'Enter customer name',
        promptGuestCount: 'Enter number of guests',
        promptContact: 'Enter contact information',
        bookingAdded: 'Booking added successfully.',
        promptFilter: 'Enter filter criteria (confirmed/pending/all)',
        filterInProgress: 'Filter feature is under development.',
        viewBookingDetail: 'View booking details',
        editBooking: 'Edit booking',
        confirmCancelBooking: 'Are you sure you want to cancel booking {id}?',
        bookingCancelled: 'Booking cancelled successfully.',
        viewReviewDetail: 'View review details',
        promptReviewResponse: 'Enter your response to this review:',
        responseSent: 'Response sent successfully.',
        categoryOptions: {
            restaurant: 'Restaurant・Dining',
            tourism: 'Tourism Guide',
            culture: 'Cultural Experience',
            transportation: 'Transportation',
            accommodation: 'Accommodation',
            shopping: 'Shopping',
            other: 'Other'
        }
    }
};

const t = isEnglish ? translations.en : translations.ja;

document.addEventListener('DOMContentLoaded', async function() {
    console.log(`🏪 Store Dashboard Initializing... [${isEnglish ? 'EN' : 'JA'}]`);
    
    // Apply translations to UI
    translateUI();
    
    // Check for store ID in URL parameters (accept both 'id' and 'storeId' for compatibility)
    const urlStoreId = urlParams.get('id') || urlParams.get('storeId');
    
    // If coming from registration with store ID, load that store
    if (urlStoreId) {
        console.log('📝 Loading store from URL parameter:', urlStoreId);
        try {
            const response = await fetch(`/api/sponsor-stores/${urlStoreId}`);
            if (response.ok) {
                const storeData = await response.json();
                
                // Save to localStorage for future visits
                const storeLoginData = {
                    userType: 'store_owner',
                    storeId: storeData.id,
                    storeName: storeData.storeName,
                    email: storeData.email,
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem('storeLogin', JSON.stringify(storeLoginData));
                
                // Update UI
                const storeNameElement = document.querySelector('h1');
                if (storeNameElement) {
                    storeNameElement.textContent = `${storeData.storeName} - ${t.dashboard}`;
                }
                
                // Load store data
                await loadStoreData(storeData.id);
                console.log('🏪 店舗ダッシュボードが読み込まれました - ' + storeData.storeName);
                // Continue to setup event listeners below
            } else {
                throw new Error('Failed to load store data');
            }
        } catch (error) {
            console.error('Error loading store from URL:', error);
            alert(t.errorLoadStore);
            window.location.href = '/sponsor-login.html';
            return;
        }
    } else {
        // Otherwise, check localStorage
        const storeLogin = localStorage.getItem('storeLogin');
        
        if (!storeLogin) {
            alert(t.errorNeedLogin);
            window.location.href = '/sponsor-login.html';
            return;
        }
        
        try {
            const storeData = JSON.parse(storeLogin);
            if (storeData.userType !== 'store_owner') {
                alert(t.errorNotOwner);
                window.location.href = '/sponsor-login.html';
                return;
            }
            
            // Update store name in header if available
            const storeNameElement = document.querySelector('h1');
            if (storeNameElement && storeData.storeName) {
                storeNameElement.textContent = `${storeData.storeName} - ${t.dashboard}`;
            }
            
            // Load store data from server
            if (storeData.storeId) {
                loadStoreData(storeData.storeId);
            }
            
            console.log('🏪 店舗ダッシュボードが読み込まれました - ' + storeData.storeName);
            
        } catch (error) {
            console.error('Store login data error:', error);
            localStorage.removeItem('storeLogin');
            alert(t.errorLoginData);
            window.location.href = '/sponsor-login.html';
            return;
        }
    }
    
    // Setup event listeners
    setupEventListeners();
});

function translateUI() {
    console.log('🌐 Translating UI to:', isEnglish ? 'English' : 'Japanese');
    
    // Header buttons
    const homeBtn = document.getElementById('homeBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const activeStatus = document.querySelector('.badge.bg-success');
    
    if (homeBtn) homeBtn.textContent = t.home;
    if (logoutBtn) logoutBtn.textContent = t.logout;
    if (activeStatus) activeStatus.textContent = t.active;
    
    // Stats cards
    const statsTexts = [
        { selector: 'div.col-md-3:nth-child(1) p.mb-0', text: t.monthlyViews },
        { selector: 'div.col-md-3:nth-child(2) p.mb-0', text: t.monthlyBookings },
        { selector: 'div.col-md-3:nth-child(3) p.mb-0', text: t.avgRating },
        { selector: 'div.col-md-3:nth-child(4) p.mb-0', text: t.reviews }
    ];
    
    statsTexts.forEach(item => {
        const elem = document.querySelector(item.selector);
        if (elem) elem.textContent = item.text;
    });
    
    // Tab buttons
    const storeProfileTab = document.getElementById('profile-tab');
    const bookingTab = document.getElementById('bookings-tab');
    const reviewsTab = document.getElementById('reviews-tab');
    const analyticsTab = document.getElementById('analytics-tab');
    
    if (storeProfileTab) storeProfileTab.textContent = t.storeProfile;
    if (bookingTab) bookingTab.textContent = t.bookingManagement;
    if (reviewsTab) reviewsTab.textContent = t.reviewTab;
    if (analyticsTab) analyticsTab.textContent = t.analytics;
    
    // Form labels (using data-translate attributes would be better, but we'll use direct selection)
    const infoHeading = document.querySelector('.content-container h5');
    if (infoHeading && infoHeading.textContent.includes('店舗情報')) {
        infoHeading.textContent = t.storeInfo;
    }
    
    const imageHeading = document.querySelector('.content-container:nth-child(2) h5');
    if (imageHeading && imageHeading.textContent.includes('店舗画像')) {
        imageHeading.textContent = t.storeImage;
    }
    
    const changeImageBtn = document.querySelector('button.btn-secondary');
    if (changeImageBtn && changeImageBtn.textContent.includes('画像を変更')) {
        changeImageBtn.textContent = t.changeImage;
    }
    
    const observationHeading = document.querySelector('.content-container:nth-child(3) h5');
    if (observationHeading && observationHeading.textContent.includes('観光案内所情報')) {
        observationHeading.textContent = t.observationInfo;
    }
    
    const monthlyStatsHeading = document.querySelector('.content-container:nth-child(4) h5');
    if (monthlyStatsHeading && monthlyStatsHeading.textContent.includes('今月の実績')) {
        monthlyStatsHeading.textContent = t.monthlyStats;
    }
    
    const saveBtn = document.querySelector('button.btn-success[type="submit"]');
    if (saveBtn && saveBtn.textContent.includes('変更を保存')) {
        saveBtn.textContent = t.saveChanges;
    }
    
    // Category dropdown options
    const categorySelect = document.getElementById('editStoreCategory');
    if (categorySelect) {
        const options = categorySelect.querySelectorAll('option');
        options.forEach(option => {
            const value = option.value;
            if (t.categoryOptions[value]) {
                option.textContent = t.categoryOptions[value];
            }
        });
    }
}

function setupEventListeners() {
    // プロフィール保存
    const storeProfileForm = document.getElementById('storeProfileForm');
    if (storeProfileForm) {
        storeProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveStoreProfile();
        });
    }
    
    // 画像変更ボタン - 実際のアップロード機能
    const changeImageBtn = document.querySelector('button.btn-outline-secondary');
    if (changeImageBtn) {
        changeImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Create hidden file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            
            fileInput.addEventListener('change', async function(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                // Validate file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    alert(isEnglish ? 'File size must be less than 10MB' : 'ファイルサイズは10MB以下にしてください');
                    return;
                }
                
                // Get store ID
                const storeLogin = localStorage.getItem('storeLogin');
                if (!storeLogin) {
                    alert(t.noLoginInfo);
                    return;
                }
                const { storeId } = JSON.parse(storeLogin);
                
                // Upload image
                const formData = new FormData();
                formData.append('storeImage', file);
                formData.append('storeId', storeId);
                
                try {
                    const response = await fetch('/api/sponsor-stores/upload-image', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // Update image preview
                        const storeImageElement = document.getElementById('storeImage');
                        if (storeImageElement) {
                            storeImageElement.src = result.imageUrl;
                        }
                        alert(isEnglish ? 'Image uploaded successfully!' : '画像がアップロードされました！');
                    } else {
                        alert(result.message || (isEnglish ? 'Failed to upload image' : '画像のアップロードに失敗しました'));
                    }
                } catch (error) {
                    console.error('Image upload error:', error);
                    alert(isEnglish ? 'Failed to upload image. Please try again.' : '画像のアップロードに失敗しました。もう一度お試しください。');
                }
            });
            
            document.body.appendChild(fileInput);
            fileInput.click();
            document.body.removeChild(fileInput);
        });
    }
    
    // タブ切り替え時のログ
    const tabLinks = document.querySelectorAll('[data-bs-toggle="pill"]');
    tabLinks.forEach(function(tab) {
        tab.addEventListener('shown.bs.tab', function(e) {
            console.log('タブ切り替え:', e.target.id);
        });
    });
    
    // ログアウトボタンのイベントリスナーを追加
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }
}

// Tourism guide store management functions (fully multilingual)
function addReservation() {
    const reservation = {
        date: prompt(t.promptBookingDate),
        customer: prompt(t.promptCustomerName),
        guests: prompt(t.promptGuestCount),
        contact: prompt(t.promptContact)
    };
    
    if (reservation.date && reservation.customer) {
        console.log('新規予約追加:', reservation);
        alert(t.bookingAdded);
        location.reload();
    }
}

function filterReservations() {
    const filter = prompt(t.promptFilter);
    console.log('Filtering reservations by:', filter);
    alert(t.filterInProgress);
}

function viewReservation(reservationId) {
    console.log('Viewing reservation:', reservationId);
    alert(`${t.viewBookingDetail} ${reservationId}`);
}

function editReservation(reservationId) {
    console.log('Editing reservation:', reservationId);
    alert(`${t.editBooking} ${reservationId}`);
}

function cancelReservation(reservationId) {
    const confirmation = confirm(t.confirmCancelBooking.replace('{id}', reservationId));
    if (confirmation) {
        console.log('Cancelling reservation:', reservationId);
        alert(t.bookingCancelled);
        location.reload();
    }
}

function viewReview(reviewId) {
    console.log('Viewing review:', reviewId);
    alert(`${t.viewReviewDetail} ${reviewId}`);
}

function respondToReview(reviewId) {
    const response = prompt(`${reviewId} ${t.promptReviewResponse}`);
    if (response) {
        console.log('Responding to review:', reviewId, response);
        alert(t.responseSent);
        location.reload();
    }
}

async function loadStoreData(storeId) {
    try {
        const response = await fetch(`/api/sponsor-stores/${storeId}`);
        if (!response.ok) {
            throw new Error('Failed to load store data');
        }
        
        const storeData = await response.json();
        console.log('📊 Store data loaded:', storeData);
        
        // Update header display elements (language-aware)
        const storeNameHeader = document.querySelector('h1');
        if (storeNameHeader) {
            storeNameHeader.textContent = `${storeData.storeName} - ${t.dashboard}`;
        }
        
        // Update category display
        const categoryDisplay = document.getElementById('storeCategory');
        if (categoryDisplay && storeData.category) {
            // Map category codes to localized labels
            categoryDisplay.textContent = t.categoryOptions[storeData.category] || storeData.category;
        }
        
        // Update location display
        const locationDisplay = document.getElementById('storeLocation');
        if (locationDisplay && storeData.address) {
            locationDisplay.innerHTML = `<i class="bi bi-geo-alt"></i> ${storeData.address}`;
        }
        
        // Populate form fields with store data (using correct edit* IDs)
        const formFields = {
            'editStoreName': storeData.storeName,
            'editStoreCategory': storeData.category,
            'editStoreDescription': storeData.description || '',
            'editStoreAddress': storeData.address,
            'editStorePhone': storeData.phone,
            'editStoreEmail': storeData.email,
            'editStoreHours': storeData.openingHours || '',
            'editStoreWebsite': storeData.website || ''
        };
        
        // Fill in the form
        for (const [fieldId, value] of Object.entries(formFields)) {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value;
                console.log(`✅ Updated field ${fieldId} with value:`, value);
            } else {
                console.warn(`⚠️ Field ${fieldId} not found in DOM`);
            }
        }
        
        // Update store image if available
        const storeImageElement = document.getElementById('storeImage');
        if (storeImageElement && storeData.imageUrl) {
            storeImageElement.src = storeData.imageUrl;
            console.log('✅ Store image updated:', storeData.imageUrl);
        }
        
        console.log('✅ Store dashboard updated with:', storeData.storeName);
        
    } catch (error) {
        console.error('Error loading store data:', error);
        alert(t.errorLoadStore);
    }
}

async function saveStoreProfile() {
    const storeLogin = localStorage.getItem('storeLogin');
    if (!storeLogin) {
        alert(t.noLoginInfo);
        return;
    }
    
    const { storeId } = JSON.parse(storeLogin);
    
    // Use correct edit* field IDs
    const formData = {
        storeName: document.getElementById('editStoreName').value,
        category: document.getElementById('editStoreCategory').value,
        description: document.getElementById('editStoreDescription').value,
        address: document.getElementById('editStoreAddress').value,
        phone: document.getElementById('editStorePhone').value,
        email: document.getElementById('editStoreEmail').value,
        website: document.getElementById('editStoreWebsite').value || '',
        openingHours: document.getElementById('editStoreHours').value || ''
    };
    
    console.log('💾 Saving store profile:', formData);
    
    try {
        const response = await fetch(`/api/sponsor-stores/${storeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save store profile');
        }
        
        const updatedStore = await response.json();
        console.log('✅ Store profile saved:', updatedStore);
        
        // Update localStorage with new store name if changed
        if (formData.storeName !== JSON.parse(storeLogin).storeName) {
            const updatedLogin = JSON.parse(storeLogin);
            updatedLogin.storeName = formData.storeName;
            localStorage.setItem('storeLogin', JSON.stringify(updatedLogin));
        }
        
        // Show success message and redirect to sponsor list
        alert(t.savingProfile);
        
        // Redirect to sponsor list page
        // TODO: Create sponsor-list-en.html for English version
        window.location.href = 'sponsor-list.html';
        
    } catch (error) {
        console.error('Error saving store profile:', error);
        alert(t.saveProfileError);
    }
}

function logout() {
    const confirmation = confirm(t.confirmLogout);
    if (confirmation) {
        console.log('🚪 Logging out...');
        localStorage.removeItem('storeLogin');
        window.location.href = '/sponsor-login.html';
    }
}
