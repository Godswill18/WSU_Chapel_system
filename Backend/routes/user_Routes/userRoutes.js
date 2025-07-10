import express from 'express';
import { protectRoute } from '../../middleware/protectRoute.js';
import upload from '../../config/multer.js';
import { getUserProfile, updateProfile, getAllUsers, getAllUsersInDepartment, uploadProfile, getBirthdays, uploadProfileImg, changePassword } from '../../controllers/userController.js';

const router = express.Router();

router.get("/profile/:id", protectRoute, getUserProfile);

router.post("/uploadProfileImg", protectRoute, upload.single("image"), uploadProfile );

router.get("/getAllUsers", protectRoute, getAllUsers);

router.get("/getBirthdays", protectRoute, getBirthdays);

router.get("/getAllUsersInDepartment/:department", protectRoute, getAllUsersInDepartment);

// Update user profile
router.put('/updateProfile', protectRoute, updateProfile);

// Upload profile image
router.put('/uploadProfileImg', protectRoute, upload.single('image'), uploadProfileImg);

// Change password
router.put('/changePassword', protectRoute, changePassword);

export default router;

