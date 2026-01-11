import express from "express";
import {
  registerAdmin,
  login,
  logout,
  getMe,
} from "../controllers/authController.js";

import { protect } from "../middlewares/protect.js";

const router = express.Router();

// Créer un admin (à protéger plus tard si besoin)
router.post("/register", registerAdmin);

// Login admin
router.post("/login", login);

// Logout admin
router.get("/logout", logout);

// Admin connecté
router.get("/me", protect, getMe);
router.get("/me", protectAdmin, getMe);
router.patch("/update-me", protectAdmin, updateMe);
router.patch("/update-password", protectAdmin, updatePassword);

export default router;
