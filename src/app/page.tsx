'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface OrderType {
  _id: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  salesRep?: string;
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
  qcPassedBy?: string | null; // 👈 Inspector tracking (Simon / Safari)
}

interface InventoryType {
  _id: string;
  name: string;
  category: string;
  stockLevel: number;
  minimumLevel: number;
  unit: string;
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

// 👥 Workshop Team Roster by Department
const CUTTERS = ['Joseph'];
const TAILORS = ['Winnie', 'Fridah', 'Sammy', 'Leah'];
const FINISHERS = ['Simon', 'Safari'];
const SALES_TEAM = ['Faith', 'Phylis'];

export default function LiveControlTower() {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [selectedOrderForMobile, setSelectedOrderForMobile] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 📱 Mobile View Quick Department Filter State
  const [mobileDepartmentFilter, setMobileDepartmentFilter] = useState<string>('ALL');

  // Dynamic Stock & Inventory States
  const [fabrics, setFabrics] = useState<InventoryType[]>([]);
  const [fullInventory, setFullInventory] = useState<InventoryType[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [newMin, setNewMin] = useState<number>(0);

  // Mobile Floor inputs
  const [mobileFabricUsed, setMobileFabricUsed] = useState<number>(0);
  const [mobilePatternsCut, setMobilePatternsCut] = useState<number>(0);
  const [selectedTailor, setSelectedTailor] = useState<string>('');
  const [selectedFinisher, setSelectedFinisher] = useState<string>(FINISHERS[0]);

  // Form Field Interactive States
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    salesRep: SALES_TEAM[0],
    garmentType: 'Suit',
    fabricSelection: '',
    fabricQuantityRequired: '2.5',
    neck: '0',
    chest: '0',
    waist: '0',
    priceTotal: '',
    depositPaid: '',
    dueDate: '',
  });

