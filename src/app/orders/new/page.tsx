'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SALES_TEAM = ['Faith', 'Phylis'];

export default function NewOrderPage() {
  const router = useRouter();
  const [intakeStep, setIntakeStep] = useState(1);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    salesRep: SALES_TEAM[0],
    garmentType: 'Suit',
    fabricSelection: '',
    fabricQuantityRequired: '2.5',
    neck: '0', chest: '0', shoulder: '0', waist: '0', hip: '0', length: '0',
    priceTotal: '15000', depositPaid: '5000', paymentMethod: 'M-Pesa', priority: 'Standard', notes: '', dueDate: '',
  });

  useEffect(() => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          const fabricItems = json.data.filter((item: any) => item.category === 'Fabric');
          setFabrics(fabricItems);
          if (fabricItems.length > 0) setFormData(p => ({ ...p, fabricSelection: fabricItems[0].name }));
        }
      });
  }, []);

  const handleGarmentChange = (type: string) => {
    let m = '2.5', p = '15000';
    if (type === 'Shirt') { m = '1.5'; p = '4500'; }
    else if (type === 'Dress' || type === 'Native') { m = '2.5'; p = '8500'; }
    setFormData(prev => ({ ...prev, garmentType: type, fabricQuantityRequired: m, priceTotal: p }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fabricQuantityRequired: Number(formData.fabricQuantityRequired),
          priceTotal: Number(formData.priceTotal),
          depositPaid: Number(formData.depositPaid),
          measurements: {
            neck: Number(formData.neck), chest: Number(formData.chest), shoulder: Number(formData.shoulder),
            waist: Number(formData.waist), hip: Number(formData.hip), length: Number(formData.length),
          },
          dueDate: formData.dueDate ? new Date(formData.dueDate) : new Date(),
        }),
      });
      const json = await res.json();
      if (json.success) router.push('/orders');
      else alert(json.message || 'Error creating order');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100">Order Intake Wizard</h1>
          <p className="text-base text-slate-400">Step {intakeStep} of 5</p>
        </div>
        <button onClick={() => router.push('/orders')} className="text-base text-slate-400 hover:text-white">Cancel</button>
      </div>

      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${intakeStep >= s ? 'bg-blue-500' : 'bg-slate-800'}`} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {intakeStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-100">Customer Details</h2>
            <input type="text" required placeholder="Customer Name" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-base" />
            <input type="text" placeholder="Phone Number" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-base" />
            <button type="button" disabled={!formData.customerName} onClick={() => setIntakeStep(2)} className="w-full py-3 bg-blue-600 text-white font-bold text-base rounded-lg">Next: Garment &rarr;</button>
          </div>
        )}

        {intakeStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-100">Garment & Fabric</h2>
            <div className="grid grid-cols-2 gap-2">
              {['Suit', 'Dress', 'Shirt', 'Native'].map(type => (
                <button type="button" key={type} onClick={() => handleGarmentChange(type)} className={`p-3 rounded-lg text-base font-bold border ${formData.garmentType === type ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>{type}</button>
              ))}
            </div>
            <select value={formData.fabricSelection} onChange={e => setFormData({ ...formData, fabricSelection: e.target.value })} className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-base">
              {fabrics.map(f => <option key={f._id} value={f.name}>{f.name} ({f.stockLevel}m in stock)</option>)}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIntakeStep(1)} className="w-1/3 py-3 bg-slate-800 text-slate-300 font-bold text-base rounded-lg">&larr; Back</button>
              <button type="button" onClick={() => setIntakeStep(3)} className="w-2/3 py-3 bg-blue-600 text-white font-bold text-base rounded-lg">Next: Measurements &rarr;</button>
            </div>
          </div>
        )}

        {intakeStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-100">Blueprint Measurements (Inches)</h2>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" step="0.25" placeholder="Neck" value={formData.neck === '0' ? '' : formData.neck} onChange={e => setFormData({ ...formData, neck: e.target.value })} className="p-3 text-center rounded bg-slate-950 border border-slate-800 text-slate-100 text-base" />
              <input type="number" step="0.25" placeholder="Chest" value={formData.chest === '0' ? '' : formData.chest} onChange={e => setFormData({ ...formData, chest: e.target.value })} className="p-3 text-center rounded bg-slate-950 border border-slate-800 text-slate-100 text-base" />
              <input type="number" step="0.25" placeholder="Waist" value={formData.waist === '0' ? '' : formData.waist} onChange={e => setFormData({ ...formData, waist: e.target.value })} className="p-3 text-center rounded bg-slate-950 border border-slate-800 text-slate-100 text-base" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIntakeStep(2)} className="w-1/3 py-3 bg-slate-800 text-slate-300 font-bold text-base rounded-lg">&larr; Back</button>
              <button type="button" onClick={() => setIntakeStep(4)} className="w-2/3 py-3 bg-blue-600 text-white font-bold text-base rounded-lg">Next: Financials &rarr;</button>
            </div>
          </div>
        )}

        {intakeStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-100">Payment Terms</h2>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Total Cost" value={formData.priceTotal} onChange={e => setFormData({ ...formData, priceTotal: e.target.value })} className="p-3 rounded bg-slate-950 border border-slate-800 text-slate-100 text-base" />
              <input type="number" placeholder="Deposit Paid" value={formData.depositPaid} onChange={e => setFormData({ ...formData, depositPaid: e.target.value })} className="p-3 rounded bg-slate-950 border border-slate-800 text-slate-100 text-base" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIntakeStep(3)} className="w-1/3 py-3 bg-slate-800 text-slate-300 font-bold text-base rounded-lg">&larr; Back</button>
              <button type="button" onClick={() => setIntakeStep(5)} className="w-2/3 py-3 bg-blue-600 text-white font-bold text-base rounded-lg">Next: Delivery &rarr;</button>
            </div>
          </div>
        )}

        {intakeStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-100">Target Delivery Date</h2>
            <input type="date" required value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full p-3 rounded bg-slate-950 border border-slate-800 text-slate-100 text-base" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setIntakeStep(4)} className="w-1/3 py-3 bg-slate-800 text-slate-300 font-bold text-base rounded-lg">&larr; Back</button>
              <button type="submit" disabled={loading} className="w-2/3 py-3 bg-emerald-500 text-slate-950 font-bold text-base rounded-lg">{loading ? 'Creating...' : 'Confirm Order'}</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
