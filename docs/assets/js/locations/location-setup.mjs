// Location names setup - centralized location management
export function setupLocationNames(state) {
    const locationData = {
        'tokyo': '東京',
        'osaka': '大阪',
        'kyoto': '京都',
        'hiroshima': '広島',
        'fukuoka': '福岡',
        'sapporo': '札幌',
        'sendai': '仙台',
        'kanazawa': '金沢',
        'nara': '奈良',
        'nikko': '日光',
        'hakone': '箱根',
        'mount-fuji': '富士山',
        'okinawa': '沖縄'
    };

    // Store in AppState and window for backward compatibility
    state.locationNames = locationData;
    window.locationNames = locationData;
    
    console.log('%cLocationNames initialized:', 'color: #28a745;', Object.keys(locationData).length, 'locations');
    return locationData;
}