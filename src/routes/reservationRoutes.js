import express from "express";
import {
  getAllReservations,
  getReservationById,
  updateReservationStatus,
  deleteReservation,
  getReservationStats,
} from "../controllers/reservationController.js";

import { protect } from "../middlewares/protect.js";

const router = express.Router();

// Protéger toutes les routes
router.use(protect);

router.get("/", getAllReservations);
router.get("/stats", getReservationStats);
router.get("/:id", getReservationById);
router.delete("/:id", deleteReservation);
router.patch("/:id/status", updateReservationStatus);

export default router;
