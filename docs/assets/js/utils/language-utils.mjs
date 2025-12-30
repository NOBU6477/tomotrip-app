// 統一言語正規化・ローカライゼーションユーティリティ
// 言語表記の日本語化とフィルタリング用の統一API

/**
 * 言語をローカライズして表示用ラベルに変換
 * @param {string} language - 言語識別子（例：japanese, English, 日本語）
 * @param {string} locale - ロケール（例：ja, en）デフォルトは'ja'
 * @returns {string} ローカライズされた言語ラベル
 */
export function localizeLanguage(language, locale = 'ja') {
    if (!language) return '';
    
    const languageLabels = {
        'ja': {
            // 英語形式の入力
            'japanese': '日本語',
            'english': '英語', 
            'chinese': '中国語',
            'korean': '韓国語',
            'thai': 'タイ語',
            'vietnamese': 'ベトナム語',
            'indonesian': 'インドネシア語',
            'tagalog': 'タガログ語',
            'hindi': 'ヒンディー語',
            'spanish': 'スペイン語',
            'french': 'フランス語',
            'german': 'ドイツ語',
            'italian': 'イタリア語',
            'portuguese': 'ポルトガル語',
            'russian': 'ロシア語',
            'arabic': 'アラビア語',
            
            // 既に日本語の場合はそのまま
            '日本語': '日本語',
            '英語': '英語',
            '中国語': '中国語',
            '韓国語': '韓国語',
            'タイ語': 'タイ語',
            'ベトナム語': 'ベトナム語',
            'インドネシア語': 'インドネシア語',
            'タガログ語': 'タガログ語',
            'ヒンディー語': 'ヒンディー語',
            'スペイン語': 'スペイン語',
            'フランス語': 'フランス語',
            'ドイツ語': 'ドイツ語',
            'イタリア語': 'イタリア語',
            'ポルトガル語': 'ポルトガル語',
            'ロシア語': 'ロシア語',
            'アラビア語': 'アラビア語',
            
            // ISOコードからの変換
            'ja': '日本語',
            'en': '英語',
            'zh': '中国語',
            'ko': '韓国語',
            'th': 'タイ語',
            'vi': 'ベトナム語',
            'id': 'インドネシア語',
            'tl': 'タガログ語',
            'hi': 'ヒンディー語',
            'es': 'スペイン語',
            'fr': 'フランス語',
            'de': 'ドイツ語',
            'it': 'イタリア語',
            'pt': 'ポルトガル語',
            'ru': 'ロシア語',
            'ar': 'アラビア語'
        },
        
        'en': {
            // 英語表示用（将来の国際化対応）
            'japanese': 'Japanese',
            'english': 'English', 
            'chinese': 'Chinese',
            'korean': 'Korean',
            'thai': 'Thai',
            'vietnamese': 'Vietnamese',
            'indonesian': 'Indonesian',
            'tagalog': 'Tagalog',
            'hindi': 'Hindi',
            'spanish': 'Spanish',
            'french': 'French',
            'german': 'German',
            'italian': 'Italian',
            'portuguese': 'Portuguese',
            'russian': 'Russian',
            'arabic': 'Arabic',
            
            // 日本語からの変換
            '日本語': 'Japanese',
            '英語': 'English',
            '中国語': 'Chinese',
            '韓国語': 'Korean',
            'タイ語': 'Thai',
            'ベトナム語': 'Vietnamese',
            'インドネシア語': 'Indonesian',
            'タガログ語': 'Tagalog',
            'ヒンディー語': 'Hindi',
            'スペイン語': 'Spanish',
            'フランス語': 'French',
            'ドイツ語': 'German',
            'イタリア語': 'Italian',
            'ポルトガル語': 'Portuguese',
            'ロシア語': 'Russian',
            'アラビア語': 'Arabic'
        }
    };
    
    const labels = languageLabels[locale] || languageLabels['ja'];
    
    // 言語名の正規化（大文字小文字を無視）
    const normalizedLanguage = language.toLowerCase();
    
    // マッピングテーブルから検索
    for (const [key, label] of Object.entries(labels)) {
        if (key.toLowerCase() === normalizedLanguage) {
            return label;
        }
    }
    
    // 部分一致検索
    for (const [key, label] of Object.entries(labels)) {
        if (normalizedLanguage.includes(key.toLowerCase()) || 
            key.toLowerCase().includes(normalizedLanguage)) {
            return label;
        }
    }
    
    // フォールバック：元の文字列を返す
    return language;
}

