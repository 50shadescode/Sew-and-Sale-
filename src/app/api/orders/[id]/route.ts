import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Dynamically update fields (status, cutting metrics, or tailor assignments)
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedOrder }, { status: 200 });
  } catch (error: any) {
    console.error('❌ PATCH API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}