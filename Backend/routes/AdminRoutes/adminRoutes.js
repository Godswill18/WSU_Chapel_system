import express from 'express';
import { getMe, signUp, login, logout, getAllAdmins, changePassword,toggleAdminStatus, toggleUserStatus, getAllUsers } from '../../controllers/Admin_Con/adminControllers.js';
import { protectAdminRoute } from '../../middleware/protectRoute.js';
// import { sign } from 'crypto';

const router = express.Router();

router.get("/me", protectAdminRoute, getMe);

router.post('/signup', signUp);

router.post('/login', login);

router.post('/logout', logout);

router.get("/getAllAdmin", protectAdminRoute, getAllAdmins);

router.get("/getAllUser", protectAdminRoute, getAllUsers);

router.put("/:id/toggle-status-admins", protectAdminRoute, toggleAdminStatus);

router.put("/:id/toggle-status-users", protectAdminRoute, toggleUserStatus);

router.put('/changePassword', protectAdminRoute, changePassword);

export default router;
