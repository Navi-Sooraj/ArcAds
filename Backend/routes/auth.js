/**
 * Auth routes: login, signup, get current user.
 * No JWT; client sends userId in header or body where needed.
 */
import express from 'express';
import { login, signup, getMe, updateProfile, changePassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);

export default router;
