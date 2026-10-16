import mongoose, { Document, Schema } from 'mongoose';
import { WasteStatus } from './Waste.js';

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
  timestamp: Date;
  deltaExplanation?: string;
}

export interface IQRScanEntry {
  stage: string;
  verifiedBy: string;
  verifierName: string;
  timestamp: Date;
  location?: string;
  status: string;
}

export interface IShipment extends Document {
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
    id: string; // userId e.g. HZU-005
    name: string;
    company: string;
    driverName: string;
    driverPhone: string;
    vehicleNumber: string;
    vehicleType: string;
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
      lastUpdated: Date;
    };
  };
  destinationFacility: {
    id: string; // userId e.g. HZU-006
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
  quantityChain: {
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
  riskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: IRiskFactor[];

  // Pillars 4 & 5: Live Visual Journey & Route Deviation
  routeTracking: {
    approvedRoute: string[];
    currentWaypointIndex: number;
    distanceTraveledKm: number;
    totalDistanceKm: number;
    isDeviated: boolean;
    deviationDistanceKm: number;
    deviationReason?: string;
    eta: Date;
    currentSpeedKmH: number;
  };

  // Pillar 13: QR Scan History & Digital Chain
  qrScanHistory: IQRScanEntry[];

  status: WasteStatus;
  collectionRequestedTime?: Date;
  collectionTime?: Date;
  transitStartTime?: Date;
  receivedTime?: Date;
  treatmentStartTime?: Date;
  treatmentTime?: Date;
  disposalTime?: Date;
  expectedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  treatmentMethod?: string;
  disposalMethod?: string;
  landfillCellId?: string;
  qrCode: string;
  manifestNumber: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentSchema = new Schema<IShipment>(
  {
    shipmentId: { type: String, required: true, unique: true, index: true },
    wasteId: { type: String, required: true, index: true },
    originOrganization: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      location: { type: String, required: true },
      contactPerson: { type: String, required: true },
      phone: { type: String, required: true },
    },
    transporter: {
      id: { type: String, required: true, index: true },
      name: { type: String, required: true },
      company: { type: String, required: true },
      driverName: { type: String, required: true },
      driverPhone: { type: String, required: true },
      vehicleNumber: { type: String, required: true },
      vehicleType: { type: String, required: true },
      gpsCoordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
        lastUpdated: { type: Date },
      },
    },
    destinationFacility: {
      id: { type: String, required: true, index: true },
      name: { type: String, required: true },
      facilityType: { type: String, required: true },
      location: { type: String, required: true },
      contactPerson: { type: String, required: true },
    },
    declaredQuantity: { type: Number, required: true },
    collectedQuantity: { type: Number },
    receivedQuantity: { type: Number },
    treatedQuantity: { type: Number },
    disposedQuantity: { type: Number },
    unit: { type: String, required: true, default: 'kg' },
    
    quantityChain: {
      declared: { type: Number },
      collected: { type: Number },
      received: { type: Number },
      treated: { type: Number },
      disposed: { type: Number },
      totalDifference: { type: Number, default: 0 },
      stageRecords: [
        {
          stage: { type: String },
          quantity: { type: Number },
          unit: { type: String },
          verifiedBy: { type: String },
          verifierName: { type: String },
          timestamp: { type: Date, default: Date.now },
          deltaExplanation: { type: String },
        },
      ],
    },

    discrepancy: {
      labToTransporterDiff: { type: Number, default: 0 },
      transporterToFacilityDiff: { type: Number, default: 0 },
      totalDiff: { type: Number, default: 0 },
      hasMismatch: { type: Boolean, default: false, index: true },
      mismatchReason: { type: String },
    },

    riskScore: { type: Number, default: 15 },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    riskFactors: [
      {
        factor: { type: String },
        points: { type: Number },
      },
    ],

    routeTracking: {
      approvedRoute: {
        type: [String],
        default: ['Origin Generator', 'Corridor Checkpoint A', 'Express Freightway', 'Destination Facility'],
      },
      currentWaypointIndex: { type: Number, default: 1 },
      distanceTraveledKm: { type: Number, default: 0 },
      totalDistanceKm: { type: Number, default: 45.0 },
      isDeviated: { type: Boolean, default: false },
      deviationDistanceKm: { type: Number, default: 0 },
      deviationReason: { type: String },
      eta: { type: Date },
      currentSpeedKmH: { type: Number, default: 42 },
    },

    qrScanHistory: [
      {
        stage: { type: String },
        verifiedBy: { type: String },
        verifierName: { type: String },
        timestamp: { type: Date, default: Date.now },
        location: { type: String },
        status: { type: String },
      },
    ],

    status: {
      type: String,
      required: true,
      enum: [
        'REGISTERED',
        'COLLECTION_REQUESTED',
        'COLLECTED',
        'IN_TRANSIT',
        'RECEIVED',
        'TREATED',
        'DISPOSED',
      ],
      default: 'REGISTERED',
      index: true,
    },
    collectionRequestedTime: { type: Date },
    collectionTime: { type: Date },
    transitStartTime: { type: Date },
    receivedTime: { type: Date },
    treatmentStartTime: { type: Date },
    treatmentTime: { type: Date },
    disposalTime: { type: Date },
    expectedDeliveryTime: { type: Date },
    actualDeliveryTime: { type: Date },
    treatmentMethod: { type: String },
    disposalMethod: { type: String },
    landfillCellId: { type: String },
    qrCode: { type: String, required: true },
    manifestNumber: { type: String, required: true, unique: true },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Shipment = mongoose.model<IShipment>('Shipment', ShipmentSchema);
