import express from 'express';
import { getDashboardStats } from '../controllers/statsController.js';
const router = express.Router();

// You can add authentication middleware here if needed
router.get('/stats', getDashboardStats);

export default router;
