import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Shipment, IShipment } from '../models/Shipment.js';
import { Waste } from '../models/Waste.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { MonitoringEngine } from '../services/monitoringEngine.js';

export const getShipments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { page = 1, limit = 20, status, search } = req.query;

    const query: any = {};

    // Role-based visibility
    if (user.role === 'TRANSPORTER') {
      query['transporter.id'] = user.userId;
    } else if (user.role === 'TREATMENT_FACILITY') {
      query['destinationFacility.id'] = user.userId;
    } else if (user.role === 'LABORATORY' || user.role === 'INDUSTRY') {
      query['originOrganization.id'] = user.userId;
    }

    if (status) query.status = status;

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { shipmentId: searchRegex },
        { wasteId: searchRegex },
        { manifestNumber: searchRegex },
        { 'originOrganization.name': searchRegex },
        { 'transporter.company': searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Shipment.countDocuments(query);
    const shipments = await Shipment.find(query).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      shipments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve shipments.' });
  }
};

export const lookupIdentifier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let rawId = String(req.params.identifier || '').trim();
    if (!rawId) {
      res.status(400).json({ success: false, message: 'Please provide a valid identifier to scan.' });
      return;
    }

    // Normalization: Extract identifier if JSON QR payload or URL was scanned
    if (rawId.startsWith('{') && rawId.endsWith('}')) {
      try {
        const parsed = JSON.parse(rawId);
        rawId = parsed.shipmentId || parsed.wasteId || parsed.manifestNumber || rawId;
      } catch {}
    }
    if (rawId.startsWith('http://') || rawId.startsWith('https://')) {
      const parts = rawId.split('/');
      rawId = parts[parts.length - 1] || rawId;
    }
    rawId = rawId.split('?')[0].split('#')[0].trim();

    const user = req.user!;

    // Query across shipmentId, wasteId, or manifestNumber
    let shipment = await Shipment.findOne({
      $or: [
        { shipmentId: rawId },
        { wasteId: rawId },
        { manifestNumber: rawId },
      ],
    });

    let waste = null;
    if (shipment) {
      waste = await Waste.findOne({ wasteId: shipment.wasteId });
    } else {
      waste = await Waste.findOne({
        $or: [
          { wasteId: rawId },
          { manifestNumber: rawId },
          { activeShipmentId: rawId },
        ],
      });

      if (waste && waste.activeShipmentId) {
        shipment = await Shipment.findOne({ shipmentId: waste.activeShipmentId });
      }
    }

    if (!shipment && !waste) {
      res.status(404).json({
        success: false,
        message: `No hazardous waste manifest or shipment found for identifier "${rawId}".`,
      });
      return;
    }

    // Role-based permission evaluation for operational actions
    const allowedActions: string[] = ['VIEW'];
    const isAdmin = user.role === 'ADMIN';
    const isTransporter = user.role === 'TRANSPORTER';
    const isFacility = user.role === 'TREATMENT_FACILITY';

    if (isAdmin) {
      allowedActions.push('RECEIVE', 'TREAT', 'DISPOSE', 'PICKUP', 'COLLECT', 'INVESTIGATE', 'EDIT');
    } else if (isFacility) {
      const isAssigned = !shipment || shipment.destinationFacility.id === user.userId;
      if (isAssigned) {
        if (shipment?.status === 'IN_TRANSIT') {
          allowedActions.push('RECEIVE');
        } else if (shipment?.status === 'RECEIVED') {
          allowedActions.push('TREAT');
        } else if (shipment?.status === 'TREATED') {
          allowedActions.push('DISPOSE');
        }
      }
    } else if (isTransporter) {
      const isAssigned = !shipment || shipment.transporter.id === user.userId;
      if (isAssigned) {
        if (shipment?.status === 'COLLECTION_REQUESTED') {
          allowedActions.push('PICKUP');
        } else if (shipment?.status === 'COLLECTED') {
          allowedActions.push('COLLECT');
        }
      }
    }

    res.json({
      success: true,
      type: shipment ? 'SHIPMENT' : 'WASTE',
      identifier: rawId,
      shipment,
      waste,
      allowedActions,
    });
  } catch (error: any) {
    console.error('[LOOKUP IDENTIFIER ERROR]', error);
    res.status(500).json({ success: false, message: 'Server error during identifier lookup.' });
  }
};

