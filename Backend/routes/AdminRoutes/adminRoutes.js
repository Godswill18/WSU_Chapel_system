import express from 'express';
import { getMe, signUp, login, logout } from '../../controllers/Admin_Con/adminControllers.js';
import { protectAdminRoute } from '../../middleware/protectRoute.js';
// import { sign } from 'crypto';

const router = express.Router();

router.get("/me", protectAdminRoute, getMe);

router.post('/signup', signUp);

router.post('/login', login);

router.post('/logout', logout);

export default router;
