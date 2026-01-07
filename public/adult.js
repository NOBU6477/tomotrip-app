// Adult Directory JavaScript - Age Gate & Shop Listing
// Separate from main TomoTrip functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Adult directory initializing...');
    
    // Setup age gate buttons first
    setupAgeGate();
    
    // Check age verification - only load content if verified
    const verified = localStorage.getItem('adult_verified') === 'true';
    
    if (verified) {
        hideAgeGate();
        initContentAfterVerification();
    } else {
        showAgeGate();
        // Content will NOT load until verified
    }
});

function initContentAfterVerification() {
    // Determine which page we're on and initialize accordingly
    const isDetailPage = window.location.pathname.includes('adult-detail');
    
    if (isDetailPage) {
        initDetailPage();
    } else {
        initListPage();
    }
}

// checkAgeVerification is now integrated into DOMContentLoaded

function showAgeGate() {
    const modal = document.getElementById('ageGateModal');
    const content = document.getElementById('mainContent');
    
    if (modal) modal.style.display = 'flex';
    if (content) content.style.display = 'none';
}

function hideAgeGate() {
    const modal = document.getElementById('ageGateModal');
    const content = document.getElementById('mainContent');
    
    if (modal) modal.style.display = 'none';
    if (content) content.style.display = 'block';
}

function setupAgeGate() {
    const yesBtn = document.getElementById('ageConfirmYes');
    const noBtn = document.getElementById('ageConfirmNo');
    
    if (yesBtn) {
        yesBtn.addEventListener('click', function() {
            localStorage.setItem('adult_verified', 'true');
            hideAgeGate();
            // Now load the content after verification
            initContentAfterVerification();
        });
    }
    
    if (noBtn) {
        noBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
}

// List Page Functions
async function initListPage() {
    console.log('Initializing adult list page...');
    
    await loadShops();
    setupFilters();
    updateSeoMeta();
}

async function loadShops() {
    const loading = document.getElementById('loading');
    const shopList = document.getElementById('shopList');
    const emptyState = document.getElementById('emptyState');
    
    try {
        const response = await fetch('/data/adult-shops.json');
        
        if (!response.ok) {
            throw new Error('Failed to load shops');
        }
        
        const shops = await response.json();
        
        if (loading) loading.style.display = 'none';
        
        if (shops.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        window.adultShops = shops;
        renderShops(shops);
        
    } catch (error) {
        console.error('Error loading shops:', error);
        if (loading) loading.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
    }
}

function renderShops(shops) {
    const shopList = document.getElementById('shopList');
    const emptyState = document.getElementById('emptyState');
    
    if (!shopList) return;
    
    if (shops.length === 0) {
        shopList.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    const areaNames = {
        'naha': '那覇',
        'chatan': '北谷',
        'nago': '名護'
    };
    
    shopList.innerHTML = shops.map(shop => `
        <div class="col-md-6 col-lg-4">
            <article class="shop-card">
                <div class="shop-card-body">
                    <span class="shop-card-category">${escapeHtml(shop.category)}</span>
                    <h3>${escapeHtml(shop.name)}</h3>
                    <p class="shop-card-area">
                        <i class="bi bi-geo-alt me-1"></i>${areaNames[shop.area] || shop.area}
                    </p>
                    <p class="text-muted small mb-0">${escapeHtml(shop.shortDescription || '')}</p>
                    <a href="adult-detail.html?id=${shop.id}" class="shop-card-link">
                        詳細を見る <i class="bi bi-arrow-right"></i>
                    </a>
                </div>
            </article>
        </div>
    `).join('');
}

function setupFilters() {
    // Category tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) categoryFilter.value = this.dataset.category || '';
            
            applyFilters();
            updateUrl();
        });
    });
    
    // Area filter
    const areaFilter = document.getElementById('areaFilter');
    if (areaFilter) {
        areaFilter.addEventListener('change', function() {
            applyFilters();
            updateUrl();
        });
    }
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            applyFilters();
        }, 300));
    }
    
    // Apply URL params on load
    applyUrlParams();
}

function applyUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || '';
    const area = urlParams.get('area') || '';
    
    if (category) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) categoryFilter.value = category;
        
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });
    }
    
    if (area) {
        const areaFilter = document.getElementById('areaFilter');
        if (areaFilter) areaFilter.value = area;
    }
    
    // Apply filters if we have URL params
    if (category || area) {
        setTimeout(() => applyFilters(), 100);
    }
}

function applyFilters() {
    if (!window.adultShops) return;
    
    const category = document.getElementById('categoryFilter')?.value || '';
    const area = document.getElementById('areaFilter')?.value || '';
    const search = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    
    let filtered = [...window.adultShops];
    
    if (category) {
        filtered = filtered.filter(shop => shop.category === category);
    }
    
    if (area) {
        filtered = filtered.filter(shop => shop.area === area);
    }
    
    if (search) {
        filtered = filtered.filter(shop => 
            shop.name.toLowerCase().includes(search) ||
            (shop.description && shop.description.toLowerCase().includes(search))
        );
    }
    
    renderShops(filtered);
    updateSeoMeta();
}

function updateUrl() {
    const params = new URLSearchParams();
    const category = document.getElementById('categoryFilter')?.value;
    const area = document.getElementById('areaFilter')?.value;
    
    if (category) params.set('category', category);
    if (area) params.set('area', area);
    
    const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
    
    window.history.replaceState({}, '', newUrl);
}

