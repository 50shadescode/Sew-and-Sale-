'use client';

import './globals.css';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickDial, setShowQuickDial] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then((res) => res.json()),
      fetch('/api/inventory').then((res) => res.json())
    ]).then(([ordersRes, invRes]) => {
      const activeAlerts: string[] = [];
      
      if (invRes.success && Array.isArray(invRes.data)) {
        const lowStock = invRes.data.filter((i: any) => i.stockLevel <= i.minimumLevel);
        if (lowStock.length > 0) {
          activeAlerts.push(`${lowStock.length} materials running low on stock`);
        }
      }

      if (ordersRes.success && Array.isArray(ordersRes.data)) {
        const todayStr = new Date().toISOString().split('T')[0];
        const dueToday = ordersRes.data.filter((o: any) => o.dueDate && o.dueDate.startsWith(todayStr));
        if (dueToday.length > 0) {
          activeAlerts.push(`${dueToday.length} orders due for completion today`);
        }
      }

      setAlerts(activeAlerts);
    }).catch(err => console.error(err));
  }, []);

  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col antialiased relative selection:bg-blue-600 selection:text-white">
        
        {/* Persistent Navigation Header */}
        <header className="bg-slate-900 border-b border-slate-800 px-8 py-4 sticky top-0 z-40 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12 overflow-hidden rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <Image
                src="/logo.jpg"
                alt="Sew & Sell Logo"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <span className="text-base font-bold text-blue-400 uppercase tracking-widest block">
                SEW & SELL UNIFORMS
              </span>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                Management Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Primary Nav */}
            <nav className="flex bg-slate-950 p-2 rounded-xl border border-slate-800 text-base">
              <Link href="/dashboard" className="px-4 py-2 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition">Dashboard</Link>
              <Link href="/orders" className="px-4 py-2 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition">Orders</Link>
              <Link href="/workshop" className="px-4 py-2 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition">Workshop</Link>
              <Link href="/inventory" className="px-4 py-2 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition">Inventory</Link>
              <Link href="/finance" className="px-4 py-2 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition">Finance</Link>
            </nav>

            {/* Notification Center Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition relative flex items-center justify-center"
                aria-label="Notification Center"
              >
                <span className="text-xl">🔔</span>
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-black text-xs rounded-full flex items-center justify-center border-2 border-slate-900">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popup */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 className="text-xl font-bold text-slate-100">Notifications</h3>
                    <span className="text-base text-slate-400 font-mono">{alerts.length} Active</span>
                  </div>
                  {alerts.length > 0 ? (
                    <div className="space-y-2">
                      {alerts.map((a, i) => (
                        <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-base text-amber-400 font-medium flex items-center gap-2">
                          <span>⚠️</span>
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base text-slate-400 py-2">No critical alerts for today.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-8 max-w-[1600px] w-full mx-auto space-y-8">
          {children}
        </main>

        {/* Floating Quick Action Dial (+) */}
        <div className="fixed bottom-8 right-8 z-50">
          {showQuickDial && (
            <div className="mb-4 flex flex-col space-y-3 items-end animate-in fade-in slide-in-from-bottom-3 duration-200">
              <Link
                href="/orders/new"
                onClick={() => setShowQuickDial(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold text-base shadow-xl flex items-center space-x-2 transition"
              >
                <span>📝 Book New Order</span>
              </Link>
              <Link
                href="/finance"
                onClick={() => setShowQuickDial(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-5 py-3 rounded-xl font-black text-base shadow-xl flex items-center space-x-2 transition"
              >
                <span>💰 Record Payment</span>
              </Link>
              <Link
                href="/inventory"
                onClick={() => setShowQuickDial(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-5 py-3 rounded-xl font-bold text-base shadow-xl border border-slate-700 flex items-center space-x-2 transition"
              >
                <span>📦 Adjust Inventory</span>
              </Link>
            </div>
          )}

          <button
            onClick={() => setShowQuickDial(!showQuickDial)}
            className="w-16 h-16 bg-blue-600 hover:bg-blue-500 text-white font-black text-3xl rounded-full shadow-2xl flex items-center justify-center transition active:scale-95 border-2 border-blue-400"
          >
            {showQuickDial ? '✕' : '+'}
          </button>
        </div>

      </body>
    </html>
  );
}
