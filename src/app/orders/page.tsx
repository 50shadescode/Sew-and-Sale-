'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STAGES = ['Intake', 'Ready', 'Cutting', 'Assignment', 'Sewing', 'QC', 'Dispatched'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePrintOrder, setActivePrintOrder] = useState<any | null>(null);

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
    o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerPhone?.includes(searchQuery)
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

  const sendWhatsAppReceipt = (order: any) => {
    const rawPhone = order.customerPhone?.replace(/[^0-9]/g, '') || '';
    if (!rawPhone) {
      alert('No phone number attached to this order.');
      return;
    }
    const formattedPhone = rawPhone.startsWith('0') ? `254${rawPhone.slice(1)}` : rawPhone;
    const message = encodeURIComponent(
      `Hi ${order.customerName}!\n\n` +
      `Your order ${order.orderId} for a ${order.garmentType} has been booked with SEW AND SELL UNIFORMS.\n\n` +
      `• Total Cost: KES ${order.priceTotal?.toLocaleString()}\n` +
      `• Deposit Paid: KES ${order.depositPaid?.toLocaleString()}\n` +
      `• Balance Remaining: KES ${order.balanceRemaining?.toLocaleString()}\n` +
      `• Target Due Date: ${new Date(order.dueDate).toLocaleDateString('en-GB')}\n\n` +
      `Thank you for choosing Sew & Sell! For inquiries, call 0700 049 052.`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100">Production Pipeline</h1>
          <p className="text-base text-slate-400 mt-1">Track orders, send WhatsApp receipts, and print physical vouchers</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by name, ID (ORD-1001), or phone..."
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

      {/* Kanban Stages Board */}
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
                    <div key={order._id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-md">
                      <div className="flex justify-between items-start">
                        <span className="text-base font-bold text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded">{order.orderId}</span>
                        <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">Due {new Date(order.dueDate).toLocaleDateString('en-GB')}</span>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-slate-100">{order.customerName}</h3>
                        <p className="text-base text-slate-400">{order.garmentType} • {order.fabricSelection || 'Standard Fabric'}</p>
                      </div>

                      {/* Financial Quick Status */}
                      <div className="flex justify-between items-center text-xs font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400">Paid: <strong className="text-emerald-400">KES {order.depositPaid?.toLocaleString()}</strong></span>
                        <span className="text-slate-400">Bal: <strong className="text-rose-400">KES {order.balanceRemaining?.toLocaleString()}</strong></span>
                      </div>

                      {/* Action Row: Print + WhatsApp + Advance */}
                      <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-1">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setActivePrintOrder(order)}
                            title="Print Order Receipt"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition"
                          >
                            🖨️
                          </button>
                          <button
                            onClick={() => sendWhatsAppReceipt(order)}
                            title="Send WhatsApp Receipt"
                            className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-sm transition"
                          >
                            💬
                          </button>
                        </div>

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
                    <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-xl text-center p-4 text-slate-500 space-y-1">
                      <span className="text-2xl">✨</span>
                      <span className="text-base font-medium text-slate-400">No jobs in {stage}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Embedded Printable Receipt Modal (Styled 1:1 with Leah's Paper Order Book) */}
      {activePrintOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 print:p-0 print:shadow-none print:w-full font-sans">
            
            {/* Modal Controls */}
            <div className="flex justify-between items-center border-b pb-3 print:hidden">
              <h3 className="text-lg font-bold text-slate-800">Print Preview</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition"
                >
                  🖨️ Print Receipt
                </button>
                <button
                  onClick={() => setActivePrintOrder(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg font-bold text-sm transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Paper Voucher */}
            <div className="border-2 border-blue-900 p-6 rounded-lg space-y-4 bg-white print:border-none print:p-0">
              
              {/* Header */}
              <div className="text-center space-y-1">
                <span className="inline-block bg-blue-900 text-white font-black text-xs px-3 py-0.5 rounded uppercase tracking-wider">
                  ORDER BOOK
                </span>
                <h1 className="text-2xl font-black text-blue-950 tracking-tight uppercase">
                  SEW AND SELL UNIFORMS
                </h1>
                <p className="text-[10px] text-slate-600 leading-tight">
                  Dealers in: School Uniforms, Corporate Uniforms, Safety Wear, Overalls, Dust Coats, Rain Coats, Branded Items etc
                </p>
                <p className="text-xs font-bold text-slate-800 pt-0.5">
                  Tel: 0700 049 052
                </p>
              </div>

              {/* Serial & Date */}
              <div className="flex justify-between items-center text-sm border-t border-b border-slate-200 py-2">
                <div className="font-bold">
                  No. <span className="text-rose-600 font-mono font-black text-base">{activePrintOrder.orderId}</span>
                </div>
                <div className="text-xs font-mono text-slate-600">
                  Date: <span className="font-bold text-slate-900">{new Date().toLocaleDateString('en-GB')}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="text-sm space-y-1">
                <div className="border-b border-dotted border-slate-400 pb-1">
                  <span className="font-bold text-slate-600">M/s:</span>{' '}
                  <span className="font-black text-slate-900">{activePrintOrder.customerName}</span>
                  {activePrintOrder.customerPhone && <span className="text-xs text-slate-500 ml-2">({activePrintOrder.customerPhone})</span>}
                </div>
                <div className="text-xs text-slate-500 flex justify-between pt-1">
                  <span>Target Due Date: <strong className="text-slate-800">{new Date(activePrintOrder.dueDate).toLocaleDateString('en-GB')}</strong></span>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-xs text-left border-collapse border border-blue-900">
                <thead>
                  <tr className="bg-blue-50 text-blue-950 font-black border-b border-blue-900">
                    <th className="p-2 border-r border-blue-900 w-12 text-center">QTY</th>
                    <th className="p-2 border-r border-blue-900">DESCRIPTION</th>
                    <th className="p-2 border-r border-blue-900 w-16 text-right">@</th>
                    <th className="p-2 w-20 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono">
                  <tr>
                    <td className="p-2 border-r border-blue-900 text-center font-bold">1</td>
                    <td className="p-2 border-r border-blue-900 font-sans">
                      <div className="font-bold">{activePrintOrder.garmentType} Custom Order</div>
                      {activePrintOrder.fabricSelection && <div className="text-[10px] text-slate-500">Fabric: {activePrintOrder.fabricSelection}</div>}
                    </td>
                    <td className="p-2 border-r border-blue-900 text-right">{activePrintOrder.priceTotal?.toLocaleString()}</td>
                    <td className="p-2 text-right font-bold">{activePrintOrder.priceTotal?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div className="space-y-1 text-xs font-mono pt-2 border-t border-slate-300">
                <div className="flex justify-between text-slate-600">
                  <span>TOTAL COST:</span>
                  <span>KES {activePrintOrder.priceTotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>DEPOSIT PAID:</span>
                  <span>KES {activePrintOrder.depositPaid?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-black text-sm pt-1 border-t border-slate-200">
                  <span>UNPAID BALANCE:</span>
                  <span>KES {activePrintOrder.balanceRemaining?.toLocaleString()}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
                <span className="font-bold">E&O.E.</span>
                <span className="font-bold text-center text-slate-700 uppercase tracking-tight">
                  Goods once sold are not returnable
                </span>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