/**
 * 言語配列をローカライズして表示
 * @param {Array|string} languages - 言語配列または単一言語
 * @param {string} locale - ロケール（デフォルト'ja'）
 * @returns {Array} ローカライズされた言語配列
 */
export function localizeLanguageArray(languages, locale = 'ja') {
    if (!languages) return [];
    
    // 単一文字列の場合は配列に変換
    if (typeof languages === 'string') {
        return [localizeLanguage(languages, locale)];
    }
    
    // 配列の場合は各要素をローカライズ
    if (Array.isArray(languages)) {
        return languages
            .filter(lang => lang && lang.trim()) // 空文字列を除去
            .map(lang => localizeLanguage(lang.trim(), locale));
    }
    
    return [];
}

/**
 * 専門分野をローカライズして表示
 * @param {string} specialty - 専門分野
 * @param {string} locale - ロケール（'ja' or 'en'）
 * @returns {string} ローカライズされた専門分野
 */
export function localizeSpecialty(specialty, locale = 'ja') {
    if (!specialty) return '';
    
    const specialtyMap = {
        'ja': {
            'Culture・History': '文化・歴史',
            'Food': 'グルメ',
            'Nature': '自然・アウトドア',
            'Shopping': 'ショッピング',
            'Photography': '写真撮影',
            '文化・歴史ガイド': '文化・歴史',
            'グルメガイド': 'グルメ',
            '自然ガイド': '自然・アウトドア',
            'business': 'ビジネス',
            'modern': 'モダン',
            'fashion': 'ファッション',
            'youth': '若者向け',
            'nightlife': 'ナイトライフ',
            'entertainment': 'エンターテイメント',
            'night tour': 'ナイトツアー'
        },
        'en': {
            '文化・歴史': 'Culture・History',
            'グルメ': 'Food',
            '自然・アウトドア': 'Nature',
            'ショッピング': 'Shopping',
            '写真撮影': 'Photography',
            '文化・歴史ガイド': 'Culture・History',
            'グルメガイド': 'Food',
            '自然ガイド': 'Nature',
            'ビジネス': 'business',
            'モダン': 'modern',
            'ファッション': 'fashion',
            '若者向け': 'youth',
            'ナイトライフ': 'nightlife',
            'エンターテイメント': 'entertainment',
            'ナイトツアー': 'night tour'
        }
    };
    
    const map = specialtyMap[locale] || specialtyMap['ja'];
    return map[specialty] || specialty;
}

/**
 * 専門分野配列をローカライズして表示
 * @param {Array|string} specialties - 専門分野配列または単一専門分野
 * @param {string} locale - ロケール（'ja' or 'en'）
 * @returns {Array} ローカライズされた専門分野配列
 */
export function localizeSpecialtyArray(specialties, locale = 'ja') {
    if (!specialties) return [];
    
    // 単一文字列の場合は配列に変換
    if (typeof specialties === 'string') {
        return [localizeSpecialty(specialties, locale)];
    }
    
    // 配列の場合は各要素をローカライズ
    if (Array.isArray(specialties)) {
        return specialties
            .filter(spec => spec && spec.trim())
            .map(spec => localizeSpecialty(spec.trim(), locale));
    }
    
    return [];
}

/**
 * 言語を正規化してフィルタリング用の値に変換
 * @param {string} language - 言語識別子
 * @returns {Array} 正規化された言語候補配列
 */
