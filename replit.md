# Overview

Local Guide is a multilingual platform connecting tourists with local guides for discovery, registration, and booking. The project aims to be a scalable, production-ready solution for a growing marketplace, prioritizing operational speed, stability, and real-world deployment. Key capabilities include comprehensive reservation management, automated email notifications, advanced SEO optimization, and a dual dashboard system for sponsors and administrators. The platform also supports an independent adult entertainment directory with age verification.

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
- **Styling**: Bootstrap CSS with custom CSS, responsive design with mobile-first approach, CSP-compliant architecture.
- **UI Components**: Responsive navigation, modal-based workflows, toast notifications, loading states, adaptive UI, touch-friendly interactions, swipe gestures. Consistent modal designs, oval button styling, enhanced hover effects, dynamic content translation, dynamic guide card rendering, visual feedback.
- **Language Support**: Dynamic translation system with Japanese/English switching, language preference persistence.
- **Pagination**: "Show More" button (transitioning to traditional pagination), advanced UI with progress bars, page previews, quick jump, smart page number display, floating toolbar, bookmark system, comparison tool, browsing history, quick page access, keyboard navigation, sort functionality.
- **Footer System**: Multilingual footer with 5 sections, content modals, dark theme, responsive Bootstrap layout, hover effects, and glass morphism elements.
- **Draft Management**: Public sponsor list for published stores, individual store edit pages with auto-save, manual save/load, timestamp tracking.
- **SEO Optimization**: Extensive SEO meta tags (title, description, keywords, canonical URL, robots), OGP, Twitter Cards, and JSON-LD structured data (WebSite, CollectionPage, BreadcrumbList, LocalBusiness). Dynamic meta based on URL parameters. Breadcrumb navigation.

## Backend
- **Server**: Python-only workflow on port 5000 with ThreadedTCPServer for multi-threading.
- **Deployment**: Health monitoring, graceful shutdown, enhanced logging, CORS support, deployment optimization, security headers, performance caching, OPTIONS request handling.
- **Architecture**: Comprehensive API endpoints, professional 404 error pages.
- **Access Control**: Role-based access control (admin/store/guide) using RBAC middleware.
- **Referral & Payout System**: Guide-to-sponsor-store referral tracking, guide ranking (Bronze/Silver/Gold/Platinum tiers), commission calculation, monthly payout display.
- **Reservation Management**: Full CRUD operations for reservations, status workflow (pending → confirmed → completed / cancelled), email notifications.
- **Feature Flags**: System for enabling/disabling features like payouts and guide ranking.
- **Extension Request System**: Tourists can request trip extensions (30/60/120 minutes at ¥3,000/hour). Guides approve/reject via dashboard. One-way state machine: pending → approved/rejected.

## Database
- **ORM**: Drizzle (prepared for PostgreSQL integration).
- **Storage**: Distributed LocalStorage for frontend, browser session storage for authentication. SponsorStorageManager for sponsor data. SQLite for scalable data management. File-based JSON storage for certain data (`data/sponsor-stores.json`, `data/guides.json`, `data/reservations.json`, `data/adult-shops.json`, `data/sponsor-referrals.json`).

## Key Technical Components
- **Camera Integration**: Document photo capture, profile photo upload, mobile camera optimization, file fallback.
- **Search & Filter System**: Multi-criteria, real-time, keyword-based matching, advanced filter combinations (location, language, price). Language normalization supports variants (英語/English/en). Filters apply to fullGuideList (immutable master) to ensure all guides are searched, not just current page. Filter state persists across 30-second data refreshes.
- **Search State Preservation** (2026-01-18): Centralized module (`search-state.mjs`) manages search state (region/language/price/keyword/page/scrollY) when navigating to detail pages. URL query priority over sessionStorage with 10-minute expiry. State saved before detail navigation, registration redirect, and login prompts. Automatic restoration on page load.
- **Same-Tab Navigation** (2026-01-19): Guide detail pages now open in the same tab (not new tab/window) to preserve browser history. This enables proper `history.back()` navigation and search state restoration when returning from detail pages.
- **Management Center**: Centralized bookmark and comparison management, bulk data deletion.
- **Access Control**: Guide detail viewing requires tourist registration, modal-based prompts, header login differentiation.
- **Booking Flow**: Multilingual system for payment and confirmation, consistent guide rate display, language inheritance.
- **Login/Registration**: Unified sponsor login/registration, guide email uniqueness enforcement.
- **Dual Dashboard System**:
  - `sponsor-dashboard.html`: Admin/operations dashboard.
  - `store-dashboard.html`: Individual sponsor store management.

