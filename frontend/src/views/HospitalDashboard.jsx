import React, { useState } from 'react';
import {
  Building2,
  AlertTriangle,
  Droplet,
  Users,
  Clock,
  PlusCircle,
  Phone,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Send,
  Activity,
  Layers,
  Search
} from 'lucide-react';
import api from '../services/api';

export default function HospitalDashboard({
  requests = [],
  bloodBanks = [],
  donors = [],
  hospitals = [],
  onOpenCreateModal,
  onSelectRequest,
  onNavigateTab,
  onToast
}) {
  const [selectedHospitalId, setSelectedHospitalId] = useState('H1');
  const [reserveLoading, setReserveLoading] = useState(null);

  const currentHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0] || {
    id: 'H1',
    name: 'Lilavati Hospital & Research Centre',
    area: 'Bandra West',
    lat: 19.0514,
    lng: 72.8295,
    contact: '+91 22 2675 1000',
    type: 'Super Specialty Apex'
  };

  // Filter requests specific to this hospital
  const hospitalRequests = requests.filter(
    (r) => r.hospitalId === currentHospital.id || r.hospitalName?.toLowerCase().includes(currentHospital.name?.toLowerCase().slice(0, 8))
  );

  const activeHospitalRequests = hospitalRequests.filter((r) => r.status !== 'FULFILLED' && r.status !== 'CANCELLED');
  const fulfilledHospitalRequests = hospitalRequests.filter((r) => r.status === 'FULFILLED');

  const totalUnitsNeeded = activeHospitalRequests.reduce(
    (acc, r) => acc + Math.max(0, (r.unitsRequired || 1) - (r.unitsFulfilled || 0)),
    0
  );

  // Incoming responding donors for this hospital
  const respondingDonors = [];
  activeHospitalRequests.forEach((req) => {
    (req.matchedDonorsList || []).forEach((d) => {
      if (d.status === 'Accepted' || d.matchScore >= 92) {
        respondingDonors.push({
          ...d,
          requestId: req.id,
          targetHospital: currentHospital.name,
          bloodGroup: d.bloodGroup || req.bloodGroup
        });
      }
    });
  });

  // Handle Quick Reserve from Blood Bank
  const handleQuickReserve = async (bankId, bloodGroup, units = 2) => {
    setReserveLoading(`${bankId}-${bloodGroup}`);
    try {
      await api.reserveUnits(bankId, bloodGroup, units, activeHospitalRequests[0]?.id || 'REQ-HOSP-RESERVE');
      if (onToast) onToast(`Successfully reserved ${units} units of ${bloodGroup} from blood bank!`, 'success');
    } catch (err) {
      if (onToast) onToast(`Reservation error: ${err.message}`, 'error');
    } finally {
      setReserveLoading(null);
    }
  };

  // Broadcast alert to all matched donors
  const handleNotifyAll = async (requestId) => {
    try {
      await api.notifyAllDonors(requestId);
      if (onToast) onToast(`Broadcast alert dispatched to all matching donors for ${requestId}!`, 'success');
    } catch (err) {
      if (onToast) onToast(`Dispatch error: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 🏥 Hospital Profile Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Hospital Apex Command
              </span>
              <span className="px-2.5 py-0.5 bg-red-600/30 text-red-300 border border-red-500/30 rounded-full text-[10px] font-bold">
                Trauma Code Red Enabled
              </span>
              <span className="px-2.5 py-0.5 bg-white/10 text-slate-300 rounded-full text-[10px] font-bold">
                {currentHospital.type || 'Super Specialty'}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {currentHospital.name}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-blue-200/80 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> {currentHospital.area || 'Mumbai Central'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-400" /> {currentHospital.contact || '+91 22 2675 1000'}
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">Verified Hospital Hub</span>
              </p>
            </div>
          </div>

          {/* Hospital Switcher & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
            <div className="bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 pl-2">Switch Facility:</span>
              <select
                value={selectedHospitalId}
                onChange={(e) => {
                  setSelectedHospitalId(e.target.value);
                  if (onToast) onToast(`Switched hospital view to ${hospitals.find((h) => h.id === e.target.value)?.name || e.target.value}`, 'info');
                }}
                className="bg-slate-800 text-white text-xs font-bold rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.area})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onOpenCreateModal}
              className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Raise Emergency Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Hospital Specific KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Facility Emergencies</span>
            <div className="p-2 rounded-xl bg-red-100 text-red-600 font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{activeHospitalRequests.length}</p>
          <span className="text-[11px] text-red-600 font-bold mt-1 inline-block">
            {activeHospitalRequests.length > 0 ? 'Active in ICU / Trauma' : 'All Requests Fulfilled'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Units Needed Now</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600 font-bold">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600">{totalUnitsNeeded}</p>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">
            Across active transfusions
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Responding Donors</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600">{respondingDonors.length}</p>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
            ● Matched & In Transit
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg Relay Speed</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600 font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-600">8.4 min</p>
          <span className="text-[11px] text-purple-700 font-semibold mt-1 inline-block">
            AI Triage to Dispatch
          </span>
        </div>
      </div>

      {/* Main Hospital Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Hospital Emergency Requests (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                  Active Transfusion Demands ({activeHospitalRequests.length})
                </h3>
                <p className="text-xs text-slate-500">Cases queued at {currentHospital.name}</p>
              </div>
              <button
                onClick={onOpenCreateModal}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                + New Request
              </button>
            </div>

            {activeHospitalRequests.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">No Pending Emergency Demands</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  All emergency blood requests for {currentHospital.name} have been fulfilled.
                </p>
                <button
                  onClick={onOpenCreateModal}
                  className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl"
                >
                  Create New Transfusion Request
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {activeHospitalRequests.map((req) => {
                  const percent = Math.min(100, Math.round(((req.unitsFulfilled || 0) / (req.unitsRequired || 1)) * 100));
                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-red-300 transition-all bg-slate-50/50 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-slate-900">{req.id}</span>
                            <span className="px-2 py-0.5 rounded font-black text-xs bg-red-100 text-red-700">
                              {req.bloodGroup}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                              {req.urgency}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 font-semibold">
                            Case: {req.patientCaseId || 'Trauma ICU Transfusion'} • {req.requiredByMinutes || 45} mins remaining
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900">
                            {req.unitsFulfilled || 0} / {req.unitsRequired} Units
                          </span>
                          <span className="block text-[10px] text-blue-600 font-bold uppercase">
                            {req.status}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden my-2">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-400 text-[11px]">
                          {req.matchedDonorsList?.length || 0} Donors Identified
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleNotifyAll(req.id)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Broadcast Alerts
                          </button>
                          <button
                            onClick={() => {
                              if (onSelectRequest) onSelectRequest(req.id);
                              if (onNavigateTab) onNavigateTab('tracker');
                            }}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                          >
                            Track Relay <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Responding Donors Stream for this Hospital */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Matched Donors Responding to {currentHospital.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time donor coordinates and dispatch status for active cases
            </p>

            {respondingDonors.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No active donors currently in transit. Use "Broadcast Alerts" above to notify candidates.
              </div>
            ) : (
              <div className="space-y-2.5">
                {respondingDonors.slice(0, 4).map((d, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 font-black text-xs flex items-center justify-center">
                        {d.bloodGroup}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">{d.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {d.distance || 2.1} km away • Match Score: <strong className="text-red-600">{d.matchScore || 95}%</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {d.status || 'Accepted'}
                      </span>
                      <a
                        href={`tel:${d.phone || '+91 98200 12345'}`}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Call
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Nearby Blood Bank Stock & Quick Reservation (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-red-600" />
                  Nearby Blood Bank Stock Requisition
                </h3>
                <p className="text-xs text-slate-500">Direct hospital-to-bank reserve ordering</p>
              </div>
              <button
                onClick={() => onNavigateTab && onNavigateTab('inventory')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                All Banks →
              </button>
            </div>

            <div className="space-y-3">
              {bloodBanks.slice(0, 4).map((bank) => {
                const requestedGroup = activeHospitalRequests[0]?.bloodGroup || 'O-';
                const availableUnits = bank.inventory?.[requestedGroup] || 0;
                const isCrit = availableUnits < 10;
                const loadingKey = `${bank.id}-${requestedGroup}`;

                return (
                  <div
                    key={bank.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{bank.name}</h4>
                        <p className="text-[10px] text-slate-500">{bank.area} • {bank.contact}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCrit ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {availableUnits} {requestedGroup} units
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        Total Stock: {Object.values(bank.inventory || {}).reduce((a, b) => a + b, 0)} units
                      </span>
                      <button
                        disabled={availableUnits <= 0 || reserveLoading === loadingKey}
                        onClick={() => handleQuickReserve(bank.id, requestedGroup, 2)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          availableUnits > 0
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {reserveLoading === loadingKey ? 'Reserving...' : `Reserve 2x ${requestedGroup}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fulfilled Transfusion History for this Hospital */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Fulfilled Transfusion Logs</h3>
            <div className="space-y-2 text-xs">
              {fulfilledHospitalRequests.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-[11px] text-center">
                  Active emergency cases in progress. Fulfilled dispatches will appear here.
                </div>
              ) : (
                fulfilledHospitalRequests.map((r) => (
                  <div key={r.id} className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-emerald-950">{r.id}</span>
                      <span className="ml-2 font-bold text-red-700">{r.bloodGroup}</span>
                      <p className="text-[10px] text-emerald-700">{r.unitsRequired} units delivered</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                      FULFILLED ✓
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
