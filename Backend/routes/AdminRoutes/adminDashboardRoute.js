import express from 'express';
import { getAdminDashboardStats } from '../../controllers/Admin_Con/dashboardController.js';
import { protectAdminRoute } from '../../middleware/protectRoute.js';
const router = express.Router();

// You can add authentication middleware here if needed
router.get('/dashboard/stats', protectAdminRoute, getAdminDashboardStats);

export default router;
