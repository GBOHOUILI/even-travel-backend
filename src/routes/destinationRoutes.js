import express from 'express';
import {
  createDestination,
  getAllDestinations,
  getDestination,
  updateDestination,
  deleteDestination,
} from '../controllers/destinationController.js';
import { protect } from '../middlewares/protect.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Routes publiques
router.get('/', getAllDestinations);
router.get('/:id', getDestination);

// Routes admin seulement
router.use(protect);

router.post('/', upload.array('images', 6), createDestination);
router
  .route('/:id')
  .patch(upload.array('images', 6), updateDestination)
  .delete(deleteDestination);

export default router;