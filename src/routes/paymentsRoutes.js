import express from "express";
import { protect } from "../middlewares/protect.js";
import {
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  deletePayment,
  getPaymentStats,
} from "../controllers/paymentController.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllPayments);
router.get("/stats", getPaymentStats);
router.get("/:id", getPaymentById);
router.delete("/:id", deletePayment);
router.patch("/:id/status", updatePaymentStatus);

export default router;