function updateSeoMeta() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || '';
    const area = urlParams.get('area') || '';
    
    const categoryNames = {
        'デリヘル': 'デリバリーヘルス',
        '店舗型': '店舗型風俗'
    };
    
    const areaNames = {
        'naha': '那覇',
        'chatan': '北谷',
        'nago': '名護'
    };
    
    let title = '沖縄のナイトライフ・大人の遊び場ガイド';
    let description = '沖縄のナイトスポット・大人向けエンターテイメント情報。18歳以上向け。';
    
    if (category && categoryNames[category]) {
        title = `沖縄の${categoryNames[category]}一覧｜大人向けガイド`;
        description = `沖縄の${categoryNames[category]}情報。18歳以上向け。`;
    }
    
    if (area && areaNames[area]) {
        title = `${areaNames[area]}のナイトスポット一覧｜大人向けガイド`;
        description = `${areaNames[area]}エリアの大人向けナイトスポット情報。`;
    }
    
    if (category && area) {
        title = `${areaNames[area]}の${categoryNames[category]}一覧｜大人向けガイド`;
        description = `${areaNames[area]}エリアの${categoryNames[category]}情報。`;
    }
    
    // Update meta tags
    document.getElementById('pageTitle').textContent = title;
    const metaDesc = document.getElementById('metaDescription');
    if (metaDesc) metaDesc.content = description;
    
    const ogTitle = document.getElementById('ogTitle');
    if (ogTitle) ogTitle.content = title;
    
    const ogDesc = document.getElementById('ogDescription');
    if (ogDesc) ogDesc.content = description;
    
    const twitterTitle = document.getElementById('twitterTitle');
    if (twitterTitle) twitterTitle.content = title;
    
    const twitterDesc = document.getElementById('twitterDescription');
    if (twitterDesc) twitterDesc.content = description;
}

// Detail Page Functions
async function initDetailPage() {
    console.log('Initializing adult detail page...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const shopId = urlParams.get('id');
    
    if (!shopId) {
        showNotFound();
        return;
    }
    
    await loadShopDetail(shopId);
}

async function loadShopDetail(shopId) {
    const loading = document.getElementById('loading');
    const notFound = document.getElementById('notFound');
    const shopDetail = document.getElementById('shopDetail');
    
    try {
        const response = await fetch('/data/adult-shops.json');
        
        if (!response.ok) {
            throw new Error('Failed to load shop data');
        }
        
        const shops = await response.json();
        const shop = shops.find(s => s.id === shopId);
        
        if (loading) loading.style.display = 'none';
        
        if (!shop) {
            showNotFound();
            return;
        }
        
        renderShopDetail(shop);
        updateDetailSeoMeta(shop);
        
    } catch (error) {
        console.error('Error loading shop detail:', error);
        showNotFound();
    }
}

function showNotFound() {
    const loading = document.getElementById('loading');
    const notFound = document.getElementById('notFound');
    const shopDetail = document.getElementById('shopDetail');
    
    if (loading) loading.style.display = 'none';
    if (notFound) notFound.style.display = 'block';
    if (shopDetail) shopDetail.style.display = 'none';
}

function renderShopDetail(shop) {
    const shopDetail = document.getElementById('shopDetail');
    if (!shopDetail) return;
    
    shopDetail.style.display = 'block';
    
    const areaNames = {
        'naha': '那覇',
        'chatan': '北谷',
        'nago': '名護'
    };
    
    // Update content
    document.getElementById('shopName').textContent = shop.name;
    document.getElementById('breadcrumbShopName').textContent = shop.name;
    document.getElementById('shopCategory').textContent = shop.category;
    document.getElementById('shopArea').innerHTML = `<i class="bi bi-geo-alt me-1"></i>${areaNames[shop.area] || shop.area}`;
    document.getElementById('shopDescription').textContent = shop.description || '情報なし';
    document.getElementById('shopHours').textContent = shop.hours || '-';
    document.getElementById('shopHoliday').textContent = shop.holiday || '-';
    
    // External link
    const externalLink = document.getElementById('externalLink');
    if (externalLink && shop.externalUrl) {
        externalLink.href = shop.externalUrl;
        externalLink.style.display = 'block';
    } else if (externalLink) {
        externalLink.style.display = 'none';
    }
}

function updateDetailSeoMeta(shop) {
    const areaNames = {
        'naha': '那覇',
        'chatan': '北谷',
        'nago': '名護'
    };
    
    const title = `${shop.name}｜${areaNames[shop.area] || shop.area}のナイトスポット`;
    const description = shop.shortDescription || `${shop.name}の詳細情報。${areaNames[shop.area] || shop.area}エリアのナイトスポット。`;
    
    document.getElementById('pageTitle').textContent = title;
    
    const metaDesc = document.getElementById('metaDescription');
    if (metaDesc) metaDesc.content = description;
    
    const canonicalUrl = document.getElementById('canonicalUrl');
    if (canonicalUrl) canonicalUrl.href = `https://nobu6477.github.io/tomotrip-app/adult-detail.html?id=${shop.id}`;
    
    const ogTitle = document.getElementById('ogTitle');
    if (ogTitle) ogTitle.content = title;
    
    const ogDesc = document.getElementById('ogDescription');
    if (ogDesc) ogDesc.content = description;
    
    const twitterTitle = document.getElementById('twitterTitle');
    if (twitterTitle) twitterTitle.content = title;
    
    const twitterDesc = document.getElementById('twitterDescription');
    if (twitterDesc) twitterDesc.content = description;
    
    // Update JSON-LD
    const jsonLdScript = document.getElementById('jsonLdScript');
    if (jsonLdScript) {
        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": title,
            "description": description
        };
        jsonLdScript.textContent = JSON.stringify(jsonLd);
    }
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
