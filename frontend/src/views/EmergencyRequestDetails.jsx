import React, { useState, useEffect } from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import { mockData } from '../data/mockData';
import {
  AlertTriangle,
  Clock,
  Heart,
  Droplet,
  CheckCircle2,
  Building2,
  MapPin,
  Send,
  Sparkles,
  Phone,
  ShieldCheck,
  Check,
  ChevronRight,
  ArrowLeft,
  XCircle,
  Radio,
  Share2
} from 'lucide-react';

export default function EmergencyRequestDetails({ setCurrentView }) {
  const {
    requests,
    selectedRequestId,
    setSelectedRequestId,
    updateRequestStatus,
    notifyDonor,
    respondAsDonor,
    updateInventoryUnit,
    showToast
  } = useRedRelay();

  const req = requests.find((r) => r.id === selectedRequestId) || requests[0];

  const [countdown, setCountdown] = useState(req.requiredByMinutes || 42);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Timeline steps
  const timelineSteps = [
    { id: 'CREATED', label: '1. Request Created', desc: 'Clinical parameters logged' },
    { id: 'MATCHING', label: '2. Smart Matching', desc: 'Algorithm search active' },
    { id: 'DONORS_IDENTIFIED', label: '3. Donors Identified', desc: '8 compatible donors located' },
    { id: 'BLOOD_BANK_CHECK', label: '4. Blood Bank Checked', desc: 'Reserve stock verified' },
    { id: 'ALERT_SENT', label: '5. Donor Alerts Dispatched', desc: 'SMS & push relay broadcast' },
    { id: 'FULFILLED', label: '6. Fulfilled', desc: 'Transfusion secured' }
  ];

  const getStepProgressIndex = (status) => {
    switch (status) {
      case 'CREATED': return 0;
      case 'MATCHING': return 1;
      case 'DONORS_IDENTIFIED': return 2;
      case 'BLOOD_BANK_CHECK': return 3;
      case 'ALERT_SENT': return 4;
      case 'PARTIALLY_FULFILLED': return 4;
      case 'FULFILLED': return 5;
      default: return 1;
    }
  };

  const currentStepIdx = getStepProgressIndex(req.status);

  // Status simulation controls
  const handleSimulateDonorAccept = () => {
    respondAsDonor('D104', req.id, 'ACCEPT');
    updateRequestStatus(req.id, 'ALERT_SENT', Math.min(req.unitsRequired, (req.unitsFulfilled || 0) + 1));
    showToast('Donor #D104 (Neha Patil) committed 1 pint! Dispatch vehicle alerted.', 'success');
  };

  const handleSimulateBankConfirm = () => {
    updateInventoryUnit('BB5', req.bloodGroup, -3, true);
    updateRequestStatus(req.id, 'PARTIALLY_FULFILLED', req.unitsRequired);
    showToast('Rotary Blood Bank BKC confirmed 3 reserve units for Lilavati Hospital.', 'success');
  };

  const handleMarkFulfilled = () => {
    updateRequestStatus(req.id, 'FULFILLED', req.unitsRequired);
    showToast(Emergency request  marked fully FULFILLED! Transfusion secured., 'success');
  };

  const handleCancel = () => {
    updateRequestStatus(req.id, 'CANCELLED');
    showToast(Emergency request  cancelled., 'info');
  };

  return (
    <div className=space-y-6 pb-16>
      
      {/* Back and Selector Bar */}
      <div className=flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200>
        <button
          onClick={() => setCurrentView('dashboard')}
          className=flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors
        >
          <ArrowLeft className=w-4 h-4 />
          <span>Back to Operations</span>
        </button>

        <div className=flex items-center gap-2>
          <span className=text-xs text-slate-500 font-medium hidden sm:inline>
            Active Cases:
          </span>
          <select
            value={selectedRequestId}
            onChange={(e) => setSelectedRequestId(e.target.value)}
            className=text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono font-semibold text-slate-800
          >
            {requests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} - {r.hospitalName} ({r.bloodGroup})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Flagship Emergency Header Card */}
      <div className=bg-gradient-to-r from-red-600 via-rose-700 to-red-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden>
        <div className=absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none></div>

        <div className=relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6>
          <div className=space-y-3>
            <div className=flex flex-wrap items-center gap-2.5>
              <span className=px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-mono font-bold tracking-wider uppercase border border-white/30>
                {req.id}
              </span>
              <span className=px-3 py-1 bg-red-500/80 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse>
                <span className=w-2 h-2 rounded-full bg-white></span>
                {req.urgency.toUpperCase()} BLOOD EMERGENCY
              </span>
              {req.isSuspicious && (
                <span className=px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-xs font-bold uppercase tracking-wider>
                  ⚠️ Potential Duplicate Flagged
                </span>
              )}
            </div>

            <div>
              <h1 className=text-2xl sm:text-3xl font-extrabold tracking-tight font-display>
                {req.hospitalName}
              </h1>
              <p className=text-xs sm:text-sm text-red-100 flex items-center gap-1.5 mt-1>
                <MapPin className=w-4 h-4 text-red-200 />
                <span>{req.location}</span>
                <span className=text-white/40>•</span>
                <span>Case: {req.patientCaseId}</span>
              </p>
            </div>

            {/* AI Priority Engine Explanation Callout */}
            <div className=bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 max-w-2xl text-xs>
              <div className=flex items-center gap-2 text-red-200 font-bold mb-1>
                <Sparkles className=w-4 h-4 text-amber-300 />
                <span>AI PRIORITY ENGINE: {req.priority || 'CRITICAL'} (Score: {req.priorityScore || 98}/100)</span>
              </div>
              <p className=text-white/90 leading-relaxed>
                {req.priorityReason || 'High priority because required time is less than 1 hour and available inventory is low in this sector.'}
              </p>
            </div>
          </div>

          {/* Right Metrics Tile */}
          <div className=flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0>
            <div className=px-3 py-2 text-center>
              <p className=text-[11px] font-semibold text-red-200 uppercase tracking-wider>Blood Group</p>
              <p className=text-3xl font-black text-white font-display mt-0.5>{req.bloodGroup}</p>
            </div>
            <div className=w-px h-12 bg-white/20 hidden sm:block></div>
            <div className=px-3 py-2 text-center>
              <p className=text-[11px] font-semibold text-red-200 uppercase tracking-wider>Required</p>
              <p className=text-3xl font-black text-white font-display mt-0.5>{req.unitsRequired} <span className=text-xs font-normal text-red-200>units</span></p>
            </div>
            <div className=w-px h-12 bg-white/20 hidden sm:block></div>
            <div className=px-3 py-2 text-center>
              <p className=text-[11px] font-semibold text-red-200 uppercase tracking-wider>Time Remaining</p>
              <p className=text-3xl font-black text-amber-300 font-display mt-0.5 flex items-center justify-center gap-1>
                <Clock className=w-5 h-5 animate-spin-slow />
                <span>{countdown}m</span>
              </p>
            </div>
          </div>
        </div>

        {/* Live Operational Status Strip */}
        <div className=mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs>
          <div className=flex items-center gap-2>
            <span className=text-red-200>Current Relay State:</span>
            <span className=px-3 py-1 bg-white text-red-700 font-black tracking-wide rounded-full uppercase shadow-xs>
              {req.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className=flex items-center gap-2>
            <button
              onClick={() => setCurrentView('map')}
              className=px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1.5
            >
              <MapPin className=w-3.5 h-3.5 text-red-200 />
              <span>View On Live Map</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast('Tracking link copied to clipboard', 'info');
              }}
              className=px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1.5
            >
              <Share2 className=w-3.5 h-3.5 text-red-200 />
              <span>Share Relay</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Timeline Stepper */}
      <div className=bg-white p-6 rounded-3xl border border-slate-200 shadow-xs>
        <div className=flex items-center justify-between mb-4>
          <h3 className=text-sm font-bold text-slate-900>
            Emergency Relay Progress Timeline
          </h3>
          <span className=text-xs font-semibold text-slate-500>
            Stage {currentStepIdx + 1} of 6
          </span>
        </div>

        <div className=grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3>
          {timelineSteps.map((s, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div
                key={s.id}
                className={p-3.5 rounded-2xl border transition-all }
              >
                <div className=flex items-center justify-between mb-2>
                  <span
                    className={w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold }
                  >
                    {isCompleted ? <Check className=w-3.5 h-3.5 /> : idx + 1}
                  </span>
                  <span className=text-[10px] font-mono font-bold text-slate-400>
                    {isCompleted ? 'DONE' : isCurrent ? 'ACTIVE' : 'QUEUED'}
                  </span>
                </div>
                <p className={	ext-xs font-bold }>
                  {s.label}
                </p>
                <p className=text-[11px] text-slate-500 mt-1 leading-snug>
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Key Tactical Metric Highlights */}
      <div className=grid grid-cols-2 sm:grid-cols-4 gap-4>
        <div className=bg-white p-4 rounded-2xl border border-slate-200 shadow-xs>
          <p className=text-[11px] font-semibold text-slate-400 uppercase tracking-wider>Compatible Donors Found</p>
          <p className=text-3xl font-extrabold text-blue-600 font-display mt-1>
            {req.compatibleDonorsFound || 8}
          </p>
          <p className=text-[11px] text-slate-500 mt-1>Within 10 km geofence</p>
        </div>

        <div className=bg-white p-4 rounded-2xl border border-slate-200 shadow-xs>
          <p className=text-[11px] font-semibold text-slate-400 uppercase tracking-wider>Nearby Blood Banks</p>
          <p className=text-3xl font-extrabold text-emerald-600 font-display mt-1>
            {req.nearbyBloodBanks || 3}
          </p>
          <p className=text-[11px] text-slate-500 mt-1>Ready for reserve hold</p>
        </div>

        <div className=bg-white p-4 rounded-2xl border border-slate-200 shadow-xs>
          <p className=text-[11px] font-semibold text-slate-400 uppercase tracking-wider>Available Units Nearby</p>
          <p className=text-3xl font-extrabold text-amber-600 font-display mt-1>
            {req.availableUnitsNearby || 5}
          </p>
          <p className=text-[11px] text-slate-500 mt-1>Reserve buffer stock</p>
        </div>

        <div className=bg-white p-4 rounded-2xl border border-slate-200 shadow-xs>
          <p className=text-[11px] font-semibold text-slate-400 uppercase tracking-wider>Nearest Distance</p>
          <p className=text-3xl font-extrabold text-slate-900 font-display mt-1>
            {req.nearestDistanceKm || 2.4} <span className=text-sm font-normal text-slate-500>km</span>
          </p>
          <p className=text-[11px] text-slate-500 mt-1>Est. 12 min transport</p>
        </div>
      </div>

      {/* Matched Donors Section */}
      <div className=bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden>
        <div className=p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3>
          <div>
            <div className=flex items-center gap-2>
              <h3 className=text-sm font-bold text-slate-900>
                AI Matched Compatible Donors
              </h3>
              <span className=px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700>
                Algorithm Ranking
              </span>
            </div>
            <p className=text-xs text-slate-500 mt-0.5>
              Ranked by blood compatibility, live proximity, response time history and cooldown eligibility.
            </p>
          </div>

          <button
            onClick={() => {
              if (req.matchedDonorsList) {
                req.matchedDonorsList.forEach((d) => notifyDonor(d.donorId, req.id));
              }
            }}
            className=px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0
          >
            <Send className=w-3.5 h-3.5 />
            <span>Notify All Matched Donors</span>
          </button>
        </div>

        <div className=p-5 grid grid-cols-1 md:grid-cols-2 gap-4>
          {(req.matchedDonorsList || []).map((donor) => {
            return (
              <div
                key={donor.donorId}
                className=p-4 rounded-2xl border border-slate-200 hover:border-red-300 transition-all bg-slate-50/50 hover:bg-white flex flex-col justify-between
              >
                <div>
                  <div className=flex items-start justify-between gap-2>
                    <div>
                      <div className=flex items-center gap-2>
                        <span className=text-xs font-bold text-slate-900>{donor.name}</span>
                        <span className=font-mono text-[10px] text-slate-400>#{donor.donorId}</span>
                      </div>
                      <p className=text-[11px] text-slate-500 mt-0.5>
                        Distance: <strong className=text-slate-800>{donor.distance} km</strong> • {donor.availability}
                      </p>
                    </div>

                    <div className=text-right>
                      <span className=inline-block px-2.5 py-0.5 rounded-md font-extrabold text-xs bg-red-100 text-red-700>
                        {donor.bloodGroup}
                      </span>
                    </div>
                  </div>

                  {/* AI Match Score Progress Bar */}
                  <div className=mt-3>
                    <div className=flex items-center justify-between text-[11px] mb-1>
                      <span className=font-semibold text-slate-600 flex items-center gap-1>
                        <Sparkles className=w-3 h-3 text-amber-500 />
                        AI Match Score
                      </span>
                      <span className=font-bold text-red-600>{donor.matchScore}%</span>
                    </div>
                    <div className=w-full h-2 rounded-full bg-slate-200 overflow-hidden>
                      <div
                        className=h-full rounded-full bg-gradient-to-r from-red-500 to-rose-600
                        style={{ width: ${donor.matchScore}% }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className=mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2>
                  <span
                    className={px-2 py-0.5 rounded text-[10px] font-semibold }
                  >
                    Status: {donor.status || 'Identified'}
                  </span>

                  <div className=flex items-center gap-1.5>
                    <button
                      onClick={() => notifyDonor(donor.donorId, req.id)}
                      className=px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors flex items-center gap-1
                    >
                      <Send className=w-3 h-3 />
                      <span>Notify</span>
                    </button>
                    <button
                      onClick={() => setCurrentView('map')}
                      className=px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1
                    >
                      <MapPin className=w-3 h-3 />
                      <span>Map</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nearby Blood Banks & Reserve Hold Section */}
      <div className=bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden>
        <div className=p-5 border-b border-slate-100 flex items-center justify-between>
          <div>
            <h3 className=text-sm font-bold text-slate-900>
              Nearby Blood Banks with {req.bloodGroup} Inventory
            </h3>
            <p className=text-xs text-slate-500>
              Direct inventory integration across Mumbai Central and Western zones
            </p>
          </div>
          <span className=text-xs text-slate-400>3 closest centres</span>
        </div>

        <div className=divide-y divide-slate-100 text-xs>
          {mockData.bloodBanks.slice(0, 3).map((bank) => (
            <div key={bank.id} className=p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50>
              <div className=space-y-1>
                <div className=flex items-center gap-2>
                  <Building2 className=w-4 h-4 text-emerald-600 />
                  <span className=font-bold text-slate-800>{bank.name}</span>
                  <span className=text-slate-400>({bank.area})</span>
                </div>
                <p className=text-slate-500>
                  Contact: <span className=font-mono text-slate-700>{bank.contact}</span> • Distance: <strong className=text-slate-700>{bank.distanceKm} km</strong>
                </p>
              </div>

              <div className=flex items-center gap-3>
                <div className=text-right>
                  <p className=text-[11px] text-slate-400>Available {req.bloodGroup}</p>
                  <p className=text-base font-bold text-emerald-600>
                    {bank.inventory[req.bloodGroup] || 0} Units
                  </p>
                </div>
                <button
                  onClick={handleSimulateBankConfirm}
                  className=px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors
                >
                  Reserve & Dispatch
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Simulation Action Toolbar */}
      <div className=bg-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-800>
        <div className=flex flex-col sm:flex-row sm:items-center justify-between gap-4>
          <div>
            <div className=flex items-center gap-2>
              <Radio className=w-4 h-4 text-red-400 animate-pulse />
              <h4 className=text-xs font-bold uppercase tracking-wider text-slate-300>
                Hackathon Live Simulation Controls
              </h4>
            </div>
            <p className=text-xs text-slate-400 mt-0.5>
              Trigger lifecycle states instantly to show judges how the multi-stakeholder relay reacts.
            </p>
          </div>

          <div className=flex flex-wrap items-center gap-2>
            <button
              onClick={handleSimulateDonorAccept}
              className=px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors
            >
              Simulate Donor Acceptance
            </button>
            <button
              onClick={handleSimulateBankConfirm}
              className=px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors
            >
              Confirm Blood Bank Units
            </button>
            <button
              onClick={handleMarkFulfilled}
              className=px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white text-xs font-bold transition-all shadow-xs
            >
              Mark Fulfilled ✓
            </button>
            <button
              onClick={handleCancel}
              className=px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
