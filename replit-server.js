const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");

// Import our new API services
const { guideAPIService } = require("./server/guideAPI");
const { adminAuthService } = require("./server/adminAuth");
const { sponsorStoreAPIService } = require("./server/sponsorStoreAPI");
const { sponsorReferralAPIService } = require("./server/sponsorReferralAPI");
const { reservationAPIService } = require("./server/reservationAPI");
const { FileStorageService } = require("./server/fileStorage");
const { storeDashboardAPIService } = require("./server/storeDashboardAPI");
const { guideDashboardAPIService } = require("./server/guideDashboardAPI");
const { adminAPIService } = require("./server/adminAPI");
const { requireRole } = require("./server/rbac");

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Max 5 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs for guide/store uploads
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "画像ファイル（JPG, PNG）またはPDFファイルのみアップロード可能です",
        ),
        false,
      );
    }
  },
});

// Initialize file storage
const fileStorage = new FileStorageService();

// Initialize API services with file storage
sponsorStoreAPIService.fileStorage = fileStorage;
guideAPIService.fileStorage = fileStorage;

// Replit-optimized server configuration
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

console.log("🚀 Starting TomoTrip integrated server...");

// Create Express app
const app = express();

// Middleware setup - Allow all origins for development (fix CORS issues)
app.use(
  cors({
    origin: true, // Allow all origins for development
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware - LOG EVERYTHING
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  if (req.path.includes("upload")) {
    console.log("  - Body keys:", Object.keys(req.body || {}));
    console.log("  - File present:", !!req.file);
    console.log("  - Files present:", !!req.files);
  }
  next();
});

// 開発用: すべての HTML と JS キャッシュを無効化
app.use((req, res, next) => {
  if (req.path.endsWith(".html") || req.path.endsWith(".js")) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

// Fix .mjs MIME type for ES6 modules
app.use((req, res, next) => {
  if (req.path.endsWith(".mjs")) {
    res.type("application/javascript");
    // Force no-cache for JavaScript modules during debugging
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
  }
  next();
});

// Rate limiting for admin login
app.use("/api/admin/login", adminAuthService.createLoginRateLimit());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    server: "TomoTrip Integrated Server",
    timestamp: new Date().toISOString(),
    services: {
      sms: "enabled",
      fileStorage: "enabled",
      adminAuth: "enabled",
      guideAPI: "enabled",
    },
  });
});

// API Status endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "TomoTrip API Server",
    version: "2.0.0",
    status: "running",
    endpoints: {
      guides: "/api/guides",
      sms: "/api/guides/send-verification",
      upload: "/api/guides/upload-document",
      admin: "/api/admin",
      health: "/health",
    },
    features: {
      smsVerification: true,
      fileUpload: true,
      adminAuth: true,
      guideRegistration: true,
    },
  });
});

// Admin authentication endpoints
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password, accessLevel } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";

    const result = await adminAuthService.authenticateAdmin(
      username,
      password,
      accessLevel,
      clientIP,
    );

    if (result.success) {
      res.json({
        success: true,
        message: "ログイン成功",
        token: result.token,
        user: result.user,
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("❌ Admin login error:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "ログイン処理中にエラーが発生しました",
    });
  }
});

app.post("/api/admin/logout", (req, res) => {
  res.json({
    success: true,
    message: "ログアウトしました",
  });
});

app.get("/api/admin/verify", adminAuthService.requireAuth(), (req, res) => {
  res.json({
    success: true,
    user: req.adminUser,
    permissions: adminAuthService.getPermissions(req.adminUser.level),
  });
});

// Request logging middleware
app.use("/api/guides/upload-profile-photo", (req, res, next) => {
  console.log("🔵 INCOMING REQUEST: /api/guides/upload-profile-photo");
  console.log("  - Method:", req.method);
  console.log("  - Headers:", JSON.stringify(req.headers, null, 2));
  console.log("  - Body:", req.body);
  next();
});

// Setup Guide API routes with multer upload
guideAPIService.setupRoutes(app, upload);

// Setup Sponsor Store API routes with multer upload
sponsorStoreAPIService.setupRoutes(app, upload);

// Setup Sponsor Referral API routes
sponsorReferralAPIService.setupRoutes(app);

// Setup Reservation API routes
reservationAPIService.setupRoutes(app);

// Store Dashboard API routes
app.get("/api/stores/:id/dashboard", async (req, res) => {
  try {
    const storeId = req.params.id;
    const dashboard = await storeDashboardAPIService.getStoreDashboard(storeId);
    res.json(dashboard);
  } catch (error) {
    console.error("Error getting store dashboard:", error);
    res.status(500).json({ error: "Failed to load store dashboard" });
  }
});

// Guide Dashboard API routes
app.get("/api/guides/:id/dashboard", async (req, res) => {
  try {
    const guideId = req.params.id;
    const dashboard = await guideDashboardAPIService.getGuideDashboard(guideId);
    res.json(dashboard);
  } catch (error) {
    console.error("Error getting guide dashboard:", error);
    res.status(500).json({ error: "Failed to load guide dashboard" });
  }
});

