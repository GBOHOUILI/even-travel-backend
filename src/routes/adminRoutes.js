import express from "express";
import { protect } from "../middlewares/protect.js";
import {
  getDashboardStats,
  getAllReservationsAdmin,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protect); // Tout protégé

router.get("/stats", getDashboardStats);
router.get("/reservations", getAllReservationsAdmin);

export default router;