  // 📊 Dynamic Financial Accounting & Warehouse Analytics Bar
  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.priceTotal || 0), 0);
  const totalDeposits = orders.reduce((acc, curr) => acc + (curr.depositPaid || 0), 0);
  const totalOutstanding = orders.reduce((acc, curr) => acc + (curr.balanceRemaining || 0), 0);
  const lowStockAlerts = fullInventory.filter(item => item.stockLevel <= item.minimumLevel);

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

  // Fetch live inventory items from MongoDB
  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFullInventory(json.data);
        const fabricItems = json.data.filter((item: InventoryType) => item.category === 'Fabric');
        setFabrics(fabricItems);
        if (fabricItems.length > 0 && !formData.fabricSelection) {
          setFormData(prev => ({ ...prev, fabricSelection: fabricItems[0].name }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchInventory();
  }, []);

  // Update Inventory Stock directly from Control Panel
  const handleUpdateStock = async (name: string) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, stockLevel: newStock, minimumLevel: newMin }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingItem(null);
        fetchInventory();
      } else {
        alert(`Failed to update stock: ${json.error}`);
      }
    } catch (err) {
      console.error('Error updating stock:', err);
    }
  };

  // Submit New Order (Stage 1: Intake) -> Live DB
  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      salesRep: formData.salesRep,
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
        fetchOrders();
        fetchInventory();
        setFormData({ 
          customerName: '', 
          customerPhone: '', 
          salesRep: SALES_TEAM[0],
          garmentType: 'Suit', 
          fabricSelection: fabrics[0]?.name || '', 
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
        fetchOrders();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // 🔍 Finishing Dept Action: Pass QC Inspection (Simon & Safari)
  const passQCOrder = async (orderId: string, finisherName: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qcPassedBy: finisherName,
          status: 'Dispatched',
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchOrders();
        setSelectedOrderForMobile(null);
        alert(`✅ QC Inspection PASSED by ${finisherName}! Order moved to Dispatched.`);
      } else {
        alert(`Error passing QC: ${json.error}`);
      }
    } catch (err) {
      console.error('Error passing QC:', err);
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
        alert(` Error: ${json.error}`);
      } else {
        fetchOrders();
        setSelectedOrderForMobile(null);
        alert(`Cutting metrics logged to Database by ${CUTTERS[0]}!`);
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
        alert(` Error: ${json.error}`);
      } else {
        fetchOrders();
        setSelectedOrderForMobile(null);
        setSelectedTailor('');
        alert(`Assigned to Tailor ${selectedTailor}!`);
      }
    } catch (err) {
      console.error('Error assigning tailor:', err);
    }
  };

  // 📱 Filter Active Mobile Orders based on Selected Department Tab
  const activeMobileOrders = orders
    .filter((o) => o.status !== 'Dispatched')
    .filter((o) => {
      if (mobileDepartmentFilter === 'ALL') return true;
      if (mobileDepartmentFilter === 'Cutting') return o.status === 'Cutting' || o.status === 'Ready';
      if (mobileDepartmentFilter === 'Assembly') return o.status === 'Assignment' || o.status === 'Sewing';
      if (mobileDepartmentFilter === 'QC') return o.status === 'QC';
      return true;
    });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* 🧭 Header Navigation Bar */}
      <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-3.5">
          {/* 🖼️ Official Logo Badge */}
          <div className="relative w-12 h-12 overflow-hidden rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-inner">
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
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full tracking-wider uppercase">
              LIVE WORKSPACE
            </span>
            <p className="text-xs font-semibold text-slate-400 mt-0.5 tracking-wide">
              Management Portal
            </p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => { setView('desktop'); setErrorMsg(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 ${view === 'desktop' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span>💻</span> Control Tower
          </button>
          <button
            onClick={() => { setView('mobile'); setErrorMsg(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 ${view === 'mobile' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span>📱</span> Workshop Floor
          </button>
        </div>
      </nav>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* 📊 Top Financial & Warehouse Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 border-t-2 border-t-slate-500 p-4 rounded-xl shadow-lg hover:border-slate-700 transition-all">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Gross Revenue Pipeline</span>
            <span className="text-2xl font-black text-slate-100 font-mono tracking-tight">KES {totalRevenue.toLocaleString()}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 border-t-2 border-t-emerald-500 p-4 rounded-xl shadow-lg hover:border-slate-700 transition-all">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Collected Deposits</span>
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">KES {totalDeposits.toLocaleString()}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 border-t-2 border-t-amber-500 p-4 rounded-xl shadow-lg hover:border-slate-700 transition-all">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-1">Outstanding Balances</span>
            <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">KES {totalOutstanding.toLocaleString()}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 border-t-2 border-t-rose-500 p-4 rounded-xl shadow-lg hover:border-slate-700 transition-all">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Low-Stock Alerts</span>
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl font-black text-rose-400 font-mono tracking-tight">{lowStockAlerts.length} Items</span>
              {lowStockAlerts.length > 0 && <span className="animate-ping w-2 h-2 rounded-full bg-rose-500 inline-block"></span>}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2">
             <span>⚠️</span> <span>Stock Interceptor Rule Alert: {errorMsg}</span>
          </div>
        )}

        {view === 'desktop' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* 📝 Left-Hand High-Contrast Intake Form */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-xl h-fit">
                <div className="border-b border-slate-800 pb-3 mb-4">
                  <h2 className="text-lg font-black text-slate-100 tracking-tight">1. Intake Register</h2>
                  <p className="text-xs text-slate-400">Add new custom orders to the workshop pipeline</p>
                </div>

                <form onSubmit={handleIntakeSubmit} className="space-y-4">
                  {/* Sales Representative */}
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Sales Representative</label>
                    <select
                      value={formData.salesRep}
                      onChange={(e) => setFormData({ ...formData, salesRep: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    >
                      {SALES_TEAM.map((rep) => (
                        <option key={rep} value={rep}>{rep} (Sales)</option>
                      ))}
                    </select>
                  </div>

                  {/* Customer Information Inputs */}
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Customer Information</label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="Customer Full Name"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Customer Phone (e.g. 0712...)"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  {/* Garment & Fabric Selects */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Garment</label>
                      <select
                        value={formData.garmentType}
                        onChange={(e) => setFormData({ ...formData, garmentType: e.target.value as any })}
                        className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      >
                        <option value="Suit">Suit</option>
                        <option value="Dress">Dress</option>
                        <option value="Shirt">Shirt</option>
                        <option value="Native">Native</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Fabric</label>
                      <select
                        value={formData.fabricSelection}
                        onChange={(e) => setFormData({ ...formData, fabricSelection: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      >
                        {fabrics.map((f) => (
                          <option key={f._id} value={f.name}>{f.name} ({f.stockLevel}m)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Meters Required</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      placeholder="Yardage Demand"
                      value={formData.fabricQuantityRequired}
                      onChange={(e) => setFormData({ ...formData, fabricQuantityRequired: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  {/* 📐 High-Contrast Blueprint Metrics Widget */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Blueprint Metrics (Inches)</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[9px] text-slate-500 block text-center font-bold mb-0.5">NECK</span>
                        <input type="number" step="0.25" placeholder="0" value={formData.neck === '0' ? '' : formData.neck} onChange={e => setFormData({ ...formData, neck: e.target.value })} className="p-2 text-center rounded-md bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none w-full" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block text-center font-bold mb-0.5">CHEST</span>
                        <input type="number" step="0.25" placeholder="0" value={formData.chest === '0' ? '' : formData.chest} onChange={e => setFormData({ ...formData, chest: e.target.value })} className="p-2 text-center rounded-md bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none w-full" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block text-center font-bold mb-0.5">WAIST</span>
                        <input type="number" step="0.25" placeholder="0" value={formData.waist === '0' ? '' : formData.waist} onChange={e => setFormData({ ...formData, waist: e.target.value })} className="p-2 text-center rounded-md bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none w-full" />
                      </div>
                    </div>
                  </div>

                  {/* Financial Fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Total (KES)</label>
                      <input
                        type="number"
                        required
                        placeholder="Cost"
                        value={formData.priceTotal}
                        onChange={(e) => setFormData({ ...formData, priceTotal: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Deposit (KES)</label>
                      <input
                        type="number"
                        required
                        placeholder="Paid"
                        value={formData.depositPaid}
                        onChange={(e) => setFormData({ ...formData, depositPaid: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Balance Unpaid</span>
                    <span className="text-xs font-black font-mono text-emerald-400">KES {balanceRemaining.toLocaleString()}</span>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Target Due Date</label>
                    <input
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs tracking-wider rounded-lg uppercase transition-all duration-200 shadow-md shadow-emerald-500/20 active:scale-[0.98]"
                  >
                    {loading ? 'Validating Stock...' : 'Confirm Intake Booking'}
                  </button>
                </form>
              </div>

              {/* 📋 Refactored Kanban Pipeline Board */}
              <div className="xl:col-span-3 overflow-x-auto pb-4">
                <div className="flex space-x-4 min-w-[1200px]">
                  {STAGES.map((stage, idx) => {
                    const stageOrders = orders.filter((o) => o.status === stage);
                    return (
                      <div key={stage} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 w-72 flex flex-col h-[82vh] backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2.5">
                          <span className="text-[11px] font-black text-slate-300 tracking-wider uppercase">
                            {idx + 1}. {stage}
                          </span>
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-black">
                            {stageOrders.length}
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                          {stageOrders.map((order) => (
                            <div
                              key={order._id}
                              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-xl hover:-translate-y-0.5 transition-all duration-200 shadow-md group"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black text-emerald-400 tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  {order.orderId}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400">
                                  Due {new Date(order.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-100 text-sm tracking-tight">{order.customerName}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">{order.garmentType} • <span className="text-slate-300">{order.fabricSelection}</span> ({order.fabricQuantityRequired}m)</p>

                              <div className="mt-2.5 grid grid-cols-3 gap-1 bg-slate-950/80 p-2 rounded-lg text-[10px] font-mono text-center text-slate-300 border border-slate-850">
                                <div>N: <span className="text-emerald-400 font-bold">{order.measurements?.neck || 0}"</span></div>
                                <div>C: <span className="text-emerald-400 font-bold">{order.measurements?.chest || 0}"</span></div>
                                <div>W: <span className="text-emerald-400 font-bold">{order.measurements?.waist || 0}"</span></div>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                                {order.salesRep && <div>👩‍💼 Sales: <span className="text-slate-200 font-medium">{order.salesRep}</span></div>}
                                {stage === 'Cutting' && <div>✂️ Cutting Lead: <span className="text-slate-200 font-medium">{CUTTERS[0]}</span></div>}
                                {order.assignedTailor && <div>🧵 Tailor: <span className="text-slate-200 font-medium">{order.assignedTailor}</span></div>}
                                {order.qcPassedBy ? (
                                  <div className="text-emerald-400 font-bold">🔍 QC Passed By: {order.qcPassedBy}</div>
                                ) : (
                                  stage === 'QC' && <div>🔍 QC Inspectors: {FINISHERS.join(', ')}</div>
                                )}
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between items-center">
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-100 font-mono">KES {order.priceTotal?.toLocaleString()}</span>
                                  <span className="text-[9px] text-slate-400">Bal: KES {order.balanceRemaining?.toLocaleString()}</span>
                                </div>
                                {stage === 'QC' ? (
                                  <div className="flex flex-col items-end space-y-1">
                                    <button
                                      onClick={() => passQCOrder(order._id, FINISHERS[0])}
                                      className="text-[9px] font-bold text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded transition-all"
                                    >
                                      Pass QC ({FINISHERS[0]})
                                    </button>
                                    <button
                                      onClick={() => passQCOrder(order._id, FINISHERS[1])}
                                      className="text-[9px] font-bold text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded transition-all"
                                    >
                                      Pass QC ({FINISHERS[1]})
                                    </button>
                                  </div>
                                ) : stage !== 'Dispatched' ? (
                                  <button
                                    onClick={() => advanceOrder(order)}
                                    className="text-[10px] font-extrabold text-emerald-400 hover:text-slate-950 border border-emerald-500/30 hover:bg-emerald-400 px-2.5 py-1 rounded-md transition-all shadow-sm"
                                  >
                                    Move Next →
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          ))}
                          {stageOrders.length === 0 && (
                            <div className="h-24 flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-600 text-xs">
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

            {/* 📦 Refactored Warehouse Inventory Manager */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-black text-slate-100 mb-4 tracking-tight">📦 Warehouse Stock & Inventory Manager</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <th className="p-3.5">Material Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Current Stock</th>
                      <th className="p-3.5">Min Safety Level</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {fullInventory.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-850/40 transition-colors">
                        <td className="p-3.5 font-bold text-slate-200">{item.name}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700/50">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono">
                          {editingItem === item._id ? (
                            <input type="number" value={newStock} onChange={e => setNewStock(parseFloat(e.target.value))} className="w-24 p-1.5 bg-slate-950 border border-slate-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                          ) : (
                            <span className={item.stockLevel <= item.minimumLevel ? "text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded" : "text-slate-300 font-semibold"}>
                              {item.stockLevel} {item.unit}
                              {item.stockLevel <= item.minimumLevel && " ⚠️ LOW"}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">
                          {editingItem === item._id ? (
                            <input type="number" value={newMin} onChange={e => setNewMin(parseFloat(e.target.value))} className="w-24 p-1.5 bg-slate-950 border border-slate-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                          ) : (
                            <span>{item.minimumLevel} {item.unit}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {editingItem === item._id ? (
                            <div className="space-x-2">
                              <button onClick={() => handleUpdateStock(item.name)} className="bg-emerald-500 text-slate-950 px-3 py-1 rounded-md font-extrabold hover:bg-emerald-400 transition">Save</button>
                              <button onClick={() => setEditingItem(null)} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-md font-bold hover:bg-slate-700 transition">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingItem(item._id); setNewStock(item.stockLevel); setNewMin(item.minimumLevel); }} className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline">Adjust Stock</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 📱 Refactored Mobile Workshop View */}
        {view === 'mobile' && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 min-h-[80vh] flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-800 pb-3 mb-4">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Workshop Floor View
                </span>
                <h2 className="text-xl font-black text-slate-100 mt-1.5">📱 Mobile Tracker Matrix</h2>
              </div>

              {!selectedOrderForMobile ? (
                <div>
                  {/* ⚡ Mobile Quick Filter Tabs */}
                  <div className="mb-4 flex space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto text-[11px]">
                    <button
                      type="button"
                      onClick={() => setMobileDepartmentFilter('ALL')}
                      className={`px-3 py-2 rounded-lg font-black whitespace-nowrap transition-all ${mobileDepartmentFilter === 'ALL' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      All Jobs
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileDepartmentFilter('Cutting')}
                      className={`px-3 py-2 rounded-lg font-black whitespace-nowrap transition-all ${mobileDepartmentFilter === 'Cutting' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      ✂️ Cutting ({orders.filter(o => (o.status === 'Cutting' || o.status === 'Ready')).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileDepartmentFilter('Assembly')}
                      className={`px-3 py-2 rounded-lg font-black whitespace-nowrap transition-all ${mobileDepartmentFilter === 'Assembly' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🧵 Assembly ({orders.filter(o => (o.status === 'Assignment' || o.status === 'Sewing')).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileDepartmentFilter('QC')}
                      className={`px-3 py-2 rounded-lg font-black whitespace-nowrap transition-all ${mobileDepartmentFilter === 'QC' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🔍 QC ({orders.filter(o => o.status === 'QC').length})
                    </button>
                  </div>

                  <label className="block text-xs font-bold text-slate-400 mb-2">Select Active Job:</label>
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {activeMobileOrders.map((order) => (
                      <button
                        key={order._id}
                        onClick={() => {
                          setSelectedOrderForMobile(order);
                          setMobileFabricUsed(order.fabricMetersUsed || 0);
                          setMobilePatternsCut(order.patternPiecesCut || 0);
                          setSelectedTailor(order.assignedTailor || '');
                        }}
                        className="w-full text-left bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition-all flex justify-between items-center group shadow-md"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{order.orderId}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                              {order.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-100 text-sm mt-1.5">{order.customerName}</h4>
                          <p className="text-xs text-slate-400">{order.garmentType} • {order.fabricSelection}</p>
                        </div>
                        <span className="text-xl text-slate-500 group-hover:text-emerald-400 transition-colors">→</span>
                      </button>
                    ))}

                    {activeMobileOrders.length === 0 && (
                      <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        No active jobs in this department filter.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <button onClick={() => setSelectedOrderForMobile(null)} className="text-xs text-slate-400 hover:text-white mb-2 block font-semibold">
                      ← Back to list
                    </button>
                    <span className="text-xs font-black text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{selectedOrderForMobile.orderId}</span>
                    <h3 className="text-lg font-black text-slate-100 mt-1">{selectedOrderForMobile.customerName}</h3>
                  </div>

                  {/* Cutting Department Action */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-300 tracking-wider uppercase">✂️ Cutting Metrics</h4>
                      <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Cutter: {CUTTERS[0]}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Meters Used (m)</label>
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                          <button 
                            type="button"
                            onClick={() => setMobileFabricUsed(p => Math.max(0, parseFloat((p - 0.1).toFixed(1))))}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black select-none"
                          >
                            -
                          </button>
                          <span className="flex-1 text-center text-xs font-mono text-slate-100 font-black">{mobileFabricUsed}m</span>
                          <button 
                            type="button"
                            onClick={() => setMobileFabricUsed(p => parseFloat((p + 0.1).toFixed(1)))}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black select-none"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Pattern Pieces Cut</label>
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                          <button 
                            type="button"
                            onClick={() => setMobilePatternsCut(p => Math.max(0, p - 1))}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black select-none"
                          >
                            -
                          </button>
                          <span className="flex-1 text-center text-xs font-mono text-slate-100 font-black">{mobilePatternsCut} pcs</span>
                          <button 
                            type="button"
                            onClick={() => setMobilePatternsCut(p => p + 1)}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black select-none"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <button onClick={submitMobileMetrics} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-black py-2.5 rounded-lg transition uppercase tracking-wider border border-slate-700">
                      Submit & Move to Cutting
                    </button>
                  </div>

                  {/* Tailors Assembly Action */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-black text-slate-300 tracking-wider uppercase">🤝 Assign Tailor (Assembly)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {TAILORS.map((tailor) => (
                        <button
                          key={tailor}
                          onClick={() => setSelectedTailor(tailor)}
                          className={`p-2.5 rounded-lg text-xs font-extrabold border transition-all ${selectedTailor === tailor ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                        >
                          {tailor}
                        </button>
                      ))}
                    </div>
                    <button onClick={submitTailorAssignment} disabled={!selectedTailor} className="w-full bg-emerald-500 disabled:opacity-40 hover:bg-emerald-400 text-slate-950 text-xs font-black py-2.5 rounded-lg transition uppercase tracking-wider shadow-md shadow-emerald-500/20">
                      Confirm Tailor & Set to Assigned
                    </button>
                  </div>

                  {/* Finishing Dept QC Inspection Action */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-black text-slate-300 tracking-wider uppercase">🔍 Finishing Dept QC Inspection</h4>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Select Inspector</label>
                      <div className="grid grid-cols-2 gap-2">
                        {FINISHERS.map((finisher) => (
                          <button
                            key={finisher}
                            onClick={() => setSelectedFinisher(finisher)}
                            className={`p-2.5 rounded-lg text-xs font-extrabold border transition-all ${selectedFinisher === finisher ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                          >
                            {finisher}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => passQCOrder(selectedOrderForMobile._id, selectedFinisher)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black py-2.5 rounded-lg transition uppercase tracking-wider shadow-md shadow-emerald-500/20"
                    >
                      Pass QC & Approve Dispatch ({selectedFinisher})
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