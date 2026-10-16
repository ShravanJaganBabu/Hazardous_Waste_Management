import { Router } from 'express';
import {
  getInvestigations,
  getInvestigationById,
  createInvestigation,
  submitResponse,
  resolveInvestigation,
} from '../controllers/investigationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getInvestigations);
router.get('/:investigationId', getInvestigationById);
router.post('/', authorize(['ADMIN']), createInvestigation);
router.post('/:investigationId/respond', submitResponse);
router.post('/:investigationId/resolve', authorize(['ADMIN']), resolveInvestigation);

export default router;
