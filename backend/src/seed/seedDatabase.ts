import bcrypt from 'bcryptjs';
import { connectDB, closeDB } from '../config/db.js';
import { User, IUser } from '../models/User.js';
import { Waste } from '../models/Waste.js';
import { Shipment } from '../models/Shipment.js';
import { Alert } from '../models/Alert.js';
import { Investigation } from '../models/Investigation.js';
import { Incident } from '../models/Incident.js';
import { DocumentRecord } from '../models/Document.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateQRCode } from '../services/qrService.js';

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('[SEED] Starting HazTrack database seeding...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Waste.deleteMany({}),
      Shipment.deleteMany({}),
      Alert.deleteMany({}),
      Investigation.deleteMany({}),
      Incident.deleteMany({}),
      DocumentRecord.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    const defaultPassword = 'HazTrack@2026!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // 1. Seed the 7 Configured Users
    const usersData = [
      {
        userId: 'HZU-001',
        name: 'Harinitha',
        username: 'harinitha_admin',
        email: 'harinitha.admin@haztrack.eec.edu',
        passwordHash,
        role: 'ADMIN' as const,
        organizationName: 'HazTrack Central Control & Compliance (EEC)',
        status: 'ACTIVE' as const,
        phone: '+91 94440 88901',
      },
      {
        userId: 'HZU-002',
        name: 'Rinitha',
        username: 'rinitha_lab',
        email: 'rinitha@apexresearch.org',
        passwordHash,
        role: 'LABORATORY' as const,
        organizationName: 'Apex Chemical R&D Labs',
        status: 'ACTIVE' as const,
        phone: '+91 94440 88902',
      },
      {
        userId: 'HZU-003',
        name: 'Harini',
        username: 'harini_industry',
        email: 'harini@titanpetro.com',
        passwordHash,
        role: 'INDUSTRY' as const,
        organizationName: 'Titan Petrochemicals Ltd.',
        status: 'ACTIVE' as const,
        phone: '+91 94440 88903',
      },
      {
        userId: 'HZU-004',
        name: 'Rini',
        username: 'rini_transporter',
        email: 'rini@ecohaul.in',
        passwordHash,
        role: 'TRANSPORTER' as const,
        organizationName: 'EcoHaul Hazmat Transport Logistics',
        status: 'ACTIVE' as const,
        phone: '+91 94440 88904',
      },
      {
        userId: 'HZU-005',
        name: 'Shravan',
        username: 'shravan_transporter',
        email: 'shravan@vanguardlogistics.in',
        passwordHash,
        role: 'TRANSPORTER' as const,
        organizationName: 'Vanguard Hazmat Fleet Express',
        status: 'ACTIVE' as const,
        phone: '+91 94440 88905',
      },
      {
        userId: 'HZU-006',
        name: 'Ravan',
        username: 'ravan_facility',
        email: 'ravan@greensafe.in',
        passwordHash,
        role: 'TREATMENT_FACILITY' as const,
        organizationName: 'GreenSafe Neutralization & Recovery Plant',
        status: 'ACTIVE' as const,
        phone: '+91 94440 88906',
      },
      {
        userId: 'HZU-007',
        name: 'Avan',
        username: 'avan_facility',
        email: 'avan@bioclean.in',
        passwordHash,
        role: 'TREATMENT_FACILITY' as const,
        organizationName: 'BioClean High-Temp Incineration Facility',
        status: 'ACTIVE' as const,
        phone: '+91 94440 88907',
      },
    ];

    const createdUsers = await User.insertMany(usersData);
    console.log(`[SEED] Created ${createdUsers.length} official users with unique IDs and hashed credentials.`);

    // 2. Seed Waste Consignments across Lifecycle
    const qr1 = await generateQRCode({ wasteId: 'HW-2026-000101', type: 'Heavy Metal Sludge', declared: 120 });
    const qr2 = await generateQRCode({ wasteId: 'HW-2026-000102', type: 'Spent Organic Solvents', declared: 85 });
    const qr3 = await generateQRCode({ wasteId: 'HW-2026-000103', type: 'Concentrated Sulfuric Acid', declared: 250 });
    const qr4 = await generateQRCode({ wasteId: 'HW-2026-000104', type: 'Lead-Acid Battery Sludge', declared: 75 });
    const qr5 = await generateQRCode({ wasteId: 'HW-2026-000105', type: 'Cyanide Electroplating Baths', declared: 40 });
    const qr6 = await generateQRCode({ wasteId: 'HW-2026-000106', type: 'Mercury Contaminated Filter Cake', declared: 30 });

    const wasteList = await Waste.insertMany([
      {
        wasteId: 'HW-2026-000101',
        organizationId: 'HZU-002',
        organizationName: 'Apex Chemical R&D Labs',
        registeredBy: 'HZU-002',
        registeredByName: 'Rinitha',
        wasteType: 'Heavy Metal Sludge',
        category: 'Class 8 (Toxic/Corrosive)',
        declaredQuantity: 120,
        unit: 'kg',
        description: 'Precipitated chromium and nickel hydroxide sludge from electroplating testing.',
        hazardLevel: 'HIGH',
        registrationDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        currentStatus: 'REGISTERED',
        qrCode: qr1,
        requiredDocuments: [
          { name: 'MSDS Sheet #882', type: 'MSDS_SHEET', uploaded: true, documentId: 'DOC-101' },
          { name: 'Generator Declaration', type: 'COLLECTION_MANIFEST', uploaded: true, documentId: 'DOC-102' },
        ],
      },
      {
        wasteId: 'HW-2026-000102',
        organizationId: 'HZU-003',
        organizationName: 'Titan Petrochemicals Ltd.',
        registeredBy: 'HZU-003',
        registeredByName: 'Harini',
        wasteType: 'Spent Organic Solvents',
        category: 'Class 3 (Flammable Liquid)',
        declaredQuantity: 85,
        unit: 'kg',
        description: 'Toluene, acetone, and dichloromethane solvent residues in sealed UN-rated drums.',
        hazardLevel: 'EXTREME',
        registrationDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
        currentStatus: 'COLLECTION_REQUESTED',
        activeShipmentId: 'SHP-2026-000102',
        qrCode: qr2,
        requiredDocuments: [
          { name: 'Solvent Flashpoint Certificate', type: 'MSDS_SHEET', uploaded: true },
        ],
      },
      {
        wasteId: 'HW-2026-000103',
        organizationId: 'HZU-002',
        organizationName: 'Apex Chemical R&D Labs',
        registeredBy: 'HZU-002',
        registeredByName: 'Rinitha',
        wasteType: 'Concentrated Sulfuric Acid',
        category: 'Class 8 (Corrosive Liquid)',
        declaredQuantity: 250,
        unit: 'kg',
        description: 'Industrial acid digestate from semiconductor catalyst synthesis.',
        hazardLevel: 'EXTREME',
        registrationDate: new Date(Date.now() - 14 * 60 * 60 * 1000),
        currentStatus: 'IN_TRANSIT',
        activeShipmentId: 'SHP-2026-000103',
        qrCode: qr3,
        requiredDocuments: [
          { name: 'Corrosive Transport Manifest', type: 'TRANSPORT_PERMIT', uploaded: true },
        ],
      },
      {
        wasteId: 'HW-2026-000104',
        organizationId: 'HZU-003',
        organizationName: 'Titan Petrochemicals Ltd.',
        registeredBy: 'HZU-003',
        registeredByName: 'Harini',
        wasteType: 'Lead-Acid Battery Sludge',
        category: 'Class 6.1 (Toxic Substance)',
        declaredQuantity: 75,
        unit: 'kg',
        description: 'High-density lead sulfate sludge containerized in anti-corrosive barrels.',
        hazardLevel: 'HIGH',
        registrationDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        currentStatus: 'RECEIVED',
        activeShipmentId: 'SHP-2026-000104',
        qrCode: qr4,
        requiredDocuments: [
          { name: 'CPCB Lead Manifest Form 10', type: 'COLLECTION_MANIFEST', uploaded: true },
        ],
      },
      {
        wasteId: 'HW-2026-000105',
        organizationId: 'HZU-002',
        organizationName: 'Apex Chemical R&D Labs',
        registeredBy: 'HZU-002',
        registeredByName: 'Rinitha',
        wasteType: 'Cyanide Electroplating Baths',
        category: 'Class 6.1 (Extreme Toxic)',
        declaredQuantity: 40,
        unit: 'kg',
        description: 'Spent sodium cyanide rinse baths neutralized with sodium hypochlorite.',
        hazardLevel: 'EXTREME',
        registrationDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
        currentStatus: 'TREATED',
        activeShipmentId: 'SHP-2026-000105',
        qrCode: qr5,
        requiredDocuments: [],
      },
      {
        wasteId: 'HW-2026-000106',
        organizationId: 'HZU-003',
        organizationName: 'Titan Petrochemicals Ltd.',
        registeredBy: 'HZU-003',
        registeredByName: 'Harini',
        wasteType: 'Mercury Contaminated Filter Cake',
        category: 'Class 8 / 6.1',
        declaredQuantity: 30,
        unit: 'kg',
        description: 'Stabilized mercury amalgam encased in sulfur polymer matrix.',
        hazardLevel: 'HIGH',
        registrationDate: new Date(Date.now() - 72 * 60 * 60 * 1000),
        currentStatus: 'DISPOSED',
        activeShipmentId: 'SHP-2026-000106',
        qrCode: qr6,
        requiredDocuments: [],
      },
    ]);

    // 3. Seed Shipments with realistic GPS, Discrepancies and Manifests
    await Shipment.insertMany([
      {
        shipmentId: 'SHP-2026-000102',
        wasteId: 'HW-2026-000102',
        originOrganization: {
          id: 'HZU-003',
          name: 'Titan Petrochemicals Ltd.',
          location: 'Ennore Express Highway, Manali, Chennai',
          contactPerson: 'Harini',
          phone: '+91 94440 88903',
        },
        transporter: {
          id: 'HZU-004',
          name: 'Rini',
          company: 'EcoHaul Hazmat Transport Logistics',
          driverName: 'S. Kumar',
          driverPhone: '+91 98401 11223',
          vehicleNumber: 'TN-04-AB-9921',
          vehicleType: 'Specialized Chemical Tanker',
        },
        destinationFacility: {
          id: 'HZU-006',
          name: 'GreenSafe Neutralization & Recovery Plant',
          facilityType: 'Neutralization & Recovery',
          location: 'SIPCOT Gummidipoondi Sector 2',
          contactPerson: 'Ravan',
        },
        declaredQuantity: 85,
        unit: 'kg',
        status: 'COLLECTION_REQUESTED',
        collectionRequestedTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        expectedDeliveryTime: new Date(Date.now() + 20 * 60 * 60 * 1000),
        qrCode: qr2,
        manifestNumber: 'MNF-TN-880102',
        discrepancy: { labToTransporterDiff: 0, transporterToFacilityDiff: 0, totalDiff: 0, hasMismatch: false },
      },
      {
        shipmentId: 'SHP-2026-000103',
        wasteId: 'HW-2026-000103',
        originOrganization: {
          id: 'HZU-002',
          name: 'Apex Chemical R&D Labs',
          location: 'Easwari R&D Sector 4, Ramapuram, Chennai',
          contactPerson: 'Rinitha',
          phone: '+91 94440 88902',
        },
        transporter: {
          id: 'HZU-005',
          name: 'Shravan',
          company: 'Vanguard Hazmat Fleet Express',
          driverName: 'Rajesh V.',
          driverPhone: '+91 98401 55678',
          vehicleNumber: 'TN-09-HZ-4042',
          vehicleType: 'Insulated Acid Carrier (Class 8)',
          gpsCoordinates: {
            latitude: 13.0827,
            longitude: 80.2707,
            lastUpdated: new Date(),
          },
        },
        destinationFacility: {
          id: 'HZU-006',
          name: 'GreenSafe Neutralization & Recovery Plant',
          facilityType: 'Neutralization & Recovery',
          location: 'SIPCOT Gummidipoondi Sector 2',
          contactPerson: 'Ravan',
        },
        declaredQuantity: 250,
        collectedQuantity: 250,
        unit: 'kg',
        status: 'IN_TRANSIT',
        collectionRequestedTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
        collectionTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
        transitStartTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        expectedDeliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        qrCode: qr3,
        manifestNumber: 'MNF-TN-880103',
        discrepancy: { labToTransporterDiff: 0, transporterToFacilityDiff: 0, totalDiff: 0, hasMismatch: false },
      },
      {
        shipmentId: 'SHP-2026-000104',
        wasteId: 'HW-2026-000104',
        originOrganization: {
          id: 'HZU-003',
          name: 'Titan Petrochemicals Ltd.',
          location: 'Ennore Express Highway, Manali, Chennai',
          contactPerson: 'Harini',
          phone: '+91 94440 88903',
        },
        transporter: {
          id: 'HZU-005',
          name: 'Shravan',
          company: 'Vanguard Hazmat Fleet Express',
          driverName: 'Rajesh V.',
          driverPhone: '+91 98401 55678',
          vehicleNumber: 'TN-09-HZ-4042',
          vehicleType: 'Insulated Acid Carrier',
        },
        destinationFacility: {
          id: 'HZU-007',
          name: 'BioClean High-Temp Incineration Facility',
          facilityType: 'High-Temperature Incinerator',
          location: 'Oragadam Industrial Corridor',
          contactPerson: 'Avan',
        },
        declaredQuantity: 75,
        collectedQuantity: 74.5,
        receivedQuantity: 72,
        unit: 'kg',
        status: 'RECEIVED',
        collectionRequestedTime: new Date(Date.now() - 20 * 60 * 60 * 1000),
        collectionTime: new Date(Date.now() - 10 * 60 * 60 * 1000),
        transitStartTime: new Date(Date.now() - 9 * 60 * 60 * 1000),
        receivedTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        actualDeliveryTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        qrCode: qr4,
        manifestNumber: 'MNF-TN-880104',
        discrepancy: {
          labToTransporterDiff: -0.5,
          transporterToFacilityDiff: -2.5,
          totalDiff: -3.0,
          hasMismatch: true,
          mismatchReason: 'Mass imbalance detected: Declared 75 kg, Collected 74.5 kg, Received 72 kg (Variance: -3 kg)',
        },
      },
      {
        shipmentId: 'SHP-2026-000105',
        wasteId: 'HW-2026-000105',
        originOrganization: {
          id: 'HZU-002',
          name: 'Apex Chemical R&D Labs',
          location: 'Easwari R&D Sector 4, Ramapuram',
          contactPerson: 'Rinitha',
          phone: '+91 94440 88902',
        },
        transporter: {
          id: 'HZU-004',
          name: 'Rini',
          company: 'EcoHaul Hazmat Transport Logistics',
          driverName: 'S. Kumar',
          driverPhone: '+91 98401 11223',
          vehicleNumber: 'TN-04-AB-9921',
          vehicleType: 'Chemical Tanker',
        },
        destinationFacility: {
          id: 'HZU-006',
          name: 'GreenSafe Neutralization & Recovery Plant',
          facilityType: 'Neutralization & Recovery',
          location: 'SIPCOT Gummidipoondi Sector 2',
          contactPerson: 'Ravan',
        },
        declaredQuantity: 40,
        collectedQuantity: 40,
        receivedQuantity: 40,
        unit: 'kg',
        status: 'TREATED',
        collectionRequestedTime: new Date(Date.now() - 40 * 60 * 60 * 1000),
        collectionTime: new Date(Date.now() - 30 * 60 * 60 * 1000),
        receivedTime: new Date(Date.now() - 20 * 60 * 60 * 1000),
        treatmentTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
        qrCode: qr5,
        manifestNumber: 'MNF-TN-880105',
        discrepancy: { labToTransporterDiff: 0, transporterToFacilityDiff: 0, totalDiff: 0, hasMismatch: false },
      },
      {
        shipmentId: 'SHP-2026-000106',
        wasteId: 'HW-2026-000106',
        originOrganization: {
          id: 'HZU-003',
          name: 'Titan Petrochemicals Ltd.',
          location: 'Ennore Express Highway, Manali',
          contactPerson: 'Harini',
          phone: '+91 94440 88903',
        },
        transporter: {
          id: 'HZU-005',
          name: 'Shravan',
          company: 'Vanguard Hazmat Fleet Express',
          driverName: 'Rajesh V.',
          driverPhone: '+91 98401 55678',
          vehicleNumber: 'TN-09-HZ-4042',
          vehicleType: 'Insulated Acid Carrier',
        },
        destinationFacility: {
          id: 'HZU-007',
          name: 'BioClean High-Temp Incineration Facility',
          facilityType: 'High-Temperature Incinerator',
          location: 'Oragadam Industrial Corridor',
          contactPerson: 'Avan',
        },
        declaredQuantity: 30,
        collectedQuantity: 30,
        receivedQuantity: 30,
        unit: 'kg',
        status: 'DISPOSED',
        collectionRequestedTime: new Date(Date.now() - 65 * 60 * 60 * 1000),
        collectionTime: new Date(Date.now() - 55 * 60 * 60 * 1000),
        receivedTime: new Date(Date.now() - 45 * 60 * 60 * 1000),
        treatmentTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
        disposalTime: new Date(Date.now() - 10 * 60 * 60 * 1000),
        qrCode: qr6,
        manifestNumber: 'MNF-TN-880106',
        discrepancy: { labToTransporterDiff: 0, transporterToFacilityDiff: 0, totalDiff: 0, hasMismatch: false },
      },
    ]);

    // 4. Seed Active Investigation for HW-2026-000104 (-3 kg Variance)
    await Investigation.create({
      investigationId: 'INV-2026-000104',
      wasteId: 'HW-2026-000104',
      shipmentId: 'SHP-2026-000104',
      issueType: 'QUANTITY_MISMATCH',
      title: 'Quantity Variance (-3.0 kg) on Consignment HW-2026-000104',
      description: 'Automated discrepancy detection triggered upon BioClean receipt confirmation. Generator declared 75.0 kg, Transporter measured 74.5 kg, Facility verified 72.0 kg. Net loss of 3.0 kg toxic lead sludge requiring justification.',
      severity: 'CRITICAL',
      createdBy: {
        userId: 'SYSTEM',
        name: 'HazTrack Monitoring Engine',
        role: 'ADMIN',
      },
      assignedTo: {
        userId: 'HZU-007',
        name: 'Avan',
        role: 'TREATMENT_FACILITY',
        organization: 'BioClean High-Temp Incineration Facility',
      },
      status: 'AWAITING_RESPONSE',
      quantityComparison: {
        declaredQuantity: 75.0,
        collectedQuantity: 74.5,
        receivedQuantity: 72.0,
        discrepancyAmount: -3.0,
        unit: 'kg',
      },
      evidence: [
        {
          evidenceId: 'EVD-01',
          title: 'Weight Scale Calibration Slip at Origin',
          fileUrl: '/uploads/scale-cert.pdf',
          fileType: 'application/pdf',
          uploadedBy: 'HZU-003',
          uploadedByName: 'Harini',
          uploadedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
          description: 'Certified weighbridge ticket confirming 75 kg gross mass at dispatch.',
        },
      ],
      responses: [
        {
          responseId: 'RSP-01',
          senderUserId: 'HZU-005',
          senderName: 'Shravan',
          senderRole: 'TRANSPORTER',
          senderOrganization: 'Vanguard Hazmat Fleet Express',
          message: 'Tare container weight was 0.5 kg less due to dry atmospheric conditions during loading. Zero spills occurred in transit. Seals arrived intact at BioClean gate.',
          attachments: [],
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
      ],
    });

    // 5. Seed Emergency Road Incident (Vehicle Breakdown / Minor Containment Check)
    await Incident.create({
      incidentId: 'INC-2026-000101',
      wasteId: 'HW-2026-000103',
      shipmentId: 'SHP-2026-000103',
      reportedBy: {
        userId: 'HZU-005',
        name: 'Shravan',
        role: 'TRANSPORTER',
        phone: '+91 94440 88905',
      },
      incidentType: 'VEHICLE_BREAKDOWN',
      description: 'Minor hydraulic pressure drop detected on vehicle TN-09-HZ-4042 near Koyambedu flyover. Acid containment seal intact and double-hulled valve secured. Backup towing unit dispatched.',
      location: {
        address: 'Koyambedu Junction, Chennai Ring Road (KM 14.2)',
        coordinates: {
          latitude: 13.0732,
          longitude: 80.1932,
        },
      },
      attachments: [],
      severity: 'WARNING',
      status: 'ACKNOWLEDGED',
      responseActions: [
        {
          action: 'HazTrack Command Center acknowledged breakdown. Backup vehicle TN-09-HZ-8812 standing by.',
          performedBy: 'HZU-001',
          performedByName: 'Harinitha',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
        },
      ],
    });

    // 6. Seed Alerts for All Roles
    await Alert.insertMany([
      {
        alertId: 'ALT-101',
        recipientUserId: 'HZU-001',
        recipientRole: 'ADMIN',
        shipmentId: 'SHP-2026-000104',
        wasteId: 'HW-2026-000104',
        type: 'QUANTITY_MISMATCH',
        severity: 'CRITICAL',
        title: 'CRITICAL: Quantity Mismatch on Consignment HW-2026-000104',
        message: 'A quantity difference of -3.0 kg was recorded upon receipt. Investigation INV-2026-000104 opened automatically.',
        actionUrl: '/admin/investigations/INV-2026-000104',
        voiceRequired: true,
        voiceStatus: 'PENDING',
        isRead: false,
      },
      {
        alertId: 'ALT-102',
        recipientUserId: 'HZU-007',
        recipientRole: 'TREATMENT_FACILITY',
        shipmentId: 'SHP-2026-000104',
        wasteId: 'HW-2026-000104',
        type: 'INVESTIGATION_OPENED',
        severity: 'CRITICAL',
        title: 'Investigation Request: Lead Sludge Mass Variance',
        message: 'Discrepancy detected (-3.0 kg). Please upload tare verification slip and official explanation in the HazTrack investigation portal.',
        actionUrl: '/facility/investigations',
        voiceRequired: true,
        voiceStatus: 'PENDING',
        isRead: false,
      },
      {
        alertId: 'ALT-103',
        recipientUserId: 'HZU-005',
        recipientRole: 'TRANSPORTER',
        shipmentId: 'SHP-2026-000103',
        wasteId: 'HW-2026-000103',
        type: 'SYSTEM_NOTICE',
        severity: 'INFO',
        title: 'Transit Monitored: Consignment HW-2026-000103',
        message: 'GPS route tracking is active. Estimated arrival at GreenSafe Plant in 2 hours.',
        actionUrl: '/transporter/shipments',
        voiceRequired: false,
        voiceStatus: 'DISMISSED',
        isRead: false,
      },
      {
        alertId: 'ALT-104',
        recipientUserId: 'HZU-002',
        recipientRole: 'LABORATORY',
        shipmentId: 'SHP-2026-000106',
        wasteId: 'HW-2026-000106',
        type: 'SYSTEM_NOTICE',
        severity: 'INFO',
        title: 'Certificate of Destruction Sealed: HW-2026-000106',
        message: 'Consignment HW-2026-000106 has reached final safe disposal under CPCB Environmental Protection guidelines.',
        actionUrl: '/lab/shipments',
        voiceRequired: false,
        voiceStatus: 'DISMISSED',
        isRead: true,
      },
    ]);

    // 7. Seed Complete Audit Logs
    await AuditLog.insertMany([
      {
        auditId: 'AUD-001',
        actorUserId: 'HZU-002',
        actorName: 'Rinitha',
        actorRole: 'LABORATORY',
        action: 'WASTE_REGISTERED',
        entityType: 'WASTE',
        entityId: 'HW-2026-000101',
        description: 'Registered 120 kg Heavy Metal Sludge with Class 8 hazard profile.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        auditId: 'AUD-002',
        actorUserId: 'HZU-003',
        actorName: 'Harini',
        actorRole: 'INDUSTRY',
        action: 'COLLECTION_REQUESTED',
        entityType: 'SHIPMENT',
        entityId: 'SHP-2026-000102',
        description: 'Requested pickup for 85 kg spent solvents assigned to EcoHaul Logistics.',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        auditId: 'AUD-003',
        actorUserId: 'HZU-005',
        actorName: 'Shravan',
        actorRole: 'TRANSPORTER',
        action: 'COLLECTION_CONFIRMED_TRANSIT_STARTED',
        entityType: 'SHIPMENT',
        entityId: 'SHP-2026-000103',
        description: 'Verified 250 kg sulfuric acid intake and locked GPS tracking on vehicle TN-09-HZ-4042.',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        auditId: 'AUD-004',
        actorUserId: 'HZU-007',
        actorName: 'Avan',
        actorRole: 'TREATMENT_FACILITY',
        action: 'SHIPMENT_RECEIVED_VERIFIED',
        entityType: 'SHIPMENT',
        entityId: 'SHP-2026-000104',
        description: 'Recorded receiving weight of 72.0 kg against 75.0 kg declared. Smart Monitoring Engine flagged -3.0 kg mismatch.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        auditId: 'AUD-005',
        actorUserId: 'SYSTEM',
        actorName: 'HazTrack Monitoring Engine',
        actorRole: 'ADMIN',
        action: 'INVESTIGATION_AUTOMATICALLY_OPENED',
        entityType: 'INVESTIGATION',
        entityId: 'INV-2026-000104',
        description: 'Automatic case created for mass imbalance (-3.0 kg) on shipment SHP-2026-000104.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ]);

    console.log('[SEED] Database successfully seeded with rich mock datasets, realistic lifecycle records, investigations, and audit history!');
  } catch (error) {
    console.error('[SEED ERROR]', error);
    throw error;
  }
};

// Run standalone if executed directly
if (process.argv[1]?.includes('seedDatabase')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    await closeDB();
    process.exit(0);
  })();
}
