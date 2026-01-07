# Overview

Local Guide is a multilingual platform connecting tourists with local guides for discovery, registration, and booking. The project aims to be a scalable, production-ready solution for a growing marketplace, prioritizing operational speed, stability, and real-world deployment.

## Recent Changes (2026-01-07)
- **Store Reservation Management System**: Complete reservation/booking management for sponsor stores
  - New API service (server/reservationAPI.js) with full CRUD operations
  - File-based storage (data/reservations.json) for persistence
  - Store dashboard integration with reservation tab, statistics, and filtering
  - Status workflow: pending → confirmed → completed / cancelled
  - Modal-based add/edit functionality with form validation
  - Stats always computed from full reservation set (not filtered subset)
  - Client-side filtering with persisted filter state across CRUD operations
  - CSP-compliant event handlers throughout (no inline onclick)
- **Sponsor List Pagination Fix**: Changed default sort from "newest" to "oldest"
  - New stores now appear on later pages instead of displacing existing stores
  - Reset filters function also uses "oldest" as default
- **Sponsor List SEO Optimization**: Complete SEO overhaul of sponsor-list.html for organic search traffic
  - SEO meta tags: title, description, keywords, canonical URL, robots
  - OGP (Open Graph Protocol) for Facebook/social sharing
  - Twitter Card meta tags for Twitter sharing
  - JSON-LD structured data: WebSite, CollectionPage, BreadcrumbList, LocalBusiness per store
  - Dynamic title/description based on URL parameters (?category=xxx, ?area=xxx)
  - Breadcrumb navigation (ホーム > 協賛店一覧)
  - SEO content sections: "TomoTrip協賛店とは", "掲載メリット", FAQ
  - Category tabs for quick filtering (観光案内, 文化体験, アクティビティ, 飲食, 宿泊, 交通)
  - Area filter (那覇, 北谷, 名護, 石垣, 宮古)
  - Modern ocean-themed UI with gradient backgrounds, KPI cards, rounded corners
  - Multiple CTA placements with data-cta attributes for tracking
  - Mobile-responsive design
- **Sponsor Detail Page**: New sponsor-detail.html for individual store SEO
  - Dynamic page content loaded from API based on ?id= parameter
  - SEO meta tags dynamically updated per store
  - JSON-LD LocalBusiness structured data per store
  - Breadcrumb navigation (ホーム > 協賛店一覧 > 店舗名)
  - Store hero section with image, status, category, address
  - Statistics display (views, bookings, rating, days registered)
  - Contact information section
  - Related stores sidebar
  - CTA buttons with tracking attributes
  - Share functionality (Web Share API with clipboard fallback)
  - Not found state for invalid store IDs

## Recent Changes (2025-11-12)
- **Guide Rank & Payout Dashboard System**: Complete implementation of guide ranking, commission tracking, and store contribution analytics
  - Created `ranks` table schema with Bronze/Silver/Gold/Platinum tiers (minScore: 0/60/120/200, bonusRate: 0%/5%/10%/15%)
  - Added `rank_name` and `rank_score` fields to `tourism_guides` table with foreign key constraint
  - Database indexes: `idx_ranks_min_score` on ranks, `idx_guides_rank` on tourism_guides (rank_name, rank_score)
  - Feature Flags system (public/js/feature-flags.js): ENABLE_PAYOUTS, ENABLE_GUIDE_RANKING, SHOW_GUIDE_REAL_NAME_TO_STORE
  - New guide dashboard (public/guide-dashboard.html) with monthly payout display, rank progress, and rank reference table
  - Store effect card (public/js/store-effect-card.js): Shows store metrics (sent customers, bookings, visit rate, video views) and TOP 3 contributing guides
  - Guide dashboard cards (public/js/guide-cards.js): Displays monthly payout breakdown, current rank, points to next rank, rank reference table
  - API endpoints: GET /api/stores/:id/dashboard (store analytics), GET /api/guides/:id/dashboard (guide payout/rank), GET/POST /api/admin/ranks (rank management), GET/POST /api/admin/flags (feature flags)
  - RBAC middleware (server/rbac.js) for role-based access control (admin/store/guide)
  - Base payout: ¥5,000 per paid referral, multiplied by (1 + bonusRate) based on guide rank
  - Integrated into store-dashboard.html with effect measurement and top contributor sections
  - All APIs return real data from sponsor_referrals.json and guides.json for immediate deployment

## Recent Changes (2025-11-02)
- **Guide Referral Commission System**: Complete implementation of guide-to-sponsor-store referral tracking for commission payment management
  - Created `sponsor_referrals` table schema in shared/schema.ts with proper relations to guides and sponsor stores
  - Implemented file-based storage system (data/sponsor-referrals.json) for immediate deployment, consistent with current architecture
  - Built comprehensive API service (server/sponsorReferralAPI.js) with full CRUD operations
  - API endpoints: POST /api/referrals (create), GET /api/referrals/guide/:guideId, GET /api/referrals/store/:storeId, GET /api/referrals (all), PUT /api/referrals/:id (update), GET /api/referrals/dashboard/:guideId (commission dashboard)
  - Tracking fields: referral date, commission rate (default 10%), commission amount, payment status, payment date, referral source, notes
  - Automated payment date tracking when status changes to 'paid'
  - Dashboard provides statistics: total referrals, referrals by status, commission amounts by status
  - Integrated into main server (replit-server.js) with complete API routing
  - Designed for future PostgreSQL migration when database issues are resolved
