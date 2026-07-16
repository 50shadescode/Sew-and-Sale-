import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Inventory from '@/models/Inventory';

// 1. GET ALL ORDERS FROM ATLAS DB
export async function GET() {
  try {
    await dbConnect();
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error: any) {
    console.error('❌ GET API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. CREATE A NEW INTAKE ORDER (WITH AUTO-GENERATED SEQUENCE ORDER-ID & AUTO-STOCK CHECK)
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // 1. Auto Stock Check: Verify if enough fabric exists in inventory before creating the order
    const stockItem = await Inventory.findOne({ name: body.fabricSelection, category: 'Fabric' });
    if (!stockItem) {
      return NextResponse.json(
        { success: false, message: `Fabric "${body.fabricSelection}" does not exist in inventory!` },
        { status: 400 }
      );
    }

    if (stockItem.stockLevel < body.fabricQuantityRequired) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Insufficient stock alert! Required: ${body.fabricQuantityRequired}m, Available: ${stockItem.stockLevel}m.` 
        },
        { status: 400 }
      );
    }

    // 2. Systematically calculate sequential order IDs to prevent duplicate validation crashes
    const totalExistingCount = await Order.countDocuments();
    const generatedOrderId = `ORD-${1000 + totalExistingCount + 1}`;

    // 3. Compute remaining balance automatically based on price totals and deposits
    const priceTotal = Number(body.priceTotal) || 0;
    const depositPaid = Number(body.depositPaid) || 0;
    const balanceRemaining = priceTotal - depositPaid;

    // 4. Map incoming properties cleanly to match your detailed model schema
    const newOrder = await Order.create({
      orderId: generatedOrderId,
      customerName: body.customerName,
      customerPhone: body.customerPhone || '',
      garmentType: body.garmentType || 'Suit',
      fabricSelection: body.fabricSelection,
      fabricQuantityRequired: Number(body.fabricQuantityRequired) || 0,
      measurements: {
        neck: Number(body.measurements?.neck) || 0,
        chest: Number(body.measurements?.chest) || 0,
        waist: Number(body.measurements?.waist) || 0,
      },
      priceTotal,
      depositPaid,
      balanceRemaining,
      dueDate: body.dueDate ? new Date(body.dueDate) : new Date(),
      status: 'Intake', // Matches the exact capitalized schema validation string
    });

    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error('❌ POST API Validation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}