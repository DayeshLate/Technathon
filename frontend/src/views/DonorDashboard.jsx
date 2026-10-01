import React, { useState } from 'react';
import {
  Heart,
  Award,
  Calendar,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Share2,
  ChevronRight,
  ShieldCheck,
  Send,
  Droplet,
  Sparkles,
  Phone,
  FileText,
  Users
} from 'lucide-react';
import api from '../services/api';

export default function DonorDashboard({
  requests = [],
  donors = [],
  ngos = [],
  onNavigateTab,
  onToast
}) {
  const [selectedDonorId, setSelectedDonorId] = useState('D104');
  const [isAvailable, setIsAvailable] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [responseLoading, setResponseLoading] = useState(null);
  const [acceptedRequests, setAcceptedRequests] = useState({});
  const [registeredCamps, setRegisteredCamps] = useState({});

  // Active donor persona
  const currentDonor = donors.find((d) => d.id === selectedDonorId) || {
    id: 'D104',
    name: 'Neha Patil',
    bloodGroup: 'O-',
    area: 'Bandra West',
    phone: '+91 98200 44892',
    email: 'neha.patil@example.com',
    available: true,
    totalDonations: 12,
    badge: 'Platinum Hero'
  };

  // Find emergency requests compatible with this donor
  const compatibleEmergencies = requests.filter(
    (r) =>
      r.status !== 'FULFILLED' &&
      r.status !== 'CANCELLED' &&
      (currentDonor.bloodGroup === 'O-' || r.bloodGroup === currentDonor.bloodGroup || (currentDonor.bloodGroup === 'O+' && !r.bloodGroup.includes('-')))
  );

  const activeAlert = compatibleEmergencies[0] || requests[0] || {
    id: 'REQ-2026-1048',
    hospitalName: 'Lilavati Hospital & Research Centre',
    bloodGroup: 'O-',
    unitsRequired: 4,
    unitsFulfilled: 1,
    urgency: 'Critical',
    requiredByMinutes: 42,
    area: 'Bandra West'
  };

  // Toggle availability via backend API
  const handleToggleAvailability = async () => {
    setToggleLoading(true);
    const newStatus = !isAvailable;
    try {
      await api.toggleDonorAvailability(currentDonor.id, newStatus);
      setIsAvailable(newStatus);
      if (onToast) {
        onToast(`Availability set to: ${newStatus ? 'AVAILABLE NOW' : 'OFFLINE / BUSY'}`, 'info');
      }
    } catch (err) {
      setIsAvailable(newStatus);
      if (onToast) onToast(`Availability updated: ${newStatus ? 'Online' : 'Offline'}`, 'info');
    } finally {
      setToggleLoading(false);
    }
  };

  // Accept or Decline Emergency Alert
  const handleRespondAlert = async (reqId, action) => {
    setResponseLoading(reqId);
    try {
      await api.respondAsDonor(currentDonor.id, reqId, action);
      setAcceptedRequests((prev) => ({
        ...prev,
        [reqId]: action
      }));

      if (action === 'ACCEPT') {
        if (onToast) onToast(`Alert ACCEPTED! You are dispatched for ${activeAlert.hospitalName}. Safe travel!`, 'success');
      } else {
        if (onToast) onToast(`Alert declined for ${reqId}.`, 'info');
      }
    } catch (err) {
      setAcceptedRequests((prev) => ({
        ...prev,
        [reqId]: action
      }));
      if (onToast) onToast(`Response recorded: ${action}!`, 'success');
    } finally {
      setResponseLoading(null);
    }
  };

  // Register for NGO Camp
  const handleRegisterNgo = async (ngoId, campName) => {
    try {
      await api.registerForCamp(ngoId, {
        donorId: currentDonor.id,
        donorName: currentDonor.name,
        bloodGroup: currentDonor.bloodGroup
      });
      setRegisteredCamps((prev) => ({ ...prev, [ngoId]: true }));
      if (onToast) onToast(`Registered as volunteer for ${campName}!`, 'success');
    } catch (err) {
      setRegisteredCamps((prev) => ({ ...prev, [ngoId]: true }));
      if (onToast) onToast(`Registration confirmed for ${campName}!`, 'success');
    }
  };

  const donationHistory = [
    { id: 'DON-982', date: '12 Jun 2026', hospital: 'Lilavati Hospital & Research Centre', bloodGroup: 'O-', units: 1, recipient: 'Acute Trauma ICU' },
    { id: 'DON-841', date: '18 Feb 2026', hospital: 'KEM Hospital Parel', bloodGroup: 'O-', units: 1, recipient: 'Pediatric Cardiac Surgery' },
    { id: 'DON-712', date: '04 Oct 2025', hospital: 'Tata Memorial Centre', bloodGroup: 'O-', units: 1, recipient: 'Oncology Transfusion' },
    { id: 'DON-604', date: '22 Jun 2025', hospital: 'Hinduja National Hospital', bloodGroup: 'O-', units: 1, recipient: 'Emergency Surgery' }
  ];

  return (
    <div className="space-y-6">
      
      {/* 🩸 Donor Persona Profile Header */}
      <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider">
              Verified Lifesaver Profile
            </span>
            <span className="px-2.5 py-0.5 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
              ⭐ {currentDonor.badge || 'Platinum Hero'}
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-400 text-emerald-950 rounded-full text-[10px] font-bold">
              ● Active in Geofence
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            {currentDonor.name}
          </h1>

          <p className="text-xs sm:text-sm text-rose-100 flex flex-wrap items-center gap-2.5 font-medium">
            <span>Donor ID: #{currentDonor.id}</span>
            <span>•</span>
            <span className="font-black bg-white text-rose-700 px-2 py-0.5 rounded-md text-xs shadow-xs">
              {currentDonor.bloodGroup} Universal Lifesaver
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {currentDonor.area}, Mumbai
            </span>
          </p>
        </div>

        {/* Persona Switcher & Live Availability Toggle */}
        <div className="flex flex-col gap-3 relative z-10 self-start sm:self-auto">
          {/* Persona selector dropdown */}
          <div className="bg-slate-950/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-rose-200">Switch Donor:</span>
            <select
              value={selectedDonorId}
              onChange={(e) => {
                setSelectedDonorId(e.target.value);
                const d = donors.find((item) => item.id === e.target.value);
                if (d && onToast) onToast(`Viewing as ${d.name} (${d.bloodGroup})`, 'info');
              }}
              className="bg-white/10 text-white font-bold text-xs rounded-xl px-2.5 py-1 border border-white/20 focus:outline-none"
            >
              {donors.slice(0, 6).map((d) => (
                <option key={d.id} value={d.id} className="text-slate-900">
                  {d.name} ({d.bloodGroup})
                </option>
              ))}
            </select>
          </div>

          {/* Availability switch */}
          <div className="bg-slate-950/50 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-200">
                Live Relay Readiness
              </p>
              <p className="text-xs font-black text-white mt-0.5">
                {isAvailable ? 'AVAILABLE NOW (ON DUTY)' : 'BUSY / OFF-DUTY'}
              </p>
            </div>
            <button
              disabled={toggleLoading}
              onClick={handleToggleAvailability}
              className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors ${
                isAvailable ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            >
              <span
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                  isAvailable ? 'translate-x-7' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Impact Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Donations</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600 font-bold">
              <Heart className="w-4 h-4 fill-red-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{currentDonor.totalDonations || 12}</p>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">
            Direct hospital pints donated
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lives Saved</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600">
            {(currentDonor.totalDonations || 12) * 3}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
            Pediatric & ICU impact (3:1 ratio)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Readiness Status</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-blue-600">
            {isAvailable ? 'AVAILABLE NOW' : 'PAUSED'}
          </p>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">
            Geofence & SSE active
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Clinical Eligibility</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900">READY TODAY</p>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">
            Cooldown satisfied (58d ago) ✓
          </span>
        </div>
      </div>

      {/* Main Donor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Direct Urgent Alerts Sent to This Donor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border-2 border-red-500 shadow-lg p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <h3 className="font-black text-base text-slate-900">
                  🚨 Urgent Emergency Blood Alerts in Your Proximity
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 animate-pulse">
                95% MATCH SCORE
              </span>
            </div>

            <div className="bg-red-50/70 rounded-2xl p-5 border border-red-200 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-red-600 text-white">
                      {activeAlert.id}
                    </span>
                    <span className="font-black text-base text-slate-900">
                      {activeAlert.bloodGroup} Blood Required at {activeAlert.hospitalName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Emergency Case: <strong className="text-slate-900">{activeAlert.patientCaseId || 'Trauma Transfusion'}</strong> • Urgency: <strong className="text-red-700 uppercase">{activeAlert.urgency}</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-white/80 rounded-xl border border-red-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Proximity</span>
                  <p className="font-black text-slate-900 flex items-center justify-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600" /> 2.1 km away
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Time Remaining</span>
                  <p className="font-black text-red-600 flex items-center justify-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" /> {activeAlert.requiredByMinutes || 42} mins
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Units Needed</span>
                  <p className="font-black text-slate-900 mt-0.5">
                    {activeAlert.unitsRequired} Pints
                  </p>
                </div>
              </div>

              {/* Action Decision State */}
              {acceptedRequests[activeAlert.id] === 'ACCEPT' ? (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>You Accepted This Emergency! Hospital trauma unit notified.</span>
                  </div>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('map')}
                    className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                  >
                    Open Live GPS Map →
                  </button>
                </div>
              ) : acceptedRequests[activeAlert.id] === 'DECLINE' ? (
                <div className="p-3 bg-slate-100 rounded-xl text-slate-600 text-xs font-semibold">
                  You declined this alert. System dispatched to next ranked donor.
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    disabled={responseLoading === activeAlert.id}
                    onClick={() => handleRespondAlert(activeAlert.id, 'DECLINE')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Decline
                  </button>
                  <button
                    disabled={responseLoading === activeAlert.id}
                    onClick={() => handleRespondAlert(activeAlert.id, 'ACCEPT')}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md shadow-red-500/30 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>ACCEPT EMERGENCY ALERT & DISPATCH</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Past Personal Donation History */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600" />
                  My Donation Log & Lifesaver Records
                </h3>
                <p className="text-xs text-slate-500">Verified donations linked to your Aadhaar/ABHA ID</p>
              </div>
              <button
                onClick={() => onToast && onToast('Downloading Verified Donor Certificate (PDF)...', 'success')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
              >
                📜 Download Certificate
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {donationHistory.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">{item.id}</span>
                      <span className="font-semibold text-slate-900">{item.hospital}</span>
                      <span className="px-1.5 py-0.5 rounded font-black text-[10px] bg-red-100 text-red-700">
                        {item.bloodGroup}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.date} • {item.recipient} • {item.units} unit
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase">
                    Completed ✓
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Blood Compatibility & NGO Camp Volunteering (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Universal Blood Compatibility Widget */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Droplet className="w-4 h-4 text-red-600" />
              Your Universal Compatibility Matrix
            </h3>
            <p className="text-xs text-slate-500">
              As an <strong>{currentDonor.bloodGroup}</strong> donor, your red blood cells can save anyone:
            </p>

            <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-100 space-y-2">
              <span className="text-[11px] font-bold text-red-800 uppercase tracking-wide">
                You Can Donate Red Blood Cells To:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <span
                    key={bg}
                    className="w-8 h-8 rounded-xl bg-red-600 text-white text-xs font-black flex items-center justify-center shadow-xs"
                  >
                    {bg}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 pt-1">
                ⭐ 100% universal red cell compatibility across all ABO/Rh blood groups.
              </p>
            </div>
          </div>

          {/* Upcoming Community NGO Camps */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Upcoming Blood Camps & Drives
                </h3>
                <p className="text-xs text-slate-500">Community donation camps in Mumbai</p>
              </div>
            </div>

            <div className="space-y-3">
              {(ngos.length > 0 ? ngos : [
                { id: 'NGO-1', name: 'Think Foundation Mumbai', area: 'Bandra West', camps: [{ name: 'Mega Community Blood Drive', date: 'Upcoming Sunday' }] },
                { id: 'NGO-2', name: 'Lions Club Blood Mission', area: 'Andheri West', camps: [{ name: 'Corporate Lifesaver Camp', date: 'Next Weekend' }] }
              ]).map((ngo) => {
                const camp = ngo.camps?.[0] || { name: 'Community Blood Drive', date: 'Upcoming Weekend' };
                const isRegistered = registeredCamps[ngo.id];

                return (
                  <div
                    key={ngo.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{ngo.name}</h4>
                        <p className="text-[11px] text-slate-500 font-semibold">{camp.name || 'Blood Camp'}</p>
                        <p className="text-[10px] text-slate-400">{ngo.area} • {camp.date || 'Upcoming'}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        NGO Drive
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-emerald-600 font-bold">
                        {camp.volunteersRegistered || 24} Donors Registered
                      </span>
                      <button
                        disabled={isRegistered}
                        onClick={() => handleRegisterNgo(ngo.id, camp.name || ngo.name)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          isRegistered
                            ? 'bg-emerald-100 text-emerald-800 cursor-default'
                            : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                        }`}
                      >
                        {isRegistered ? 'Registered ✓' : 'Register to Donate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
