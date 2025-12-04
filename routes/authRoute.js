import express from 'express';
import { getRegister, postRegister, getLogin, postLogin, logout } from '../controllers/authController.js';
import { redirectIfAuthenticated } from '../middleware/middleware.js';
const router = express.Router();
router.get('/register', redirectIfAuthenticated, getRegister);
router.post('/register', redirectIfAuthenticated, postRegister);
router.get('/login', redirectIfAuthenticated, getLogin);
router.post('/login', redirectIfAuthenticated, postLogin);
router.post('/logout', logout);
export default router;