export const getShipmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shipmentId = String(req.params.shipmentId).trim();
    const shipment = await Shipment.findOne({
      $or: [
        { shipmentId },
        { wasteId: shipmentId },
        { manifestNumber: shipmentId },
      ],
    });

    if (!shipment) {
      res.status(404).json({ success: false, message: 'Shipment record not found.' });
      return;
    }

    const waste = await Waste.findOne({ wasteId: shipment.wasteId });

    res.json({
      success: true,
      shipment,
      waste,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error retrieving shipment details.' });
  }
};

/**
 * 1. Transporter accepts pickup request
 */
export const acceptPickup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const shipmentId = String(req.params.shipmentId);
    const { driverName, driverPhone, vehicleNumber, vehicleType } = req.body;

    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      res.status(404).json({ success: false, message: 'Shipment not found.' });
      return;
    }

    if (user.role !== 'ADMIN' && shipment.transporter.id !== user.userId) {
      res.status(403).json({ success: false, message: 'You are not assigned to transport this shipment.' });
      return;
    }

    if (shipment.status !== 'COLLECTION_REQUESTED') {
      res.status(400).json({
        success: false,
        message: `Cannot accept pickup in ${shipment.status} status. Must be COLLECTION_REQUESTED.`,
      });
      return;
    }

    if (driverName) shipment.transporter.driverName = driverName;
    if (driverPhone) shipment.transporter.driverPhone = driverPhone;
    if (vehicleNumber) shipment.transporter.vehicleNumber = vehicleNumber;
    if (vehicleType) shipment.transporter.vehicleType = vehicleType;

    await shipment.save();

    await logAudit({
      actorUserId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      action: 'PICKUP_ACCEPTED',
      entityType: 'SHIPMENT',
      entityId: shipmentId,
      description: `Transporter ${user.name} accepted pickup for ${shipmentId} with vehicle ${shipment.transporter.vehicleNumber}.`,
    });

    res.json({
      success: true,
      message: 'Pickup accepted. Vehicle and driver details locked in chain.',
      shipment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error accepting pickup.' });
  }
};

/**
 * 2. Transporter confirms collection on-site (verifies collected quantity) and starts transit
 */
export const confirmCollectionAndStartTransit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const shipmentId = String(req.params.shipmentId);
    const { collectedQuantity, notes } = req.body;

    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      res.status(404).json({ success: false, message: 'Shipment not found.' });
      return;
    }

    if (user.role !== 'ADMIN' && shipment.transporter.id !== user.userId) {
      res.status(403).json({ success: false, message: 'Unauthorized. Not assigned transporter.' });
      return;
    }

    if (shipment.status !== 'COLLECTION_REQUESTED') {
      res.status(400).json({
        success: false,
        message: `Illegal transition. Cannot confirm collection from status ${shipment.status}.`,
      });
      return;
    }

    if (collectedQuantity !== undefined && (isNaN(Number(collectedQuantity)) || Number(collectedQuantity) < 0)) {
      res.status(400).json({
        success: false,
        message: 'Collected quantity cannot be negative or invalid numeric measurement.',
      });
      return;
    }

    const verifiedQty = collectedQuantity !== undefined ? Number(collectedQuantity) : shipment.declaredQuantity;

    shipment.collectedQuantity = verifiedQty;
    shipment.collectionTime = new Date();
    shipment.transitStartTime = new Date();
    shipment.status = 'IN_TRANSIT';
    if (notes) shipment.notes = notes;

    await shipment.save();

    // Update waste status
    await Waste.updateOne({ wasteId: shipment.wasteId }, { currentStatus: 'IN_TRANSIT' });

    // Evaluate quantity discrepancy right at collection
    await MonitoringEngine.evaluateQuantityMismatch(shipment, {
      userId: user.userId,
      name: user.name,
      role: user.role,
    });

    await logAudit({
      actorUserId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      action: 'COLLECTION_CONFIRMED_TRANSIT_STARTED',
      entityType: 'SHIPMENT',
      entityId: shipmentId,
      oldValue: { status: 'COLLECTION_REQUESTED' },
      newValue: { status: 'IN_TRANSIT', collectedQuantity: verifiedQty },
      description: `Transporter ${user.name} verified ${verifiedQty} ${shipment.unit} collected and commenced secure GPS transit.`,
    });

    // Notify Destination Facility
    await createNotification({
      recipientUserId: shipment.destinationFacility.id,
      recipientRole: 'TREATMENT_FACILITY',
      shipmentId,
      wasteId: shipment.wasteId,
      type: 'SYSTEM_NOTICE',
      severity: 'INFO',
      title: `Shipment In Transit: ${shipmentId}`,
      message: `${shipment.transporter.company} is en route with ${verifiedQty} ${shipment.unit} to your facility.`,
      actionUrl: `/facility/shipments`,
    });

    res.json({
      success: true,
      message: 'Collection verified and shipment is now IN_TRANSIT.',
      shipment,
    });
  } catch (error: any) {
    console.error('[CONFIRM COLLECTION ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to record collection.' });
  }
};

