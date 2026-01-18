// AppState - Single application state object with default export
// Uses nullish coalescing to prevent redefinition errors

const AppState = (window.AppState ??= {
  locale: 'ja',
  page: 1,
  guides: [],
  originalGuides: [], // Preserve original guides for filter reset
  fullGuideList: [], // ✅ 不変のマスターデータ（フィルタ/検索時に上書きしない）
  filteredGuides: [], // ✅ フィルタ適用後の結果
  paginationSourceList: [], // ✅ NEW: ページネーションが参照するリスト（フィルタ中はfilteredGuides、通常はfullGuideList）
  pageSize: 12,
  currentPage: 1,
  filters: {},
  activeFilters: { // ✅ 現在のフィルタ条件を保持
    location: '',
    language: '',
    price: '',
    keyword: ''
  },
  isFiltered: false,
  searchTerm: '',
  locationNames: {},
  
  get totalPages() {
    return Math.max(1, Math.ceil(this.guides.length / this.pageSize));
  },
  
  initialize(initialData = {}) {
    console.log('%cAppState initializing...', 'color: #007bff;');
    
    // Merge with initial data safely
    Object.assign(this, initialData);
    
    console.log('%cAppState initialized:', 'color: #28a745; font-weight: bold;', {
      guides: this.guides.length,
      pageSize: this.pageSize,
      currentPage: this.currentPage,
      totalPages: this.totalPages
    });
    
    return this;
  },
  
  setGuides(guides) {
    const validGuides = Array.isArray(guides) ? guides : [];
    this.guides = validGuides;
    // Preserve original guides for filter reset functionality  
    this.originalGuides = [...validGuides];
    // ✅ fullGuideList も設定（フィルタのソースとして使用）
    this.fullGuideList = [...validGuides];
    this.currentPage = 1;
    console.log(`📚 AppState: Set ${validGuides.length} guides (fullGuideList: ${this.fullGuideList.length})`);
    return this;
  }
});

export default AppState;