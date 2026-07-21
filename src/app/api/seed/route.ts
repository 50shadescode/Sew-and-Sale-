import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Inventory from '@/models/Inventory';
import Order from '@/models/Order';

export async function GET() {
  try {
    await connectDB();
    
    // 1. Clear existing collections to prevent duplicate key errors during seeding
    await Inventory.deleteMany({});
    await Order.deleteMany({});
    
    // 2. Seed Warehouse Inventory Items
    const inventoryItems = [
      { name: 'Cotton Fabric', category: 'Fabric', stockLevel: 450, minimumLevel: 500, unit: 'Meters' },
      { name: 'Denim Fabric', category: 'Fabric', stockLevel: 1200, minimumLevel: 800, unit: 'Meters' },
      { name: 'Khaki Fabric', category: 'Fabric', stockLevel: 100, minimumLevel: 150, unit: 'Meters' },
      { name: 'Silver Zippers', category: 'Hardware', stockLevel: 300, minimumLevel: 50, unit: 'Pieces' },
      { name: 'Gold Buttons', category: 'Hardware', stockLevel: 500, minimumLevel: 100, unit: 'Pieces' },
    ];
    
    const seededInventory = await Inventory.insertMany(inventoryItems);

    // 3. Seed Mock Operational Orders with Sales Reps
    const orderItems = [
      {
        orderId: 'ORD-1001',
        customerName: 'Amina Hassan',
        customerPhone: '0712345678',
        salesRep: 'Faith',
        garmentType: 'Suit',
        fabricSelection: 'Cotton Fabric',
        fabricQuantityRequired: 3.5,
        measurements: { neck: 15.5, chest: 40, waist: 34 },
        priceTotal: 15000,
        depositPaid: 10000,
        balanceRemaining: 5000,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'Intake',
      },
      {
        orderId: 'ORD-1002',
        customerName: 'Brian Otieno',
        customerPhone: '0722987654',
        salesRep: 'Phylis',
        garmentType: 'Native',
        fabricSelection: 'Khaki Fabric',
        fabricQuantityRequired: 2.5,
        measurements: { neck: 16, chest: 42, waist: 36 },
        priceTotal: 8500,
        depositPaid: 8500,
        balanceRemaining: 0,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'Cutting',
        fabricMetersUsed: 2.5,
        patternPiecesCut: 4,
      },
    ];

    const seededOrders = await Order.insertMany(orderItems);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Mock inventory and operational orders seeded successfully!',
      inventoryCount: seededInventory.length,
      ordersCount: seededOrders.length,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}