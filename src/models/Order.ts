import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
  orderId: string; // e.g., "ORD-1001"
  customerName: string;
  customerPhone?: string;
  garmentType: string; 
  measurements: {
    neck?: number;
    chest?: number;
    waist?: number;
    [key: string]: number | undefined;
  };
  fabricSelection: string;
  fabricMetersUsed?: number;
  patternPiecesCut?: number;
  status: 
    | 'INTAKE' 
    | 'READY_FOR_PRODUCTION' 
    | 'CUTTING_AREA' 
    | 'ASSIGNMENT' 
    | 'PRODUCTION_SEWING' 
    | 'CONTROL_TOWER_QC' 
    | 'DISPATCHED';
  assignedTailor?: string;
  price: number;
  amountPaid: number;
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  dueDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema<IOrder> = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    garmentType: {
      type: String,
      required: [true, 'Garment type is required'],
      trim: true,
    },
    measurements: {
      neck: Number,
      chest: Number,
      waist: Number,
    },
    fabricSelection: {
      type: String,
      required: [true, 'Fabric selection is required'],
    },
    fabricMetersUsed: {
      type: Number,
      default: 0,
    },
    patternPiecesCut: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'INTAKE',
        'READY_FOR_PRODUCTION',
        'CUTTING_AREA',
        'ASSIGNMENT',
        'PRODUCTION_SEWING',
        'CONTROL_TOWER_QC',
        'DISPATCHED',
      ],
      default: 'INTAKE',
    },
    assignedTailor: {
      type: String,
      default: null,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Partial', 'Paid'],
      default: 'Unpaid',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;