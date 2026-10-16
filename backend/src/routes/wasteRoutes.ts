import { Router } from 'express';
import { registerWaste, getWasteList, getWasteById, requestCollection } from '../controllers/wasteController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getWasteList);
router.get('/:wasteId', getWasteById);
router.post('/register', authorize(['ADMIN', 'LABORATORY', 'INDUSTRY']), registerWaste);
router.post('/:wasteId/request-collection', authorize(['ADMIN', 'LABORATORY', 'INDUSTRY']), requestCollection);

export default router;
