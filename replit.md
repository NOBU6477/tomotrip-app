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
- **SEO Optimization**: Extensive SEO meta tags (title, description, keywords, canonical URL, robots), OGP, Twitter Cards, and JSON-LD structured data. Dynamic meta based on URL parameters. Breadcrumb navigation.
- **Camera Integration**: Document photo capture, profile photo upload, mobile camera optimization, file fallback.
- **Search & Filter System**: Multi-criteria, real-time, keyword-based matching, advanced filter combinations (location, language, price). Language normalization. Filters apply to an immutable master list. Filter state persists across data refreshes.
- **Search State Preservation**: Centralized module manages search state (region/language/price/keyword/page/scrollY) when navigating to detail pages. URL query priority over sessionStorage with 10-minute expiry. State saved before detail navigation, registration redirect, and login prompts. Automatic restoration on page load.
- **Same-Tab Navigation**: Guide detail pages open in the same tab to preserve browser history, enabling `history.back()` and search state restoration.
- **Management Center**: Centralized bookmark and comparison management, bulk data deletion.
- **Access Control**: Guide detail viewing requires tourist registration, modal-based prompts, header login differentiation.
- **Booking Flow**: Multilingual system for payment and confirmation, consistent guide rate display, language inheritance.
- **Login/Registration**: Unified sponsor login/registration, guide email uniqueness enforcement.

## Backend
- **Server**: Python-only workflow on port 5000 with ThreadedTCPServer for multi-threading.
- **Deployment**: Health monitoring, graceful shutdown, enhanced logging, CORS support, deployment optimization, security headers, performance caching, OPTIONS request handling.
- **Architecture**: Comprehensive API endpoints, professional 404 error pages.
- **Access Control**: Role-based access control (admin/store/guide) using RBAC middleware.
- **Referral & Payout System**: Guide-to-sponsor-store referral tracking, guide ranking (Bronze/Silver/Gold/Platinum tiers), commission calculation, monthly payout display.
- **Reservation Management**: Full CRUD operations for reservations, status workflow (pending → confirmed → completed / cancelled), email notifications.
- **Feature Flags**: System for enabling/disabling features like payouts and guide ranking.
- **Extension Request System**: Tourists can request trip extensions. Guides approve/reject via dashboard.
- **Contact Form System**: Multi-type contact form (guide/tourist/sponsor) with dual email delivery using Promise.all:
    - Admin notification: Sent to info@tomotrip.com with Reply-To set to user's email
    - Auto-reply: Sent to user with confirmation message and submitted content
    - Route: `POST /api/contact` with validation (name, email format, message ≥10 chars, valid type)

## Database
- **ORM**: Drizzle (prepared for PostgreSQL integration).
- **Guide Data**: PostgreSQL is the authoritative source for guide data. JSON file (`data/guides.json`) serves as backup only after successful DB writes.
    - Write Operations: DB mandatory, no JSON-only writes.
    - Read Operations: DB first, JSON fallback if DB returns null.
- **Storage**: Distributed LocalStorage for frontend, browser session storage for authentication. SponsorStorageManager for sponsor data. File-based JSON storage for certain data.
- **Canonical Guide Data Structure**: Unified field naming convention across the application:
    - Core utilities: `normalizeToCanonical()`, `canonicalToDbFormat()`, `validateCanonicalGuide()` in server/guideAPI.js
    - Canonical fields: `name`, `price`, `area`, `description`, `specialties[]`, `languages[]`, `photos[]`, `extensionPolicy`, `lateNightPolicy`, `isPublished`, `email`, `phone`
    - DB field mapping: `guideName→name`, `guideSessionRate→price`, `location→area`, `guideIntroduction→description`
    - Validation: name required (non-empty), price required (>0); incomplete guides filtered from API with warning logs
    - API responses: Both canonical and legacy field names returned for backward compatibility
    - Edit page: All fields populated from canonical or legacy names with incomplete data warnings

## Dual Dashboard System
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

## Supabase API Integration
External form submissions are handled by fixed API endpoints:
- `POST /api/supabase/reservations` - Store reservation requests
- `POST /api/supabase/contacts` - Contact form submissions
- `POST /api/supabase/listings` - Listing applications
- `GET /api/supabase/health` - Health check endpoint
CORS is configured to allow specific production and development domains.