export function normalizeLanguageForFiltering(language) {
    if (!language) return [];
    
    const languageMapping = {
        // UI選択値からの変換
        'japanese': ['japanese', 'ja', '日本語', 'japan'],
        'english': ['english', 'en', '英語', 'eng'],
        'chinese': ['chinese', 'zh', '中国語', 'chn'],
        'korean': ['korean', 'ko', '韓国語', 'kor'],
        'thai': ['thai', 'th', 'タイ語'],
        'vietnamese': ['vietnamese', 'vi', 'ベトナム語'],
        'indonesian': ['indonesian', 'id', 'インドネシア語'],
        'tagalog': ['tagalog', 'tl', 'タガログ語'],
        'hindi': ['hindi', 'hi', 'ヒンディー語'],
        'spanish': ['spanish', 'es', 'スペイン語'],
        'french': ['french', 'fr', 'フランス語'],
        'german': ['german', 'de', 'ドイツ語'],
        'italian': ['italian', 'it', 'イタリア語'],
        'portuguese': ['portuguese', 'pt', 'ポルトガル語'],
        'russian': ['russian', 'ru', 'ロシア語'],
        'arabic': ['arabic', 'ar', 'アラビア語'],
        
        // 日本語表記からの変換
        '日本語': ['japanese', 'ja', '日本語', 'japan'],
        '英語': ['english', 'en', '英語', 'eng'],
        '中国語': ['chinese', 'zh', '中国語', 'chn'],
        '韓国語': ['korean', 'ko', '韓国語', 'kor'],
        'タイ語': ['thai', 'th', 'タイ語'],
        'ベトナム語': ['vietnamese', 'vi', 'ベトナム語'],
        'インドネシア語': ['indonesian', 'id', 'インドネシア語'],
        'タガログ語': ['tagalog', 'tl', 'タガログ語'],
        'ヒンディー語': ['hindi', 'hi', 'ヒンディー語'],
        'スペイン語': ['spanish', 'es', 'スペイン語'],
        'フランス語': ['french', 'fr', 'フランス語'],
        'ドイツ語': ['german', 'de', 'ドイツ語'],
        'イタリア語': ['italian', 'it', 'イタリア語'],
        'ポルトガル語': ['portuguese', 'pt', 'ポルトガル語'],
        'ロシア語': ['russian', 'ru', 'ロシア語'],
        'アラビア語': ['arabic', 'ar', 'アラビア語']
    };
    
    return languageMapping[language] || [language];
}

/**
 * 2つの言語が同じかどうかを比較
 * @param {string} lang1 - 言語1
 * @param {string} lang2 - 言語2
 * @returns {boolean} 同じ言語かどうか
 */
export function compareLanguages(lang1, lang2) {
    if (!lang1 || !lang2) return false;
    
    const normalized1 = normalizeLanguageForFiltering(lang1);
    const normalized2 = normalizeLanguageForFiltering(lang2);
    
    // 交差する正規化値があるかチェック
    return normalized1.some(val1 => 
        normalized2.some(val2 => 
            val1.toLowerCase() === val2.toLowerCase()
        )
    );
}

/**
 * 言語配列内に指定言語が含まれているかチェック
 * @param {Array} languageArray - 言語配列
 * @param {string} targetLanguage - 検索対象言語
 * @returns {boolean} 含まれているかどうか
 */
export function languageArrayIncludes(languageArray, targetLanguage) {
    if (!Array.isArray(languageArray) || !targetLanguage) return false;
    
    return languageArray.some(lang => compareLanguages(lang, targetLanguage));
}

/**
 * 現在のページの言語を検出
 * @returns {string} 'ja' または 'en'
 */
export function getCurrentPageLanguage() {
    const pathname = window.location.pathname;
    // Check if pathname includes '-en.' or '-en/' to detect English pages
    return (pathname.includes('-en.') || pathname.includes('-en/')) ? 'en' : 'ja';
}

/**
 * 現在のページが英語版かどうか
 * @returns {boolean}
 */
export function isEnglishPage() {
    return getCurrentPageLanguage() === 'en';
}

/**
 * 言語に応じたテキストを取得
 * @param {string} jaText - 日本語テキスト
 * @param {string} enText - 英語テキスト
 * @returns {string} 現在の言語に応じたテキスト
 */
export function getText(jaText, enText) {
    return isEnglishPage() ? enText : jaText;
}

// デバッグ用
console.log('🗣️ Language Utils loaded:', {
    currentPage: window.location.pathname,
    detectedLanguage: getCurrentPageLanguage()
});

// 使用例（デバッグ）
console.log('📝 Language Utils Examples:', {
    'japanese → ja': localizeLanguage('japanese', 'ja'),
    'English → ja': localizeLanguage('English', 'ja'),
    '日本語 → ja': localizeLanguage('日本語', 'ja'),
    'array test': localizeLanguageArray(['japanese', 'English'], 'ja')
});