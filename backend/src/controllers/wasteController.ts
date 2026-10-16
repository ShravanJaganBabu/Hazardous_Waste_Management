import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Waste, IWaste } from '../models/Waste.js';
import { Shipment } from '../models/Shipment.js';
import { generateQRCode } from '../services/qrService.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { User } from '../models/User.js';

export const registerWaste = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      wasteType,
      category,
      declaredQuantity,
      unit = 'kg',
      description,
      hazardLevel = 'HIGH',
      handlingInstructions,
      requiredDocuments = [],
    } = req.body;

    if (!wasteType || wasteType.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Please provide the waste type / chemical classification.',
      });
      return;
    }

    if (
      declaredQuantity === undefined ||
      declaredQuantity === null ||
      declaredQuantity === '' ||
      isNaN(Number(declaredQuantity)) ||
      Number(declaredQuantity) <= 0
    ) {
      res.status(400).json({
        success: false,
        message: 'Declared quantity is required and must be a positive numeric value greater than zero.',
      });
      return;
    }

    const effectiveQuantity = Number(declaredQuantity);
    const effectiveCategory = category && category.trim() !== '' ? category : 'Class 8 (Toxic/Corrosive)';
    const effectiveDescription = description && description.trim() !== '' 
      ? description 
      : `${wasteType} - Standard hazardous consignment sealed and declared under CPCB compliance guidelines.`;

    const latestWaste = await Waste.findOne().sort({ createdAt: -1 }).select('wasteId').exec();
    let nextWasteSeq = 101;
    if (latestWaste && latestWaste.wasteId) {
      const match = latestWaste.wasteId.match(/\d+$/);
      if (match) {
        nextWasteSeq = Math.max(nextWasteSeq, parseInt(match[0], 10) + 1);
      }
    }
    let wasteId = `HW-2026-${String(nextWasteSeq).padStart(6, '0')}`;
    while (await Waste.exists({ wasteId })) {
      nextWasteSeq++;
      wasteId = `HW-2026-${String(nextWasteSeq).padStart(6, '0')}`;
    }

    // Generate high-definition QR code
    const qrPayload = JSON.stringify({
      wasteId,
      organization: user.organizationName,
      wasteType,
      quantity: `${effectiveQuantity} ${unit}`,
      hazardLevel,
      registeredAt: new Date().toISOString(),
      issuer: 'HAZTRACK // SECURE CHAIN',
    });

    const qrCode = await generateQRCode(qrPayload);

    const waste = await Waste.create({
      wasteId,
      organizationId: user.organizationName?.includes('Apex') ? 'HZU-002' : (user.userId || 'HZU-002'),
      organizationName: user.organizationName || 'Apex Chemical R&D Labs',
      registeredBy: user.userId || 'HZU-002',
      registeredByName: user.name || 'Rinitha (Lab Generator)',
      wasteType,
      category: effectiveCategory,
      declaredQuantity: effectiveQuantity,
      unit,
      description: effectiveDescription,
      hazardLevel,
      handlingInstructions: handlingInstructions || 'Handle with certified protective gear (gloves, goggles, apron).',
      registrationDate: new Date(),
      currentStatus: 'REGISTERED',
      qrCode,
      requiredDocuments: requiredDocuments.length > 0 ? requiredDocuments : [
        { name: 'Material Safety Data Sheet (MSDS)', type: 'MSDS_SHEET', uploaded: false },
        { name: 'Hazard Declaration Certificate', type: 'COLLECTION_MANIFEST', uploaded: false },
      ],
    });

    await logAudit({
      actorUserId: user.userId || 'HZU-002',
      actorName: user.name || 'Lab Generator',
      actorRole: user.role || 'LABORATORY',
      action: 'WASTE_REGISTERED',
      entityType: 'WASTE',
      entityId: wasteId,
      newValue: { wasteType, declaredQuantity: effectiveQuantity, hazardLevel },
      description: `Registered hazardous waste consignment ${wasteId} (${effectiveQuantity} ${unit} of ${wasteType}) under ${user.organizationName || 'Generator'}.`,
    });

    // Notify Admin
    try {
      const admins = await User.find({ role: 'ADMIN', status: 'ACTIVE' });
      for (const admin of admins) {
        await createNotification({
          recipientUserId: admin.userId,
          recipientRole: 'ADMIN',
          wasteId,
          type: 'SYSTEM_NOTICE',
          severity: 'INFO',
          title: `New Waste Registered: ${wasteId}`,
          message: `${user.organizationName || 'Generator'} registered ${effectiveQuantity} ${unit} of ${wasteType}.`,
          actionUrl: `/admin/waste`,
        });
      }
    } catch (notifErr) {
      console.warn('[NOTIF WARN]', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Hazardous waste successfully registered and secured in chain.',
      waste,
    });
  } catch (error: any) {
    console.error('[WASTE REGISTER ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: error?.message || 'Failed to register waste consignment.' 
    });
  }
};

