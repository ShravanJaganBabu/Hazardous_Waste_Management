import { Router } from 'express';
import { uploadDocumentRecord, getDocuments } from '../controllers/documentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getDocuments);
router.post('/upload', uploadDocumentRecord);

export default router;
