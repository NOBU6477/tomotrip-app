// ガイド管理センター機能
// Admin functionality for bulk guide operations

// 管理者モードの状態
let isAdminMode = false;
let selectedGuides = new Set();

// 管理者モードの切り替え
export function toggleAdminMode() {
    // 管理者認証をチェック
    if (!isAdminMode && !checkAdminAuthentication()) {
        console.log('🔒 管理者認証が必要です');
        showAdminLoginModal();
        return false;
    }
    
    isAdminMode = !isAdminMode;
    selectedGuides.clear();
    
    // AppStateに状態を保存
    saveAdminState();
    
    // ガイドカードを再描画（チェックボックス表示/非表示）
    if (window.AppState && window.AppState.guides && window.renderGuideCards) {
        window.renderGuideCards(window.AppState.guides);
    }
    
    // ツールバーの表示/非表示
    updateAdminToolbar();
    
    // 管理者専用UI要素の表示/非表示
    updateAdminOnlyElements();
    
    console.log(`${isAdminMode ? '✅ 管理者モード有効' : '❌ 管理者モード無効'}`);
    return isAdminMode;
}

function updateAdminOnlyElements() {
    document.querySelectorAll('.admin-only').forEach(el => {
        if (isAdminMode) {
            el.style.removeProperty('display');
        } else {
            el.style.setProperty('display', 'none', 'important');
        }
    });
}

// 管理者ツールバーの更新
function updateAdminToolbar() {
    let toolbar = document.getElementById('adminToolbar');
    
    if (isAdminMode) {
        if (!toolbar) {
            toolbar = createAdminToolbar();
            document.body.appendChild(toolbar);
        }
        toolbar.style.display = 'block';
        updateSelectionCounter();
    } else {
        if (toolbar) {
            toolbar.style.display = 'none';
        }
    }
}

