// AppState - Single application state object with default export
// Uses nullish coalescing to prevent redefinition errors

const AppState = (window.AppState ??= {
  locale: 'ja',
  page: 1,
  guides: [],
  originalGuides: [], // Preserve original guides for filter reset
  pageSize: 12,
  currentPage: 1,
  filters: {},
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
    this.currentPage = 1;
    console.log(`📚 AppState: Set ${validGuides.length} guides (${this.originalGuides.length} preserved as original)`);
    return this;
  }
});

export default AppState;