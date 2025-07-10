import express from 'express';
import { getChapelEvents, createChapelEvent, updateChapelEvent, deleteChapelEvent, getEventById } from '../../controllers/Admin_Con/chapelCalendarController.js';
import { protectAdminRoute, protectRoute } from '../../middleware/protectRoute.js';

const router = express.Router();

// Route to get the chapel calendar
router.get('/chapel-calendar', protectAdminRoute, getChapelEvents);

router.get('/chapel-events', protectRoute, getChapelEvents);
// Route to create a new chapel event
router.post('/chapel-calendar', protectAdminRoute, createChapelEvent);

// Route to get a specific chapel event by ID
router.get('/chapel-calendar/:id', protectAdminRoute, getEventById);

// Route to update an existing chapel event
router.put('/chapel-calendar/:id', protectAdminRoute, updateChapelEvent);

// Route to delete a chapel event
router.delete('/chapel-calendar/:id', protectAdminRoute, deleteChapelEvent);

export default router;