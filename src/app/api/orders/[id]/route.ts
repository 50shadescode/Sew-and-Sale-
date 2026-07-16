import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Inventory from '@/models/Inventory';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // 1. Fetch current document state to inspect baseline status markers
    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // 2. Track when a card steps into active production (Stage 2 or 3)
    const isEnteringProduction = ['Ready', 'Cutting'].includes(status);
    const wasAlreadyInProduction = ['Ready', 'Cutting', 'Assignment', 'Sewing', 'QC', 'Dispatched'].includes(currentOrder.status);

    if (isEnteringProduction && !wasAlreadyInProduction) {
      // Execute Automated Material Lifecycle Deduction
      const fabric = await Inventory.findOne({ name: currentOrder.fabricSelection, category: 'Fabric' });
      
      if (fabric) {
        if (fabric.stockLevel < currentOrder.fabricQuantityRequired) {
          return NextResponse.json({ 
            success: false, 
            error: `Material lockout! Insufficient ${fabric.name} in stock to initiate production cutting.` 
          }, { status: 400 });
        }

        // Deduct inventory atomically from rolls
        fabric.stockLevel -= currentOrder.fabricQuantityRequired;
        await fabric.save();
      }
    }

    // 3. Apply state machine transitions dynamically
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: updatedOrder }, { status: 200 });
  } catch (error: any) {
    console.error('❌ PATCH API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}