'use client';

import { useState, useEffect } from 'react';

export default function FinancePage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(json => json.success && setOrders(json.data));
  }, []);

  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.priceTotal || 0), 0);
  const totalDeposits = orders.reduce((acc, curr) => acc + (curr.depositPaid || 0), 0);
  const totalOutstanding = orders.reduce((acc, curr) => acc + (curr.balanceRemaining || 0), 0);
  const unpaidOrders = orders.filter(o => o.balanceRemaining > 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-100">Financial Ledger</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <span className="text-base font-bold text-slate-400 uppercase">Gross Revenue</span>
          <span className="text-3xl font-black text-slate-100 font-mono mt-2 block">KES {totalRevenue.toLocaleString()}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <span className="text-base font-bold text-emerald-400 uppercase">Collected Cash</span>
          <span className="text-3xl font-black text-emerald-400 font-mono mt-2 block">KES {totalDeposits.toLocaleString()}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <span className="text-base font-bold text-rose-400 uppercase">Unpaid Balances</span>
          <span className="text-3xl font-black text-rose-400 font-mono mt-2 block">KES {totalOutstanding.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Accounts with Pending Balances</h2>
        <div className="divide-y divide-slate-800">
          {unpaidOrders.map(order => (
            <div key={order._id} className="py-4 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-100 text-base">{order.customerName}</h4>
                <p className="text-base text-slate-400">{order.garmentType} • Order {order.orderId}</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-rose-400 font-mono block">KES {order.balanceRemaining?.toLocaleString()} Unpaid</span>
                <span className="text-base text-slate-500">Total: KES {order.priceTotal?.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
