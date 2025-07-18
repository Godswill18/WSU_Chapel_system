import express from 'express';
import { protectRoute } from '../../middleware/protectRoute.js';
import { getNotifications, deleteNotifications, deleteOneNotification, markAsRead } from '../../controllers/notificationsController.js';

const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.put('/mark-read', protectRoute, markAsRead)
router.delete("/", protectRoute, deleteNotifications);
router.delete("/:id", protectRoute, deleteOneNotification);

export default router;