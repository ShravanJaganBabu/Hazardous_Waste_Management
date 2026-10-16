import { Router } from 'express';
import { login, getMe, getAllUsers, getSecurityStats, unlockUser, logoutAllDevices } from '../controllers/authController.js';
import { authenticate, authorizeRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, getAllUsers);
router.get('/security-stats', authenticate, authorizeRole('ADMIN'), getSecurityStats);
router.post('/unlock/:userId', authenticate, authorizeRole('ADMIN'), unlockUser);
router.post('/logout-all', authenticate, logoutAllDevices);
router.post('/logout-all/:userId', authenticate, authorizeRole('ADMIN'), logoutAllDevices);

export default router;