export const getWasteList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { page = 1, limit = 20, status, hazardLevel, search, organizationId } = req.query;

    const query: any = {};

    // RBAC Scope: Labs & Industry only view their own waste
    if (user.role === 'LABORATORY' || user.role === 'INDUSTRY') {
      query.organizationId = user.userId;
    } else if (organizationId) {
      query.organizationId = organizationId;
    }

    if (status) query.currentStatus = status;
    if (hazardLevel) query.hazardLevel = hazardLevel;

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { wasteId: searchRegex },
        { wasteType: searchRegex },
        { organizationName: searchRegex },
        { category: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Waste.countDocuments(query);
    const wasteList = await Waste.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      wasteList,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch waste list.' });
  }
};

export const getWasteById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { wasteId } = req.params;

    const waste = await Waste.findOne({ wasteId });
    if (!waste) {
      res.status(404).json({ success: false, message: 'Waste record not found.' });
      return;
    }

    // Role check
    if ((user.role === 'LABORATORY' || user.role === 'INDUSTRY') && waste.organizationId !== user.userId) {
      res.status(403).json({ success: false, message: 'Forbidden. You do not own this waste consignment.' });
      return;
    }

    const shipment = waste.activeShipmentId ? await Shipment.findOne({ shipmentId: waste.activeShipmentId }) : null;

    res.json({
      success: true,
      waste,
      shipment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error retrieving waste details.' });
  }
};

