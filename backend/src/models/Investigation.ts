import mongoose, { Document, Schema } from 'mongoose';

export type InvestigationStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'AWAITING_RESPONSE'
  | 'RESPONSE_RECEIVED'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'VIOLATION_CONFIRMED';

export type InvestigationIssueType =
  | 'QUANTITY_MISMATCH'
  | 'TRANSIT_DELAY'
  | 'UNAUTHORIZED_ROUTE'
  | 'SEAL_TAMPERING'
  | 'DOCUMENT_FALSIFICATION'
  | 'SPILL_NEGLIGENCE'
  | 'IMPROPER_HANDLING'
  | 'OTHER';

export interface IInvestigation extends Document {
  investigationId: string;
  wasteId: string;
  shipmentId?: string;
  issueType: InvestigationIssueType;
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
    uploadedAt: Date;
    description?: string;
  }>;
  responses: Array<{
    responseId: string;
    senderUserId: string;
    senderName: string;
    senderRole: string;
    senderOrganization: string;
    message: string;
    attachments: string[];
    createdAt: Date;
  }>;
  resolution?: {
    resolvedBy: string;
    resolvedByName: string;
    resolutionNote: string;
    verdict: 'EXPLANATION_ACCEPTED' | 'RECTIFIED' | 'VIOLATION_CONFIRMED' | 'DISMISSED';
    penaltyOrAction?: string;
    resolvedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const InvestigationSchema = new Schema<IInvestigation>(
  {
    investigationId: { type: String, required: true, unique: true, index: true },
    wasteId: { type: String, required: true, index: true },
    shipmentId: { type: String, index: true },
    issueType: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ['WARNING', 'CRITICAL', 'EMERGENCY'],
      default: 'CRITICAL',
      index: true,
    },
    createdBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    assignedTo: {
      userId: { type: String, required: true, index: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
      organization: { type: String, required: true },
    },
    status: {
      type: String,
      required: true,
      enum: [
        'OPEN',
        'UNDER_INVESTIGATION',
        'AWAITING_RESPONSE',
        'RESPONSE_RECEIVED',
        'UNDER_REVIEW',
        'RESOLVED',
        'VIOLATION_CONFIRMED',
      ],
      default: 'OPEN',
      index: true,
    },
    quantityComparison: {
      declaredQuantity: { type: Number },
      collectedQuantity: { type: Number },
      receivedQuantity: { type: Number },
      discrepancyAmount: { type: Number },
      unit: { type: String, default: 'kg' },
    },
    evidence: [
      {
        evidenceId: { type: String, required: true },
        title: { type: String, required: true },
        fileUrl: { type: String },
        fileType: { type: String },
        uploadedBy: { type: String, required: true },
        uploadedByName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        description: { type: String },
      },
    ],
    responses: [
      {
        responseId: { type: String, required: true },
        senderUserId: { type: String, required: true },
        senderName: { type: String, required: true },
        senderRole: { type: String, required: true },
        senderOrganization: { type: String, required: true },
        message: { type: String, required: true },
        attachments: [{ type: String }],
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resolution: {
      resolvedBy: { type: String },
      resolvedByName: { type: String },
      resolutionNote: { type: String },
      verdict: {
        type: String,
        enum: ['EXPLANATION_ACCEPTED', 'RECTIFIED', 'VIOLATION_CONFIRMED', 'DISMISSED'],
      },
      penaltyOrAction: { type: String },
      resolvedAt: { type: Date },
    },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const Investigation = mongoose.model<IInvestigation>('Investigation', InvestigationSchema);