/**
 * 3. Treatment Facility confirms receipt & verifies received quantity (triggers mass balance check)
 */
export const confirmReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const shipmentId = String(req.params.shipmentId);
    const { receivedQuantity, notes } = req.body;

    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      res.status(404).json({ success: false, message: 'Shipment not found.' });
      return;
    }

    if (user.role !== 'ADMIN' && shipment.destinationFacility.id !== user.userId) {
      res.status(403).json({ success: false, message: 'Unauthorized. Not assigned treatment facility.' });
      return;
    }

    if (shipment.status !== 'IN_TRANSIT') {
      res.status(400).json({
        success: false,
        message: `Illegal transition. Cannot receive shipment currently in ${shipment.status} status.`,
      });
      return;
    }

    if (
      receivedQuantity === undefined ||
      receivedQuantity === null ||
      receivedQuantity === '' ||
      isNaN(Number(receivedQuantity))
    ) {
      res.status(400).json({
        success: false,
        message: 'Received quantity is mandatory for facility intake verification and cannot be omitted.',
      });
      return;
    }

    const verifiedReceivedQty = Number(receivedQuantity);

    if (verifiedReceivedQty < 0) {
      res.status(400).json({
        success: false,
        message: 'Received quantity cannot be negative. Please enter a valid non-negative measurement.',
      });
      return;
    }

    shipment.receivedQuantity = verifiedReceivedQty;
    shipment.receivedTime = new Date();
    shipment.actualDeliveryTime = new Date();
    shipment.status = 'RECEIVED';
    if (notes) shipment.notes = notes;

    await shipment.save();

    // Update waste status
    await Waste.updateOne({ wasteId: shipment.wasteId }, { currentStatus: 'RECEIVED' });

    // Run Full Mass Balance Verification & Discrepancy Engine
    await MonitoringEngine.evaluateQuantityMismatch(shipment, {
      userId: user.userId,
      name: user.name,
      role: user.role,
    });

    await logAudit({
      actorUserId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      action: 'SHIPMENT_RECEIVED_VERIFIED',
      entityType: 'SHIPMENT',
      entityId: shipmentId,
      oldValue: { status: 'IN_TRANSIT' },
      newValue: { status: 'RECEIVED', receivedQuantity: verifiedReceivedQty },
      description: `Treatment facility ${user.organizationName} confirmed receipt of ${verifiedReceivedQty} ${shipment.unit}.`,
    });

    res.json({
      success: true,
      message: 'Shipment safely received and quantity verified in ledger.',
      shipment,
    });
  } catch (error: any) {
    console.error('[CONFIRM RECEIPT ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to confirm receipt.' });
  }
};

/**
 * 4. Record Treatment
 */
