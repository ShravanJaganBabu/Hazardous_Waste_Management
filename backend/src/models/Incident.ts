import mongoose, { Document, Schema } from 'mongoose';

export type IncidentType =
  | 'ACCIDENT'
  | 'SPILL'
  | 'CONTAINER_DAMAGE'
  | 'VEHICLE_BREAKDOWN'
  | 'ROUTE_PROBLEM'
  | 'OTHER';

export type IncidentSeverity = 'WARNING' | 'CRITICAL' | 'EMERGENCY';
export type IncidentStatus = 'REPORTED' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED';

export interface IIncident extends Document {
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
  severity: IncidentSeverity;
  status: IncidentStatus;
  responseActions?: Array<{
    action: string;
    performedBy: string;
    performedByName: string;
    timestamp: Date;
  }>;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const IncidentSchema = new Schema<IIncident>(
  {
    incidentId: { type: String, required: true, unique: true, index: true },
    wasteId: { type: String, required: true, index: true },
    shipmentId: { type: String, required: true, index: true },
    reportedBy: {
      userId: { type: String, required: true, index: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
      phone: { type: String },
    },
    incidentType: {
      type: String,
      required: true,
      enum: ['ACCIDENT', 'SPILL', 'CONTAINER_DAMAGE', 'VEHICLE_BREAKDOWN', 'ROUTE_PROBLEM', 'OTHER'],
      index: true,
    },
    description: { type: String, required: true },
    location: {
      address: { type: String, required: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    attachments: [{ type: String }],
    severity: {
      type: String,
      required: true,
      enum: ['WARNING', 'CRITICAL', 'EMERGENCY'],
      default: 'CRITICAL',
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['REPORTED', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED'],
      default: 'REPORTED',
      index: true,
    },
    responseActions: [
      {
        action: { type: String, required: true },
        performedBy: { type: String, required: true },
        performedByName: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    resolutionNotes: { type: String },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const Incident = mongoose.model<IIncident>('Incident', IncidentSchema);