// Admin API routes for Feature Flags
app.get("/api/admin/flags", (req, res) => {
  try {
    const flags = adminAPIService.getFlags();
    res.json(flags);
  } catch (error) {
    console.error("Error getting flags:", error);
    res.status(500).json({ error: "Failed to get flags" });
  }
});

app.post("/api/admin/flags", (req, res) => {
  try {
    const flags = adminAPIService.updateFlags(req.body);
    res.json(flags);
  } catch (error) {
    console.error("Error updating flags:", error);
    res.status(500).json({ error: "Failed to update flags" });
  }
});

app.post("/api/admin/weights", (req, res) => {
  try {
    const weights = adminAPIService.updateWeights(req.body);
    res.json(weights);
  } catch (error) {
    console.error("Error updating weights:", error);
    res.status(500).json({ error: "Failed to update weights" });
  }
});

app.post("/api/admin/policies/top-guides", (req, res) => {
  try {
    const policy = adminAPIService.updateTopGuidesPolicy(req.body);
    res.json(policy);
  } catch (error) {
    console.error("Error updating top guides policy:", error);
    res.status(500).json({ error: "Failed to update policy" });
  }
});

// Admin API routes for Rank Management
app.get("/api/admin/ranks", (req, res) => {
  try {
    const ranks = adminAPIService.getRanks();
    res.json(ranks);
  } catch (error) {
    console.error("Error getting ranks:", error);
    res.status(500).json({ error: "Failed to get ranks" });
  }
});

app.post("/api/admin/ranks", (req, res) => {
  try {
    const ranks = adminAPIService.updateRanks(req.body);
    res.json(ranks);
  } catch (error) {
    console.error("Error updating ranks:", error);
    res.status(500).json({ error: "Failed to update ranks" });
  }
});

app.delete("/api/admin/ranks/:name", (req, res) => {
  try {
    const result = adminAPIService.deleteRank(req.params.name);
    res.json(result);
  } catch (error) {
    console.error("Error deleting rank:", error);
    res.status(500).json({ error: "Failed to delete rank" });
  }
});

// [REDIRECT] 古い perfect.html へのリクエストを v2 にリダイレクト
app.get("/guide-registration-perfect.html", (req, res) => {
  console.log("[TomoTrip] redirecting from PERFECT to V2");
  return res.redirect(302, "/guide-registration-v2.html");
});

app.get("/guide-registration-perfect-en.html", (req, res) => {
  console.log("[TomoTrip] redirecting from PERFECT-EN to V2");
  return res.redirect(302, "/guide-registration-v2.html");
});

// V2ルート: 完全にキャッシュをバイパスする新しいエンドポイント
app.get("/guide-registration-v2.html", (req, res) => {
  const filePath = path.join(__dirname, "public", "guide-registration-v2.html");
  res.set({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate, private",
    Pragma: "no-cache",
    Expires: "0",
    "Last-Modified": new Date().toUTCString(),
    ETag: Date.now().toString(),
  });
  const content = fs.readFileSync(filePath, "utf8");
  res.send(content);
});

// Serve static files with STRICT NO-CACHE for all files (per Codex analysis)
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: 0, // Disable memory caching
    etag: false, // ✅ Disable ETag caching (per Codex)
    lastModified: false, // ✅ Disable last-modified checks (per Codex)
    setHeaders: (res, filepath) => {
      // STRICT cache control - no-store for all files (per Codex analysis)
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "-1");
      res.setHeader("Vary", "Accept-Encoding");

      console.log(`📦 Serving ${filepath} - Cache: DISABLED (no-store)`);
    },
  }),
);

// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error("❌ Express Error Handler:", err);
  console.error("  - Error message:", err.message);
  console.error("  - Error stack:", err.stack);
  console.error("  - Request path:", req.path);
  console.error("  - Request method:", req.method);

  // Handle multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      error: "FILE_TOO_LARGE",
      message: "ファイルサイズが大きすぎます（最大10MB）",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      error: "UNEXPECTED_FILE",
      message: "ファイルフィールド名が正しくありません",
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    success: false,
    error: "INTERNAL_ERROR",
    message: err.message || "サーバーエラーが発生しました",
  });
});

// Fallback to index.html for SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Explicit server binding for Replit compatibility
app.listen(PORT, HOST, () => {
  console.log(`✅ TomoTrip Integrated Server READY on ${HOST}:${PORT}`);
  console.log(`REPLIT_PORT_READY:${PORT}`);
  console.log(`PORT_${PORT}_OPEN`);
  console.log(`REPLIT_READY`);
  console.log("🎯 TomoTrip Complete System Services:");
  console.log("   • SMS Verification: Twilio integration");
  console.log("   • File Upload: Object storage ready");
  console.log("   • Admin Auth: JWT-based security");
  console.log("   • Guide API: Full registration system");
  console.log("   • Referral Tracking: Guide commission system");
});

// Error handling
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Keep the process alive
process.on("SIGTERM", () => {
  console.log("🔄 Graceful shutdown...");
  process.exit(0);
});
