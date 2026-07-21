import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  customerName: string;
  customerPhone: string;
  salesRep?: string; // 👈 Track sales team member (Faith / Phylis)
  garmentType: 'Suit' | 'Dress' | 'Shirt' | 'Native';
  fabricSelection: string; // References Inventory Item Name
  fabricQuantityRequired: number; // Meters needed for custom build
  measurements: {
    neck: number;
    chest: number;
    waist: number;
  };
  priceTotal: number;
  depositPaid: number;
  balanceRemaining: number;
  dueDate: Date;
  status: 'Intake' | 'Ready' | 'Cutting' | 'Assignment' | 'Sewing' | 'QC' | 'Dispatched';
  fabricMetersUsed?: number; // 👈 Logged by Cutting (Joseph)
  patternPiecesCut?: number; // 👈 Logged by Cutting (Joseph)
  assignedTailor?: string | null; // 👈 Assigned tailor (Winnie, Fridah, Sammy, Leah)
  qcPassedBy?: string | null; // 👈 Approved inspector (Simon / Safari)
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    salesRep: { type: String, default: 'Faith' },
    garmentType: { 
      type: String, 
      enum: ['Suit', 'Dress', 'Shirt', 'Native'], 
      required: true 
    },
    fabricSelection: { type: String, required: true },
    fabricQuantityRequired: { type: Number, required: true, default: 0 },
    measurements: {
      neck: { type: Number, required: true, default: 0 },
      chest: { type: Number, required: true, default: 0 },
      waist: { type: Number, required: true, default: 0 },
    },
    priceTotal: { type: Number, required: true },
    depositPaid: { type: Number, required: true, default: 0 },
    balanceRemaining: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['Intake', 'Ready', 'Cutting', 'Assignment', 'Sewing', 'QC', 'Dispatched'],
      default: 'Intake' 
    },
    fabricMetersUsed: { type: Number, default: 0 },
    patternPiecesCut: { type: Number, default: 0 },
    assignedTailor: { type: String, default: null },
    qcPassedBy: { type: String, default: null }, // 👈 Added Mongoose field
  },
  { timestamps: true }
);
export default models.Order || model<IOrder>('Order', OrderSchema);