- **Guide Email Uniqueness Enforcement**: Architect-reviewed comprehensive email duplicate prevention system
  - Added server-side email duplicate check in both registration and update endpoints (server/guideAPI.js)
  - Email normalization with .trim() to prevent whitespace bypasses
  - Case-insensitive duplicate detection for robust validation
  - Returns clear error message: "このメールアドレスは既に登録されています" / "This email address is already registered"
  - Frontend error handling in both Japanese and English registration pages with DUPLICATE_EMAIL error code
  - Email field auto-focus and highlight on duplicate error for better UX
  - Fixed existing duplicate email addresses in data/guides.json (4 duplicates resolved)
  - Modified guides: test1500@gmail.com duplicates → test1500-2, test1500-3; test1600@gmail.com duplicates → test1600-2, test1600-3
  - Updated frontend duplicate removal logic to check ID only (removed email-based deduplication)
  - All 13 registered guides now have unique email addresses

# User Preferences

Preferred communication style: Simple, everyday language.

**GitHub Integration**: User wants to sync current project work with GitHub repository for backup and version control. GitHub-ready files organized in `github-ready` folder for easy deployment.

User confirmed preference for production-ready solution prioritizing:
1. Operational speed and performance
2. Long-term durability and stability
3. Real-world deployment capability
4. Scalable architecture for growth

**Footer Development Approach**: User prefers Japanese version first, then English translation workflow. Language toggle buttons removed since Japanese and English are separate versions (index.html vs index-en.html).

User confirmed mobile adaptation approach: PC specifications should be fully adapted to mobile phones without losing functionality. This includes:
- Complete PC-level functionality on mobile devices
- Adaptive UI for different screen sizes (mobile/tablet detection)
- Touch-friendly interactions with proper sizing (44px minimum)
- Swipe gestures for page navigation (left/right swipe)
- Mobile-optimized modal displays (full-screen on mobile)
- Responsive toolbar positioning (bottom-center on mobile)
- Visual hints and feedback for mobile users

User confirmed correct understanding of guide display system:
- Default display shows ALL currently registered guides (dynamically growing count)
- New guide registrations automatically increase the total displayed count
- Current system shows 24 registered guides (12 default + 12 new registrations)
- Filter functionality should work on this complete dataset of all registered guides
- This is the intended scalable design for a growing guide marketplace

# System Architecture

## Frontend
- **Framework**: Vanilla JavaScript with Bootstrap 5.3, ESM module architecture.
- **Styling**: Bootstrap CSS with custom CSS, responsive design with mobile-first approach.
- **UI Components**: Responsive navigation, modal-based workflows, toast notifications, loading states, adaptive UI, touch-friendly interactions, swipe gestures.
- **Security**: CSP-compliant architecture with zero inline scripts.
- **Language Support**: Dynamic translation system with Japanese/English switching, language preference persistence.
- **UI/UX Decisions**: Consistent modal designs, unified oval button styling, enhanced hover effects, dynamic content translation, dynamic guide card rendering with individual bookmark/compare buttons, visual feedback systems.
- **Pagination**: "Show More" button (transitioning to traditional pagination), advanced UI with progress bars, page previews, quick jump, smart page number display, floating toolbar with bookmark system, comparison tool (3-guide limit), browsing history, quick page access, keyboard navigation, sort functionality, memory efficiency (12 guides in DOM).
- **Footer System**: Complete multilingual footer with 5 sections and detailed content modals, dark theme with responsive Bootstrap layout, hover effects, and glass morphism elements.
- **Draft Management**: Public sponsor list for published stores. Draft management moved to individual store edit pages with auto-save, manual save/load, timestamp tracking, and distinct yellow gradient UI.

## Backend
- **Server**: Python-only workflow configured for direct execution on port 5000.
- **Deployment**: Enhanced production-ready features including health monitoring, graceful shutdown, enhanced logging, CORS support, deployment optimization, security headers, performance caching, and OPTIONS request handling. Custom deployment scripts.
- **Architecture**: ThreadedTCPServer with multi-threading, comprehensive API endpoints, professional 404 error pages.

## Database
- **ORM**: Drizzle (prepared for PostgreSQL integration).
- **Storage**: Distributed LocalStorage system for frontend data; browser session storage for authentication. SponsorStorageManager for distributed sponsor data with image compression, cleanup, and real-time monitoring. SQLite for scalable data management with bookmark/comparison persistence.
- **Persistence**: File-based storage system using JSON (`data/sponsor-stores.json`, `data/guides.json`) for persistence for certain data, alongside PostgreSQL.

## Key Technical Components
- **Camera Integration**: Document photo capture, profile photo upload, mobile camera optimization, file fallback system.
- **Search & Filter System**: Multi-criteria filtering, real-time search, keyword-based matching, advanced filter combinations, location, language, price filtering.
- **Management Center**: Centralized management for bookmarks and comparisons, bulk data deletion, visual feedback.
- **Access Control**: Guide detail viewing requires tourist registration, modal-based access prompts, header login differentiation.
- **Booking Flow**: Complete multilingual system with language detection and translation across payment and confirmation pages. Consistent guide rate display and language inheritance.
- **Login/Registration**: Unified sponsor login/registration concept requiring store name, email, phone. Login redirects to individual store edit page. Guide email uniqueness enforcement.
- **Dual Dashboard System**:
  - `sponsor-dashboard.html`: Admin/operations dashboard for TomoTrip team to manage all stores.
  - `store-dashboard.html`: Individual store dashboard for each sponsor to manage their own store.
  - Role-based access control with different permission levels and feature sets.

# External Dependencies

## CDN Resources
- Bootstrap 5.3.0-alpha1 (CSS & JS)
- Bootstrap Icons 1.10.0
- Swiper.js 10.x (for carousel components)

## Third-party Integrations
- Firebase (authentication services)
- Google Cloud Storage (for profile photo uploads)
- Camera API (document capture)
- Geolocation services (location detection)