import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

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

// 2. CREATE A NEW INTAKE ORDER (WITH AUTO-GENERATED SEQUENCE ORDER-ID)
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Systematically calculate sequential order IDs to prevent MongoDB validation crashes
    const totalExistingCount = await Order.countDocuments();
    const generatedOrderId = `ORD-${1000 + totalExistingCount + 1}`;

    // Map incoming frontend properties safely and fall back on required schema elements
    const newOrder = await Order.create({
      orderId: generatedOrderId,
      customerName: body.customerName,
      customerPhone: body.customerPhone || '',
      garmentType: body.garmentType || 'Suit',
      fabricSelection: body.fabricSelection,
      price: Number(body.price),
      dueDate: body.dueDate ? new Date(body.dueDate) : new Date(),
      amountPaid: body.amountPaid || 0,
      paymentStatus: body.paymentStatus || 'Unpaid',
      measurements: body.measurements || {}, // satisfy default object shape
      status: 'INTAKE', // always lock to stage 1 upon intake registration
    });

    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error('❌ POST API Validation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}