import React, { useState } from 'react';
import {
  Building2,
  Droplet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Send,
  Eye,
  Sliders,
  Plus,
  Minus
} from 'lucide-react';
import api from '../services/api';

export default function BloodBankDashboard({
  bloodBanks = [],
  requests = [],
  onNavigateTab,
  onToast,
  onRefreshData
}) {
  const [selectedBankId, setSelectedBankId] = useState('BB1');
  const [updatingStock, setUpdatingStock] = useState(null);

  const currentBank = bloodBanks.find((b) => b.id === selectedBankId) || bloodBanks[0] || {
    id: 'BB1',
    name: 'Red Cross Blood Centre Mumbai',
    area: 'Dadar / Fort',
    contact: '+91 22 2266 3390',
    threshold: 20,
    inventory: { 'A+': 18, 'A-': 8, 'B+': 24, 'B-': 6, 'AB+': 14, 'AB-': 4, 'O+': 32, 'O-': 5 },
    reserved: { 'A+': 2, 'A-': 0, 'B+': 4, 'B-': 1, 'AB+': 0, 'AB-': 0, 'O+': 6, 'O-': 2 }
  };

  const totalInventoryUnits = Object.values(currentBank.inventory || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalReservedUnits = Object.values(currentBank.reserved || {}).reduce((a, b) => a + (Number(b) || 0), 0);

  const incomingEmergencyRequests = requests.filter(
    (r) => r.status !== 'CANCELLED' && r.status !== 'FULFILLED'
  );

  const criticalGroups = Object.entries(currentBank.inventory || {})
    .filter(([_, units]) => units < 10)
    .map(([bg]) => bg);

  // Live Inventory adjustment in MySQL
  const handleStockAdjust = async (bloodGroup, diff) => {
    const key = `${bloodGroup}-${diff}`;
    setUpdatingStock(key);
    try {
      await api.updateInventory(currentBank.id, bloodGroup, diff);
      if (currentBank.inventory) {
        currentBank.inventory[bloodGroup] = Math.max(0, (currentBank.inventory[bloodGroup] || 0) + diff);
      }
      if (onToast) onToast(`${diff > 0 ? '+ Added' : '- Dispatched'} ${Math.abs(diff)} unit(s) of ${bloodGroup} to ${currentBank.name}`, 'success');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      if (onToast) onToast(`Stock update error: ${err.message}`, 'error');
    } finally {
      setUpdatingStock(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 🩸 Blood Bank Operations Terminal Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider">
              Blood Centre Operations Hub
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-400 text-emerald-950 rounded-full text-[10px] font-bold">
              FDA Licensed Hub
            </span>
            <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-[10px] font-bold">
              Threshold: {currentBank.threshold || 20} Units
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {currentBank.name}
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100 flex flex-wrap items-center gap-2.5 font-medium">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-300" /> Facility ID: #{currentBank.id}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {currentBank.area}, Mumbai
            </span>
            <span>•</span>
            <span>Contact: {currentBank.contact}</span>
          </p>
        </div>

        {/* Facility Selector */}
        <div className="flex flex-col gap-3 relative z-10 self-start sm:self-auto">
          <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-emerald-200">Switch Facility:</span>
            <select
              value={selectedBankId}
              onChange={(e) => {
                setSelectedBankId(e.target.value);
                const b = bloodBanks.find((item) => item.id === e.target.value);
                if (b && onToast) onToast(`Viewing ${b.name}`, 'info');
              }}
              className="bg-white/10 text-white font-bold text-xs rounded-xl px-2.5 py-1 border border-white/20 focus:outline-none"
            >
              {bloodBanks.map((b) => (
                <option key={b.id} value={b.id} className="text-slate-900">
                  {b.name} ({b.area})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('inventory')}
            className="px-4 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl font-bold text-xs transition-colors self-start sm:self-auto shadow-sm"
          >
            Citywide Reserves Matrix →
          </button>
        </div>
      </div>

      {/* 4 Operations KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">In-Stock Units</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold">
              <Droplet className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalInventoryUnits}</p>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">
            Ready for Hospital Dispatch
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reserved For ICU</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600">{totalReservedUnits}</p>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">
            Locked for active cases
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Critical Shortages</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-red-600">{criticalGroups.length}</p>
          <span className="text-[11px] text-red-600 font-bold mt-1 inline-block">
            {criticalGroups.length > 0 ? `${criticalGroups.join(', ')} under 10 units` : 'All groups healthy'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Inbounds</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 font-bold">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-600">{incomingEmergencyRequests.length}</p>
          <span className="text-[11px] text-purple-700 font-semibold mt-1 inline-block">
            Hospital requisitions
          </span>
        </div>
      </div>

      {/* Interactive Live Inventory Adjuster (8 Blood Groups) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Droplet className="w-4 h-4 text-emerald-600" />
              Live Blood Group Stock Adjuster ({currentBank.name})
            </h3>
            <p className="text-xs text-slate-500">Real-time inventory updates synced with MySQL database</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Auto-synced with MySQL BloodBank DB
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => {
            const available = currentBank.inventory?.[bg] || 0;
            const reserved = currentBank.reserved?.[bg] || 0;
            const isCrit = available < 10;
            const isAddLoading = updatingStock === `${bg}-1`;
            const isSubLoading = updatingStock === `${bg}--1`;

            return (
              <div
                key={bg}
                className={`p-4 rounded-2xl border transition-all ${
                  isCrit ? 'bg-red-50/50 border-red-200' : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                    {bg}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isCrit ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isCrit ? 'CRITICAL' : 'OK'}
                  </span>
                </div>

                <div className="my-2">
                  <p className="text-2xl font-black text-slate-900">
                    {available} <span className="text-xs font-semibold text-slate-500">units</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Reserved: {reserved} units
                  </p>
                </div>

                {/* Direct stock buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    disabled={isSubLoading || available <= 0}
                    onClick={() => handleStockAdjust(bg, -1)}
                    className="flex-1 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Minus className="w-3 h-3" /> 1
                  </button>
                  <button
                    disabled={isAddLoading}
                    onClick={() => handleStockAdjust(bg, 1)}
                    className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3" /> 1
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hospital Emergency Requisitions Queue */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              Incoming Emergency Hospital Demands
            </h3>
            <p className="text-xs text-slate-500">Hospitals requesting blood units from nearby centres</p>
          </div>
        </div>

        <div className="space-y-3">
          {incomingEmergencyRequests.slice(0, 4).map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-800">{req.id}</span>
                  <span className="font-bold text-slate-900 text-xs">{req.hospitalName}</span>
                  <span className="px-2 py-0.5 rounded font-black text-xs bg-red-100 text-red-700">
                    {req.bloodGroup}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                    {req.urgency}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Demands: <strong>{req.unitsRequired} units</strong> • Required within <strong>{req.requiredByMinutes || 45} mins</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleStockAdjust(req.bloodGroup, -req.unitsRequired);
                    if (onToast) onToast(`Allocated ${req.unitsRequired} units of ${req.bloodGroup} to ${req.hospitalName}!`, 'success');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Allocate & Dispatch Units
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
