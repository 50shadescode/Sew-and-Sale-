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
  qcPassedBy?: string | null;
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

const CUTTERS = ['Joseph'];
const TAILORS = ['Winnie', 'Fridah', 'Sammy', 'Leah'];
const FINISHERS = ['Simon', 'Safari'];
const SALES_TEAM = ['Faith', 'Phylis'];

export default function LiveControlTower() {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'workshop' | 'inventory'>('dashboard');
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [selectedOrderForMobile, setSelectedOrderForMobile] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 🧙‍♂️ 5-Step Intake Form State
  const [intakeStep, setIntakeStep] = useState<number>(1);

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
    garmentType: 'Suit' as 'Suit' | 'Dress' | 'Shirt' | 'Native',
    fabricSelection: '',
    fabricQuantityRequired: '2.5',
    neck: '0',
    chest: '0',
    waist: '0',
    priceTotal: '15000',
    depositPaid: '5000',
    dueDate: '',
  });

  // 📊 Dynamic Financial Accounting & Warehouse Analytics Bar
  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.priceTotal || 0), 0);
  const totalDeposits = orders.reduce((acc, curr) => acc + (curr.depositPaid || 0), 0);
  const totalOutstanding = orders.reduce((acc, curr) => acc + (curr.balanceRemaining || 0), 0);
  const lowStockAlerts = fullInventory.filter(item => item.stockLevel <= item.minimumLevel);

  // Operational Questions Engine Data
  const todayStr = new Date().toISOString().split('T')[0];
  const dueTodayOrders = orders.filter(o => o.dueDate && o.dueDate.startsWith(todayStr));
  const awaitingPickup = orders.filter(o => o.status === 'QC');

  // Auto-calculated Balance
  const balanceRemaining = Math.max(
    0, 
    (Number(formData.priceTotal) || 0) - (Number(formData.depositPaid) || 0)
  );

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

  // 💡 Smart Defaults Engine for Garment Selection
  const handleGarmentChange = (type: 'Suit' | 'Dress' | 'Shirt' | 'Native') => {
    let defaultMeters = '2.5';
    let defaultPrice = '15000';

    if (type === 'Shirt') {
      defaultMeters = '1.5';
      defaultPrice = '4500';
    } else if (type === 'Dress') {
      defaultMeters = '3.0';
      defaultPrice = '8500';
    } else if (type === 'Native') {
      defaultMeters = '2.5';
      defaultPrice = '8500';
    }

    setFormData(prev => ({
      ...prev,
      garmentType: type,
      fabricQuantityRequired: defaultMeters,
      priceTotal: defaultPrice,
    }));
  };

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
        setIntakeStep(1);
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
          priceTotal: '15000', 
          depositPaid: '5000', 
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
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white pb-12">
      {/* 🧭 Human-Centric Main Navigation Header */}
      <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 shadow-lg gap-4">
        <div className="flex items-center space-x-4">
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
            <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full tracking-wider uppercase">
              SEW & SELL UNIFORMS
            </span>
            <h1 className="text-xl font-black text-slate-100 mt-0.5 tracking-tight">
              Management Portal
            </h1>
          </div>
        </div>

        {/* Intuitive Navigation Bar Tabs */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-inner text-sm">
          <button
            onClick={() => { setActiveTab('dashboard'); setView('desktop'); }}
            className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ${activeTab === 'dashboard' && view === 'desktop' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => { setActiveTab('orders'); setView('desktop'); }}
            className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ${activeTab === 'orders' && view === 'desktop' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => { setActiveTab('workshop'); setView('mobile'); }}
            className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ${view === 'mobile' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📱 Workshop Floor
          </button>
          <button
            onClick={() => { setActiveTab('inventory'); setView('desktop'); }}
            className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ${activeTab === 'inventory' && view === 'desktop' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Inventory
          </button>
        </div>
      </nav>

      <div className="p-6 space-y-8 max-w-[1600px] mx-auto">

        {/* 🌅 Morning Executive Briefing Banner (Answers Key Questions) */}
        {view === 'desktop' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-start flex-wrap gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-0.5">DAILY BRIEFING</span>
                <h2 className="text-2xl font-black text-slate-100">Good Morning, {formData.salesRep} 👋</h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Answer Engine Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Did we make money today?</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">KES {totalDeposits.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Which orders are due today?</span>
                  <span className="text-lg font-black text-amber-400 font-mono">{dueTodayOrders.length} Due Today</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <span className="text-2xl">🛍️</span>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Customers Awaiting Pickup?</span>
                  <span className="text-lg font-black text-blue-400 font-mono">{awaitingPickup.length} Ready in QC</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Running out of fabric?</span>
                  <span className={`text-lg font-black font-mono ${lowStockAlerts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {lowStockAlerts.length > 0 ? `${lowStockAlerts.length} Items Low` : 'Stock Healthy'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📊 High-Contrast Semantic Metric KPI Cards */}
        {view === 'desktop' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 border-t-4 border-t-blue-500 p-4 rounded-xl shadow-lg">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Gross Revenue Pipeline</span>
              <span className="text-2xl font-black text-slate-100 font-mono">KES {totalRevenue.toLocaleString()}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 border-t-4 border-t-emerald-500 p-4 rounded-xl shadow-lg">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Collected Deposits</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">KES {totalDeposits.toLocaleString()}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 border-t-4 border-t-amber-500 p-4 rounded-xl shadow-lg">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-1">Outstanding Unpaid</span>
              <span className="text-2xl font-black text-amber-400 font-mono">KES {totalOutstanding.toLocaleString()}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 border-t-4 border-t-rose-500 p-4 rounded-xl shadow-lg">
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Low-Stock Alerts</span>
              <span className="text-2xl font-black text-rose-400 font-mono">{lowStockAlerts.length} Materials</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2">
             <span>⚠️</span> <span>Rule Alert: {errorMsg}</span>
          </div>
        )}

        {view === 'desktop' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

              {/* 🧙‍♂️ Step-by-Step Interactive Intake Wizard */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-fit">
                <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-black text-slate-100">Create Order</h2>
                    <p className="text-xs text-slate-400">Step {intakeStep} of 5</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                    Wizard Mode
                  </span>
                </div>

                {/* Wizard Progress Indicator */}
                <div className="flex space-x-1 mb-6">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${intakeStep >= step ? 'bg-blue-500' : 'bg-slate-800'}`}
                    />
                  ))}
                </div>

                <form onSubmit={handleIntakeSubmit} className="space-y-4">

                  {/* STEP 1: CUSTOMER CONTACT */}
                  {intakeStep === 1 && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-300 block">Step 1: Customer Contact</span>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sales Rep</label>
                        <select
                          value={formData.salesRep}
                          onChange={(e) => setFormData({ ...formData, salesRep: e.target.value })}
                          className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:border-blue-500"
                        >
                          {SALES_TEAM.map((rep) => (
                            <option key={rep} value={rep}>{rep} (Sales)</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Customer Full Name"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Phone (e.g. 0712...)"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm focus:border-blue-500"
                      />
                      <button
                        type="button"
                        disabled={!formData.customerName}
                        onClick={() => setIntakeStep(2)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider transition disabled:opacity-50"
                      >
                        Next: Garment & Fabric →
                      </button>
                    </div>
                  )}

                  {/* STEP 2: GARMENT & FABRIC (WITH SMART DEFAULTS) */}
                  {intakeStep === 2 && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-300 block">Step 2: Garment & Fabric Selection</span>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Garment Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['Suit', 'Dress', 'Shirt', 'Native'] as const).map((type) => (
                            <button
                              type="button"
                              key={type}
                              onClick={() => handleGarmentChange(type)}
                              className={`p-2 rounded-lg text-xs font-bold border transition ${formData.garmentType === type ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Fabric Selection</label>
                        <select
                          value={formData.fabricSelection}
                          onChange={(e) => setFormData({ ...formData, fabricSelection: e.target.value })}
                          className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm"
                        >
                          {fabrics.map((f) => (
                            <option key={f._id} value={f.name}>{f.name} ({f.stockLevel}m in stock)</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Meters Required</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={formData.fabricQuantityRequired}
                          onChange={(e) => setFormData({ ...formData, fabricQuantityRequired: e.target.value })}
                          className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button type="button" onClick={() => setIntakeStep(1)} className="w-1/3 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg">← Back</button>
                        <button type="button" onClick={() => setIntakeStep(3)} className="w-2/3 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-lg uppercase">Next: Measurements →</button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: MEASUREMENTS */}
                  {intakeStep === 3 && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-300 block">Step 3: Blueprint Metrics (Inches)</span>
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Upper Body</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[9px] text-slate-500 block text-center">NECK</span>
                            <input type="number" step="0.25" placeholder="0" value={formData.neck === '0' ? '' : formData.neck} onChange={e => setFormData({ ...formData, neck: e.target.value })} className="p-2 text-center rounded bg-slate-900 border border-slate-800 text-slate-100 text-xs w-full" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block text-center">CHEST</span>
                            <input type="number" step="0.25" placeholder="0" value={formData.chest === '0' ? '' : formData.chest} onChange={e => setFormData({ ...formData, chest: e.target.value })} className="p-2 text-center rounded bg-slate-900 border border-slate-800 text-slate-100 text-xs w-full" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block text-center">WAIST</span>
                            <input type="number" step="0.25" placeholder="0" value={formData.waist === '0' ? '' : formData.waist} onChange={e => setFormData({ ...formData, waist: e.target.value })} className="p-2 text-center rounded bg-slate-900 border border-slate-800 text-slate-100 text-xs w-full" />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button type="button" onClick={() => setIntakeStep(2)} className="w-1/3 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg">← Back</button>
                        <button type="button" onClick={() => setIntakeStep(4)} className="w-2/3 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-lg uppercase">Next: Pricing →</button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: FINANCIALS */}
                  {intakeStep === 4 && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-300 block">Step 4: Payment Terms</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Total (KES)</label>
                          <input
                            type="number"
                            required
                            value={formData.priceTotal}
                            onChange={(e) => setFormData({ ...formData, priceTotal: e.target.value })}
                            className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Deposit (KES)</label>
                          <input
                            type="number"
                            required
                            value={formData.depositPaid}
                            onChange={(e) => setFormData({ ...formData, depositPaid: e.target.value })}
                            className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Balance Unpaid</span>
                        <span className="text-xs font-black font-mono text-emerald-400">KES {balanceRemaining.toLocaleString()}</span>
                      </div>

                      <div className="flex gap-2">
                        <button type="button" onClick={() => setIntakeStep(3)} className="w-1/3 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg">← Back</button>
                        <button type="button" onClick={() => setIntakeStep(5)} className="w-2/3 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-lg uppercase">Next: Delivery →</button>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: DELIVERY & CONFIRM */}
                  {intakeStep === 5 && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-300 block">Step 5: Target Delivery Date</span>
                      <input
                        type="date"
                        required
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm"
                      />

                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1 text-slate-300">
                        <div><strong className="text-slate-400">Client:</strong> {formData.customerName}</div>
                        <div><strong className="text-slate-400">Garment:</strong> {formData.garmentType} ({formData.fabricSelection})</div>
                        <div><strong className="text-slate-400">Total Price:</strong> KES {formData.priceTotal}</div>
                      </div>

                      <div className="flex gap-2">
                        <button type="button" onClick={() => setIntakeStep(4)} className="w-1/3 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg">← Back</button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-2/3 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg uppercase tracking-wider transition shadow-md shadow-emerald-500/20"
                        >
                          {loading ? 'Validating...' : 'Confirm Order ✓'}
                        </button>
                      </div>
                    </div>
                  )}

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
                              className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 p-4 rounded-xl hover:-translate-y-0.5 transition-all duration-200 shadow-md group"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black text-blue-400 tracking-wider bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                  {order.orderId}
                                </span>
                                <span className="text-[10px] font-medium text-amber-400">
                                  Due {new Date(order.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-100 text-sm tracking-tight">{order.customerName}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">{order.garmentType} • <span className="text-slate-300">{order.fabricSelection}</span> ({order.fabricQuantityRequired}m)</p>

                              <div className="mt-2.5 grid grid-cols-3 gap-1 bg-slate-950/80 p-2 rounded-lg text-[10px] font-mono text-center text-slate-300 border border-slate-850">
                                <div>N: <span className="text-blue-400 font-bold">{order.measurements?.neck || 0}"</span></div>
                                <div>C: <span className="text-blue-400 font-bold">{order.measurements?.chest || 0}"</span></div>
                                <div>W: <span className="text-blue-400 font-bold">{order.measurements?.waist || 0}"</span></div>
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
                                    className="text-[10px] font-extrabold text-blue-400 hover:text-white border border-blue-500/30 hover:bg-blue-600 px-2.5 py-1 rounded-md transition-all shadow-sm"
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

            {/* 📦 Refactored Warehouse Inventory Manager with Visual Progress Meters */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-lg font-black text-slate-100 tracking-tight">📦 Material & Inventory Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fullInventory.map((item) => {
                  const isLow = item.stockLevel <= item.minimumLevel;
                  const percentage = Math.min(100, Math.round((item.stockLevel / (item.minimumLevel * 2)) * 100));

                  return (
                    <div key={item._id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-200 text-sm">{item.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">{item.category}</span>
                        </div>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isLow ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {item.stockLevel} {item.unit} {isLow && '⚠️ LOW'}
                        </span>
                      </div>

                      {/* Visual Progress Bar Meter */}
                      <div className="space-y-1 pt-1">
                        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-500 ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-500">
                          <span>Safety Threshold: {item.minimumLevel} {item.unit}</span>
                          <span>{percentage}% Stocked</span>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        {editingItem === item._id ? (
                          <div className="flex space-x-2">
                            <input type="number" value={newStock} onChange={e => setNewStock(parseFloat(e.target.value))} className="w-20 p-1 bg-slate-900 border border-slate-700 text-white text-xs rounded" />
                            <button onClick={() => handleUpdateStock(item.name)} className="bg-emerald-500 text-slate-950 px-2.5 py-1 rounded text-xs font-bold">Save</button>
                            <button onClick={() => setEditingItem(null)} className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded text-xs font-bold">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingItem(item._id); setNewStock(item.stockLevel); setNewMin(item.minimumLevel); }} className="text-xs text-blue-400 hover:text-blue-300 font-bold">Adjust Stock</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 📱 Refactored Mobile Workshop View */}
        {view === 'mobile' && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 min-h-[80vh] flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-800 pb-3 mb-4">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Workshop Floor View
                </span>
                <h2 className="text-xl font-black text-slate-100 mt-1.5">📱 Mobile Tracker Matrix</h2>
              </div>

              {!selectedOrderForMobile ? (
                <div>
                  {/* Quick Department Filter Tabs */}
                  <div className="mb-4 flex space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto text-[11px]">
                    <button
                      type="button"
                      onClick={() => setMobileDepartmentFilter('ALL')}
                      className={`px-3 py-2 rounded-lg font-black whitespace-nowrap transition-all ${mobileDepartmentFilter === 'ALL' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      All Jobs
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileDepartmentFilter('Cutting')}
                      className={`px-3 py-2 rounded-lg font-black whitespace-nowrap transition-all ${mobileDepartmentFilter === 'Cutting' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      ✂️ Cutting ({orders.filter(o => (o.status === 'Cutting' || o.status === 'Ready')).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileDepartmentFilter('Assembly')}
                      className={`px-3 py-2 rounded-lg font-black whitespace-nowrap transition-all ${mobileDepartmentFilter === 'Assembly' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🧵 Assembly ({orders.filter(o => (o.status === 'Assignment' || o.status === 'Sewing')).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileDepartmentFilter('QC')}
                      className={`px-3 py-2 rounded-lg font-black whitespace-nowrap transition-all ${mobileDepartmentFilter === 'QC' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
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
                            <span className="text-xs font-black text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{order.orderId}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                              {order.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-100 text-sm mt-1.5">{order.customerName}</h4>
                          <p className="text-xs text-slate-400">{order.garmentType} • {order.fabricSelection}</p>
                        </div>
                        <span className="text-xl text-slate-500 group-hover:text-blue-400 transition-colors">→</span>
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
                    <span className="text-xs font-black text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{selectedOrderForMobile.orderId}</span>
                    <h3 className="text-lg font-black text-slate-100 mt-1">{selectedOrderForMobile.customerName}</h3>
                  </div>

                  {/* Cutting Department Action */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-300 tracking-wider uppercase">✂️ Cutting Metrics</h4>
                      <span className="text-[10px] font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Cutter: {CUTTERS[0]}</span>
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
                          className={`p-2.5 rounded-lg text-xs font-extrabold border transition-all ${selectedTailor === tailor ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                        >
                          {tailor}
                        </button>
                      ))}
                    </div>
                    <button onClick={submitTailorAssignment} disabled={!selectedTailor} className="w-full bg-blue-600 disabled:opacity-40 hover:bg-blue-500 text-white text-xs font-black py-2.5 rounded-lg transition uppercase tracking-wider shadow-md shadow-blue-500/20">
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