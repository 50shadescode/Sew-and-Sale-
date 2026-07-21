import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Inventory from '@/models/Inventory';

// GET: Fetch all inventory items for Leah's dashboard
export async function GET() {
  try {
    await connectDB();
    const items = await Inventory.find({}).sort({ category: 1, name: 1 });
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Allow Leah to update stock levels or add stock directly
export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, stockLevel, minimumLevel } = body;

    const updatedItem = await Inventory.findOneAndUpdate(
      { name },
      { stockLevel, minimumLevel },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}