// 協賛店管理画面 JavaScript - CSP準拠版
// エラーハンドリング強化とコンソールエラー解決

// 店舗編集機能
function editStore(storeId) {
    console.log(`店舗ID ${storeId} の編集画面を開きます`);
    try {
        // 実際のプロジェクトでは編集モーダルを表示
        alert(`店舗ID ${storeId} の編集画面を開きます`);
    } catch (error) {
        console.error('店舗編集エラー:', error);
    }
}

// 分析表示機能
function viewAnalytics(storeId) {
    console.log(`店舗ID ${storeId} の詳細分析を表示します`);
    try {
        // 実際のプロジェクトでは分析モーダルを表示
        alert(`店舗ID ${storeId} の詳細分析を表示します`);
    } catch (error) {
        console.error('分析表示エラー:', error);
    }
}

// データエクスポート
function exportData() {
    console.log('データエクスポートを開始します');
    try {
        alert('データをCSV形式でエクスポートします');
    } catch (error) {
        console.error('データエクスポートエラー:', error);
    }
}

// 一括メール送信
function sendBulkEmail() {
    console.log('一括メール送信を開始します');
    try {
        alert('協賛店に一括メールを送信します');
    } catch (error) {
        console.error('一括メール送信エラー:', error);
    }
}

// レポート生成
function generateReport() {
    console.log('レポート生成を開始します');
    try {
        alert('月次レポートを生成します');
    } catch (error) {
        console.error('レポート生成エラー:', error);
    }
}

// データバックアップ
function backupData() {
    console.log('データバックアップを開始します');
    try {
        alert('データベースをバックアップします');
    } catch (error) {
        console.error('データバックアップエラー:', error);
    }
}

// 統計情報更新
function updateStatistics() {
    try {
        console.log('📊 統計情報を更新中...');
        // 実際のプロジェクトでは API からデータを取得
        // updateStatisticsCards();
    } catch (error) {
        console.error('統計情報更新エラー:', error);
    }
}

// エラーハンドリング強化
function handleError(error, context) {
    console.error(`[${context}] エラーが発生しました:`, error);
    // 実際のプロジェクトではエラー報告システムに送信
}

// ページ読み込み時の初期化
function initializeDashboard() {
    try {
        console.log('🏪 協賛店管理画面が読み込まれました');
        
        // Bootstrap tooltips初期化
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
        
        // 統計情報の更新
        updateStatistics();
        
        console.log('✅ 協賛店管理画面の初期化完了');
    } catch (error) {
        handleError(error, 'Dashboard初期化');
    }
}

// グローバルエラーハンドラー
window.addEventListener('error', function(event) {
    handleError(event.error, 'グローバルエラー');
});

window.addEventListener('unhandledrejection', function(event) {
    handleError(event.reason, 'Promise拒否');
});

// DOMContentLoaded イベントリスナー
document.addEventListener('DOMContentLoaded', initializeDashboard);

// 関数をグローバルスコープに公開（onclick属性で使用するため）
window.editStore = editStore;
window.viewAnalytics = viewAnalytics;
window.exportData = exportData;
window.sendBulkEmail = sendBulkEmail;
window.generateReport = generateReport;
window.backupData = backupData;