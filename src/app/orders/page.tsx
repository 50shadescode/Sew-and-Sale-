'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STAGES = ['Intake', 'Ready', 'Cutting', 'Assignment', 'Sewing', 'QC', 'Dispatched'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const json = await res.json();
      if (json.success) setOrders(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.orderId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const advanceOrder = async (order: any) => {
    const currentIndex = STAGES.indexOf(order.status);
    if (currentIndex >= STAGES.length - 1) return;
    const nextStatus = STAGES[currentIndex + 1];

    try {
      const res = await fetch(`/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100">Production Pipeline</h1>
          <p className="text-base text-slate-400 mt-1">Track and manage active workshop orders</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by customer name or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-base w-full md:w-80 focus:border-blue-500 outline-none"
          />
          <Link
            href="/orders/new"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-xl transition shrink-0"
          >
            + Create Order
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-[1200px]">
          {STAGES.map((stage, idx) => {
            const stageOrders = filteredOrders.filter((o) => o.status === stage);
            return (
              <div key={stage} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 w-72 flex flex-col h-[75vh]">
                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2 flex-shrink-0">
                  <h2 className="text-xl font-bold text-slate-200">{idx + 1}. {stage}</h2>
                  <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-base px-3 py-1 rounded-full font-bold">
                    {stageOrders.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {stageOrders.map((order) => (
                    <div key={order._id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-base font-bold text-blue-400 font-mono bg-blue-500/10 px-2 py-1 rounded">{order.orderId}</span>
                        <span className="text-base text-amber-400 font-medium">Due {new Date(order.dueDate).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-100">{order.customerName}</h3>
                      <p className="text-base text-slate-400">{order.garmentType} • {order.fabricSelection} ({order.fabricQuantityRequired}m)</p>
                      
                      <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-base font-bold text-slate-100 font-mono">KES {order.priceTotal?.toLocaleString()}</span>
                        {stage !== 'Dispatched' && (
                          <button
                            onClick={() => advanceOrder(order)}
                            className="text-base font-bold text-blue-400 hover:text-white border border-blue-500/30 hover:bg-blue-600 px-3 py-1 rounded-lg transition"
                          >
                            Advance &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {stageOrders.length === 0 && (
                    <div className="h-24 flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-base">
                      No orders
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
