import { Router } from 'express';
import {
  getShipments,
  getShipmentById,
  lookupIdentifier,
  acceptPickup,
  confirmCollectionAndStartTransit,
  confirmReceipt,
  recordTreatment,
  recordDisposal,
} from '../controllers/shipmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getShipments);
router.get('/lookup/:identifier', lookupIdentifier);
router.get('/:shipmentId', getShipmentById);

// Transporter actions
router.post('/:shipmentId/accept-pickup', authorize(['ADMIN', 'TRANSPORTER']), acceptPickup);
router.post('/:shipmentId/confirm-collection', authorize(['ADMIN', 'TRANSPORTER']), confirmCollectionAndStartTransit);

// Treatment facility actions
router.post('/:shipmentId/confirm-receipt', authorize(['ADMIN', 'TREATMENT_FACILITY']), confirmReceipt);
router.post('/:shipmentId/record-treatment', authorize(['ADMIN', 'TREATMENT_FACILITY']), recordTreatment);
router.post('/:shipmentId/record-disposal', authorize(['ADMIN', 'TREATMENT_FACILITY']), recordDisposal);

export default router;