// 管理者ツールバーの作成
function createAdminToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'adminToolbar';
    toolbar.className = 'admin-toolbar position-fixed';
    toolbar.style.cssText = `
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 15px 25px;
        border-radius: 50px;
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        z-index: 1000;
        display: none;
        min-width: 400px;
        text-align: center;
    `;
    
    toolbar.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
            <div class="admin-selection-info">
                <span id="selectionCounter">0個選択中</span>
            </div>
            <div class="admin-actions d-flex gap-2">
                <button class="btn btn-light btn-sm" data-action="select-all">全選択</button>
                <button class="btn btn-outline-light btn-sm" data-action="clear-selection">クリア</button>
                <button class="btn btn-warning btn-sm" data-action="bulk-approve">一括承認</button>
                <button class="btn btn-danger btn-sm" data-action="bulk-reject">一括却下</button>
                <button class="btn btn-outline-light btn-sm" data-action="logout-admin">
                    <i class="bi bi-box-arrow-right"></i> ログアウト
                </button>
            </div>
        </div>
    `;
    
    // CSP準拠のイベントリスナー設定
    toolbar.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        
        const action = button.dataset.action;
        
        switch (action) {
            case 'select-all':
                selectAllGuides();
                break;
            case 'clear-selection':
                clearSelection();
                break;
            case 'bulk-approve':
                bulkApprove();
                break;
            case 'bulk-reject':
                bulkReject();
                break;
            case 'logout-admin':
                logoutAdmin();
                break;
        }
    });
    
    return toolbar;
}

// 選択カウンターの更新
function updateSelectionCounter() {
    const counter = document.getElementById('selectionCounter');
    if (counter) {
        counter.textContent = `${selectedGuides.size}個選択中`;
    }
}

// ガイドの選択/選択解除
export function toggleGuideSelection(guideId) {
    if (selectedGuides.has(guideId)) {
        selectedGuides.delete(guideId);
    } else {
        selectedGuides.add(guideId);
    }
    
    saveAdminState(); // 状態変更を保存
    updateSelectionCounter();
    updateGuideCardSelection(guideId);
    
    console.log(`Guide ${guideId} ${selectedGuides.has(guideId) ? 'selected' : 'deselected'}`);
}

// ガイドカードの選択状態を更新
function updateGuideCardSelection(guideId) {
    const checkbox = document.querySelector(`input[data-guide-id="${guideId}"]`);
    const card = document.querySelector(`[data-guide-id="${guideId}"]`)?.closest('.guide-card');
    
    if (checkbox) {
        checkbox.checked = selectedGuides.has(guideId);
    }
    
    if (card) {
        if (selectedGuides.has(guideId)) {
            card.style.border = '3px solid #007bff';
            card.style.boxShadow = '0 8px 25px rgba(0, 123, 255, 0.3)';
        } else {
            card.style.border = 'none';
            card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
        }
    }
}

// 全選択
window.selectAllGuides = function() {
    if (!window.AppState || !window.AppState.guides) return;
    
    selectedGuides.clear();
    window.AppState.guides.forEach(guide => {
        selectedGuides.add(guide.id);
    });
    
    updateSelectionCounter();
    
    // すべてのガイドカードの選択状態を更新
    window.AppState.guides.forEach(guide => {
        updateGuideCardSelection(guide.id);
    });
    
    console.log(`✅ ${selectedGuides.size}個のガイドを全選択`);
};

// 選択クリア
window.clearSelection = function() {
    const previousCount = selectedGuides.size;
    selectedGuides.clear();
    updateSelectionCounter();
    
    // すべてのガイドカードの選択状態をクリア
    if (window.AppState && window.AppState.guides) {
        window.AppState.guides.forEach(guide => {
            updateGuideCardSelection(guide.id);
        });
    }
    
    console.log(`❌ ${previousCount}個のガイド選択をクリア`);
};

// 一括承認
window.bulkApprove = async function() {
    if (selectedGuides.size === 0) {
        alert('ガイドを選択してください。');
        return;
    }
    
    const confirmation = confirm(`選択した${selectedGuides.size}個のガイドを承認しますか？`);
    if (!confirmation) return;
    
    try {
        const selectedIds = Array.from(selectedGuides);
        
        // API経由で一括承認（仮実装 - 実際のAPIエンドポイントに応じて調整）
        const response = await fetch('/api/guides/bulk-approve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ guideIds: selectedIds })
        });
        
        if (response.ok) {
            alert(`${selectedIds.length}個のガイドを承認しました。`);
            selectedGuides.clear();
            updateSelectionCounter();
            
            // ガイドデータを再読み込み
            if (window.refreshGuideData) {
                await window.refreshGuideData();
            }
        } else {
            alert('一括承認に失敗しました。');
        }
    } catch (error) {
        console.error('一括承認エラー:', error);
        alert('一括承認中にエラーが発生しました。');
    }
};

// 一括却下
window.bulkReject = async function() {
    if (selectedGuides.size === 0) {
        alert('ガイドを選択してください。');
        return;
    }
    
    const confirmation = confirm(`選択した${selectedGuides.size}個のガイドを却下しますか？`);
    if (!confirmation) return;
    
    try {
        const selectedIds = Array.from(selectedGuides);
        
        // API経由で一括却下（仮実装 - 実際のAPIエンドポイントに応じて調整）
        const response = await fetch('/api/guides/bulk-reject', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ guideIds: selectedIds })
        });
        
        if (response.ok) {
            alert(`${selectedIds.length}個のガイドを却下しました。`);
            selectedGuides.clear();
            updateSelectionCounter();
            
            // ガイドデータを再読み込み
            if (window.refreshGuideData) {
                await window.refreshGuideData();
            }
        } else {
            alert('一括却下に失敗しました。');
        }
    } catch (error) {
        console.error('一括却下エラー:', error);
        alert('一括却下中にエラーが発生しました。');
    }
};

// 管理者モード状態の取得
export function getAdminModeState() {
    return {
        isAdminMode,
        selectedCount: selectedGuides.size,
        selectedGuides: Array.from(selectedGuides)
    };
}

// 管理者モードの状態をAppStateに保存
function saveAdminState() {
    if (window.AppState) {
        window.AppState.adminMode = {
            isAdminMode,
            selectedGuides: Array.from(selectedGuides)
        };
    }
    console.log('💾 Admin state saved to AppState:', { isAdminMode, selectedCount: selectedGuides.size });
}

// AppStateから管理者モード状態を読み込み
function loadAdminState() {
    if (window.AppState && window.AppState.adminMode) {
        isAdminMode = window.AppState.adminMode.isAdminMode || false;
        selectedGuides = new Set(window.AppState.adminMode.selectedGuides || []);
        console.log('📂 Admin state loaded from AppState:', { isAdminMode, selectedCount: selectedGuides.size });
    }
    updateAdminOnlyElements();
}

// 管理者モードの初期化（グローバル関数として公開）
window.toggleAdminMode = toggleAdminMode;
window.toggleGuideSelection = toggleGuideSelection;

// 管理者モード状態をグローバルアクセス可能に  
window.getAdminModeState = function() {
    return {
        isAdminMode,
        selectedCount: selectedGuides.size,
        selectedGuides: Array.from(selectedGuides)
    };
};

// 実際にグローバル関数を割り当て
window.selectAllGuides = selectAllGuides;
window.clearSelection = clearSelection;
window.bulkApprove = bulkApprove;
window.bulkReject = bulkReject;

// アプリケーション初期化時に状態を復元
document.addEventListener('DOMContentLoaded', loadAdminState);

// 管理者モード用スタイルの追加
const adminStyles = document.createElement('style');
adminStyles.innerHTML = `
    .admin-checkbox {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 10;
        transform: scale(1.5);
    }
    
    .guide-card.admin-mode {
        position: relative;
        cursor: pointer;
    }
    
    .admin-toolbar {
        backdrop-filter: blur(10px);
    }
    
    @media (max-width: 768px) {
        .admin-toolbar {
            min-width: 350px;
            padding: 12px 20px;
        }
        
        .admin-actions {
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .admin-actions .btn {
            font-size: 12px;
            padding: 4px 8px;
        }
    }
`;
document.head.appendChild(adminStyles);

// 管理者認証機能
function checkAdminAuthentication() {
    // セッションストレージから管理者認証状態を確認
    const adminAuth = sessionStorage.getItem('adminAuth');
    const adminAuthTimestamp = sessionStorage.getItem('adminAuthTimestamp');
    
    if (!adminAuth || !adminAuthTimestamp) {
        return false;
    }
    
    // 認証の有効期限チェック（2時間）
    const authTime = parseInt(adminAuthTimestamp);
    const currentTime = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    
    if (currentTime - authTime > twoHours) {
        // 認証期限切れの場合、クリア
        sessionStorage.removeItem('adminAuth');
        sessionStorage.removeItem('adminAuthTimestamp');
        return false;
    }
    
    return adminAuth === 'authenticated';
}

function showAdminLoginModal() {
    // 既存のモーダルがあれば削除
    const existingModal = document.getElementById('adminLoginModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 管理者ログインモーダルのHTML
    const modalHTML = `
        <div class="modal fade" id="adminLoginModal" tabindex="-1" aria-labelledby="adminLoginModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="border-radius: 15px; border: none; box-shadow: 0 15px 50px rgba(0,0,0,0.3);">
                    <div class="modal-header" style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; border-radius: 15px 15px 0 0;">
                        <h5 class="modal-title" id="adminLoginModalLabel">
                            <i class="bi bi-shield-lock me-2"></i>管理者認証
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4">
                        <form id="adminLoginForm">
                            <div class="mb-3">
                                <label for="adminUsername" class="form-label">管理者ID</label>
                                <input type="text" class="form-control" id="adminUsername" required>
                            </div>
                            <div class="mb-3">
                                <label for="adminPassword" class="form-label">パスワード</label>
                                <input type="password" class="form-control" id="adminPassword" required>
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-danger">
                                    <i class="bi bi-key me-2"></i>ログイン
                                </button>
                            </div>
                        </form>
                        <div id="adminLoginError" class="alert alert-danger mt-3" style="display: none;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // モーダルをDOMに追加
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // モーダルを表示
    const modal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
    modal.show();
    
    // フォーム送信のイベントリスナー
    document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
}

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('adminLoginError');
    
    try {
        // 管理者認証API呼び出し（現在は簡単な固定認証）
        const isValidAdmin = await authenticateAdmin(username, password);
        
        if (isValidAdmin) {
            // 認証成功
            sessionStorage.setItem('adminAuth', 'authenticated');
            sessionStorage.setItem('adminAuthTimestamp', Date.now().toString());
            
            // モーダルを閉じる
            const modal = bootstrap.Modal.getInstance(document.getElementById('adminLoginModal'));
            modal.hide();
            
            // 管理者モードを有効化
            isAdminMode = true;
            saveAdminState();
            
            // ガイドカードを再描画
            if (window.AppState && window.AppState.guides && window.renderGuideCards) {
                window.renderGuideCards(window.AppState.guides);
            }
            
            updateAdminToolbar();
            
            console.log('✅ 管理者認証成功');
            alert('管理者モードが有効になりました。');
            
        } else {
            // 認証失敗
            errorDiv.textContent = '管理者IDまたはパスワードが正しくありません。';
            errorDiv.style.display = 'block';
        }
        
    } catch (error) {
        console.error('❌ 管理者認証エラー:', error);
        errorDiv.textContent = '認証中にエラーが発生しました。';
        errorDiv.style.display = 'block';
    }
}

