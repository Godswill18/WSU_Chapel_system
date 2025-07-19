import express from 'express';
import { protectRoute, protectAdminRoute } from '../../middleware/protectRoute.js';
import { createAnnouncement, getAllAnnouncements, getAnnouncementById, updateAnnouncement, deleteAnnouncement, getUserAnnouncements, getAllAnnouncementsAdmin, togglePinAnnouncement } from '../../controllers/announcementControllers';
import uploadAnnouncement from '../../config/announceMulter.js'

const router = express.Router();

// Route to create a new anouncement
router.post('/createAnnouncement', protectAdminRoute, uploadAnnouncement.single("image"), createAnnouncement);

// Route to get user specific anouncements
router.get('/getUserAnnouncements', protectRoute, getUserAnnouncements);

// admin to get announcements in dashboard
// router.get('/getUserAnnouncements', protectAdminRoute, getUserAnnouncements);

// Route to get all anouncements
router.get('/getAllAnnouncement', protectRoute, getAllAnnouncements);

router.get('/getAll-admin', protectAdminRoute, getAllAnnouncementsAdmin);

// Route to get an anouncement by ID
router.get('/getAnnouncementById/:id', protectRoute, getAnnouncementById);

router.get('/adminGetById/:id', protectAdminRoute, getAnnouncementById);

// Route to update an anouncement by ID
router.put('/updateAnnouncement/:id', protectAdminRoute, uploadAnnouncement.single("image"),updateAnnouncement);

// Route to delete an anouncement by ID
router.patch('/:id/pin', protectAdminRoute, togglePinAnnouncement);

router.delete('/deleteAnnouncement/:id', protectAdminRoute, deleteAnnouncement);

export default router;