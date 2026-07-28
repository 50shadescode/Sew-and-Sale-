'use client';

import { useState, useEffect } from 'react';

export default function FinancePage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((json) => json.success && setOrders(json.data));
  }, []);

  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.priceTotal || 0), 0);
  const totalDeposits = orders.reduce((acc, curr) => acc + (curr.depositPaid || 0), 0);
  const totalOutstanding = orders.reduce((acc, curr) => acc + (curr.balanceRemaining || 0), 0);
  const unpaidOrders = orders.filter((o) => (o.balanceRemaining || 0) > 0);

  // CSV Generator and Downloader Function
  const exportToCSV = () => {
    if (orders.length === 0) {
      alert('No financial records available to export.');
      return;
    }

    // CSV Column Headers
    const headers = [
      'Order ID',
      'Customer Name',
      'Phone Number',
      'Garment Type',
      'Total Price (KES)',
      'Deposit Paid (KES)',
      'Balance Unpaid (KES)',
      'Due Date',
      'Status'
    ];

    // Format Order Rows
    const rows = orders.map((o) => [
      `"${o.orderId || ''}"`,
      `"${o.customerName || ''}"`,
      `"${o.customerPhone || ''}"`,
      `"${o.garmentType || ''}"`,
      o.priceTotal || 0,
      o.depositPaid || 0,
      o.balanceRemaining || 0,
      `"${o.dueDate ? new Date(o.dueDate).toLocaleDateString('en-GB') : ''}"`,
      `"${o.status || ''}"`
    ]);

    // Construct CSV String
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n');

    // Trigger File Download in Browser
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `sew_and_sell_financial_report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100">Financial Ledger</h1>
          <p className="text-base text-slate-400 mt-1">
            Revenue breakdowns, collected payments, and bookkeeping exports
          </p>
        </div>

        {/* 1-Click CSV Export Button */}
        <button
          onClick={exportToCSV}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-base rounded-xl transition shrink-0 flex items-center space-x-2 shadow-lg shadow-emerald-600/20"
        >
          <span>📊</span>
          <span>Export Financial Report (.CSV)</span>
        </button>
      </div>

      {/* Metric Cards Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl border-t-4 border-t-blue-500 space-y-2">
          <span className="text-base font-bold text-slate-400 block">Gross Revenue Booked</span>
          <span className="text-3xl font-black text-blue-400 font-mono block">
            KES {totalRevenue.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500 block">Total contract value of all bookings</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl border-t-4 border-t-emerald-500 space-y-2">
          <span className="text-base font-bold text-slate-400 block">Total Cash Collected</span>
          <span className="text-3xl font-black text-emerald-400 font-mono block">
            KES {totalDeposits.toLocaleString()}
          </span>
          <span className="text-xs text-emerald-400 font-medium block">Deposits and full payments received</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl border-t-4 border-t-rose-500 space-y-2">
          <span className="text-base font-bold text-slate-400 block">Total Outstanding Balances</span>
          <span className="text-3xl font-black text-rose-400 font-mono block">
            KES {totalOutstanding.toLocaleString()}
          </span>
          <span className="text-xs text-rose-400 font-medium block">{unpaidOrders.length} accounts pending balance</span>
        </div>
      </div>

      {/* Outstanding Balances Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Accounts with Pending Balances</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-base border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Garment</th>
                <th className="py-3 px-4 text-right">Total (KES)</th>
                <th className="py-3 px-4 text-right">Paid (KES)</th>
                <th className="py-3 px-4 text-right">Balance Due (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {unpaidOrders.map((o) => (
                <tr key={o._id} className="hover:bg-slate-950/50 transition">
                  <td className="py-3 px-4 font-bold text-blue-400">{o.orderId}</td>
                  <td className="py-3 px-4 font-sans font-bold text-slate-100">{o.customerName}</td>
                  <td className="py-3 px-4 text-slate-400">{o.customerPhone || 'N/A'}</td>
                  <td className="py-3 px-4 font-sans text-slate-300">{o.garmentType}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{o.priceTotal?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-emerald-400">{o.depositPaid?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-black text-rose-400">{o.balanceRemaining?.toLocaleString()}</td>
                </tr>
              ))}

              {unpaidOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    ✨ No accounts with pending balances. All orders fully settled!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
