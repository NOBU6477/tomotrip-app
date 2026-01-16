// Location names setup - centralized location management
// ✅ FIXED: 47都道府県 + 離島の完全なマッピング
export function setupLocationNames(state) {
    const currentLang = window.location.pathname.includes('index-en.html') || 
                        window.location.pathname.includes('-en.html') ? 'en' : 'ja';
    
    // 英語版の都道府県マッピング
    const englishLocationData = {
        hokkaido: "Hokkaido", aomori: "Aomori", iwate: "Iwate", miyagi: "Miyagi", akita: "Akita", yamagata: "Yamagata", fukushima: "Fukushima",
        ibaraki: "Ibaraki", tochigi: "Tochigi", gunma: "Gunma", saitama: "Saitama", chiba: "Chiba", tokyo: "Tokyo", kanagawa: "Kanagawa",
        niigata: "Niigata", toyama: "Toyama", ishikawa: "Ishikawa", fukui: "Fukui", yamanashi: "Yamanashi", nagano: "Nagano", gifu: "Gifu", shizuoka: "Shizuoka", aichi: "Aichi",
        mie: "Mie", shiga: "Shiga", kyoto: "Kyoto", osaka: "Osaka", hyogo: "Hyogo", nara: "Nara", wakayama: "Wakayama",
        tottori: "Tottori", shimane: "Shimane", okayama: "Okayama", hiroshima: "Hiroshima", yamaguchi: "Yamaguchi", tokushima: "Tokushima", kagawa: "Kagawa", ehime: "Ehime", kochi: "Kochi",
        fukuoka: "Fukuoka", saga: "Saga", nagasaki: "Nagasaki", kumamoto: "Kumamoto", oita: "Oita", miyazaki: "Miyazaki", kagoshima: "Kagoshima", okinawa: "Okinawa",
        ogasawara: "Ogasawara Islands", izu: "Izu Islands", sado: "Sado Island", awaji: "Awaji Island", yakushima: "Yakushima", amami: "Amami Oshima", ishigaki: "Ishigaki Island", miyako: "Miyako Island"
    };
    
    // 日本語版の都道府県マッピング
    const japaneseLocationData = {
        hokkaido: "北海道", aomori: "青森県", iwate: "岩手県", miyagi: "宮城県", akita: "秋田県", yamagata: "山形県", fukushima: "福島県",
        ibaraki: "茨城県", tochigi: "栃木県", gunma: "群馬県", saitama: "埼玉県", chiba: "千葉県", tokyo: "東京都", kanagawa: "神奈川県",
        niigata: "新潟県", toyama: "富山県", ishikawa: "石川県", fukui: "福井県", yamanashi: "山梨県", nagano: "長野県", gifu: "岐阜県", shizuoka: "静岡県", aichi: "愛知県",
        mie: "三重県", shiga: "滋賀県", kyoto: "京都府", osaka: "大阪府", hyogo: "兵庫県", nara: "奈良県", wakayama: "和歌山県",
        tottori: "鳥取県", shimane: "島根県", okayama: "岡山県", hiroshima: "広島県", yamaguchi: "山口県", tokushima: "徳島県", kagawa: "香川県", ehime: "愛媛県", kochi: "高知県",
        fukuoka: "福岡県", saga: "佐賀県", nagasaki: "長崎県", kumamoto: "熊本県", oita: "大分県", miyazaki: "宮崎県", kagoshima: "鹿児島県", okinawa: "沖縄県",
        ogasawara: "小笠原諸島", izu: "伊豆諸島", sado: "佐渡島", awaji: "淡路島", yakushima: "屋久島", amami: "奄美大島", ishigaki: "石垣島", miyako: "宮古島"
    };
    
    const locationData = currentLang === 'en' ? englishLocationData : japaneseLocationData;

    // Store in AppState and window for backward compatibility
    state.locationNames = locationData;
    window.locationNames = locationData;
    
    console.log('%cLocationNames initialized:', 'color: #28a745;', Object.keys(locationData).length, 'locations', `(${currentLang})`);
    return locationData;
}