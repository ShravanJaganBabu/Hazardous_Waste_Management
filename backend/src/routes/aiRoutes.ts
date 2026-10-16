import { Router } from 'express';
import { handleAiQuery } from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/query', authenticate, handleAiQuery);

export default router;
