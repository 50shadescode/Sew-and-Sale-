'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((json) => json.success && setOrders(json.data));

    fetch('/api/inventory')
      .then((res) => res.json())
      .then((json) => json.success && setInventory(json.data));
  }, []);

  const totalDeposits = orders.reduce((acc, curr) => acc + (curr.depositPaid || 0), 0);
  const totalOutstanding = orders.reduce((acc, curr) => acc + (curr.balanceRemaining || 0), 0);
  const unpaidCount = orders.filter((o) => (o.balanceRemaining || 0) > 0).length;
  const activeOrders = orders.filter((o) => o.status !== 'Dispatched');
  const lowStockItems = inventory.filter((item) => item.stockLevel <= item.minimumLevel);
  const todayStr = new Date().toISOString().split('T')[0];
  const dueToday = orders.filter((o) => o.dueDate && o.dueDate.startsWith(todayStr));

  return (
    <div className="space-y-8">
      {/* Executive Briefing Banner */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-2 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
              DAILY BRIEFING
            </span>
            <h1 className="text-3xl font-black text-slate-100">Good Morning, Leah</h1>
          </div>
          <span className="text-base font-mono font-bold text-slate-400 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <p className="text-base text-slate-300">
          Operational answers and action triggers for today:
        </p>

        {/* Actionable KPI Cards Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Today's Sales Card */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-sm font-bold text-slate-400 block">Today's Sales</span>
              <span className="text-3xl font-black text-emerald-400 font-mono mt-1 block">
                KES {totalDeposits.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-400 font-semibold block mt-1">
                ↑ 15% compared to yesterday
              </span>
            </div>
            <Link
              href="/finance"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline pt-2 border-t border-slate-800 flex justify-between items-center"
            >
              <span>View Financial Ledger</span>
              <span>→</span>
            </Link>
          </div>

          {/* Outstanding Payments Card */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-sm font-bold text-slate-400 block">Outstanding Balances</span>
              <span className="text-3xl font-black text-rose-400 font-mono mt-1 block">
                KES {totalOutstanding.toLocaleString()}
              </span>
              <span className="text-xs text-rose-400 font-semibold block mt-1">
                {unpaidCount} Accounts Pending Balance
              </span>
            </div>
            <Link
              href="/finance"
              className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline pt-2 border-t border-slate-800 flex justify-between items-center"
            >
              <span>Collect Payments</span>
              <span>→</span>
            </Link>
          </div>

          {/* Orders in Progress Card */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-sm font-bold text-slate-400 block">Orders in Progress</span>
              <span className="text-3xl font-black text-amber-400 font-mono mt-1 block">
                {activeOrders.length} Active
              </span>
              <span className="text-xs text-amber-400 font-semibold block mt-1">
                {dueToday.length} Orders Due Today
              </span>
            </div>
            <Link
              href="/orders"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline pt-2 border-t border-slate-800 flex justify-between items-center"
            >
              <span>View Pipeline Board</span>
              <span>→</span>
            </Link>
          </div>

          {/* Inventory Reorder Alert Card */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-sm font-bold text-slate-400 block">Inventory Alerts</span>
              <span className={`text-3xl font-black font-mono mt-1 block ${lowStockItems.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {lowStockItems.length > 0 ? `${lowStockItems.length} Materials` : 'Healthy'}
              </span>
              <span className="text-xs text-slate-400 font-semibold block mt-1">
                {lowStockItems.length > 0 ? lowStockItems.map(i => i.name).join(', ') : 'All stocks above safety minimum'}
              </span>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline pt-2 border-t border-slate-800 flex justify-between items-center"
            >
              <span>Restock Materials</span>
              <span>→</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Primary Task Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/orders/new"
          className="bg-blue-600 hover:bg-blue-500 text-white p-6 rounded-2xl font-bold transition text-center space-y-2 block"
        >
          <h2 className="text-xl font-bold">New Order Booking</h2>
          <p className="text-base opacity-90">Open 5-Step Intake Wizard</p>
        </Link>

        <Link
          href="/orders"
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl font-bold transition text-center space-y-2 block"
        >
          <h2 className="text-xl font-bold text-slate-100">Production Pipeline</h2>
          <p className="text-base text-slate-400">View Active Kanban Board</p>
        </Link>

        <Link
          href="/inventory"
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl font-bold transition text-center space-y-2 block"
        >
          <h2 className="text-xl font-bold text-slate-100">Inventory Status</h2>
          <p className="text-base text-slate-400">Check Fabric & Supplies</p>
        </Link>
      </div>
    </div>
  );
}