export const requestCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { wasteId } = req.params;
    const { transporterId, destinationFacilityId, expectedPickupDate, notes } = req.body;

    const waste = await Waste.findOne({ wasteId });
    if (!waste) {
      res.status(404).json({ success: false, message: 'Waste record not found.' });
      return;
    }

    if (user.role !== 'ADMIN' && waste.organizationId !== user.userId) {
      res.status(403).json({ success: false, message: 'Only the generating organization or Admin can request pickup.' });
      return;
    }

    if (waste.currentStatus !== 'REGISTERED') {
      res.status(400).json({
        success: false,
        message: `Cannot request collection for waste in ${waste.currentStatus} status. Must be REGISTERED.`,
      });
      return;
    }

    // Resolve transporter and facility details
    const transporterUser = await User.findOne({ userId: transporterId || 'HZU-004' });
    const facilityUser = await User.findOne({ userId: destinationFacilityId || 'HZU-006' });

    if (!transporterUser || !facilityUser) {
      res.status(400).json({ success: false, message: 'Invalid transporter or treatment facility selected.' });
      return;
    }

    const latestShipment = await Shipment.findOne().sort({ createdAt: -1 }).select('shipmentId').exec();
    let nextShipmentSeq = 101;
    if (latestShipment && latestShipment.shipmentId) {
      const match = latestShipment.shipmentId.match(/\d+$/);
      if (match) {
        nextShipmentSeq = Math.max(nextShipmentSeq, parseInt(match[0], 10) + 1);
      }
    }
    let shipmentId = `SHP-2026-${String(nextShipmentSeq).padStart(6, '0')}`;
    while (await Shipment.exists({ shipmentId })) {
      nextShipmentSeq++;
      shipmentId = `SHP-2026-${String(nextShipmentSeq).padStart(6, '0')}`;
    }
    const manifestNumber = `MNF-TN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    // Generate shipment QR
    const qrPayload = JSON.stringify({
      shipmentId,
      wasteId: waste.wasteId,
      manifest: manifestNumber,
      origin: waste.organizationName,
      transporter: transporterUser.organizationName,
      destination: facilityUser.organizationName,
      quantity: `${waste.declaredQuantity} ${waste.unit}`,
      status: 'COLLECTION_REQUESTED',
    });

    const qrCode = await generateQRCode(qrPayload);

    const shipment = await Shipment.create({
      shipmentId,
      wasteId: waste.wasteId,
      originOrganization: {
        id: waste.organizationId,
        name: waste.organizationName,
        location: 'Easwari R&D Sector 4, Chennai',
        contactPerson: user.name,
        phone: '+91 94440 12345',
      },
      transporter: {
        id: transporterUser.userId,
        name: transporterUser.name,
        company: transporterUser.organizationName,
        driverName: 'Captain Ramesh V.',
        driverPhone: '+91 98401 55678',
        vehicleNumber: 'TN-09-HZ-4042',
        vehicleType: 'Hazmat Insulated Carrier (Class 8)',
        gpsCoordinates: {
          latitude: 13.0317,
          longitude: 80.1817,
          lastUpdated: new Date(),
        },
      },
      destinationFacility: {
        id: facilityUser.userId,
        name: facilityUser.organizationName,
        facilityType: 'High-Temperature Incineration & Neutralization Plant',
        location: 'SIPCOT Industrial Complex, Gummidipoondi',
        contactPerson: facilityUser.name,
      },
      declaredQuantity: waste.declaredQuantity,
      unit: waste.unit,
      discrepancy: {
        labToTransporterDiff: 0,
        transporterToFacilityDiff: 0,
        totalDiff: 0,
        hasMismatch: false,
      },
      status: 'COLLECTION_REQUESTED',
      collectionRequestedTime: new Date(),
      expectedDeliveryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      qrCode,
      manifestNumber,
      notes,
    });

    // Update waste status
    waste.currentStatus = 'COLLECTION_REQUESTED';
    waste.activeShipmentId = shipmentId;
    await waste.save();

    await logAudit({
      actorUserId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      action: 'COLLECTION_REQUESTED',
      entityType: 'SHIPMENT',
      entityId: shipmentId,
      oldValue: { status: 'REGISTERED' },
      newValue: { status: 'COLLECTION_REQUESTED', transporter: transporterUser.organizationName },
      description: `Collection requested for consignment ${wasteId}. Created shipment ${shipmentId} assigned to ${transporterUser.name}.`,
    });

    // Send Alert to Transporter
    await createNotification({
      recipientUserId: transporterUser.userId,
      recipientRole: 'TRANSPORTER',
      shipmentId,
      wasteId: waste.wasteId,
      type: 'SYSTEM_NOTICE',
      severity: 'WARNING',
      title: `New Pickup Assigned: ${shipmentId}`,
      message: `Pickup requested at ${waste.organizationName} for ${waste.declaredQuantity} ${waste.unit} of ${waste.wasteType}.`,
      actionUrl: `/transporter/dashboard`,
      voiceRequired: false,
    });

    res.json({
      success: true,
      message: 'Collection request dispatched to transporter.',
      shipment,
      waste,
    });
  } catch (error: any) {
    console.error('[REQUEST COLLECTION ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to request collection.' });
  }
};
