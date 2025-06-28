import express from 'express';
import { protectRoute } from '../../middleware/protectRoute.js';
import { createAnnouncement, getAllAnnouncements, getAnnouncementById, updateAnnouncement, deleteAnnouncement, getUserAnnouncements } from '../../controllers/announcementControllers.js';
import uploadAnnouncement from '../../config/announceMulter.js'

const router = express.Router();

// Route to create a new anouncement
router.post('/createAnnouncement', protectRoute, uploadAnnouncement.single("image"), createAnnouncement);

// Route to get user specific anouncements
router.get('/getUserAnnouncements', protectRoute, getUserAnnouncements);

// Route to get all anouncements
router.get('/getAllAnnouncement', protectRoute, getAllAnnouncements);

// Route to get an anouncement by ID
router.get('/getAnnouncementById/:id', protectRoute, getAnnouncementById);

// Route to update an anouncement by ID
router.put('/updateAnnouncement/:id', protectRoute, uploadAnnouncement.single("image"),updateAnnouncement);

// Route to delete an anouncement by ID
router.delete('/deleteAnnouncement/:id', protectRoute, deleteAnnouncement);

export default router;