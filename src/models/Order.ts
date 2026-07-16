import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  customerName: string;
  customerPhone: string;
  garmentType: 'Suit' | 'Dress' | 'Shirt' | 'Native';
  fabricSelection: string; // References Inventory Item ID/Name
  fabricQuantityRequired: number; // Meters needed for this custom build
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
  assignedTailor: string | null;
}

const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  garmentType: { type: String, enum: ['Suit', 'Dress', 'Shirt', 'Native'], required: true },
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
  assignedTailor: { type: String, default: null }
}, { timestamps: true });

export default models.Order || model<IOrder>('Order', OrderSchema);