async function authenticateAdmin(username, password) {
    // デモ用の固定認証（本番では適切なAPI認証を実装）
    const validCredentials = [
        { username: 'admin', password: 'tomotrip2024' },
        { username: 'manager', password: 'guide_admin' },
        { username: 'supervisor', password: 'secure_pass' }
    ];
    
    // 簡単な遅延でAPI呼び出しをシミュレート
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return validCredentials.some(cred => 
        cred.username === username && cred.password === password
    );
}

// 管理者ログアウト機能
function logoutAdmin() {
    // セッション情報を完全にクリア
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminAuthTimestamp');
    
    // 管理者モード状態をリセット
    isAdminMode = false;
    selectedGuides.clear();
    
    // AppStateも更新
    saveAdminState();
    
    // ツールバーを非表示
    const toolbar = document.getElementById('adminToolbar');
    if (toolbar) {
        toolbar.style.display = 'none';
    }
    
    // ガイドカードを再描画（チェックボックスを非表示）
    if (window.AppState && window.AppState.guides && window.renderGuideCards) {
        window.renderGuideCards(window.AppState.guides);
    }
    
    console.log('👋 管理者ログアウト完了');
    alert('管理者モードを終了しました。セキュリティ情報もクリアされました。');
}

// グローバル関数として公開
window.logoutAdmin = logoutAdmin;
window.toggleAdminMode = toggleAdminMode;
window.getAdminModeState = getAdminModeState;
window.toggleGuideSelection = toggleGuideSelection;

console.log('✅ Guide management module loaded');