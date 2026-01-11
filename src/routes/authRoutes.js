// routes/adminAuthRoutes.js
import express from "express";
import {
  registerAdmin,
  login,
  logout,
  getMe,
} from "../controllers/adminAuthController.js";

import { protectAdmin } from "../middlewares/adminAuthMiddleware.js";

const router = express.Router();

/**
 * AUTH ADMIN
 */

// Créer un admin (à protéger plus tard si besoin)
router.post("/register", registerAdmin);

// Login admin
router.post("/login", login);

// Logout admin
router.get("/logout", logout);

// Admin connecté
router.get("/me", protectAdmin, getMe);

export default router;
