'use client';

import { useState, useEffect } from 'react';

const CUTTERS = ['Joseph'];
const TAILORS = ['Winnie', 'Fridah', 'Sammy', 'Leah'];

export default function WorkshopPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [fabricUsed, setFabricUsed] = useState(0);

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const json = await res.json();
    if (json.success) setOrders(json.data.filter((o: any) => o.status !== 'Dispatched'));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleUpdate = async (status: string, extra = {}) => {
    if (!selectedOrder) return;
    await fetch(`/api/orders/${selectedOrder._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    });
    setSelectedOrder(null);
    fetchOrders();
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <h1 className="text-3xl font-black text-slate-100">Workshop Floor</h1>

      {!selectedOrder ? (
        <div className="space-y-3">
          <label className="block text-base text-slate-400 font-bold">Select Active Garment:</label>
          {orders.map((order) => (
            <button
              key={order._id}
              onClick={() => { setSelectedOrder(order); setFabricUsed(order.fabricMetersUsed || 0); }}
              className="w-full text-left bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-blue-500 transition flex justify-between items-center"
            >
              <div>
                <span className="text-base font-bold text-blue-400 font-mono">{order.orderId}</span>
                <h4 className="font-bold text-slate-100 text-base">{order.customerName}</h4>
                <p className="text-base text-slate-400">{order.garmentType} • {order.status}</p>
              </div>
              <span className="text-xl text-slate-500">&rarr;</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setSelectedOrder(null)} className="text-base text-slate-400">&larr; Back</button>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-base font-bold text-blue-400 font-mono">{selectedOrder.orderId}</span>
            <h3 className="text-xl font-bold text-slate-100">{selectedOrder.customerName}</h3>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-base font-bold text-slate-300">Cut Fabric Meters</h4>
            <div className="flex items-center gap-4">
              <button onClick={() => setFabricUsed(p => Math.max(0, parseFloat((p - 0.1).toFixed(1))))} className="px-4 py-2 bg-slate-800 text-white font-bold text-xl rounded">-</button>
              <span className="text-xl font-mono text-slate-100 font-bold">{fabricUsed}m</span>
              <button onClick={() => setFabricUsed(p => parseFloat((p + 0.1).toFixed(1)))} className="px-4 py-2 bg-slate-800 text-white font-bold text-xl rounded">+</button>
            </div>
            <button onClick={() => handleUpdate('Cutting', { fabricMetersUsed: fabricUsed })} className="w-full py-2.5 bg-slate-800 text-white font-bold text-base rounded-lg">Log Cutting Data</button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-base font-bold text-slate-300">Assign Tailor</h4>
            <div className="grid grid-cols-2 gap-2">
              {TAILORS.map(t => (
                <button key={t} onClick={() => handleUpdate('Assignment', { assignedTailor: t })} className="p-2.5 bg-slate-900 border border-slate-800 hover:border-blue-500 text-slate-200 font-bold text-base rounded-lg">{t}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
