'use client';

import { useState, useEffect } from 'react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(json => json.success && setInventory(json.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-slate-100">Inventory & Fabric Stock</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map((item) => {
          const isLow = item.stockLevel <= item.minimumLevel;
          const percentage = Math.min(100, Math.round((item.stockLevel / (item.minimumLevel * 2)) * 100));

          return (
            <div key={item._id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-100 text-xl">{item.name}</h4>
                  <span className="text-base font-mono text-slate-400">{item.category}</span>
                </div>
                <span className={`text-base font-mono font-bold px-3 py-1 rounded ${isLow ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {item.stockLevel} {item.unit}
                </span>
              </div>

              <div className="space-y-1">
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className={`h-full transition-all ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${percentage}%` }} />
                </div>
                <div className="flex justify-between text-base font-mono text-slate-500">
                  <span>Min Threshold: {item.minimumLevel} {item.unit}</span>
                  <span>{percentage}% Stocked</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
