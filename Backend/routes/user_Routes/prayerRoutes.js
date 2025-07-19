import express from 'express';
import { protectAdminRoute, protectRoute } from '../../middleware/protectRoute.js';
import {submitPrayerRequest, getAllPrayerRequests, approvePrayerRequest, getPublicPrayerRequests, prayFor, getPrayerCount, rejectPrayerRequest} from '../../controllers/prayerController.js';

const router = express.Router();

// users submit prayer requests
router.post("/submitPrayerRequest", protectRoute, submitPrayerRequest);

// admin to get all prayer request
router.get("/all-request", protectAdminRoute, getAllPrayerRequests);

// admin to approve prayer request 
router.put("/approve/:id", protectAdminRoute, approvePrayerRequest);


router.delete("/reject/:id", protectAdminRoute, rejectPrayerRequest);

// users to view prayer requests 
router.get("/public-view", protectRoute, getPublicPrayerRequests);

// router.post('/:id/pray', protectRoute, prayForRequest); // New pray for request route

router.post('/:id/pray', protectRoute, prayFor);
router.get('/:id/prayers', getPrayerCount);


export default router;