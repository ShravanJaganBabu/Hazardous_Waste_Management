import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'ADMIN' | 'LABORATORY' | 'INDUSTRY' | 'TRANSPORTER' | 'TREATMENT_FACILITY';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';

export interface ILoginRecord {
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  success: boolean;
}

export interface IUser extends Document {
  userId: string; // e.g. HZU-001, HZU-005
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationName: string;
  status: UserStatus;
  phone?: string;
  avatarUrl?: string;
  lastLogin?: Date;
  failedAttempts: number;
  lockedUntil?: Date;
  activeSessions: number;
  loginHistory: ILoginRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['ADMIN', 'LABORATORY', 'INDUSTRY', 'TRANSPORTER', 'TREATMENT_FACILITY'],
      index: true,
    },
    organizationName: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED'],
      default: 'ACTIVE',
      index: true,
    },
    phone: { type: String },
    avatarUrl: { type: String },
    lastLogin: { type: Date },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    activeSessions: { type: Number, default: 1 },
    loginHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        ip: { type: String },
        userAgent: { type: String },
        success: { type: Boolean, default: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent returning passwordHash in JSON queries
UserSchema.set('toJSON', {
  transform: function (_doc, ret) {
    const { passwordHash, ...safeUser } = ret;
    return safeUser;
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);
