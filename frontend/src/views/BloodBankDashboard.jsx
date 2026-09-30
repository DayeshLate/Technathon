import React, { useState } from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import { mockData } from '../data/mockData';
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
  Sliders
} from 'lucide-react';

export default function BloodBankDashboard({ setCurrentView }) {
  const {
    bloodBanks,
    requests,
    setSelectedRequestId,
    updateRequestStatus,
    updateInventoryUnit,
    showToast
  } = useRedRelay();

  // Active facility: Rotary Blood Bank BKC / Red Cross
  const currentBank = bloodBanks[0];

  const totalInventoryUnits = Object.values(currentBank.inventory).reduce((a, b) => a + b, 0);

  const incomingEmergencyRequests = requests.filter(
    (r) => r.status !== 'CANCELLED'
  );

  const criticalGroups = Object.entries(currentBank.inventory)
    .filter(([bg, units]) => units < 10)
    .map(([bg]) => bg);

  const handleAcceptRequest = (reqId) => {
    updateRequestStatus(reqId, 'PARTIALLY_FULFILLED');
    showToast(Blood Bank accepted request . Reserve units allocated., 'success');
  };

  const handleFulfillRequest = (reqId, unitsReq, bg) => {
    updateInventoryUnit(currentBank.id, bg, -unitsReq, true);
    updateRequestStatus(reqId, 'FULFILLED');
    showToast(Request  marked FULFILLED! Dispatch logged., 'success');
  };

  return (
    <div className=space-y-6 pb-16>
      
      {/* Header */}
      <div className=bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6>
        <div className=space-y-2>
          <div className=flex items-center gap-2>
            <span className=px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider>
              Blood Bank Operations Terminal
            </span>
            <span className=px-2 py-0.5 bg-emerald-400 text-emerald-950 rounded-full text-[10px] font-bold>
              Apex Licensed
            </span>
          </div>
          <h1 className=text-2xl sm:text-3xl font-extrabold font-display>
            {currentBank.name}
          </h1>
          <p className=text-xs sm:text-sm text-emerald-100 flex items-center gap-2>
            <Building2 className=w-4 h-4 text-emerald-300 />
            <span>Facility ID: #{currentBank.id}</span>
            <span>•</span>
            <span>{currentBank.area}, Mumbai</span>
            <span>•</span>
            <span>Contact: {currentBank.contact}</span>
          </p>
        </div>

        <button
          onClick={() => setCurrentView('inventory')}
          className=px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-bold text-xs transition-colors self-start sm:self-auto
        >
          Manage All Stocks →
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className=grid grid-cols-2 sm:grid-cols-4 gap-4>
        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Total In-Stock Units</span>
          <p className=text-3xl font-black text-slate-900 font-display mt-2>
            {totalInventoryUnits}
          </p>
          <p className=text-[11px] text-emerald-600 font-semibold mt-1>Across 8 Blood Groups</p>
        </div>

        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Today's Inbound Requests</span>
          <p className=text-3xl font-black text-blue-600 font-display mt-2>
            {incomingEmergencyRequests.length + 14}
          </p>
          <p className=text-[11px] text-slate-500 mt-1>Trauma admissions</p>
        </div>

        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Critical Blood Groups</span>
          <p className=text-3xl font-black text-red-600 font-display mt-2>
            {criticalGroups.length} <span className=text-xs font-normal text-slate-500>({criticalGroups.join(', ')})</span>
          </p>
          <p className=text-[11px] text-red-600 font-semibold mt-1>Below safety threshold</p>
        </div>

        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Fulfilled Dispatches</span>
          <p className=text-3xl font-black text-emerald-600 font-display mt-2>
            18
          </p>
          <p className=text-[11px] text-slate-500 mt-1>Delivered via cold-chain</p>
        </div>
      </div>

      {/* Incoming Requests Queue */}
      <div className=bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden>
        <div className=p-5 border-b border-slate-100 flex items-center justify-between>
          <div>
            <h3 className=text-sm font-bold text-slate-900>
              Incoming Hospital Emergency Requests
            </h3>
            <p className=text-xs text-slate-500>
              Prioritized by AI Clinical Urgency score and road transit proximity
            </p>
          </div>
          <span className=text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100>
            {incomingEmergencyRequests.length} Active in Sector
          </span>
        </div>

        <div className=overflow-x-auto>
          <table className=w-full text-left border-collapse text-xs>
            <thead>
              <tr className=bg-slate-50 text-slate-500 font-semibold border-b border-slate-100>
                <th className=py-3 px-4>Request ID</th>
                <th className=py-3 px-4>Hospital Target</th>
                <th className=py-3 px-4>Blood Group</th>
                <th className=py-3 px-4>Units Needed</th>
                <th className=py-3 px-4>Urgency</th>
                <th className=py-3 px-4>Distance</th>
                <th className=py-3 px-4>Time Left</th>
                <th className=py-3 px-4 text-right>Actions</th>
              </tr>
            </thead>
            <tbody className=divide-y divide-slate-100>
              {incomingEmergencyRequests.map((req) => (
                <tr key={req.id} className=hover:bg-slate-50 transition-colors>
                  <td className=py-3.5 px-4 font-mono font-bold text-slate-800>{req.id}</td>
                  <td className=py-3.5 px-4>
                    <p className=font-semibold text-slate-900>{req.hospitalName}</p>
                    <p className=text-[11px] text-slate-400>{req.location}</p>
                  </td>
                  <td className=py-3.5 px-4>
                    <span className=px-2 py-0.5 rounded font-black text-xs bg-red-100 text-red-700>
                      {req.bloodGroup}
                    </span>
                  </td>
                  <td className=py-3.5 px-4 font-semibold text-slate-800>
                    {req.unitsRequired} Pints
                  </td>
                  <td className=py-3.5 px-4>
                    <span
                      className={px-2 py-0.5 rounded-full text-[10px] font-bold }
                    >
                      {req.urgency}
                    </span>
                  </td>
                  <td className=py-3.5 px-4 font-medium text-slate-700>
                    {req.nearestDistanceKm || 2.4} km
                  </td>
                  <td className=py-3.5 px-4 text-red-600 font-bold>
                    <span className=flex items-center gap-1>
                      <Clock className=w-3.5 h-3.5 />
                      {req.requiredByMinutes} min
                    </span>
                  </td>
                  <td className=py-3.5 px-4 text-right space-x-1.5>
                    <button
                      onClick={() => {
                        setSelectedRequestId(req.id);
                        setCurrentView('details');
                      }}
                      className=px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className=px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleFulfillRequest(req.id, req.unitsRequired, req.bloodGroup)}
                      className=px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold
                    >
                      Fulfill
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