# External Dependencies

## CDN Resources
- Bootstrap 5.3.0-alpha1 (CSS & JS)
- Bootstrap Icons 1.10.0
- Swiper.js 10.x

## Third-party Integrations
- Firebase (authentication services)
- Google Cloud Storage (for profile photo uploads)
- SendGrid/Resend (for email notifications)
- Camera API (document capture)
- Geolocation services (location detection)
- Supabase (external form submissions: reservations, contacts, listings)

## Supabase API Integration (2026-01-11)
External form submissions from tomotrip.com are handled by fixed API endpoints:
- `POST /api/supabase/reservations` - Store reservation requests
- `POST /api/supabase/contacts` - Contact form submissions
- `POST /api/supabase/listings` - Listing applications
- `GET /api/supabase/health` - Health check endpoint

CORS is configured to allow only:
- Production: https://tomotrip.com, https://www.tomotrip.com
- Development: localhost, replit domains

See `docs/supabase-setup.sql` for table creation SQL and RLS policies.
See `docs/SUPABASE_API_README.md` for API documentation.

# Pagination & Filter Regression Testing (2026-01-18)

## Debug Mode

デバッグモードを有効にする方法:
1. ブラウザのコンソールで `window.__TT_DEBUG = true` を入力
2. ページをリロード
3. 操作を行い、コンソールログを確認

デバッグモードでは以下が出力される:
- `[TT-DEBUG] context=...` - ページネーション状態の詳細
- `✅` - 正常（重複なし、カウンター整合）
- `❌` - エラー（重複あり、カウンター不整合、フィルタ違反）

通常モードではデバッグログは出力されない（本番影響なし）。

## Regression Test Cases (TC1-TC7)

### TC1: 初期表示 → 2ページ目 → 1ページ目へ戻る
- 初期: 全件表示
- 次ページを押下
- 前ページを押下
- ✅ カウンターが整合（例: 1-12/14, 13-14/14）
- ✅ 重複なし

### TC2: フィルタON（英語）→ 次ページ押下
- 言語=英語を選択
- 次ページを押す
- ✅ totalPages <=1 の場合、次ページが押せない/無効
- ✅ 英語以外が混入しない

### TC3: フィルタON（地域×英語で少数）→ 次ページ押下
- 地域=東京都 かつ 言語=英語を選択
- 次ページを押下
- ✅ 1ページ内なら次ページ無効
- ✅ 重複なし

### TC4: ページ2へ移動後に条件変更（再検索）
- 全件で2ページ目へ
- 言語=英語を選ぶ（再検索）
- ✅ currentPage が 1 に戻る
- ✅ カウンターが正しくなる
- ✅ 表示がフィルタ結果に一致
- ✅ 重複なし

### TC5: フィルタ中にさらに条件追加（再検索）
- 言語=英語 → 地域=東京都を追加
- ✅ currentPage=1 に戻る
- ✅ total/totalPages が filtered に一致
- ✅ 表示一致、混入なし

### TC6: リセット後の整合性
- リセットして全件へ
- ✅ fullGuideList に戻る
- ✅ ページネーションが全件用に復元
- ✅ カウンター正常、重複なし

### TC7: 30秒更新を跨いでも保持される
- フィルタON（地域×言語）
- 30秒待つ（refresh）
- ✅ フィルタ状態・ページ状態が崩れない
- ✅ 表示件数と内容が維持
- ✅ 重複なし

## Debug Utilities

デバッグユーティリティは `window.__TT_DEBUG_UTILS` で利用可能:
- `logPaginationState(context)` - ページネーション状態をログ出力
- `detectDuplicateIds(guides, context)` - 重複ID検知
- `validateCounterDisplay(start, end, total, context)` - カウンター整合性チェック
- `validateSourceList(list, context)` - ソースリスト一本化検証
- `validateFilterResults(guides, filters, context)` - フィルタ結果検証
- `printTestSummary()` - テストサマリー出力