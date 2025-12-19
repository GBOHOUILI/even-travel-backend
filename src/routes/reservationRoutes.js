import express from "express";
import {
  initierPaiement,
  webhookKkiaPay,
} from "../controllers/reservationController.js";

const router = express.Router();

router.post("/initier", initierPaiement);
router.post("/webhook/kkiapay", webhookKkiaPay);

export default router;
