import React, { useState } from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import { mockData } from '../data/mockData';
import { X, AlertCircle, Sparkles, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function EmergencyRequestModal({ isOpen, onClose, onCreated }) {
  const { createEmergencyRequest, getInventoryAggregates } = useRedRelay();

  const [hospitalId, setHospitalId] = useState('H1');
  const [patientCaseId, setPatientCaseId] = useState('PT-2026-TR891 (Severe Hemorrhage)');
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [unitsRequired, setUnitsRequired] = useState(4);
  const [urgency, setUrgency] = useState('Critical');
  const [requiredByMinutes, setRequiredByMinutes] = useState(42);
  const [location, setLocation] = useState('Bandra West, Mumbai');
  const [notes, setNotes] = useState('Immediate acute surgery requirement. Coordinated ambulance waiting.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSummary, setCreatedSummary] = useState(null);

  if (!isOpen) return null;

  const inventorySummary = getInventoryAggregates();
  const currentGroupStock = inventorySummary[bloodGroup]?.available || 0;

  // Real-time Priority Engine calculation
  const calculatePriority = () => {
    const mins = Number(requiredByMinutes);
    const units = Number(unitsRequired);
    if (urgency === 'Critical' || mins <= 60 || (bloodGroup === 'O-' && units >= 3)) {
      return {
        level: 'CRITICAL',
        color: 'text-red-700 bg-red-100 border-red-300',
        score: 96,
        reason: 'High priority because required time is less than 1 hour and available inventory is low (' + currentGroupStock + ' units in city buffer).'
      };
    }
    if (urgency === 'High' || mins <= 120 || units >= 4) {
      return {
        level: 'HIGH',
        color: 'text-amber-800 bg-amber-100 border-amber-300',
        score: 82,
        reason: 'Elevated urgency based on unit volume and clinical requirement timeframe.'
      };
    }
    return {
      level: 'NORMAL',
      color: 'text-emerald-800 bg-emerald-100 border-emerald-300',
      score: 64,
      reason: 'Standard clinical distribution queue within safe buffer window.'
    };
  };

  const priorityData = calculatePriority();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const newReq = createEmergencyRequest({
        hospitalId,
        patientCaseId,
        bloodGroup,
        unitsRequired,
        urgency,
        requiredByMinutes,
        location,
        notes
      });
      setIsSubmitting(false);
      setCreatedSummary(newReq);
    }, 600);
  };

  const handleFinish = () => {
    if (onCreated && createdSummary) {
      onCreated(createdSummary.id);
    }
    setCreatedSummary(null);
    onClose();
  };

  return (
    <div className=fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4>
      <div className=bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200>
        
        {/* Modal Header */}
        <div className=bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-6 py-4 text-white flex items-center justify-between>
          <div className=flex items-center gap-3>
            <div className=p-2 rounded-xl bg-white/20 backdrop-blur-xs>
              <AlertCircle className=w-5 h-5 text-white />
            </div>
            <div>
              <h2 className=text-base font-bold>Create Emergency Blood Request</h2>
              <p className=text-xs text-red-100>
                Instantly broadcast and match with donors and blood bank reserve across Mumbai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className=p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors
          >
            <X className=w-5 h-5 />
          </button>
        </div>

        {/* Modal Body */}
        <div className=p-6>
          {createdSummary ? (
            <div className=text-center py-6 space-y-4>
              <div className=w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm>
                <CheckCircle2 className=w-9 h-9 />
              </div>
              <div>
                <span className=px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-mono font-bold>
                  {createdSummary.id}
                </span>
                <h3 className=text-xl font-bold text-slate-900 mt-2>
                  Emergency Request Created Successfully!
                </h3>
                <p className=text-xs text-slate-500 max-w-md mx-auto mt-1>
                  Smart Matching engine has matched {createdSummary.compatibleDonorsFound} compatible donors and alerted 3 nearby blood banks.
                </p>
              </div>

              <div className=bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2 max-w-lg mx-auto>
                <div className=flex justify-between py-1 border-b border-slate-200/60>
                  <span className=text-slate-500>Blood Group & Units:</span>
                  <span className=font-bold text-red-600>{createdSummary.bloodGroup} • {createdSummary.unitsRequired} Units</span>
                </div>
                <div className=flex justify-between py-1 border-b border-slate-200/60>
                  <span className=text-slate-500>Hospital:</span>
                  <span className=font-semibold text-slate-800>{createdSummary.hospitalName}</span>
                </div>
                <div className=flex justify-between py-1 border-b border-slate-200/60>
                  <span className=text-slate-500>Priority Engine Rating:</span>
                  <span className=font-bold text-red-700>{createdSummary.priority} ({createdSummary.priorityScore}% Urgency)</span>
                </div>
                <div className=flex justify-between py-1>
                  <span className=text-slate-500>Response Window:</span>
                  <span className=font-semibold text-amber-600>{createdSummary.requiredByMinutes} Minutes Remaining</span>
                </div>
              </div>

              <div className=pt-3 flex items-center justify-center gap-3>
                <button
                  onClick={handleFinish}
                  className=px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all
                >
                  Track Live Request Now →
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className=space-y-4>
              
              {/* AI Priority Live Calculation Card */}
              <div className={p-3.5 rounded-2xl border text-xs }>
                <div className=flex items-center justify-between mb-1>
                  <div className=flex items-center gap-1.5 font-bold tracking-wide>
                    <Sparkles className=w-4 h-4 />
                    <span>AI PRIORITY ENGINE: {priorityData.level} ({priorityData.score}/100)</span>
                  </div>
                  <span className=text-[10px] font-semibold uppercase bg-white/70 px-2 py-0.5 rounded-md>
                    Prototype Simulation
                  </span>
                </div>
                <p className=leading-relaxed opacity-95>
                  {priorityData.reason}
                </p>
              </div>

              <div className=grid grid-cols-1 sm:grid-cols-2 gap-4>
                {/* Hospital Selection */}
                <div>
                  <label className=block text-xs font-semibold text-slate-700 mb-1>
                    Requesting Hospital *
                  </label>
                  <select
                    value={hospitalId}
                    onChange={(e) => {
                      setHospitalId(e.target.value);
                      const h = mockData.hospitals.find((x) => x.id === e.target.value);
                      if (h) setLocation(${h.area}, Mumbai);
                    }}
                    className=w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-red-500 focus:outline-none
                    required
                  >
                    {mockData.hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.area})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Patient Case ID */}
                <div>
                  <label className=block text-xs font-semibold text-slate-700 mb-1>
                    Patient / Case Reference ID *
                  </label>
                  <input
                    type=text
                    value={patientCaseId}
                    onChange={(e) => setPatientCaseId(e.target.value)}
                    className=w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-red-500 focus:outline-none
                    placeholder=e.g. PT-99420 (Emergency Trauma)
                    required
                  />
                </div>
              </div>

              {/* Blood Group & Units */}
              <div className=grid grid-cols-1 sm:grid-cols-3 gap-4>
                <div>
                  <label className=block text-xs font-semibold text-slate-700 mb-1>
                    Blood Group Required *
                  </label>
                  <div className=grid grid-cols-4 gap-1.5>
                    {mockData.bloodGroups.map((bg) => (
                      <button
                        type=button
                        key={bg}
                        onClick={() => setBloodGroup(bg)}
                        className={py-1.5 rounded-lg text-xs font-bold transition-all }
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className=block text-xs font-semibold text-slate-700 mb-1>
                    Units Required (Pints) *
                  </label>
                  <input
                    type=number
                    min=1
                    max=20
                    value={unitsRequired}
                    onChange={(e) => setUnitsRequired(Number(e.target.value))}
                    className=w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-red-500 focus:outline-none
                    required
                  />
                  <p className=text-[10px] text-slate-400 mt-1>
                    City Available Reserve: <strong className=text-slate-700>{currentGroupStock} units</strong>
                  </p>
                </div>

                <div>
                  <label className=block text-xs font-semibold text-slate-700 mb-1>
                    Clinical Urgency Level *
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className=w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-red-500 focus:outline-none
                  >
                    <option value=Critical>Critical (Immediate Life-Threatening)</option>
                    <option value=High>High (Within 2 Hours)</option>
                    <option value=Normal>Normal (Scheduled/Stable)</option>
                  </select>
                </div>
              </div>

              {/* Time Remaining & Location */}
              <div className=grid grid-cols-1 sm:grid-cols-2 gap-4>
                <div>
                  <label className=block text-xs font-semibold text-slate-700 mb-1>
                    Required By (Minutes Remaining) *
                  </label>
                  <div className=flex items-center gap-2>
                    <input
                      type=number
                      min=5
                      max=720
                      value={requiredByMinutes}
                      onChange={(e) => setRequiredByMinutes(Number(e.target.value))}
                      className=w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-red-500 focus:outline-none
                      required
                    />
                    <span className=text-xs text-slate-500 shrink-0 font-medium>min</span>
                  </div>
                </div>

                <div>
                  <label className=block text-xs font-semibold text-slate-700 mb-1>
                    Hospital Location / Delivery Bay *
                  </label>
                  <input
                    type=text
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className=w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-red-500 focus:outline-none
                    placeholder=e.g. Bandra West, Mumbai
                    required
                  />
                </div>
              </div>

              {/* Additional Clinical Notes */}
              <div>
                <label className=block text-xs font-semibold text-slate-700 mb-1>
                  Additional Clinical Notes & Case Context
                </label>
                <textarea
                  rows=2
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className=w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:bg-white focus:border-red-500 focus:outline-none
                  placeholder=Specify operating theater, surgeon contact, or transit protocol...
                />
              </div>

              {/* Actions */}
              <div className=pt-2 flex items-center justify-end gap-3 border-t border-slate-100>
                <button
                  type=button
                  onClick={onClose}
                  className=px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors
                >
                  Cancel
                </button>
                <button
                  type=submit
                  disabled={isSubmitting}
                  className=px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-semibold shadow-md shadow-red-500/20 transition-all flex items-center gap-2
                >
                  {isSubmitting ? (
                    <>
                      <span className=w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin></span>
                      Matching Donors...
                    </>
                  ) : (
                    'Create Emergency Request'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
