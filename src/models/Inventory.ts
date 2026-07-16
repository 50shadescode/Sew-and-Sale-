import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IInventory extends Document {
  name: string;
  category: 'Fabric' | 'Hardware' | 'Finished Products'; // Decoupled multi-category inventory design[cite: 1]
  stockLevel: number; // Quantity in stock (e.g., meters, pieces, units)[cite: 1]
  minimumLevel: number; // Dynamic low-stock threshold rule[cite: 1]
  unit: string; // 'Meters', 'Pieces', etc.[cite: 1]
}

const InventorySchema = new Schema<IInventory>({
  name: { type: String, required: true, unique: true },
  category: { type: String, enum: ['Fabric', 'Hardware', 'Finished Products'], required: true },
  stockLevel: { type: Number, required: true, default: 0 },
  minimumLevel: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true, default: 'Meters' }
}, { timestamps: true });

export default models.Inventory || model<IInventory>('Inventory', InventorySchema);