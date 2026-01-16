import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware for parsing JSON
  app.use(express.json());

  // Sponsor Store API endpoints
  app.post("/api/sponsor-stores", async (req, res) => {
    try {
      const storeData = req.body;
      console.log("Creating sponsor store:", storeData);

      // Check if store already exists
      const existingStore = await storage.getSponsorStoreByEmail(
        storeData.email,
      );
      if (existingStore) {
        return res
          .status(409)
          .json({ error: "Store with this email already exists" });
      }

      // Create new store
      const newStore = await storage.createSponsorStore(storeData);
      console.log("Store created with ID:", newStore.id);

      res.status(201).json(newStore);
    } catch (error) {
      console.error("Error creating sponsor store:", error);
      res.status(500).json({ error: "Failed to create store" });
    }
  });

  app.get("/api/sponsor-stores/:id", async (req, res) => {
    try {
      const store = await storage.getSponsorStoreById(req.params.id);
      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }
      res.json(store);
    } catch (error) {
      console.error("Error fetching store:", error);
      res.status(500).json({ error: "Failed to fetch store" });
    }
  });

  app.put("/api/sponsor-stores/:id", async (req, res) => {
    try {
      const updatedStore = await storage.updateSponsorStore(
        req.params.id,
        req.body,
      );
      res.json(updatedStore);
    } catch (error) {
      console.error("Error updating store:", error);
      res.status(500).json({ error: "Failed to update store" });
    }
  });

  app.get("/api/sponsor-stores", async (req, res) => {
    try {
      const stores = await storage.getAllSponsorStores();
      res.json(stores);
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ error: "Failed to fetch stores" });
    }
  });

  // Tourism Guide API endpoints
  app.post("/api/tourism-guides", async (req, res) => {
    try {
      const guideData = req.body;
      console.log("Creating tourism guide:", guideData);

      const newGuide = await storage.createTourismGuide(guideData);
      console.log("Guide created with ID:", newGuide.id);

      res.status(201).json(newGuide);
    } catch (error) {
      console.error("Error creating tourism guide:", error);
      res.status(500).json({ error: "Failed to create guide" });
    }
  });

  app.get("/api/tourism-guides/store/:storeId", async (req, res) => {
    try {
      const guides = await storage.getTourismGuidesByStore(req.params.storeId);
      res.json(guides);
    } catch (error) {
      console.error("Error fetching guides:", error);
      res.status(500).json({ error: "Failed to fetch guides" });
    }
  });

  // Reservation API endpoints
  app.post("/api/reservations", async (req, res) => {
    try {
      const reservationData = req.body;
      console.log("Creating reservation:", reservationData);

      const newReservation = await storage.createReservation(reservationData);
      console.log("Reservation created with ID:", newReservation.id);

      res.status(201).json(newReservation);
    } catch (error) {
      console.error("Error creating reservation:", error);
      res.status(500).json({ error: "Failed to create reservation" });
    }
  });

  app.get("/api/reservations/store/:storeId", async (req, res) => {
    try {
      const reservations = await storage.getReservationsByStore(
        req.params.storeId,
      );
      res.json(reservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      res.status(500).json({ error: "Failed to fetch reservations" });
    }
  });

  app.put("/api/reservations/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const updatedReservation = await storage.updateReservationStatus(
        req.params.id,
        status,
      );
      res.json(updatedReservation);
    } catch (error) {
      console.error("Error updating reservation status:", error);
      res.status(500).json({ error: "Failed to update reservation status" });
    }
  });

  // Static file serving (keep existing routes)
  app.use(express.static("public"));

  // ==============================
  // PreRequest（事前要望）API テスト用
  // ==============================
  app.get("/api/pre-requests/test", (req, res) => {
    res.json({
      success: true,
      message: "preRequest API は動いています",
    });
  });
  const httpServer = createServer(app);
  return httpServer;
}