export const recordTreatment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const shipmentId = String(req.params.shipmentId);
    const { treatmentMethod, notes } = req.body;

    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      res.status(404).json({ success: false, message: 'Shipment not found.' });
      return;
    }

    if (user.role !== 'ADMIN' && user.role !== 'TREATMENT_FACILITY' && shipment.destinationFacility.id !== user.userId) {
      res.status(403).json({ success: false, message: 'Unauthorized. Only treatment facility operators or admins can record treatment.' });
      return;
    }

    if (shipment.status !== 'RECEIVED') {
      res.status(400).json({
        success: false,
        message: `Illegal transition. Waste consignment must be in RECEIVED status before chemical neutralization. Current status: ${shipment.status}`,
      });
      return;
    }

    shipment.treatmentStartTime = new Date();
    shipment.treatmentTime = new Date();
    shipment.treatmentMethod = treatmentMethod || 'Standard Chemical Neutralization & Precipitation';
    shipment.status = 'TREATED';
    if (notes) shipment.notes = notes;

    await shipment.save();
    await Waste.updateOne({ wasteId: shipment.wasteId }, { currentStatus: 'TREATED' });

    await logAudit({
      actorUserId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      action: 'WASTE_TREATMENT_COMPLETED',
      entityType: 'SHIPMENT',
      entityId: shipmentId,
      oldValue: { status: 'RECEIVED' },
      newValue: { status: 'TREATED', treatmentMethod: shipment.treatmentMethod },
      description: `Completed neutralization / treatment for ${shipmentId} using ${shipment.treatmentMethod}.`,
    });

    res.json({
      success: true,
      message: 'Waste chemical neutralization recorded and locked in ledger.',
      shipment,
    });
  } catch (error: any) {
    console.error('[RECORD TREATMENT ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to record treatment.' });
  }
};

/**
 * 5. Record Final Disposal & Issue Certificate
 */
export const recordDisposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const shipmentId = String(req.params.shipmentId);
    const { disposalMethod, landfillCellId, notes } = req.body;

    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      res.status(404).json({ success: false, message: 'Shipment not found.' });
      return;
    }

    if (user.role !== 'ADMIN' && user.role !== 'TREATMENT_FACILITY' && shipment.destinationFacility.id !== user.userId) {
      res.status(403).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    if (shipment.status !== 'TREATED') {
      res.status(400).json({
        success: false,
        message: `Illegal transition. Waste must be TREATED before DISPOSED. Current status: ${shipment.status}`,
      });
      return;
    }

    shipment.disposalTime = new Date();
    shipment.disposalMethod = disposalMethod || 'Secured Hazardous Landfill Encapsulation';
    if (landfillCellId) shipment.landfillCellId = landfillCellId;
    shipment.status = 'DISPOSED';
    if (notes) shipment.notes = notes;

    await shipment.save();
    await Waste.updateOne({ wasteId: shipment.wasteId }, { currentStatus: 'DISPOSED' });

    await logAudit({
      actorUserId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      action: 'FINAL_DISPOSAL_COMPLETED',
      entityType: 'SHIPMENT',
      entityId: shipmentId,
      oldValue: { status: 'TREATED' },
      newValue: { status: 'DISPOSED', disposalMethod: shipment.disposalMethod, landfillCellId },
      description: `Final secured disposal logged for consignment ${shipmentId}. Certificate of Destruction issued.`,
    });

    // Notify Origin Lab that waste has achieved end of life
    await createNotification({
      recipientUserId: shipment.originOrganization.id,
      recipientRole: 'LABORATORY',
      shipmentId,
      wasteId: shipment.wasteId,
      type: 'SYSTEM_NOTICE',
      severity: 'INFO',
      title: `Destruction Certificate Issued: ${shipment.wasteId}`,
      message: `Your hazardous waste consignment ${shipment.wasteId} has been safely neutralized and permanently disposed of according to CPCB norms.`,
      actionUrl: `/lab/shipments`,
    });

    res.json({
      success: true,
      message: 'Final disposal recorded and Certificate of Destruction sealed.',
      shipment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to record disposal.' });
  }
};
