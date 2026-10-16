import { Router } from 'express';
import { synthesizeVoice } from '../controllers/voiceController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/synthesize', synthesizeVoice);

export default router;
