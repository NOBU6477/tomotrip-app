// 統一地域正規化ユーティリティ - すべての地域マッピングの統一API
import { prefecturesData, locationToCodeMap } from '../data/prefectures-data.mjs';
import { getCurrentPageLanguage } from './language-utils.mjs';

// 都道府県名の英語翻訳マッピング
const prefectureNameTranslations = {
  "北海道": "Hokkaido",
  "青森県": "Aomori",
  "岩手県": "Iwate",
  "宮城県": "Miyagi",
  "秋田県": "Akita",
  "山形県": "Yamagata",
  "福島県": "Fukushima",
  "茨城県": "Ibaraki",
  "栃木県": "Tochigi",
  "群馬県": "Gunma",
  "埼玉県": "Saitama",
  "千葉県": "Chiba",
  "東京都": "Tokyo",
  "神奈川県": "Kanagawa",
  "新潟県": "Niigata",
  "富山県": "Toyama",
  "石川県": "Ishikawa",
  "福井県": "Fukui",
  "山梨県": "Yamanashi",
  "長野県": "Nagano",
  "岐阜県": "Gifu",
  "静岡県": "Shizuoka",
  "愛知県": "Aichi",
  "三重県": "Mie",
  "滋賀県": "Shiga",
  "京都府": "Kyoto",
  "大阪府": "Osaka",
  "兵庫県": "Hyogo",
  "奈良県": "Nara",
  "和歌山県": "Wakayama",
  "鳥取県": "Tottori",
  "島根県": "Shimane",
  "岡山県": "Okayama",
  "広島県": "Hiroshima",
  "山口県": "Yamaguchi",
  "徳島県": "Tokushima",
  "香川県": "Kagawa",
  "愛媛県": "Ehime",
  "高知県": "Kochi",
  "福岡県": "Fukuoka",
  "佐賀県": "Saga",
  "長崎県": "Nagasaki",
  "熊本県": "Kumamoto",
  "大分県": "Oita",
  "宮崎県": "Miyazaki",
  "鹿児島県": "Kagoshima",
  "沖縄県": "Okinawa"
};

/**
 * 都道府県名をコードに変換（統一API）
 * @param {string} prefectureName - 都道府県名（例：東京都、沖縄県）
 * @returns {string} 都道府県コード（例：tokyo, okinawa）
 */
export function convertPrefectureNameToCode(prefectureName) {
    if (!prefectureName) return '';
    
    // 直接的なマッピング
    const directCode = locationToCodeMap[prefectureName];
    if (directCode) return directCode;
    
    // 都道府県名から接尾辞を除去してマッチング
    const nameWithoutSuffix = prefectureName.replace(/[都道府県]/g, '');
    for (const [code, data] of Object.entries(prefecturesData)) {
        const prefNameWithoutSuffix = data.name.replace(/[都道府県]/g, '');
        if (nameWithoutSuffix === prefNameWithoutSuffix) {
            return code;
        }
    }
    
    return prefectureName; // フォールバック
}

/**
 * 都道府県コードから名前を取得（統一API）
 * @param {string} code - 都道府県コード（例：tokyo, okinawa）
 * @returns {string} 都道府県名（例：東京都、沖縄県）
 */
export function convertCodeToPrefectureName(code) {
    return prefecturesData[code]?.name || code;
}

/**
 * 地域文字列を正規化してコードに変換（統一API）
 * @param {string} locationString - 地域文字列（様々な形式に対応）
 * @returns {string} 正規化された都道府県コード
 */
export function normalizeLocationToCode(locationString) {
    if (!locationString) return '';
    
    // 1. 完全一致を最初に試行
    for (const [code, data] of Object.entries(prefecturesData)) {
        if (locationString === data.name) {
            return code;
        }
        
        // "都道府県 市区町村" 形式での一致
        if (locationString.startsWith(data.name + ' ')) {
            return code;
        }
        
        // 市区町村リストとの照合
        for (const city of data.cities) {
            if (locationString === `${data.name} ${city}`) {
                return code;
            }
        }
    }
    
    // 2. 部分一致（都道府県名を含む場合）
    for (const [code, data] of Object.entries(prefecturesData)) {
        const prefNameWithoutSuffix = data.name.replace(/[都道府県]/g, '');
        if (locationString.includes(prefNameWithoutSuffix)) {
            return code;
        }
    }
    
    // 3. 直接的なコードマッピング確認
    const directCode = locationToCodeMap[locationString];
    if (directCode) return directCode;
    
    return locationString; // フォールバック
}

/**
 * 地域コードを表示用の名前に変換（統一API）
 * @param {string} code - 地域コード
 * @param {string} lang - 言語コード（'ja' または 'en'）、省略時は現在のページ言語
 * @returns {string} 表示用の地域名
 */
export function convertCodeToDisplayName(code, lang = null) {
    const currentLang = lang || getCurrentPageLanguage();
    const data = prefecturesData[code];
    
    if (!data) return code;
    
    // 英語ページの場合は英訳を返す
    if (currentLang === 'en' && prefectureNameTranslations[data.name]) {
        return prefectureNameTranslations[data.name];
    }
    
    return data.name;
}

/**
 * 都道府県名を現在の言語に翻訳
 * @param {string} prefectureName - 都道府県名（日本語）
 * @param {string} lang - 言語コード（'ja' または 'en'）、省略時は現在のページ言語
 * @returns {string} 翻訳された都道府県名
 */
export function translatePrefectureName(prefectureName, lang = null) {
    if (!prefectureName) return '';
    
    const currentLang = lang || getCurrentPageLanguage();
    
    // 英語ページの場合は英訳を返す
    if (currentLang === 'en' && prefectureNameTranslations[prefectureName]) {
        return prefectureNameTranslations[prefectureName];
    }
    
    return prefectureName;
}

/**
 * 2つの地域値が同じかどうか比較（統一API）
 * @param {string} location1 - 地域1（コードまたは名前）
 * @param {string} location2 - 地域2（コードまたは名前）
 * @returns {boolean} 同じ地域かどうか
 */
export function compareLocations(location1, location2) {
    if (!location1 || !location2) return false;
    
    const code1 = normalizeLocationToCode(location1);
    const code2 = normalizeLocationToCode(location2);
    
    return code1 === code2;
}

/**
 * 全都道府県の名前→コードマッピング取得（統一API）
 * @returns {Object} 名前→コードのマッピングオブジェクト
 */
export function getAllLocationMappings() {
    return locationToCodeMap;
}

/**
 * 全都道府県データ取得（統一API）
 * @returns {Object} 都道府県データ
 */
export function getAllPrefecturesData() {
    return prefecturesData;
}

// 下位互換性のためのエクスポート
export const locationNames = {};
Object.entries(prefecturesData).forEach(([code, data]) => {
    locationNames[code] = data.name;
});

// デバッグ用
console.log('🗾 Location Utils loaded:', {
    prefectures: Object.keys(prefecturesData).length,
    mappings: Object.keys(locationToCodeMap).length
});