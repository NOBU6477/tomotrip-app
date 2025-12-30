// 都道府県選択UI生成モジュール
import { prefecturesData, regionTypes } from '../data/prefectures-data.mjs';
import { getCurrentPageLanguage } from '../utils/language-utils.mjs';
import { convertCodeToDisplayName } from '../utils/location-utils.mjs';

// 地域名の日英対応マッピング
const regionNames = {
  ja: {
    "hokkaido": "北海道地方",
    "tohoku": "東北地方",
    "kanto": "関東地方",
    "chubu": "中部地方",
    "kinki": "近畿地方",
    "chugoku": "中国地方",
    "shikoku": "四国地方",
    "kyushu": "九州地方",
    "okinawa": "沖縄地方",
    "remote_islands": "離島地域（詳細選択）",
    "individual_islands": "個別離島選択",
    "all_islands": "離島地域（全体）"
  },
  en: {
    "hokkaido": "Hokkaido Region",
    "tohoku": "Tohoku Region",
    "kanto": "Kanto Region",
    "chubu": "Chubu Region",
    "kinki": "Kinki Region",
    "chugoku": "Chugoku Region",
    "shikoku": "Shikoku Region",
    "kyushu": "Kyushu Region",
    "okinawa": "Okinawa Region",
    "remote_islands": "Remote Islands (Detailed)",
    "individual_islands": "Individual Islands",
    "all_islands": "Remote Islands (All)"
  }
};

// 離島サブリージョン名の日英対応マッピング
const islandSubregionNames = {
  ja: {
    "hokkaido_islands": "北海道離島",
    "tohoku_islands": "東北離島",
    "kanto_islands": "関東離島",
    "chubu_islands": "中部離島",
    "kinki_islands": "近畿離島",
    "chugoku_islands": "中国離島",
    "shikoku_islands": "四国離島",
    "kyushu_islands": "九州離島",
    "okinawa_islands": "沖縄離島"
  },
  en: {
    "hokkaido_islands": "Hokkaido Islands",
    "tohoku_islands": "Tohoku Islands",
    "kanto_islands": "Kanto Islands",
    "chubu_islands": "Chubu Islands",
    "kinki_islands": "Kinki Islands",
    "chugoku_islands": "Chugoku Islands",
    "shikoku_islands": "Shikoku Islands",
    "kyushu_islands": "Kyushu Islands",
    "okinawa_islands": "Okinawa Islands"
  }
};

// 地域別にグループ化した都道府県選択HTMLを生成
export function generatePrefectureOptions() {
  const currentLang = getCurrentPageLanguage();
  const regionLabels = regionNames[currentLang];
  
  const regions = {
    "hokkaido": ["hokkaido"],
    "tohoku": ["aomori", "iwate", "miyagi", "akita", "yamagata", "fukushima"], 
    "kanto": ["ibaraki", "tochigi", "gunma", "saitama", "chiba", "tokyo", "kanagawa"],
    "chubu": ["niigata", "toyama", "ishikawa", "fukui", "yamanashi", "nagano", "gifu", "shizuoka", "aichi"],
    "kinki": ["mie", "shiga", "kyoto", "osaka", "hyogo", "nara", "wakayama"], 
    "chugoku": ["tottori", "shimane", "okayama", "hiroshima", "yamaguchi"],
    "shikoku": ["tokushima", "kagawa", "ehime", "kochi"],
    "kyushu": ["fukuoka", "saga", "nagasaki", "kumamoto", "oita", "miyazaki", "kagoshima"],
    "okinawa": ["okinawa"]
  };

  const placeholderText = currentLang === 'en' ? 'Select Location' : '活動地域を選択してください';
  let optionsHTML = `<option value="">${placeholderText}</option>\n`;
  
  console.log('🏗️ Generating prefecture options for language:', currentLang);

  Object.entries(regions).forEach(([regionKey, prefectureCodes]) => {
    const regionLabel = regionLabels[regionKey] || regionKey;
    optionsHTML += `<optgroup label="${regionLabel}">\n`;
    
    prefectureCodes.forEach(code => {
      const prefecture = prefecturesData[code];
      if (prefecture) {
        const prefectureName = convertCodeToDisplayName(code, currentLang);
        optionsHTML += `    <option value="${code}" data-region="${prefecture.region}" data-attributes='${JSON.stringify(prefecture.attributes)}'>${prefectureName}</option>\n`;
      }
    });
    
    optionsHTML += `</optgroup>\n`;
  });

  // 離島選択肢を詳細化して追加
  const remoteIslandsData = prefecturesData["remote_islands"];
  if (remoteIslandsData && remoteIslandsData.subregions) {
    const islandSubregionLabels = islandSubregionNames[currentLang];
    
    optionsHTML += `<optgroup label="${regionLabels.remote_islands}">\n`;
    
    // 全離島オプション
    optionsHTML += `    <option value="remote_islands">${regionLabels.all_islands}</option>\n`;
    
    // 地域別離島オプション
    Object.entries(remoteIslandsData.subregions).forEach(([subregionCode, subregionData]) => {
      const translatedName = islandSubregionLabels[subregionCode] || subregionData.name;
      optionsHTML += `    <option value="${subregionCode}">${translatedName}</option>\n`;
    });
    
    optionsHTML += '</optgroup>\n';
    
    // 個別離島選択オプション
    optionsHTML += `<optgroup label="${regionLabels.individual_islands}">\n`;
    Object.entries(remoteIslandsData.subregions).forEach(([subregionCode, subregionData]) => {
      subregionData.islands.forEach(island => {
        const islandCode = `island_${island.replace(/[^\w]/g, '_')}`;
        optionsHTML += `    <option value="${islandCode}">${island}</option>\n`;
      });
    });
    optionsHTML += '</optgroup>\n';
  }

  console.log('📊 Generated options HTML length:', optionsHTML.length);
  return optionsHTML;
}

// 地域属性フィルター用のチェックボックス生成
export function generateAttributeFilters() {
  const allAttributes = new Set();
  Object.values(prefecturesData).forEach(prefecture => {
    prefecture.attributes.forEach(attr => allAttributes.add(attr));
  });

  let attributeHTML = '';
  [...allAttributes].sort().forEach(attribute => {
    attributeHTML += `
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" id="attr-${attribute}" value="${attribute}">
        <label class="form-check-label" for="attr-${attribute}">${attribute}</label>
      </div>
    `;
  });

  return attributeHTML;
}

// 都道府県コードから名前を取得
export function getPrefectureName(code) {
  return prefecturesData[code]?.name || code;
}

// 地域マッチング関数（API responseの地域文字列をコードにマッピング）
export function matchLocationToCode(locationString) {
  if (!locationString) return null;
  
  // 完全一致を最初に試行
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
  
  // 部分一致（都道府県名を含む場合）
  for (const [code, data] of Object.entries(prefecturesData)) {
    if (locationString.includes(data.name.replace(/[都道府県]/g, ''))) {
      return code;
    }
  }
  
  return null;
}