import express from 'express';
import {
  registerAdmin,
  login,
  logout,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middlewares/protect.js';

const router = express.Router();

router.post('/register', registerAdmin);  // Premier admin seulement
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;