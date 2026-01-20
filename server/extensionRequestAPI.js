const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const EXTENSION_RATE_PER_HOUR = 3000;

class ExtensionRequestAPIService {
  constructor() {
    this.extensionRequestsFilePath = path.join(
      __dirname,
      "../data/extension-requests.json"
    );
    this.reservationsFilePath = path.join(
      __dirname,
      "../data/reservations.json"
    );
    this.guidesFilePath = path.join(__dirname, "../data/guides.json");
    this.ensureExtensionRequestsFile();
  }

  ensureExtensionRequestsFile() {
    const dir = path.dirname(this.extensionRequestsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.extensionRequestsFilePath)) {
      fs.writeFileSync(this.extensionRequestsFilePath, JSON.stringify([], null, 2));
    }
  }

  loadExtensionRequests() {
    try {
      const data = fs.readFileSync(this.extensionRequestsFilePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading extension requests:", error);
      return [];
    }
  }

  saveExtensionRequests(requests) {
    try {
      fs.writeFileSync(
        this.extensionRequestsFilePath,
        JSON.stringify(requests, null, 2)
      );
    } catch (error) {
      console.error("Error saving extension requests:", error);
    }
  }

  loadReservations() {
    try {
      const data = fs.readFileSync(this.reservationsFilePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading reservations:", error);
      return [];
    }
  }

  loadGuides() {
    try {
      const data = fs.readFileSync(this.guidesFilePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading guides:", error);
      return [];
    }
  }

  calculatePrice(minutes) {
    return Math.round((minutes / 60) * EXTENSION_RATE_PER_HOUR);
  }

  setupRoutes(app) {
    app.post("/api/extension-requests", this.createExtensionRequest.bind(this));
    app.get("/api/extension-requests/guide/:guideId", this.getExtensionRequestsByGuide.bind(this));
    app.get("/api/extension-requests/reservation/:reservationId", this.getExtensionRequestsByReservation.bind(this));
    app.put("/api/extension-requests/:id/status", this.updateExtensionRequestStatus.bind(this));
    app.get("/api/extension-requests/:id", this.getExtensionRequest.bind(this));
    app.get("/api/extension-pricing", this.getExtensionPricing.bind(this));
    console.log("✅ Extension Request API routes initialized");
  }

  async createExtensionRequest(req, res) {
    try {
      const {
        reservationId,
        requestedMinutes,
        requestedBy,
        touristName
      } = req.body;

      if (!reservationId || !requestedMinutes) {
        return res.status(400).json({
          success: false,
          error: "MISSING_REQUIRED_FIELDS",
          message: "予約IDと延長時間は必須です"
        });
      }

      const validMinutes = [30, 60, 120];
      if (!validMinutes.includes(parseInt(requestedMinutes))) {
        return res.status(400).json({
          success: false,
          error: "INVALID_MINUTES",
          message: "延長時間は30分、60分、120分のいずれかを選択してください"
        });
      }

      const reservations = this.loadReservations();
      const reservation = reservations.find(r => r.id === reservationId);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: "RESERVATION_NOT_FOUND",
          message: "予約が見つかりません"
        });
      }

      const extensionId = randomUUID();
      const now = new Date().toISOString();
      const price = this.calculatePrice(parseInt(requestedMinutes));

      const extensionRequest = {
        id: extensionId,
        reservationId,
        guideId: reservation.guideId || null,
        requestedMinutes: parseInt(requestedMinutes),
        price,
        status: "pending",
        requestedAt: now,
        requestedBy: requestedBy || null,
        touristName: touristName || reservation.customerName || "観光客",
        respondedAt: null,
        respondedBy: null
      };

      const extensionRequests = this.loadExtensionRequests();
      extensionRequests.push(extensionRequest);
      this.saveExtensionRequests(extensionRequests);

      console.log(`📩 Extension request created: ${extensionId} for ${requestedMinutes} minutes (¥${price})`);

      return res.status(201).json({
        success: true,
        message: "延長リクエストを送信しました",
        extensionRequest
      });
    } catch (error) {
      console.error("Create extension request error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "延長リクエストの作成に失敗しました"
      });
    }
  }

  async getExtensionRequestsByGuide(req, res) {
    try {
      const { guideId } = req.params;
      const { status } = req.query;

      const extensionRequests = this.loadExtensionRequests();
      let guideRequests = extensionRequests.filter(r => r.guideId === guideId);

      if (status) {
        guideRequests = guideRequests.filter(r => r.status === status);
      }

      guideRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

      return res.json({
        success: true,
        extensionRequests: guideRequests,
        total: guideRequests.length,
        pending: guideRequests.filter(r => r.status === "pending").length
      });
    } catch (error) {
      console.error("Get extension requests by guide error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "延長リクエストの取得に失敗しました"
      });
    }
  }

  async getExtensionRequestsByReservation(req, res) {
    try {
      const { reservationId } = req.params;

      const extensionRequests = this.loadExtensionRequests();
      const reservationRequests = extensionRequests.filter(r => r.reservationId === reservationId);

      reservationRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

      return res.json({
        success: true,
        extensionRequests: reservationRequests
      });
    } catch (error) {
      console.error("Get extension requests by reservation error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "延長リクエストの取得に失敗しました"
      });
    }
  }

  async getExtensionRequest(req, res) {
    try {
      const { id } = req.params;

      const extensionRequests = this.loadExtensionRequests();
      const request = extensionRequests.find(r => r.id === id);

      if (!request) {
        return res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "延長リクエストが見つかりません"
        });
      }

      return res.json({
        success: true,
        extensionRequest: request
      });
    } catch (error) {
      console.error("Get extension request error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "延長リクエストの取得に失敗しました"
      });
    }
  }

  async updateExtensionRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, respondedBy } = req.body;

      const validStatuses = ["approved", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_STATUS",
          message: "ステータスはapprovedまたはrejectedを指定してください"
        });
      }

      const extensionRequests = this.loadExtensionRequests();
      const requestIndex = extensionRequests.findIndex(r => r.id === id);

      if (requestIndex === -1) {
        return res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "延長リクエストが見つかりません"
        });
      }

      const request = extensionRequests[requestIndex];

      if (request.status !== "pending") {
        return res.status(400).json({
          success: false,
          error: "ALREADY_PROCESSED",
          message: "このリクエストは既に処理済みです"
        });
      }

      extensionRequests[requestIndex] = {
        ...request,
        status,
        respondedAt: new Date().toISOString(),
        respondedBy: respondedBy || null
      };

      this.saveExtensionRequests(extensionRequests);

      const statusText = status === "approved" ? "承認" : "拒否";
      console.log(`📋 Extension request ${id} ${statusText}されました`);

      return res.json({
        success: true,
        message: `延長リクエストを${statusText}しました`,
        extensionRequest: extensionRequests[requestIndex]
      });
    } catch (error) {
      console.error("Update extension request status error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "延長リクエストのステータス更新に失敗しました"
      });
    }
  }

  async getExtensionPricing(req, res) {
    try {
      const pricing = {
        ratePerHour: EXTENSION_RATE_PER_HOUR,
        options: [
          { minutes: 30, price: this.calculatePrice(30), label: "30分" },
          { minutes: 60, price: this.calculatePrice(60), label: "60分" },
          { minutes: 120, price: this.calculatePrice(120), label: "120分" }
        ]
      };

      return res.json({
        success: true,
        pricing
      });
    } catch (error) {
      console.error("Get extension pricing error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "料金情報の取得に失敗しました"
      });
    }
  }
}

const extensionRequestAPIService = new ExtensionRequestAPIService();

module.exports = { extensionRequestAPIService };
