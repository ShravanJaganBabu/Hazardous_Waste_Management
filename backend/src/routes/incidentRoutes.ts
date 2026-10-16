import { Router } from 'express';
import { reportIncident, getIncidents, updateIncidentStatus } from '../controllers/incidentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getIncidents);
router.post('/report', reportIncident);
router.patch('/:incidentId/status', authorize(['ADMIN', 'TRANSPORTER']), updateIncidentStatus);

export default router;
