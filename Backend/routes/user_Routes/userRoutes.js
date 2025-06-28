import express from 'express';
import { protectRoute } from '../../middleware/protectRoute.js';
import upload from '../../config/multer.js';
import { getUserProfile, updatePeofile, getAllUsers, getAllUsersInDepartment, uploadProfile } from '../../controllers/userController.js';

const router = express.Router();

router.get("/profile/:id", protectRoute, getUserProfile);

router.post("/uploadProfileImg", protectRoute, upload.single("image"), uploadProfile );

router.get("/getAllUsers", protectRoute, getAllUsers);

router.get("/getAllUsersInDepartment/:department", protectRoute, getAllUsersInDepartment);

router.put("/updateProfile", protectRoute, updatePeofile);

export default router;

