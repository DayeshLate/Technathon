import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { mockData } from './data/mockData';
import {
  Activity,
  AlertTriangle,
  Heart,
  Droplet,
  MapPin,
  Clock,
  Sparkles,
  Send,
  PlusCircle,
  Building2,
  Layers,
  Users,
  CheckCircle2,
  XCircle,
  Check,
  ChevronRight,
  TrendingUp,
  Sliders,
  X,
  ShieldCheck,
  Radio
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Custom Marker for Leaflet
const createMarkerIcon = (type, bloodGroup = '') => {
  let html = '';
  if (type === 'hospital') {
    html = '<div style="background:#1e3a8a;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);font-size:14px;">🏥</div>';
  } else if (type === 'blood_bank') {
    html = '<div style="background:#059669;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);font-size:14px;">🩸</div>';
  } else if (type === 'emergency') {
    html = '<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;"><span style="position:absolute;width:38px;height:38px;background:rgba(220,38,38,0.4);border-radius:50%;animation:ping 1.5s infinite;"></span><div style="background:#dc2626;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;font-size:13px;box-shadow:0 3px 10px rgba(220,38,38,0.6);">🚨</div></div>';
  } else {
    html = '<div style="background:#e11d48;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;font-size:10px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.3);">' + (bloodGroup || 'D') + '</div>';
  }
  return L.divIcon({
    html,
    className: 'custom-pin',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
};

export default function App() {
  const [role, setRole] = useState('hospital');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [requests, setRequests] = useState(mockData.initialRequests);
  const [selectedReqId, setSelectedReqId] = useState('REQ-2026-1048');
  const [bloodBanks, setBloodBanks] = useState(mockData.bloodBanks);
  const [donors, setDonors] = useState(mockData.donors);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Request Form State
  const [newHospId, setNewHospId] = useState('H1');
  const [newBloodGroup, setNewBloodGroup] = useState('O-');
  const [newUnits, setNewUnits] = useState(4);
  const [newUrgency, setNewUrgency] = useState('Critical');
  const [newMins, setNewMins] = useState(42);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  const activeRequest = requests.find((r) => r.id === selectedReqId) || requests[0];

  // Aggregated Inventory
  const inventoryAggregates = {};
  mockData.bloodGroups.forEach((bg) => (inventoryAggregates[bg] = 0));
  bloodBanks.forEach((b) => {
    mockData.bloodGroups.forEach((bg) => {
      inventoryAggregates[bg] += b.inventory[bg] || 0;
    });
  });

  const totalUnits = Object.values(inventoryAggregates).reduce((a, b) => a + b, 0);

  const chartData = mockData.bloodGroups.map((bg) => ({
    group: bg,
    units: inventoryAggregates[bg],
    isCritical: inventoryAggregates[bg] < 25
  }));

  // Handle Create Request
  const handleCreateRequest = (e) => {
    e.preventDefault();
    const hosp = mockData.hospitals.find((h) => h.id === newHospId) || mockData.hospitals[0];
    const newId = 'REQ-2026-' + Math.floor(1050 + Math.random() * 800);
    const newReq = {
      id: newId,
      hospitalId: hosp.id,
      hospitalName: hosp.name,
      patientCaseId: 'PT-' + Math.floor(10000 + Math.random() * 90000),
      bloodGroup: newBloodGroup,
      unitsRequired: Number(newUnits),
      unitsFulfilled: 0,
      urgency: newUrgency,
      priorityScore: newUrgency === 'Critical' ? 96 : 80,
      priorityReason: newUrgency === 'Critical' ? 'High priority because required time is less than 1 hour and citywide O- inventory is low.' : 'Standard clinical triage.',
      requiredByMinutes: Number(newMins),
      location: hosp.area + ', Mumbai',
      latitude: hosp.lat,
      longitude: hosp.lng,
      status: 'MATCHING',
      compatibleDonorsFound: 8,
      nearbyBloodBanks: 3,
      nearestDistanceKm: 2.1,
      matchedDonorsList: donors
        .filter((d) => mockData.compatibility[newBloodGroup]?.includes(d.bloodGroup))
        .slice(0, 6)
        .map((d, i) => ({
          donorId: d.id,
          name: d.name,
          bloodGroup: d.bloodGroup,
          distance: (1.8 + i * 0.9).toFixed(1),
          availability: 'Available Now',
          matchScore: 92 - i * 3,
          status: 'Notified'
        }))
    };
    setRequests([newReq, ...requests]);
    setSelectedReqId(newId);
    setIsModalOpen(false);
    setActiveTab('tracker');
    showToast('Emergency request ' + newId + ' created! AI matching launched.', 'success');
  };

  const handleNotifyDonor = (donorId) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedReqId && r.matchedDonorsList
          ? {
              ...r,
              matchedDonorsList: r.matchedDonorsList.map((d) =>
                d.donorId === donorId ? { ...d, status: 'Notified' } : d
              )
            }
          : r
      )
    );
    showToast('Simulated SMS alert dispatched to Donor #' + donorId, 'success');
  };

  const handleSimulateFulfill = () => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedReqId
          ? { ...r, status: 'FULFILLED', unitsFulfilled: r.unitsRequired }
          : r
      )
    );
    showToast('Request ' + selectedReqId + ' marked FULFILLED! Units delivered.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-500/20">
              <Droplet className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-slate-900">
                RED<span className="text-red-600">RELAY</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                Prototype
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={'px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900')}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('tracker')}
              className={'px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'tracker' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900')}
            >
              🚨 Emergency Tracker
            </button>
            <button
              onClick={() => setActiveTab('matching')}
              className={'px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'matching' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900')}
            >
              Smart Matching
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={'px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900')}
            >
              Live Map
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={'px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900')}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('donor')}
              className={'px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'donor' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900')}
            >
              Donor Portal
            </button>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-500/30 flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">+ Create</span> Emergency Request
            </button>

            {/* Role Switcher */}
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (e.target.value === 'donor') setActiveTab('donor');
                if (e.target.value === 'blood_bank') setActiveTab('inventory');
                showToast('Switched persona to ' + e.target.value.replace('_', ' ').toUpperCase(), 'info');
              }}
              className="text-xs bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700"
            >
              <option value="hospital">Role: Hospital</option>
              <option value="blood_bank">Role: Blood Bank</option>
              <option value="donor">Role: Donor (Neha)</option>
              <option value="admin">Role: Admin</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* VIEW 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Critical Alert Banner */}
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-600 text-white">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide">
                    Critical Shortage Alert: O- Blood Depleted in South Mumbai
                  </h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    Only 5 units remaining in city reserve (Safety Threshold: 20).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('inventory')}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold self-start sm:self-auto hover:bg-red-700"
              >
                Inspect Stock →
              </button>
            </div>

            {/* 6 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Active Requests</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{requests.length + 8}</p>
                <span className="text-[10px] text-red-600 font-bold">4 Critical</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Units Available</span>
                <p className="text-2xl font-black text-blue-600 mt-1">{totalUnits}</p>
                <span className="text-[10px] text-slate-500">8 Blood Banks</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Donors Online</span>
                <p className="text-2xl font-black text-rose-600 mt-1">347</p>
                <span className="text-[10px] text-emerald-600 font-bold">● Ready</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Critical Groups</span>
                <p className="text-2xl font-black text-amber-600 mt-1">2</p>
                <span className="text-[10px] text-amber-600 font-bold">O- & A-</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Fulfilled Today</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">28</p>
                <span className="text-[10px] text-emerald-600 font-bold">+18% Today</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Avg Response</span>
                <p className="text-2xl font-black text-purple-600 mt-1">8 min</p>
                <span className="text-[10px] text-purple-600 font-bold">Rapid Relay</span>
              </div>
            </div>

            {/* Inventory Bar Chart */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Blood Group Availability Matrix (Mumbai Hub)
                  </h3>
                  <p className="text-xs text-slate-500">Aggregated units across 8 blood centres</p>
                </div>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="text-xs font-bold text-red-600 hover:text-red-700"
                >
                  View Facility Table →
                </button>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="group" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                      {chartData.map((e, idx) => (
                        <Cell key={idx} fill={e.isCritical ? '#dc2626' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Emergency Requests Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Active Emergency Blood Requests</h3>
                <span className="text-xs text-slate-400">Click Track to view live matching</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Hospital</th>
                      <th className="py-3 px-4">Blood Group</th>
                      <th className="py-3 px-4">Units</th>
                      <th className="py-3 px-4">Urgency</th>
                      <th className="py-3 px-4">Time Left</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.slice(0, 5).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{r.id}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{r.hospitalName}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded font-black bg-red-100 text-red-700">{r.bloodGroup}</span></td>
                        <td className="py-3 px-4 font-semibold">{r.unitsFulfilled}/{r.unitsRequired}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">{r.urgency}</span></td>
                        <td className="py-3 px-4 text-red-600 font-semibold">{r.requiredByMinutes}m left</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">{r.status}</span></td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedReqId(r.id);
                              setActiveTab('tracker');
                            }}
                            className="px-3 py-1 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                          >
                            Track →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: EMERGENCY TRACKER */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-mono font-bold">{activeRequest.id}</span>
                  <span className="px-2.5 py-0.5 bg-white text-red-700 rounded-full text-xs font-black uppercase">{activeRequest.urgency} EMERGENCY</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleSimulateFulfill} className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs">
                    Simulate Fulfilled ✓
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black">{activeRequest.hospitalName}</h1>
                  <p className="text-xs text-red-100 mt-1">Location: {activeRequest.location} • Case: {activeRequest.patientCaseId}</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-950/40 p-3.5 rounded-2xl border border-white/10 text-center">
                  <div>
                    <span className="text-[10px] text-red-200 uppercase font-semibold">Blood Group</span>
                    <p className="text-2xl font-black">{activeRequest.bloodGroup}</p>
                  </div>
                  <div className="w-px h-8 bg-white/20"></div>
                  <div>
                    <span className="text-[10px] text-red-200 uppercase font-semibold">Units</span>
                    <p className="text-2xl font-black">{activeRequest.unitsRequired}</p>
                  </div>
                  <div className="w-px h-8 bg-white/20"></div>
                  <div>
                    <span className="text-[10px] text-red-200 uppercase font-semibold">Time Left</span>
                    <p className="text-2xl font-black text-amber-300">{activeRequest.requiredByMinutes}m</p>
                  </div>
                </div>
              </div>

              {/* Priority Engine Explanation */}
              <div className="p-3 bg-white/10 rounded-2xl text-xs text-white/95 border border-white/20">
                <p className="font-bold text-amber-300 flex items-center gap-1.5 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Priority Engine: {activeRequest.urgency.toUpperCase()} (Score: {activeRequest.priorityScore || 96}/100)
                </p>
                <p>{activeRequest.priorityReason}</p>
              </div>
            </div>

            {/* Visual Timeline Stepper */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Relay Status Lifecycle</h3>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                {['1. Request Created', '2. Smart Matching', '3. Donors Identified', '4. Blood Bank Checked', '5. Donor Alerts Sent', '6. Fulfilled'].map((step, idx) => {
                  const isDone = activeRequest.status === 'FULFILLED' || idx <= 3;
                  return (
                    <div key={idx} className={'p-2.5 rounded-xl border text-center ' + (isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400')}>
                      <span className={'w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] mb-1 ' + (isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600')}>
                        {isDone ? '✓' : idx + 1}
                      </span>
                      <p className="text-[11px] font-semibold leading-tight">{step}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Matched Donors Cards */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Matched Compatible Donors</h3>
                  <p className="text-xs text-slate-500">Scored by compatibility, distance, and readiness</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  {activeRequest.matchedDonorsList?.length || 8} Matched
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {(activeRequest.matchedDonorsList || []).map((donor) => (
                  <div key={donor.donorId} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-xs text-slate-900">{donor.name}</p>
                          <p className="text-[10px] text-slate-500">#{donor.donorId} • {donor.distance} km away</p>
                        </div>
                        <span className="px-2 py-0.5 rounded font-black text-xs bg-red-100 text-red-700">{donor.bloodGroup}</span>
                      </div>

                      {/* Score */}
                      <div className="my-2">
                        <div className="flex justify-between text-[11px] mb-1 font-bold">
                          <span className="text-slate-600">AI Match Score</span>
                          <span className="text-red-600">{donor.matchScore}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-red-600 rounded-full" style={{ width: donor.matchScore + '%' }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500">{donor.status || 'Ready'}</span>
                      <button
                        onClick={() => handleNotifyDonor(donor.donorId)}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Notify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SMART MATCHING */}
        {activeTab === 'matching' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Smart Donor Matching Engine</h2>
                <p className="text-xs text-slate-500">Calculates multi-factor readiness scores across all 50+ Mumbai donors</p>
              </div>
              <button onClick={() => showToast('Dispatched alerts to all 90%+ match candidates', 'success')} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">
                Notify Top Candidates
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {donors.slice(0, 9).map((d, i) => {
                const score = 95 - i * 3;
                return (
                  <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-xs text-slate-900">{d.name}</p>
                          <p className="text-[11px] text-slate-500">{d.area} • {(1.5 + i * 0.8).toFixed(1)} km</p>
                        </div>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-black text-xs">{d.bloodGroup}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl my-2">
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span className="text-slate-600">AI Match Score</span>
                          <span className="text-red-600">{score}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-red-600 rounded-full" style={{ width: score + '%' }}></div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">Last Donation: <strong>{d.daysSinceDonation} days ago</strong></p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end gap-2">
                      <button onClick={() => showToast('Simulated notification sent to ' + d.name, 'success')} className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg">
                        Notify Donor
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: LIVE MAP */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Mumbai Geo-Intelligence Map</h3>
                <p className="text-xs text-slate-500">Showing 10 Hospitals (🏥), 8 Blood Banks (🩸), Donors, and Emergencies (🚨)</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                Active Mesh
              </span>
            </div>

            <div className="h-[580px] rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-white p-2">
              <MapContainer center={[19.0760, 72.8777]} zoom={12} scrollWheelZoom={true} className="h-full w-full rounded-2xl">
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Shortage Hotspot Circle */}
                <Circle
                  center={[19.0039, 72.8436]}
                  radius={2500}
                  pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.15 }}
                />

                {/* Hospitals */}
                {mockData.hospitals.map((h) => (
                  <Marker key={h.id} position={[h.lat, h.lng]} icon={createMarkerIcon('hospital')}>
                    <Popup>
                      <div className="text-xs p-1">
                        <strong className="text-blue-900 block font-bold text-sm">{h.name}</strong>
                        <p className="text-slate-500">{h.area} • {h.type}</p>
                        <p className="font-mono mt-1 text-slate-700">{h.contact}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Blood Banks */}
                {bloodBanks.map((b) => (
                  <Marker key={b.id} position={[b.lat, b.lng]} icon={createMarkerIcon('blood_bank')}>
                    <Popup>
                      <div className="text-xs p-1">
                        <strong className="text-emerald-900 block font-bold text-sm">{b.name}</strong>
                        <p className="text-slate-500">{b.area}</p>
                        <p className="font-bold text-red-600 mt-1">O- Units Available: {b.inventory['O-'] || 0}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Active Emergency */}
                <Marker position={[19.0514, 72.8295]} icon={createMarkerIcon('emergency')}>
                  <Popup>
                    <div className="text-xs p-1">
                      <strong className="text-red-700 block font-black text-sm">🚨 CRITICAL BLOOD REQUEST</strong>
                      <p className="font-bold text-slate-800">Lilavati Hospital (O- • 4 Units)</p>
                      <p className="text-slate-500">42 min remaining</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Donors sample */}
                {donors.slice(0, 15).map((d) => (
                  <Marker key={d.id} position={[d.latitude, d.longitude]} icon={createMarkerIcon('donor', d.bloodGroup)}>
                    <Popup>
                      <div className="text-xs p-1">
                        <strong>{d.name}</strong> ({d.bloodGroup})
                        <p className="text-slate-500">{d.area}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}

        {/* VIEW 5: INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Blood Inventory Telemetry</h2>
                <p className="text-xs text-slate-500">Citywide reserve across all 8 licensed blood banks</p>
              </div>
              <button onClick={() => showToast('Stock counts refreshed across all API feeds', 'info')} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl">
                Refresh
              </button>
            </div>

            {/* 8 Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {mockData.bloodGroups.map((bg) => {
                const count = inventoryAggregates[bg];
                const isCrit = count < 25;
                const isLow = count < 45;
                return (
                  <div key={bg} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-lg flex items-center justify-center">{bg}</span>
                        <span className={'px-2 py-0.5 rounded text-[10px] font-bold ' + (isCrit ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}>
                          {isCrit ? 'CRITICAL' : isLow ? 'LOW' : 'HEALTHY'}
                        </span>
                      </div>
                      <p className="text-2xl font-black text-slate-900 mt-2">{count} <span className="text-xs font-normal text-slate-500">units</span></p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Threshold: 20 units</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Blood Bank Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800">
                Facility-Wise Inventory
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <th className="py-2.5 px-4">Blood Bank</th>
                      <th className="py-2.5 px-4">Area</th>
                      <th className="py-2.5 px-4">A+</th>
                      <th className="py-2.5 px-4">A-</th>
                      <th className="py-2.5 px-4">B+</th>
                      <th className="py-2.5 px-4">B-</th>
                      <th className="py-2.5 px-4">AB+</th>
                      <th className="py-2.5 px-4">AB-</th>
                      <th className="py-2.5 px-4">O+</th>
                      <th className="py-2.5 px-4 text-red-700 font-bold">O-</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bloodBanks.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{b.name}</td>
                        <td className="py-3 px-4 text-slate-500">{b.area}</td>
                        <td className="py-3 px-4">{b.inventory['A+']}</td>
                        <td className="py-3 px-4 font-semibold text-red-600">{b.inventory['A-']}</td>
                        <td className="py-3 px-4">{b.inventory['B+']}</td>
                        <td className="py-3 px-4">{b.inventory['B-']}</td>
                        <td className="py-3 px-4">{b.inventory['AB+']}</td>
                        <td className="py-3 px-4">{b.inventory['AB-']}</td>
                        <td className="py-3 px-4">{b.inventory['O+']}</td>
                        <td className="py-3 px-4 font-black text-red-700 bg-red-50/50">{b.inventory['O-']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: DONOR PORTAL */}
        {activeTab === 'donor' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">Volunteer Portal</span>
                <h2 className="text-2xl font-black mt-1">Neha Patil</h2>
                <p className="text-xs text-rose-100">Donor ID: #D104 • Blood Group: <strong>O- Universal</strong> • Bandra West</p>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-xs font-semibold text-center">
                <span>Availability: </span>
                <span className="text-emerald-300 font-bold">● Available Now</span>
              </div>
            </div>

            {/* Impact Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Donations</span>
                <p className="text-2xl font-black text-slate-900 mt-1">12</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Lives Impacted</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">36</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Status</span>
                <p className="text-xl font-bold text-blue-600 mt-1">ELIGIBLE</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Next Eligible</span>
                <p className="text-base font-bold text-slate-900 mt-1">15 Oct 2026</p>
              </div>
            </div>

            {/* Emergency Request Near You Card */}
            <div className="bg-white p-5 rounded-3xl border-2 border-red-500 shadow-md space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> 🚨 Emergency Request Near You (2.1 km away)
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">42 min remaining</span>
              </div>
              <p className="text-xs text-slate-700">
                <strong>Lilavati Hospital & Research Centre</strong> urgently requires <strong>4 units of O- blood</strong> for acute trauma surgery.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    showToast('Request ACCEPTED! Hospital transport coordinated.', 'success');
                    setActiveTab('tracker');
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  ACCEPT REQUEST
                </button>
                <button
                  onClick={() => showToast('Request declined.', 'info')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  DECLINE
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Create Emergency Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Emergency Blood Request</h3>
                <p className="text-xs text-slate-500">Triggers real-time matching and citywide donor alert</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Requesting Hospital</label>
                <select
                  value={newHospId}
                  onChange={(e) => setNewHospId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                >
                  {mockData.hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name} ({h.area})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Group Required</label>
                  <select
                    value={newBloodGroup}
                    onChange={(e) => setNewBloodGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-red-700"
                  >
                    {mockData.bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Units Required</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newUnits}
                    onChange={(e) => setNewUnits(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Urgency</label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="Critical">Critical (Immediate)</option>
                    <option value="High">High (Under 2h)</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Required By (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    value={newMins}
                    onChange={(e) => setNewMins(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Priority Preview */}
              <div className="p-3 rounded-xl bg-red-50 text-red-900 border border-red-200">
                <span className="font-bold block mb-0.5">AI Priority Engine: CRITICAL (96/100)</span>
                <p className="text-[11px] opacity-90">High priority because required time is less than 1 hour and citywide O- inventory is low.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/20"
                >
                  Create Emergency Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-white border border-slate-200 shadow-xl max-w-sm flex items-center gap-2.5 text-xs font-semibold text-slate-900 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

    </div>
  );
}
