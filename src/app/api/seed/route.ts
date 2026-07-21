import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Inventory from '@/models/Inventory';

export async function GET() {
  try {
    await connectDB();
    
    // Clear inventory to prevent duplicate keys during seeds
    await Inventory.deleteMany({});
    
    const items = [
      { name: 'Cotton Fabric', category: 'Fabric', stockLevel: 450, minimumLevel: 500, unit: 'Meters' },
      { name: 'Denim Fabric', category: 'Fabric', stockLevel: 1200, minimumLevel: 800, unit: 'Meters' },
      { name: 'Khaki Fabric', category: 'Fabric', stockLevel: 100, minimumLevel: 150, unit: 'Meters' },
      { name: 'Silver Zippers', category: 'Hardware', stockLevel: 300, minimumLevel: 50, unit: 'Pieces' },
    ];
    
    await Inventory.insertMany(items);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Mock inventory seeded successfully!' 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}