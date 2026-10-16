export type UserRole = 'ADMIN' | 'LABORATORY' | 'INDUSTRY' | 'TRANSPORTER' | 'TREATMENT_FACILITY';

export type WasteStatus =
  | 'REGISTERED'
  | 'COLLECTION_REQUESTED'
  | 'COLLECTED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'TREATED'
  | 'DISPOSED';

export type HazardLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';

export type InvestigationStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'AWAITING_RESPONSE'
  | 'RESPONSE_RECEIVED'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'VIOLATION_CONFIRMED';

export type IncidentType =
  | 'ACCIDENT'
  | 'SPILL'
  | 'CONTAINER_DAMAGE'
  | 'VEHICLE_BREAKDOWN'
  | 'ROUTE_PROBLEM'
  | 'OTHER';

export interface ILoginRecord {
  timestamp: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
}

export interface IUser {
  userId: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  organizationName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';
  phone?: string;
  avatarUrl?: string;
  lastLogin?: string;
  failedAttempts?: number;
  lockedUntil?: string;
  activeSessions?: number;
  loginHistory?: ILoginRecord[];
  createdAt?: string;
}

export interface IWaste {
  _id?: string;
  wasteId: string;
  organizationId: string;
  organizationName: string;
  registeredBy: string;
  registeredByName: string;
  wasteType: string;
  category: string;
  declaredQuantity: number;
  unit: string;
  description: string;
  hazardLevel: HazardLevel;
  handlingInstructions?: string;
  registrationDate: string;
  currentStatus: WasteStatus;
  qrCode: string;
  requiredDocuments: Array<{
    name: string;
    type: string;
    uploaded: boolean;
    documentId?: string;
  }>;
  activeShipmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IRiskFactor {
  factor: string;
  points: number;
}

export interface IStageQuantityRecord {
  stage: string;
  quantity: number;
  unit: string;
  verifiedBy: string;
  verifierName: string;
  timestamp: string;
  deltaExplanation?: string;
}

export interface IQRScanEntry {
  stage: string;
  verifiedBy: string;
  verifierName: string;
  timestamp: string;
  location?: string;
  status: string;
}

export interface IShipment {
  _id?: string;
  shipmentId: string;
  wasteId: string;
  originOrganization: {
    id: string;
    name: string;
    location: string;
    contactPerson: string;
    phone: string;
  };
  transporter: {
    id: string;
    name: string;
    company: string;
    driverName: string;
    driverPhone: string;
    vehicleNumber: string;
    vehicleType: string;
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
      lastUpdated: string;
    };
  };
  destinationFacility: {
    id: string;
    name: string;
    facilityType: string;
    location: string;
    contactPerson: string;
  };
  declaredQuantity: number;
  collectedQuantity?: number;
  receivedQuantity?: number;
  treatedQuantity?: number;
  disposedQuantity?: number;
  unit: string;
  
  // Pillar 6: Smart Quantity Verification & Chain of Custody Mass Balance
  quantityChain?: {
    declared: number;
    collected?: number;
    received?: number;
    treated?: number;
    disposed?: number;
    totalDifference?: number;
    stageRecords: IStageQuantityRecord[];
  };

  discrepancy: {
    labToTransporterDiff?: number;
    transporterToFacilityDiff?: number;
    totalDiff?: number;
    hasMismatch: boolean;
    mismatchReason?: string;
  };

  // Pillar 3: Dynamic Risk Score
  riskScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors?: IRiskFactor[];

  // Pillars 4 & 5: Live Visual Journey & Route Deviation
  routeTracking?: {
    approvedRoute: string[];
    currentWaypointIndex: number;
    distanceTraveledKm: number;
    totalDistanceKm: number;
    isDeviated: boolean;
    deviationDistanceKm: number;
    deviationReason?: string;
    eta?: string;
    currentSpeedKmH: number;
  };

  // Pillar 13: QR Scan History
  qrScanHistory?: IQRScanEntry[];

  status: WasteStatus;
  collectionRequestedTime?: string;
  collectionTime?: string;
  transitStartTime?: string;
  receivedTime?: string;
  treatmentStartTime?: string;
  treatmentTime?: string;
  disposalTime?: string;
  expectedDeliveryTime?: string;
  actualDeliveryTime?: string;
  treatmentMethod?: string;
  disposalMethod?: string;
  landfillCellId?: string;
  qrCode: string;
  manifestNumber: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAlert {
  _id?: string;
  alertId: string;
  recipientUserId: string;
  recipientRole?: string;
  shipmentId?: string;
  wasteId?: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionUrl?: string;
  voiceRequired: boolean;
  voiceStatus: 'PENDING' | 'PLAYED' | 'DISMISSED';
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface IInvestigation {
  _id?: string;
  investigationId: string;
  wasteId: string;
  shipmentId?: string;
  issueType: string;
  title: string;
  description: string;
  severity: 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  createdBy: {
    userId: string;
    name: string;
    role: string;
  };
  assignedTo: {
    userId: string;
    name: string;
    role: string;
    organization: string;
  };
  status: InvestigationStatus;
  quantityComparison?: {
    declaredQuantity: number;
    collectedQuantity?: number;
    receivedQuantity?: number;
    discrepancyAmount: number;
    unit: string;
  };
  evidence: Array<{
    evidenceId: string;
    title: string;
    fileUrl?: string;
    fileType?: string;
    uploadedBy: string;
    uploadedByName: string;
    uploadedAt: string;
    description?: string;
  }>;
  responses: Array<{
    responseId: string;
    senderUserId: string;
    senderName: string;
    senderRole: string;
    senderOrganization: string;
    message: string;
    attachments?: string[];
    createdAt: string;
  }>;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IIncident {
  _id?: string;
  incidentId: string;
  wasteId: string;
  shipmentId: string;
  reportedBy: {
    userId: string;
    name: string;
    role: string;
    phone?: string;
  };
  incidentType: IncidentType;
  description: string;
  location: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  attachments: string[];
  severity: 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  status: 'REPORTED' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED';
  responseActions?: Array<{
    action: string;
    performedBy: string;
    performedByName: string;
    timestamp: string;
  }>;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface IDocumentRecord {
  _id?: string;
  documentId: string;
  wasteId?: string;
  shipmentId?: string;
  documentType: string;
  documentNumber: string;
  title: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: {
    userId: string;
    name: string;
    role: string;
  };
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedBy?: {
    userId: string;
    name: string;
    verifiedAt: string;
  };
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAuditLog {
  _id?: string;
  auditId: string;
  timestamp: string;
  createdAt?: string;
  actorUserId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface IDashboardStats {
  totalWasteCount: number;
  totalWeightKg: number;
  activeShipmentsCount: number;
  inTransitCount: number;
  openInvestigationsCount: number;
  activeIncidentsCount: number;
  complianceRate: number;
  totalWasteDeclaredKg?: number;
  activeShipmentsInTransit?: number;
  unacknowledgedAlertsCount?: number;
  totalDisposedKg?: number;
  complianceRatingPercent?: number;
  discrepancyCount?: number;
  delayedShipmentsCount?: number;
  systemStatus?: string;
}
