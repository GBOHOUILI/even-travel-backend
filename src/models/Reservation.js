import express from "express";
import {
  initierPaiementFlutterwave,
  webhookFlutterwave,
  verifierPaiement,
} from "../controllers/paiementController.js";

const router = express.Router();

router.post("/initier", initierPaiementFlutterwave);
router.post("/webhook", webhookFlutterwave);
router.post("/verifier", verifierPaiement);

export default router;
