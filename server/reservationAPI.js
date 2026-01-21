// Reservation API - 店舗予約管理システム
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { emailService } = require("./emailService");
const { supabase } = require("./supabaseClient");

class ReservationAPIService {
  constructor() {
    this.reservationsFilePath = path.join(
      __dirname,
      "../data/reservations.json",
    );
    this.storesFilePath = path.join(__dirname, "../data/sponsor-stores.json");

    this.ensureReservationsFile();
  }

  getStoreById(storeId) {
    try {
      const data = fs.readFileSync(this.storesFilePath, "utf8");
      const stores = JSON.parse(data);
      return stores.find((store) => store.id === storeId);
    } catch (error) {
      console.error("Error loading store:", error);
      return null;
    }
  }

  ensureReservationsFile() {
    if (!fs.existsSync(this.reservationsFilePath)) {
      fs.writeFileSync(this.reservationsFilePath, JSON.stringify([], null, 2));
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

  saveReservations(reservations) {
    try {
      fs.writeFileSync(
        this.reservationsFilePath,
        JSON.stringify(reservations, null, 2),
      );
    } catch (error) {
      console.error("Error saving reservations:", error);
    }
  }

  setupRoutes(app) {
    app.post("/api/reservations", this.createReservation.bind(this));
    app.get(
      "/api/reservations/store/:storeId",
      this.getReservationsByStore.bind(this),
    );
    app.get("/api/reservations/:id", this.getReservation.bind(this));
    app.put("/api/reservations/:id", this.updateReservation.bind(this));
    app.delete("/api/reservations/:id", this.deleteReservation.bind(this));
    app.put(
      "/api/reservations/:id/status",
      this.updateReservationStatus.bind(this),
    );
    console.log("✅ Reservation API routes initialized");
  }

  async createReservation(req, res) {
    try {
      const {
        storeId,
        guideId,
        guideName,
        customerName,
        customerEmail,
        customerPhone,
        numberOfGuests,
        reservationDate,
        reservationTime,
        notes,
      } = req.body;

      // Accept either storeId (for sponsor stores) or guideId (for guide bookings)
      const targetId = storeId || guideId;
      if (!targetId || !customerName || !reservationDate || !reservationTime) {
        return res.status(400).json({
          success: false,
          error: "MISSING_REQUIRED_FIELDS",
          message: "必須項目が入力されていません",
        });
      }
      
      // ✅ Step1-B: email と phone の必須チェック
      const emailTrimmed = (customerEmail || "").trim();
      const phoneTrimmed = (customerPhone || "").trim();
      
      if (!emailTrimmed || !phoneTrimmed) {
        return res.status(400).json({
          success: false,
          error: "CONTACT_INFO_REQUIRED",
          message: "メールアドレスと電話番号は必須です",
        });
      }
      
      // email形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_EMAIL",
          message: "正しいメールアドレス形式で入力してください",
        });
      }
      
      // phone形式チェック（10桁以上の数字）
      const phoneClean = phoneTrimmed.replace(/[\s\-\(\)]/g, "");
      if (!/^[0-9]{10,15}$/.test(phoneClean)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_PHONE",
          message: "電話番号は10桁以上の数字で入力してください",
        });
      }

      const reservationId = randomUUID();
      const now = new Date().toISOString();

      const reservation = {
        id: reservationId,
        storeId: storeId || null,
        guideId: guideId || null,
        guideName: guideName || null,
        customerName,
        customerEmail: emailTrimmed,
        customerPhone: phoneTrimmed,
        numberOfGuests: parseInt(numberOfGuests) || 1,
        reservationDate,
        reservationTime,
        status: "pending",
        notes: notes || "",
        createdAt: now,
        updatedAt: now,
      };

      const reservations = this.loadReservations();
      reservations.push(reservation);
      // ★ ここで予約データを保存している（あとでSupabaseに置き換える）

      this.saveReservations(reservations);

      // Send email notifications (async, don't block response)
      this.sendReservationEmails(reservation, storeId);

      return res.status(201).json({
        success: true,
        message: "予約が作成されました",
        reservation,
        reservationId: reservationId,
      });
    } catch (error) {
      console.error("Create reservation error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "予約の作成に失敗しました",
      });
    }
  }

  async sendReservationEmails(reservation, storeId) {
    try {
      // ✅ ガイド予約の場合
      if (reservation.guideId && !storeId) {
        console.log("📧 Sending guide reservation confirmation email...");
        const guideResult = await emailService.sendGuideReservationConfirmation(reservation);
        console.log("Guide reservation email result:", guideResult);
        return;
      }
      
      // 店舗予約の場合
      const store = this.getStoreById(storeId);
      if (!store) {
        console.error("Store not found for email notification:", storeId);
        return;
      }

      // Send email to customer
      const customerResult =
        await emailService.sendReservationConfirmationToCustomer(
          reservation,
          store,
        );
      console.log("Customer email result:", customerResult);

      // Send email to store
      const storeResult = await emailService.sendReservationNotificationToStore(
        reservation,
        store,
      );
      console.log("Store email result:", storeResult);
    } catch (error) {
      console.error("Error sending reservation emails:", error);
    }
  }

  async getReservationsByStore(req, res) {
    try {
      const { storeId } = req.params;
      const { status, startDate, endDate } = req.query;

      let allReservations = this.loadReservations();
      let storeReservations = allReservations.filter(
        (r) => r.storeId === storeId,
      );

      const stats = {
        total: storeReservations.length,
        pending: storeReservations.filter((r) => r.status === "pending").length,
        confirmed: storeReservations.filter((r) => r.status === "confirmed")
          .length,
        completed: storeReservations.filter((r) => r.status === "completed")
          .length,
        cancelled: storeReservations.filter((r) => r.status === "cancelled")
          .length,
      };

      let filteredReservations = [...storeReservations];

      if (status) {
        filteredReservations = filteredReservations.filter(
          (r) => r.status === status,
        );
      }

      if (startDate) {
        filteredReservations = filteredReservations.filter(
          (r) => r.reservationDate >= startDate,
        );
      }

      if (endDate) {
        filteredReservations = filteredReservations.filter(
          (r) => r.reservationDate <= endDate,
        );
      }

      filteredReservations.sort((a, b) => {
        const dateA = new Date(`${a.reservationDate}T${a.reservationTime}`);
        const dateB = new Date(`${b.reservationDate}T${b.reservationTime}`);
        return dateB - dateA;
      });

      return res.json({
        success: true,
        reservations: filteredReservations,
        stats,
      });
    } catch (error) {
      console.error("Get reservations error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "予約の取得に失敗しました",
      });
    }
  }

  async getReservation(req, res) {
    try {
      const { id } = req.params;
      const reservations = this.loadReservations();
      const reservation = reservations.find((r) => r.id === id);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "予約が見つかりません",
        });
      }

      return res.json({
        success: true,
        reservation,
      });
    } catch (error) {
      console.error("Get reservation error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "予約の取得に失敗しました",
      });
    }
  }

  async updateReservation(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const reservations = this.loadReservations();
      const index = reservations.findIndex((r) => r.id === id);

      if (index === -1) {
        return res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "予約が見つかりません",
        });
      }

      const updatedReservation = {
        ...reservations[index],
        ...updates,
        id: reservations[index].id,
        storeId: reservations[index].storeId,
        createdAt: reservations[index].createdAt,
        updatedAt: new Date().toISOString(),
      };

      reservations[index] = updatedReservation;
      this.saveReservations(reservations);

      return res.json({
        success: true,
        message: "予約が更新されました",
        reservation: updatedReservation,
      });
    } catch (error) {
      console.error("Update reservation error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "予約の更新に失敗しました",
      });
    }
  }

  async deleteReservation(req, res) {
    try {
      const { id } = req.params;

      const reservations = this.loadReservations();
      const index = reservations.findIndex((r) => r.id === id);

      if (index === -1) {
        return res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "予約が見つかりません",
        });
      }

      reservations.splice(index, 1);
      this.saveReservations(reservations);

      return res.json({
        success: true,
        message: "予約が削除されました",
      });
    } catch (error) {
      console.error("Delete reservation error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "予約の削除に失敗しました",
      });
    }
  }

  async updateReservationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_STATUS",
          message: "無効なステータスです",
        });
      }

      const reservations = this.loadReservations();
      const index = reservations.findIndex((r) => r.id === id);

      if (index === -1) {
        return res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "予約が見つかりません",
        });
      }

      reservations[index].status = status;
      reservations[index].updatedAt = new Date().toISOString();
      this.saveReservations(reservations);

      return res.json({
        success: true,
        message: "ステータスが更新されました",
        reservation: reservations[index],
      });
    } catch (error) {
      console.error("Update status error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "ステータスの更新に失敗しました",
      });
    }
  }
}

const reservationAPIService = new ReservationAPIService();

module.exports = { reservationAPIService, ReservationAPIService };
