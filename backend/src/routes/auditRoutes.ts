import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

// Audit logs are accessible strictly by ADMIN
router.get('/', authorize(['ADMIN']), getAuditLogs);

export default router;
