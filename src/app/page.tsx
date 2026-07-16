'use client';

import { useState, useEffect } from 'react';

interface OrderType {
  _id: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  garmentType: 'Suit' | 'Dress' | 'Shirt' | 'Native';
  fabricSelection: string;
  fabricQuantityRequired: number;
  measurements: {
    neck: number;
    chest: number;
    waist: number;
  };
  priceTotal: number;
  depositPaid: number;
  balanceRemaining: number;
  dueDate: string;
  status: 'Intake' | 'Ready' | 'Cutting' | 'Assignment' | 'Sewing' | 'QC' | 'Dispatched';
  fabricMetersUsed?: number;
  patternPiecesCut?: number;
  assignedTailor?: string | null;
}

const STAGES = [
  'Intake',
  'Ready',
  'Cutting',
  'Assignment',
  'Sewing',
  'QC',
  'Dispatched'
];

const TAILORS = ['A. Kimani', 'M. Njoroge', 'L. Wanjiku', 'J. Mutua'];

export default function LiveControlTower() {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [selectedOrderForMobile, setSelectedOrderForMobile] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available stock array matched against seeded warehouse states
  const [fabrics] = useState([
    { name: 'Cotton Fabric', stock: 450 },
    { name: 'Denim Fabric', stock: 1200 },
    { name: 'Khaki Fabric', stock: 100 }
  ]);

  // Mobile Floor inputs
  const [mobileFabricUsed, setMobileFabricUsed] = useState(0);
  const [mobilePatternsCut, setMobilePatternsCut] = useState(0);
  const [selectedTailor, setSelectedTailor] = useState('');

  // Form Field Interactive States
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    garmentType: 'Suit',
    fabricSelection: 'Cotton Fabric',
    fabricQuantityRequired: '2.5',
    neck: '0',
    chest: '0',
    waist: '0',
    priceTotal: '',
    depositPaid: '',
    dueDate: '',
  });

  // Auto-calculated Financial Accounting Engine
  const balanceRemaining = Math.max(
    0, 
    (Number(formData.priceTotal) || 0) - (Number(formData.depositPaid) || 0)
  );

  // Fetch all orders from the live MongoDB backend
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Submit New Order (Stage 1: Intake) -> Live DB
  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      garmentType: formData.garmentType,
      fabricSelection: formData.fabricSelection,
      fabricQuantityRequired: Number(formData.fabricQuantityRequired) || 0,
      measurements: {
        neck: Number(formData.neck) || 0,
        chest: Number(formData.chest) || 0,
        waist: Number(formData.waist) || 0,
      },
      priceTotal: Number(formData.priceTotal) || 0,
      depositPaid: Number(formData.depositPaid) || 0,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : new Date(),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.message || "Auto-Stock validation rejected intake entry.");
      } else {
        fetchOrders(); // Refresh dashboard instantly
        setFormData({ 
          customerName: '', 
          customerPhone: '', 
          garmentType: 'Suit', 
          fabricSelection: 'Cotton Fabric', 
          fabricQuantityRequired: '2.5',
          neck: '0',
          chest: '0',
          waist: '0',
          priceTotal: '', 
          depositPaid: '', 
          dueDate: '' 
        });
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setErrorMsg("Network timeout registering operational order parameters.");
    } finally {
      setLoading(false);
    }
  };

  // Move order status forward -> Live DB Patch
  const advanceOrder = async (order: OrderType) => {
    const currentIndex = STAGES.indexOf(order.status);
    if (currentIndex >= STAGES.length - 1) return;

    const nextStatus = STAGES[currentIndex + 1];

    if (nextStatus === 'Dispatched') {
      alert(`💬 STAGE 7: DISPATCHED\nInvoice generated & simulated M-Pesa STK Push initiated for KES ${order.priceTotal} to ${order.customerPhone || 'Customer'}`);
    }

    try {
      const res = await fetch(`/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(`❌ Operational Hold: ${json.error || 'Failed to update stage.'}`);
      } else {
        fetchOrders(); // Sync board
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Submit metrics from mobile workshop view -> Live DB Patch
  const submitMobileMetrics = async () => {
    if (!selectedOrderForMobile) return;

    try {
      const res = await fetch(`/api/orders/${selectedOrderForMobile._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fabricMetersUsed: mobileFabricUsed,
          patternPiecesCut: mobilePatternsCut,
          status: 'Cutting',
        }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(`❌ Error: ${json.error}`);
      } else {
        fetchOrders();
        setSelectedOrderForMobile(null);
        alert('Cutting metrics logged to Database!');
      }
    } catch (err) {
      console.error('Error logging metrics:', err);
    }
  };

  // Assign tailor from mobile workshop matrix -> Live DB Patch
  const submitTailorAssignment = async () => {
    if (!selectedOrderForMobile || !selectedTailor) return;

    try {
      const res = await fetch(`/api/orders/${selectedOrderForMobile._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTailor: selectedTailor,
          status: 'Assignment',
        }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(`❌ Error: ${json.error}`);
      } else {
        fetchOrders();
        setSelectedOrderForMobile(null);
        setSelectedTailor('');
        alert(`Assigned to ${selectedTailor}!`);
      }
    } catch (err) {
      console.error('Error assigning tailor:', err);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">LIVE WORKSPACE</span>
          <h1 className="text-2xl font-black text-white mt-1">🧵 SEW & SALE Dashboard</h1>
        </div>
        <div className="flex bg-slate-800 p-1.5 rounded-lg border border-slate-700">
          <button
            onClick={() => { setView('desktop'); setErrorMsg(null); }}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'desktop' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
          >
            💻 Control Tower (Desktop)
          </button>
          <button
            onClick={() => { setView('mobile'); setErrorMsg(null); }}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'mobile' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
          >
            📱 Workshop Floor (Mobile)
          </button>
        </div>
      </nav>

      <div className="p-6">
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold shadow-sm">
            ⚠️ Stock Interceptor Rule Alert: {errorMsg}
          </div>
        )}

        {view === 'desktop' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Hand Intake Form */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl h-fit">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <h2 className="text-lg font-bold text-slate-200">1. Intake Register</h2>
                <p className="text-xs text-slate-400">Add new custom orders to the pipeline</p>
              </div>

              <form onSubmit={handleIntakeSubmit} className="space-y-4 text-slate-900">
                <input
                  type="text"
                  required
                  placeholder="Customer Name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Customer Phone"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={formData.garmentType}
                    onChange={(e) => setFormData({ ...formData, garmentType: e.target.value })}
                    className="p-2.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="Suit">Suit</option>
                    <option value="Dress">Dress</option>
                    <option value="Shirt">Shirt</option>
                    <option value="Native">Native</option>
                  </select>
                  
                  {/* Dynamic Fabric Dropdown Mapping */}
                  <select
                    value={formData.fabricSelection}
                    onChange={(e) => setFormData({ ...formData, fabricSelection: e.target.value })}
                    className="p-2.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                  >
                    {fabrics.map((f, i) => (
                      <option key={i} value={f.name}>{f.name} ({f.stock}m)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Meters Required</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="Yardage Demand"
                    value={formData.fabricQuantityRequired}
                    onChange={(e) => setFormData({ ...formData, fabricQuantityRequired: e.target.value })}
                    className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Submatrix Dimensional Blueprint Input Block */}
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 space-y-2">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400">Blueprint Metrics (Inches)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" step="0.25" placeholder="Neck" value={formData.neck === '0' ? '' : formData.neck} onChange={e => setFormData({ ...formData, neck: e.target.value })} className="p-2 text-center rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none" />
                    <input type="number" step="0.25" placeholder="Chest" value={formData.chest === '0' ? '' : formData.chest} onChange={e => setFormData({ ...formData, chest: e.target.value })} className="p-2 text-center rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none" />
                    <input type="number" step="0.25" placeholder="Waist" value={formData.waist === '0' ? '' : formData.waist} onChange={e => setFormData({ ...formData, waist: e.target.value })} className="p-2 text-center rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    required
                    placeholder="Total Cost (KES)"
                    value={formData.priceTotal}
                    onChange={(e) => setFormData({ ...formData, priceTotal: e.target.value })}
                    className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Deposit (KES)"
                    value={formData.depositPaid}
                    onChange={(e) => setFormData({ ...formData, depositPaid: e.target.value })}
                    className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="p-2.5 bg-slate-950 rounded border border-slate-850 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Balance Unpaid</span>
                  <span className="text-xs font-black font-mono text-emerald-400">KES {balanceRemaining.toLocaleString()}</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs tracking-wider rounded uppercase transition-colors shadow-md shadow-emerald-500/10"
                >
                  {loading ? 'Validating Stock...' : 'Confirm Intake Booking'}
                </button>
              </form>
            </div>

            {/* Pipeline board (7 Stages Scrollable) */}
            <div className="xl:col-span-3 overflow-x-auto pb-4">
              <div className="flex space-x-4 min-w-[1200px]">
                {STAGES.map((stage, idx) => {
                  const stageOrders = orders.filter((o) => o.status === stage);
                  return (
                    <div key={stage} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 w-72 flex flex-col h-[82vh]">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                          {idx + 1}. {stage.replace(/_/g, ' ')}
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">
                          {stageOrders.length}
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3">
                        {stageOrders.map((order) => (
                          <div
                            key={order._id}
                            className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg hover:border-emerald-500/40 transition-all shadow-md group"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-extrabold text-emerald-400 tracking-wider">
                                {order.orderId}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Due {new Date(order.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-200 text-sm">{order.customerName}</h4>
                            <p className="text-xs text-slate-400">{order.garmentType} • {order.fabricSelection} ({order.fabricQuantityRequired}m)</p>

                            {/* Metrics Grid inside card context layout */}
                            <div className="mt-2 grid grid-cols-3 gap-1 bg-slate-950/60 p-1.5 rounded text-[10px] font-mono text-center text-slate-400 border border-slate-850">
                              <div>N: {order.measurements?.neck || 0}"</div>
                              <div>C: {order.measurements?.chest || 0}"</div>
                              <div>W: {order.measurements?.waist || 0}"</div>
                            </div>

                            {(order.fabricMetersUsed || order.assignedTailor) && (
                              <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                                {order.fabricMetersUsed && <div>📏 Fabric used: {order.fabricMetersUsed}m</div>}
                                {order.assignedTailor && <div>✂️ Tailor: {order.assignedTailor}</div>}
                              </div>
                            )}

                            <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between items-center">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-100">KES {order.priceTotal?.toLocaleString()}</span>
                                <span className="text-[9px] text-slate-500">Bal: KES {order.balanceRemaining?.toLocaleString()}</span>
                              </div>
                              {stage !== 'Dispatched' && (
                                <button
                                  onClick={() => advanceOrder(order)}
                                  className="text-[10px] font-bold text-emerald-400 hover:text-white border border-emerald-500/30 hover:bg-emerald-500/20 px-2 py-1 rounded transition"
                                >
                                  Move Next →
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {stageOrders.length === 0 && (
                          <div className="h-20 flex items-center justify-center border border-dashed border-slate-800 rounded-lg text-slate-600 text-xs">
                            Empty stage
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Workshop view */}
        {view === 'mobile' && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 min-h-[80vh] flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-800 pb-3 mb-5">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Workshop Floor view</span>
                <h2 className="text-xl font-bold text-white mt-1">📱 Mobile Tracker Matrix</h2>
              </div>

              {!selectedOrderForMobile ? (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Select Active Job:</label>
                  <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                    {orders
                      .filter((o) => o.status !== 'Dispatched')
                      .map((order) => (
                        <button
                          key={order._id}
                          onClick={() => {
                            setSelectedOrderForMobile(order);
                            setMobileFabricUsed(order.fabricMetersUsed || 0);
                            setMobilePatternsCut(order.patternPiecesCut || 0);
                            setSelectedTailor(order.assignedTailor || '');
                          }}
                          className="w-full text-left bg-slate-850 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 p-4 rounded-xl transition flex justify-between items-center"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-black text-emerald-400">{order.orderId}</span>
                              <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                {order.status}
                              </span>
                            </div>
                            <h4 className="font-bold text-white text-sm mt-1">{order.customerName}</h4>
                            <p className="text-xs text-slate-400">{order.garmentType} • {order.fabricSelection}</p>
                          </div>
                          <span className="text-xl text-slate-500">→</span>
                        </button>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <button onClick={() => setSelectedOrderForMobile(null)} className="text-xs text-slate-400 hover:text-white mb-2 block">
                      &larr; Back to list
                    </button>
                    <span className="text-xs font-bold text-emerald-400">{selectedOrderForMobile.orderId}</span>
                    <h3 className="text-lg font-black text-white">{selectedOrderForMobile.customerName}</h3>
                  </div>

                  {/* Cutting Metrics */}
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-black text-slate-300 tracking-wider uppercase">✂️ Floor Action: Cutting Metrics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Meters Used (m)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={mobileFabricUsed}
                          onChange={(e) => setMobileFabricUsed(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Pattern Pieces Cut</label>
                        <input
                          type="number"
                          value={mobilePatternsCut}
                          onChange={(e) => setMobilePatternsCut(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                    <button onClick={submitMobileMetrics} className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded transition">
                      Submit & Move to CUTTING AREA
                    </button>
                  </div>

                  {/* Tailor Assignment */}
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-black text-slate-300 tracking-wider uppercase">🤝 Floor Action: Tailor Assignment</h4>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Select Tailor from Matrix</label>
                      <div className="grid grid-cols-2 gap-2">
                        {TAILORS.map((tailor) => (
                          <button
                            key={tailor}
                            onClick={() => setSelectedTailor(tailor)}
                            className={`p-2 rounded text-xs font-bold border transition ${selectedTailor === tailor ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'bg-slate-900 border-slate-700 text-slate-300'}`}
                          >
                            {tailor}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={submitTailorAssignment} disabled={!selectedTailor} className="w-full bg-emerald-500 disabled:opacity-50 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold py-2.5 rounded transition uppercase tracking-wider">
                      Confirm Tailor & Set to ASSIGNED
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}