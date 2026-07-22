'use client';

import { useState, useEffect } from 'react';

const TAILORS = ['Winnie', 'Fridah', 'Sammy', 'Leah'];

const GARMENT_ICONS: Record<string, string> = {
  Suit: '👔',
  Dress: '👗',
  Shirt: '👕',
  Native: '👘',
};

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
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-3xl font-black text-slate-100">Workshop Floor</h1>
        <p className="text-base text-slate-400 mt-1">Mobile tailor execution matrix</p>
      </div>

      {!selectedOrder ? (
        <div className="space-y-4">
          <label className="block text-base text-slate-300 font-bold">Select Active Garment Job:</label>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {orders.map((order) => (
              <button
                key={order._id}
                onClick={() => { setSelectedOrder(order); setFabricUsed(order.fabricMetersUsed || 0); }}
                className="w-full text-left bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-blue-500 transition flex items-center justify-between group shadow-md"
              >
                <div className="flex items-center space-x-4">
                  {/* Visual Garment Icon Badge */}
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shrink-0">
                    {GARMENT_ICONS[order.garmentType] || '✂️'}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-blue-400 font-mono">{order.orderId}</span>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">{order.status}</span>
                    </div>
                    <h4 className="font-bold text-slate-100 text-base mt-0.5">{order.customerName}</h4>
                    <p className="text-base text-slate-400">{order.garmentType} • {order.fabricSelection}</p>
                  </div>
                </div>

                <span className="text-xl text-slate-500 group-hover:text-blue-400 transition">&rarr;</span>
              </button>
            ))}

            {orders.length === 0 && (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                <span className="text-3xl">🎉</span>
                <p className="text-base text-slate-300 font-bold">All active jobs completed!</p>
                <p className="text-xs text-slate-500">No pending workshop items in pipeline.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          <button onClick={() => setSelectedOrder(null)} className="text-base font-bold text-blue-400 hover:underline">&larr; Back to Order List</button>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shrink-0">
              {GARMENT_ICONS[selectedOrder.garmentType] || '✂️'}
            </div>
            <div>
              <span className="text-base font-bold text-blue-400 font-mono">{selectedOrder.orderId}</span>
              <h3 className="text-xl font-bold text-slate-100">{selectedOrder.customerName}</h3>
              <p className="text-base text-slate-400">{selectedOrder.garmentType} ({selectedOrder.fabricSelection})</p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-base font-bold text-slate-200">Cutting Department Log</h4>
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
              <button onClick={() => setFabricUsed(p => Math.max(0, parseFloat((p - 0.1).toFixed(1))))} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl rounded-lg">-</button>
              <span className="text-2xl font-mono text-slate-100 font-black">{fabricUsed}m</span>
              <button onClick={() => setFabricUsed(p => parseFloat((p + 0.1).toFixed(1)))} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl rounded-lg">+</button>
            </div>
            <button onClick={() => handleUpdate('Cutting', { fabricMetersUsed: fabricUsed })} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-lg transition uppercase tracking-wider">
              Submit Cutting Data
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-base font-bold text-slate-200">Assign Assembly Tailor</h4>
            <div className="grid grid-cols-2 gap-2">
              {TAILORS.map(t => (
                <button
                  key={t}
                  onClick={() => handleUpdate('Assignment', { assignedTailor: t })}
                  className="p-3 bg-slate-900 border border-slate-800 hover:border-blue-500 text-slate-200 font-bold text-base rounded-xl transition"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
