import { Router } from 'express';
import { getMyAlerts, markAlertAsRead, markAllAlertsAsRead } from '../controllers/alertController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getMyAlerts);
router.patch('/:alertId/read', markAlertAsRead);
router.post('/read-all', markAllAlertsAsRead);

export default router;
