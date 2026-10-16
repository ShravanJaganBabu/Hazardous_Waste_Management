import mongoose, { Document, Schema } from 'mongoose';

export type WasteStatus =
  | 'REGISTERED'
  | 'COLLECTION_REQUESTED'
  | 'COLLECTED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'TREATED'
  | 'DISPOSED';

export type HazardLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export interface IWaste extends Document {
  wasteId: string;
  organizationId: string;
  organizationName: string;
  registeredBy: string; // userId
  registeredByName: string;
  wasteType: string;
  category: string;
  declaredQuantity: number;
  unit: string;
  description: string;
  hazardLevel: HazardLevel;
  handlingInstructions?: string;
  registrationDate: Date;
  currentStatus: WasteStatus;
  qrCode: string;
  requiredDocuments: Array<{
    name: string;
    type: string;
    uploaded: boolean;
    documentId?: string;
  }>;
  activeShipmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WasteSchema = new Schema<IWaste>(
  {
    wasteId: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    organizationName: { type: String, required: true },
    registeredBy: { type: String, required: true, index: true },
    registeredByName: { type: String, required: true },
    wasteType: { type: String, required: true, index: true },
    category: { type: String, required: true },
    declaredQuantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, default: 'kg' },
    description: { type: String, required: true },
    hazardLevel: {
      type: String,
      required: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'],
      default: 'HIGH',
      index: true,
    },
    handlingInstructions: { type: String },
    registrationDate: { type: Date, default: Date.now, index: true },
    currentStatus: {
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
    qrCode: { type: String, required: true },
    requiredDocuments: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        uploaded: { type: Boolean, default: false },
        documentId: { type: String },
      },
    ],
    activeShipmentId: { type: String, index: true },
  },
  {
    timestamps: true,
  }
);

export const Waste = mongoose.model<IWaste>('Waste', WasteSchema);
