import { Router } from 'express';
import { getDashboardStats } from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);

export default router;
