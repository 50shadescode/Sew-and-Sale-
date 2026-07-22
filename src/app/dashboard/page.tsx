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
  const lowStockItems = inventory.filter((item) => item.stockLevel <= item.minimumLevel);
  const todayStr = new Date().toISOString().split('T')[0];
  const dueToday = orders.filter((o) => o.dueDate && o.dueDate.startsWith(todayStr));

  return (
    <div className="space-y-8">
      {/* Executive Briefing Banner */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-4">
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
          Operational overview for today:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-base text-slate-400 block">Today's Revenue</span>
            <span className="text-3xl font-black text-emerald-400 font-mono mt-1 block">
              KES {totalDeposits.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-base text-slate-400 block">Orders Due Today</span>
            <span className="text-3xl font-black text-amber-400 font-mono mt-1 block">
              {dueToday.length} Pending
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-base text-slate-400 block">Unpaid Accounts</span>
            <span className="text-3xl font-black text-rose-400 font-mono mt-1 block">
              KES {totalOutstanding.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-base text-slate-400 block">Low Stock Alerts</span>
            <span className={`text-3xl font-black font-mono mt-1 block ${lowStockItems.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {lowStockItems.length} Materials
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Triggers */}
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
