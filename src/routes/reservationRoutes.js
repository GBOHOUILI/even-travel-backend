import express from "express";
import {
  getAllReservations,
  getReservationById,
  updateReservationStatus,
  deleteReservation,
  getReservationStats,
} from "../controllers/reservationController.js";
import { protect, restrictTo } from "../controllers/authController.js";

const router = express.Router();

// Protéger toutes les routes
router.use(protect);
router.use(restrictTo("admin"));

router.route("/").get(getAllReservations);

router.route("/stats").get(getReservationStats);

router.route("/:id").get(getReservationById).delete(deleteReservation);

router.route("/:id/status").patch(updateReservationStatus);

export default router;
