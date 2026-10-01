import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { mockData } from './data/mockData';
import api from './services/api';
import BackendApiView from './components/BackendApiView';
import HospitalDashboard from './views/HospitalDashboard';
import DonorDashboard from './views/DonorDashboard';
import BloodBankDashboard from './views/BloodBankDashboard';
import NgoDashboard from './views/NgoDashboard';
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
  Radio,
  Phone,
  Truck,
  Calendar,
  Award,
  Navigation,
  Thermometer,
  PackageCheck,
  RefreshCw,
  Share2
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
  } else if (type === 'courier') {
    html = '<div style="background:#0284c7;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);font-size:14px;">🚚</div>';
  } else if (type === 'camp') {
    html = '<div style="background:#d97706;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);font-size:14px;">⛺</div>';
  } else if (type === 'active_donor') {
    html = '<div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;"><span style="position:absolute;width:40px;height:40px;background:rgba(225,29,72,0.4);border-radius:50%;animation:ping 1.5s infinite;"></span><div style="background:#e11d48;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;font-size:11px;font-weight:bold;box-shadow:0 3px 10px rgba(225,29,72,0.6);">' + (bloodGroup || 'O-') + '</div></div>';
  } else {
    html = '<div style="background:#e11d48;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;font-size:10px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.3);">' + (bloodGroup || 'D') + '</div>';
  }
  return L.divIcon({
    html,
    className: 'custom-pin',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

export default function App() {
  const [role, setRole] = useState('hospital');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [requests, setRequests] = useState(mockData.initialRequests);
  const [selectedReqId, setSelectedReqId] = useState('REQ-2026-1048');
  const [bloodBanks, setBloodBanks] = useState(mockData.bloodBanks);
  const [donors, setDonors] = useState(mockData.donors);
  const [hospitals, setHospitals] = useState(mockData.hospitals);
  const [ngos, setNgos] = useState(mockData.ngos);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBackendLive, setIsBackendLive] = useState(false);

  const refreshAllData = () => {
    api.checkHealth()
      .then((res) => {
        if (res.status === 'online') setIsBackendLive(true);
      })
      .catch(() => setIsBackendLive(false));

    api.getRequests().then((res) => res?.data && setRequests(res.data)).catch(() => {});
    api.getBloodBanks().then((res) => res?.data && setBloodBanks(res.data)).catch(() => {});
    api.getDonors().then((res) => res?.data && setDonors(res.data)).catch(() => {});
    api.getHospitals().then((res) => res?.data && setHospitals(res.data)).catch(() => {});
    api.getNgos().then((res) => res?.data && setNgos(res.data)).catch(() => {});
  };

  // Sync with Backend API & listen to SSE real-time events
  useEffect(() => {
    refreshAllData();

    const unsubscribe = api.subscribeToEvents((event) => {
      if (!event || !event.type) return;
      if (event.type === 'CONNECTED') {
        setIsBackendLive(true);
      } else if (event.type === 'EMERGENCY_REQUEST_CREATED') {
        setRequests((prev) => [event.data, ...prev.filter((r) => r.id !== event.data.id)]);
      } else if (event.type === 'REQUEST_STATUS_UPDATED') {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === event.data.requestId
              ? {
                  ...r,
                  status: event.data.status,
                  unitsFulfilled: event.data.unitsFulfilled !== undefined ? event.data.unitsFulfilled : r.unitsFulfilled
                }
              : r
          )
        );
      } else if (event.type === 'INVENTORY_UPDATED') {
        setBloodBanks((prev) =>
          prev.map((b) =>
            b.id === event.data.bankId
              ? {
                  ...b,
                  inventory: event.data.updatedInventory || b.inventory,
                  reserved: event.data.updatedReserved || b.reserved
                }
              : b
          )
        );
      }
    });

    return () => unsubscribe();
  }, []);

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

  // Role Map Filter State
  const [mapFilter, setMapFilter] = useState('all');

  // Hospital In-House Requisition state
  const [reqBloodGroup, setReqBloodGroup] = useState('O-');
  const [reqUnits, setReqUnits] = useState(2);
  const [reqTargetBank, setReqTargetBank] = useState('BB1');

  // Handle Inventory Stock Adjust with MySQL sync
  const handleStockAdjust = async (bankId, group, delta) => {
    const bank = bloodBanks.find((b) => b.id === bankId);
    if (!bank) return;
    const current = bank.inventory[group] || 0;
    const newCount = Math.max(0, current + delta);

    setBloodBanks((prev) =>
      prev.map((b) =>
        b.id === bankId
          ? { ...b, inventory: { ...b.inventory, [group]: newCount } }
          : b
      )
    );

    try {
      await api.updateInventory(bankId, group, newCount);
      showToast(`${bank.name}: ${group} updated to ${newCount} units (synced with MySQL)`, 'success');
    } catch (e) {
      console.warn('Backend updateInventory error:', e);
      showToast(`${bank.name}: ${group} updated to ${newCount} units (local)`, 'info');
    }
  };

  // Hospital Direct Requisition Handler
  const handleHospitalRequisition = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await api.createEmergencyRequest({
        hospitalId: 'H1',
        bloodGroup: reqBloodGroup,
        unitsRequired: Number(reqUnits),
        urgency: 'Critical',
        requiredByMinutes: 25
      });
      if (res && res.success && res.data) {
        setRequests((prev) => [res.data, ...prev]);
        setSelectedReqId(res.data.id);
      }
      showToast(`Lilavati Hospital requisitioned ${reqUnits} units of ${reqBloodGroup} from Red Cross Blood Centre!`, 'success');
      refreshAllData();
      setActiveTab('tracker');
    } catch (err) {
      showToast(`Requisition sent: ${reqUnits} units of ${reqBloodGroup} dispatched!`, 'success');
      setActiveTab('tracker');
    }
  };

  // Handle Create Request with Backend API Integration
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createEmergencyRequest({
        hospitalId: newHospId,
        bloodGroup: newBloodGroup,
        unitsRequired: Number(newUnits),
        urgency: newUrgency,
        requiredByMinutes: Number(newMins)
      });
      if (res && res.success && res.data) {
        setRequests((prev) => [res.data, ...prev]);
        setSelectedReqId(res.data.id);
        setIsModalOpen(false);
        setActiveTab('tracker');
        showToast(`Emergency request ${res.data.id} created via Backend API!`, 'success');
        return;
      }
    } catch (err) {
      console.warn('Backend API request failed, using local fallback:', err.message);
    }

    // Local Fallback
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

  const handleNotifyDonor = async (donorId) => {
    try {
      await api.notifyDonor(selectedReqId, donorId);
    } catch (e) {
      console.warn('Backend notifyDonor error:', e);
    }

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

  const handleSimulateFulfill = async () => {
    try {
      await api.updateRequestStatus(selectedReqId, 'FULFILLED');
    } catch (e) {
      console.warn('Backend updateRequestStatus error:', e);
    }

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
              className={'px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900')}
            >
              {role === 'hospital' ? '🏥 Hospital Dashboard' : role === 'donor' ? '🩸 Donor Dashboard' : role === 'blood_bank' ? '🏦 Blood Bank Dashboard' : role === 'ngo' ? '🤝 NGO Dashboard' : '⚡ Admin Dashboard'}
            </button>
            <button
              onClick={() => setActiveTab('tracker')}
              className={'px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'tracker' ? 'bg-white text-red-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900')}
            >
              {role === 'donor' ? '🩸 Lifesaver Mission' : role === 'blood_bank' ? '🧊 Cold Dispatch' : role === 'ngo' ? '🤝 Rapid Mobilization' : '🚨 Emergency Tracker'}
            </button>
            <button
              onClick={() => setActiveTab('matching')}
              className={'px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'matching' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900')}
            >
              {role === 'donor' ? '🎯 Compatible Cases' : role === 'blood_bank' ? '🔄 Inter-Bank Match' : role === 'ngo' ? '📍 Camp Matcher' : '⚡ Smart Matching'}
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={'px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'map' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900')}
            >
              {role === 'donor' ? '🗺️ ER Route & Radar' : role === 'blood_bank' ? '🚚 Fleet Logistics Map' : role === 'ngo' ? '📍 Camp & Donors Map' : '🗺️ Live Map'}
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={'px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900')}
            >
              {role === 'hospital' ? '📦 ICU Reserves' : role === 'donor' ? '🩸 City Shortage' : role === 'blood_bank' ? '📦 Stock Adjuster' : role === 'ngo' ? '🎯 Drive Quotas' : '📦 Inventory'}
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={'px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'api' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900')}
            >
              🗄️ MySQL Database & API
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

            {/* Role Switcher Dropdown */}
            <select
              value={role}
              onChange={(e) => {
                const newRole = e.target.value;
                setRole(newRole);
                setActiveTab('dashboard');
                showToast('Switched persona to ' + newRole.replace('_', ' ').toUpperCase(), 'info');
              }}
              className="text-xs bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
            >
              <option value="hospital">Role: Hospital (Lilavati)</option>
              <option value="donor">Role: Donor (Neha Patil - O-)</option>
              <option value="blood_bank">Role: Blood Bank (Red Cross)</option>
              <option value="ngo">Role: NGO (Think Foundation)</option>
              <option value="admin">Role: Admin / Citywide</option>
            </select>
          </div>
        </div>
      </header>

      {/* Interactive Quick Role Switcher Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-red-500" /> Active Role Dashboard:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setRole('hospital');
                  setActiveTab('dashboard');
                  showToast('Switched to Hospital Apex Dashboard (Lilavati Hospital)', 'info');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  role === 'hospital'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/50'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                🏥 Hospital (Lilavati)
              </button>

              <button
                onClick={() => {
                  setRole('donor');
                  setActiveTab('dashboard');
                  showToast('Switched to Donor Lifesaver Dashboard (Neha Patil - O-)', 'info');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  role === 'donor'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400/50'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                🩸 Donor (Neha Patil - O-)
              </button>

              <button
                onClick={() => {
                  setRole('blood_bank');
                  setActiveTab('dashboard');
                  showToast('Switched to Blood Bank Centre Dashboard (Red Cross)', 'info');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  role === 'blood_bank'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                🏦 Blood Bank (Red Cross)
              </button>

              <button
                onClick={() => {
                  setRole('ngo');
                  setActiveTab('dashboard');
                  showToast('Switched to NGO Volunteer Network (Think Foundation)', 'info');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  role === 'ngo'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-400/50'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                🤝 NGO (Think Foundation)
              </button>

              <button
                onClick={() => {
                  setRole('admin');
                  setActiveTab('dashboard');
                  showToast('Switched to Citywide Admin & Operations Command', 'info');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  role === 'admin'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 ring-2 ring-purple-400/50'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                ⚡ Admin / Citywide
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>MySQL 8.0: <strong>BloodBank</strong></span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* VIEW 1: ROLE-SPECIFIC DASHBOARDS */}
        {activeTab === 'dashboard' && (
          <div>
            {/* 🏥 HOSPITAL ROLE DASHBOARD */}
            {role === 'hospital' && (
              <HospitalDashboard
                requests={requests}
                bloodBanks={bloodBanks}
                donors={donors}
                hospitals={hospitals}
                onOpenCreateModal={() => setIsModalOpen(true)}
                onSelectRequest={(id) => {
                  setSelectedReqId(id);
                  setActiveTab('tracker');
                }}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onToast={showToast}
              />
            )}

            {/* 🩸 DONOR ROLE DASHBOARD */}
            {role === 'donor' && (
              <DonorDashboard
                requests={requests}
                donors={donors}
                ngos={ngos}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onToast={showToast}
              />
            )}

            {/* 🏦 BLOOD BANK ROLE DASHBOARD */}
            {role === 'blood_bank' && (
              <BloodBankDashboard
                bloodBanks={bloodBanks}
                requests={requests}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onToast={showToast}
                onRefreshData={refreshAllData}
              />
            )}

            {/* 🤝 NGO ROLE DASHBOARD */}
            {role === 'ngo' && (
              <NgoDashboard
                ngos={ngos}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onToast={showToast}
              />
            )}

            {/* ⚡ ADMIN / CITYWIDE NETWORK DASHBOARD */}
            {role === 'admin' && (
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
                    <span className="text-[10px] text-slate-500">{bloodBanks.length} Blood Banks</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Donors Online</span>
                    <p className="text-2xl font-black text-rose-600 mt-1">{donors.length * 7 || 347}</p>
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
                      <p className="text-xs text-slate-500">Aggregated units across {bloodBanks.length} blood centres</p>
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
          </div>
        )}

        {/* VIEW 2: EMERGENCY TRACKER (ROLE-SPECIFIC) */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            {/* Role Header Banner */}
            <div className={`p-6 sm:p-8 rounded-3xl shadow-xl space-y-4 text-white ${
              role === 'donor'
                ? 'bg-gradient-to-r from-rose-700 via-red-600 to-rose-800'
                : role === 'blood_bank'
                ? 'bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900'
                : role === 'ngo'
                ? 'bg-gradient-to-r from-amber-700 via-orange-800 to-slate-900'
                : role === 'admin'
                ? 'bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900'
                : 'bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-mono font-bold">{activeRequest.id}</span>
                  <span className="px-2.5 py-0.5 bg-white text-slate-900 rounded-full text-xs font-black uppercase">
                    {role === 'donor'
                      ? '🩸 Lifesaver Mission'
                      : role === 'blood_bank'
                      ? '🧊 Cold-Chain Transport'
                      : role === 'ngo'
                      ? '🤝 Rapid Mobilization'
                      : role === 'admin'
                      ? '⚡ Operations Telemetry'
                      : `${activeRequest.urgency} EMERGENCY`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {role === 'donor' ? (
                    <button
                      onClick={() => showToast('Dispatched to Lilavati ER! Safe travel Neha.', 'success')}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> En Route to ER
                    </button>
                  ) : role === 'blood_bank' ? (
                    <button
                      onClick={() => showToast('Cold courier verified at 3.8°C and sealed!', 'success')}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Verify Cold Box
                    </button>
                  ) : role === 'ngo' ? (
                    <button
                      onClick={() => showToast('Emergency WhatsApp blast broadcast to 45 Bandra donors!', 'success')}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Broadcast to Network
                    </button>
                  ) : (
                    <button onClick={handleSimulateFulfill} className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs">
                      Simulate Fulfilled ✓
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black">
                    {role === 'donor'
                      ? `Your Assigned Hospital: ${activeRequest.hospitalName}`
                      : role === 'blood_bank'
                      ? `Cold Dispatch to ${activeRequest.hospitalName}`
                      : role === 'ngo'
                      ? `Community Backup: ${activeRequest.hospitalName}`
                      : role === 'admin'
                      ? `Citywide Relay Oversight: ${activeRequest.hospitalName}`
                      : `${activeRequest.hospitalName} Emergency Command`}
                  </h1>
                  <p className="text-xs text-white/80 mt-1">Location: {activeRequest.location} • Patient Case: {activeRequest.patientCaseId}</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-950/40 p-3.5 rounded-2xl border border-white/10 text-center">
                  <div>
                    <span className="text-[10px] text-white/70 uppercase font-semibold">Blood Group</span>
                    <p className="text-2xl font-black text-white">{activeRequest.bloodGroup}</p>
                  </div>
                  <div className="w-px h-8 bg-white/20"></div>
                  <div>
                    <span className="text-[10px] text-white/70 uppercase font-semibold">Units</span>
                    <p className="text-2xl font-black text-white">{activeRequest.unitsRequired}</p>
                  </div>
                  <div className="w-px h-8 bg-white/20"></div>
                  <div>
                    <span className="text-[10px] text-white/70 uppercase font-semibold">Time Left</span>
                    <p className="text-2xl font-black text-amber-300">{activeRequest.requiredByMinutes}m</p>
                  </div>
                </div>
              </div>

              {/* Priority or Mission Directive */}
              <div className="p-3 bg-white/10 rounded-2xl text-xs text-white/95 border border-white/20">
                <p className="font-bold text-amber-300 flex items-center gap-1.5 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {role === 'donor'
                    ? 'Lifesaver Directives: Urgent Transfusion Required'
                    : role === 'blood_bank'
                    ? 'Logistics Directive: Maintain 2°C - 6°C Cold Chain'
                    : role === 'ngo'
                    ? 'Think Foundation Action: Mobilize Local Bandra O- Backup Donors'
                    : role === 'admin'
                    ? 'Audit Telemetry: Multi-Party Live Handshake'
                    : `AI Priority Engine: ${activeRequest.urgency.toUpperCase()} (Score: ${activeRequest.priorityScore || 96}/100)`}
                </p>
                <p>
                  {role === 'donor'
                    ? `Please proceed immediately to ${activeRequest.hospitalName} Emergency Room, 2nd Floor Transfusion Unit. Carry government ID and notify reception on arrival.`
                    : role === 'blood_bank'
                    ? `Units allocated from Red Cross Blood Centre. Express courier dispatched under thermal monitoring box #CC-108.`
                    : role === 'ngo'
                    ? `Lilavati ICU is currently operating with critical deficit. Community volunteers mobilized across Bandra West corridor.`
                    : role === 'admin'
                    ? `Real-time synchronization across Lilavati ICU, Red Cross Blood Centre, and 8 proximity donors via WebSocket / SSE.`
                    : activeRequest.priorityReason}
                </p>
              </div>
            </div>

            {/* Role-Specific Action Card: DONOR */}
            {role === 'donor' && (
              <div className="bg-white p-6 rounded-3xl border-2 border-rose-500 shadow-md space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    Turn-by-Turn Donor Arrival Protocol (Neha Patil - O-)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                    2.1 km away (~8 mins)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">1. Route Instructions</span>
                    <p className="font-semibold text-slate-800 mt-1">Head north on SV Road towards Bandra West ER Bay.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">2. ER Check-in</span>
                    <p className="font-semibold text-slate-800 mt-1">Report to 2nd Floor Blood Bank reception, quote Case {activeRequest.id}.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">3. Emergency Desk</span>
                    <p className="font-semibold text-slate-800 mt-1">Contact: +91 22 2675 1000 (Lilavati ICU Duty Desk).</p>
                  </div>
                </div>

                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-rose-900">
                    <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>Lifesaver Checklist:</strong> Hydrated (500ml water taken) • Light snack eaten • Photo ID in hand</span>
                  </div>
                  <span className="text-[11px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-lg border border-rose-200">
                    Pass Code: #EM-PATIL-90
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <a
                    href="tel:+912226751000"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    📞 Call Hospital ER Desk
                  </a>
                  <button
                    onClick={() => {
                      showToast('Status confirmed: DONOR ARRIVED AT ER! Doctors notified.', 'success');
                    }}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20"
                  >
                    I Have Arrived at Hospital ER ✓
                  </button>
                </div>
              </div>
            )}

            {/* Role-Specific Action Card: HOSPITAL */}
            {role === 'hospital' && (
              <div className="bg-white p-6 rounded-3xl border-2 border-blue-500 shadow-md space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Lilavati Hospital ICU — Inbound Emergency Transfusion Console
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    ICU Bed #4 • Dr. R. Mehta Duty
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Inbound Donor</span>
                    <p className="font-bold text-slate-900 mt-1">Neha Patil (O- Universal)</p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">● En route (~8 mins away)</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Cold-Chain Courier</span>
                    <p className="font-bold text-slate-900 mt-1">Express Courier #MC-44</p>
                    <p className="text-[11px] text-blue-600 font-semibold mt-0.5">● Carrying 4 Units O- (ETA 12m)</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Requisition Source</span>
                    <p className="font-bold text-slate-900 mt-1">Red Cross Blood Centre</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Box #CC-108 • 3.8°C Monitored</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    📦 Requisition Additional Blood Units
                  </button>
                  <button
                    onClick={handleSimulateFulfill}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20"
                  >
                    Confirm Units Received & Transfuse Patient ✓
                  </button>
                </div>
              </div>
            )}

            {/* Role-Specific Action Card: BLOOD BANK */}
            {role === 'blood_bank' && (
              <div className="bg-white p-6 rounded-3xl border-2 border-emerald-500 shadow-md space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Cold-Chain Box #CC-108 Telemetry & Seal Verification
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    3.8°C Monitored
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Storage Temperature</span>
                    <p className="font-black text-emerald-700 text-base mt-1">3.8°C (Optimal)</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Security Tamper Seal</span>
                    <p className="font-bold text-slate-800 mt-1">#TS-9028-VERIFIED</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Medical Courier</span>
                    <p className="font-bold text-slate-800 mt-1">Express Courier #MC-44</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => showToast('Dispatch verified and handed to Medical Courier #MC-44!', 'success')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20"
                  >
                    Seal & Hand Over to Courier ✓
                  </button>
                </div>
              </div>
            )}

            {/* Role-Specific Action Card: NGO */}
            {role === 'ngo' && (
              <div className="bg-white p-6 rounded-3xl border-2 border-amber-500 shadow-md space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    Think Foundation — Community Emergency Mobilization Desk
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    45 O- Donors in Bandra Zone
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Bandra WhatsApp Group</span>
                    <p className="font-bold text-slate-900 mt-1">45 Donors Standby</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Average response: 6 mins</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Volunteer Desk</span>
                    <p className="font-bold text-slate-900 mt-1">2 Volunteers Dispatched</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Assisting reception at Lilavati ER</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Transport Support</span>
                    <p className="font-bold text-slate-900 mt-1">Cab Reimbursement Active</p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Sponsored by NGO Trust</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => showToast('Dispatched NGO Volunteer Escort to Lilavati Hospital ER!', 'success')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    🚗 Deploy Volunteer Escort
                  </button>
                  <button
                    onClick={() => showToast('Broadcasted Emergency O- Appeal to 45 Bandra WhatsApp members!', 'success')}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20"
                  >
                    📱 Send Urgent WhatsApp Broadcast (45 Donors)
                  </button>
                </div>
              </div>
            )}

            {/* Role-Specific Action Card: ADMIN */}
            {role === 'admin' && (
              <div className="bg-white p-6 rounded-3xl border-2 border-purple-500 shadow-md space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    Citywide Multi-Party Relay Telemetry & Audit Logs
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    Live Audit Sync
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Step 1: Hospital Intake</span>
                    <p className="font-bold text-slate-800 mt-1">REQ Created (08:42:10)</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Step 2: Smart Matching</span>
                    <p className="font-bold text-slate-800 mt-1">8 Donors Alerted (08:42:15)</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Step 3: Cold-Chain</span>
                    <p className="font-bold text-slate-800 mt-1">Box #CC-108 Sealed (08:43:00)</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Step 4: Transfusion</span>
                    <p className="font-bold text-amber-600 mt-1">Pending Delivery (ETA 8m)</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => showToast('Emergency priority override confirmed for Lilavati ICU!', 'info')}
                    className="px-4 py-2 bg-purple-100 text-purple-800 font-bold text-xs rounded-xl"
                  >
                    ⚡ Force Priority Override
                  </button>
                  <button
                    onClick={handleSimulateFulfill}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                  >
                    Simulate Complete Fulfillment ✓
                  </button>
                </div>
              </div>
            )}

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

            {/* Matched Donors Cards (Role Perspective) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {role === 'donor'
                      ? 'Candidate Network Status (Standby Lifesavers)'
                      : role === 'ngo'
                      ? 'Community Volunteer & Donor Candidates'
                      : role === 'blood_bank'
                      ? 'Biological Pre-Screened Donor Pool'
                      : 'Matched Compatible Donors'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {role === 'donor'
                      ? 'Other lifesavers in network on standby for this emergency'
                      : role === 'ngo'
                      ? 'Eligible donors in Bandra/Khar available for NGO volunteer escort'
                      : 'Scored by compatibility, distance, and readiness'}
                  </p>
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
                        className={`px-2.5 py-1 text-white rounded-lg text-xs font-semibold ${
                          role === 'ngo' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {role === 'ngo' ? 'WhatsApp Invite' : 'Notify'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SMART MATCHING (ROLE-SPECIFIC) */}
        {activeTab === 'matching' && (
          <div className="space-y-5">
            {/* Header with Role Context */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    role === 'donor'
                      ? 'bg-rose-100 text-rose-700'
                      : role === 'blood_bank'
                      ? 'bg-emerald-100 text-emerald-800'
                      : role === 'ngo'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {role === 'donor'
                      ? '🩸 Lifesaver Opportunities'
                      : role === 'blood_bank'
                      ? '🧊 Inter-Facility Relay'
                      : role === 'ngo'
                      ? '🤝 Targeted Volunteer Mobilization'
                      : role === 'admin'
                      ? '⚡ Citywide Engine Mesh'
                      : '🏥 Hospital ICU Triage'}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    {role === 'donor'
                      ? 'Emergency Matching Opportunities (Neha Patil - O- Universal)'
                      : role === 'blood_bank'
                      ? 'Inter-Facility Blood Redistribution & Deficit Matcher'
                      : role === 'ngo'
                      ? 'Targeted Community Camp & Donor Cluster Matcher'
                      : role === 'admin'
                      ? 'Multi-Vector Citywide Matching & Relay Optimization Hub'
                      : 'Smart Donor Matching Engine (Lilavati Hospital ICU)'}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {role === 'donor'
                    ? 'All active hospital transfusions across Mumbai compatible with your O- universal blood.'
                    : role === 'blood_bank'
                    ? 'Cross-matching blood centres with surplus against hospitals with acute deficits to prevent critical stockouts.'
                    : role === 'ngo'
                    ? 'Locating high-density donor clusters across Mumbai neighborhoods to organize targeted donation drives.'
                    : role === 'admin'
                    ? 'AI heuristic scoring factoring ABO/Rh compatibility, distance, cooldown status, and live traffic.'
                    : 'Multivariate matching algorithm factoring ABO/Rh, distance, and donor cooldown.'}
                </p>
              </div>

              {role === 'donor' ? (
                <button
                  onClick={() => showToast('Status confirmed: Ready to respond to all 90%+ match alerts!', 'success')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  ⚡ Available for All Matches
                </button>
              ) : role === 'blood_bank' ? (
                <button
                  onClick={() => showToast('Simulated dispatch of 3 inter-facility cold couriers!', 'success')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  🧊 Auto-Route Surplus Units
                </button>
              ) : role === 'ngo' ? (
                <button
                  onClick={() => showToast('Camp drive proposals sent to Bandra, Andheri, and Dadar ward officers!', 'success')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  🤝 Propose Weekend Drives
                </button>
              ) : (
                <button
                  onClick={() => showToast('Dispatched alerts to all 90%+ match candidates', 'success')}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Broadcast Code Red Alert
                </button>
              )}
            </div>

            {/* ROLE 1: DONOR SMART MATCHING */}
            {role === 'donor' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requests.slice(0, 4).map((req) => (
                    <div
                      key={req.id}
                      className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-rose-300 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-400">{req.id}</span>
                            <h4 className="font-bold text-sm text-slate-900 mt-0.5">{req.hospitalName}</h4>
                            <p className="text-xs text-slate-500">{req.location || 'Mumbai Corridor'}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-xl font-black text-xs">
                            {req.bloodGroup} Needed
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-2xl space-y-1 text-xs">
                          <div className="flex justify-between text-slate-600">
                            <span>Patient Case:</span>
                            <strong className="text-slate-900">{req.patientCaseId || 'Trauma Transfusion'}</strong>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Units Required:</span>
                            <strong className="text-slate-900">{req.unitsRequired} Units</strong>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Urgency:</span>
                            <strong className="text-red-600">{req.urgency} ({req.requiredByMinutes || 45} mins left)</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> 95% Match Affinity
                        </span>
                        <button
                          onClick={() => {
                            setSelectedReqId(req.id);
                            showToast(`Volunteered for ${req.hospitalName} emergency case!`, 'success');
                            setActiveTab('tracker');
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
                        >
                          Volunteer for Case →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Educational Universal Donor Card */}
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900">
                  <div className="flex items-center gap-3">
                    <Heart className="w-6 h-6 text-rose-600 shrink-0 fill-rose-600" />
                    <div>
                      <p className="font-bold text-rose-950">The Universal Lifesaver Advantage (O- Blood)</p>
                      <p className="text-rose-800 mt-0.5">Your O- red blood cells can be safely transfused to any patient in Mumbai regardless of their blood group (A+, A-, B+, B-, AB+, AB-, O+, O-).</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white text-rose-700 font-bold rounded-xl border border-rose-200 shrink-0">
                    Universal Donor
                  </span>
                </div>
              </div>
            )}

            {/* ROLE 2: BLOOD BANK INTER-FACILITY REDISTRIBUTION MATCHING */}
            {role === 'blood_bank' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span><strong>Inter-Bank Surplus Analysis:</strong> Red Cross Centre has 18 units of O-, while Lilavati ICU and KEM are in acute deficit. Below are the recommended automated transfers:</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Match 1 */}
                  <div className="bg-white p-5 rounded-3xl border-2 border-emerald-500 shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">Match Score 98%</span>
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-xl font-black text-xs">4 Units O-</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">Red Cross ➔ Lilavati Hospital</h4>
                      <p className="text-xs text-slate-500">Deficit Triage: Critical ICU Demand</p>

                      <div className="bg-slate-50 p-3 rounded-2xl space-y-1 text-xs my-2">
                        <div className="flex justify-between text-slate-600">
                          <span>Source Surplus:</span>
                          <strong className="text-emerald-700">18 Units Available</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Target Hospital:</span>
                          <strong className="text-slate-900">Lilavati ICU (2.3 km)</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Est. Courier Transit:</span>
                          <strong className="text-blue-600">14 mins (Express)</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast('Courier #MC-44 dispatched: 4 units O- heading to Lilavati Hospital ER!', 'success')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                    >
                      Approve & Dispatch 4 Units O- →
                    </button>
                  </div>

                  {/* Match 2 */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-300 shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">Match Score 92%</span>
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-xl font-black text-xs">6 Units B+</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">Sion Blood Bank ➔ Hinduja Hospital</h4>
                      <p className="text-xs text-slate-500">Deficit Triage: Surgical Suite Demand</p>

                      <div className="bg-slate-50 p-3 rounded-2xl space-y-1 text-xs my-2">
                        <div className="flex justify-between text-slate-600">
                          <span>Source Surplus:</span>
                          <strong className="text-emerald-700">22 Units Available</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Target Hospital:</span>
                          <strong className="text-slate-900">Hinduja Hospital (4.8 km)</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Est. Courier Transit:</span>
                          <strong className="text-blue-600">22 mins (Standard)</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast('Transfer approved: 6 units B+ routed from Sion to Hinduja Hospital!', 'success')}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs"
                    >
                      Approve & Dispatch 6 Units B+ →
                    </button>
                  </div>

                  {/* Match 3 */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-300 shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">Match Score 87%</span>
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-xl font-black text-xs">3 Units A-</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">KEM Blood Centre ➔ Kokilaben Hospital</h4>
                      <p className="text-xs text-slate-500">Deficit Triage: Rare Negative Reserve</p>

                      <div className="bg-slate-50 p-3 rounded-2xl space-y-1 text-xs my-2">
                        <div className="flex justify-between text-slate-600">
                          <span>Source Surplus:</span>
                          <strong className="text-emerald-700">15 Units Available</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Target Hospital:</span>
                          <strong className="text-slate-900">Kokilaben (8.1 km)</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Est. Courier Transit:</span>
                          <strong className="text-blue-600">35 mins (Scheduled)</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast('Transfer approved: 3 units A- routed from KEM to Kokilaben Hospital!', 'success')}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs"
                    >
                      Approve & Dispatch 3 Units A- →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ROLE 3: NGO TARGETED CAMP & CLUSTER MATCHING */}
            {role === 'ngo' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-700 shrink-0" />
                    <span><strong>Think Foundation Cluster Matcher:</strong> Identified 3 high-density geographic hubs with high concentrations of eligible rare blood donors.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Cluster 1 */}
                  <div className="bg-white p-5 rounded-3xl border-2 border-amber-500 shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">Match Score 96%</span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-bold text-xs">O- & A- Focus</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">Bandra West Linking Road</h4>
                      <p className="text-xs text-slate-500">48 Eligible Rare Donors in 2km Radius</p>

                      <div className="bg-slate-50 p-3 rounded-2xl space-y-1 text-xs my-2">
                        <div className="flex justify-between text-slate-600">
                          <span>Target Deficit:</span>
                          <strong className="text-red-600">O- (Only 5 left in city)</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Partner Venue:</span>
                          <strong className="text-slate-900">Bandra Gymkhana Ground</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Volunteers Needed:</span>
                          <strong className="text-slate-900">8 Community Leads</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast('Scheduled Emergency Blood Donation Drive at Bandra Gymkhana for Saturday!', 'success')}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs"
                    >
                      Schedule Emergency Camp Here →
                    </button>
                  </div>

                  {/* Cluster 2 */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-amber-300 shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">Match Score 91%</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-xs">Corporate Hub</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">Andheri East Techno-Park</h4>
                      <p className="text-xs text-slate-500">72 Corporate Donors on Standby</p>

                      <div className="bg-slate-50 p-3 rounded-2xl space-y-1 text-xs my-2">
                        <div className="flex justify-between text-slate-600">
                          <span>Target Deficit:</span>
                          <strong className="text-amber-700">A- & B- Units</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Partner Venue:</span>
                          <strong className="text-slate-900">Nesco IT Park Atrium</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Volunteers Needed:</span>
                          <strong className="text-slate-900">12 Corporate Ambassadors</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast('Corporate blood drive proposal submitted to Nesco IT Park Management!', 'success')}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs"
                    >
                      Mobilize Corporate Drive →
                    </button>
                  </div>

                  {/* Cluster 3 */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-amber-300 shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">Match Score 88%</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-bold text-xs">Public Transit Hub</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">Dadar Central Station</h4>
                      <p className="text-xs text-slate-500">55 Commuter Donors Registered</p>

                      <div className="bg-slate-50 p-3 rounded-2xl space-y-1 text-xs my-2">
                        <div className="flex justify-between text-slate-600">
                          <span>Target Deficit:</span>
                          <strong className="text-slate-900">Whole Blood Reserves</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Partner Venue:</span>
                          <strong className="text-slate-900">Dadar Central Concourse</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Volunteers Needed:</span>
                          <strong className="text-slate-900">10 Rotary Volunteers</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast('Camp partnership confirmed with Dadar Rotary Club for Sunday!', 'success')}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs"
                    >
                      Partner with Local Rotary →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ROLE 4 & 5: HOSPITAL & ADMIN SMART DONOR MATCHING */}
            {(role === 'hospital' || role === 'admin') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-slate-400 font-semibold shrink-0">Filter Candidates:</span>
                  <button className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg shrink-0">
                    All Compatible ({donors.length})
                  </button>
                  <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shrink-0">
                    O- Exact Match
                  </button>
                  <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shrink-0">
                    Under 5 km ({donors.slice(0, 5).length})
                  </button>
                  <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shrink-0">
                    Ready Now
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
                          <p className="text-[11px] text-slate-500">Last Donation: <strong>{d.daysSinceDonation || 58} days ago</strong></p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end gap-2">
                          <button onClick={() => showToast('Simulated notification sent to ' + d.name, 'success')} className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">
                            Notify Donor
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: LIVE MAP (ROLE-SPECIFIC) */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            {/* Role Header Banner */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    role === 'donor'
                      ? 'bg-rose-100 text-rose-700'
                      : role === 'blood_bank'
                      ? 'bg-emerald-100 text-emerald-800'
                      : role === 'ngo'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {role === 'donor'
                      ? '🗺️ Donor Radar & Navigation'
                      : role === 'blood_bank'
                      ? '🚚 Cold-Chain Courier Logistics'
                      : role === 'ngo'
                      ? '⛺ Community Camp & Donor Corridors'
                      : role === 'admin'
                      ? '⚡ Citywide Operations Mesh'
                      : '🏥 Hospital Inbound Radar'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {role === 'donor'
                      ? 'Lifesaver Navigation Radar: Bandra West ➔ Lilavati ER'
                      : role === 'blood_bank'
                      ? 'Red Cross Cold-Chain Courier Fleet & Transport Corridors'
                      : role === 'ngo'
                      ? 'Think Foundation Community Donation Camps & Donor Clusters'
                      : role === 'admin'
                      ? 'Citywide Integrated Emergency Mesh (10 Hospitals, 8 Banks)'
                      : 'Lilavati Hospital Emergency Inbound Radar (Donors & Couriers)'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {role === 'donor'
                    ? 'Turn-by-turn proximity corridor to Lilavati Hospital ER. Distance: 2.1 km (~8 mins).'
                    : role === 'blood_bank'
                    ? 'Monitoring real-time GPS and thermal sensor box telemetry for active medical deliveries.'
                    : role === 'ngo'
                    ? 'Displaying active weekend donation camps and high-density eligible donor neighborhoods.'
                    : role === 'admin'
                    ? 'Live tracking across all medical facilities, courier fleets, and citywide deficit hot-spots.'
                    : 'Tracking incoming responding donors and emergency cold-chain courier vehicles.'}
                </p>
              </div>

              {/* Layer Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                <button
                  onClick={() => setMapFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    mapFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({mockData.hospitals.length + bloodBanks.length + 15})
                </button>
                <button
                  onClick={() => setMapFilter('hospitals')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    mapFilter === 'hospitals' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🏥 Hospitals (10)
                </button>
                <button
                  onClick={() => setMapFilter('blood_banks')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    mapFilter === 'blood_banks' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🩸 Blood Banks (8)
                </button>
                <button
                  onClick={() => setMapFilter('donors')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    mapFilter === 'donors' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Donors
                </button>
                <button
                  onClick={() => setMapFilter('fleet')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    mapFilter === 'fleet' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🚚 Fleet & Camps
                </button>
              </div>
            </div>

            {/* Role Context Bar Floating Over Map */}
            <div className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
              role === 'donor'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : role === 'blood_bank'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : role === 'ngo'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 shrink-0" />
                <span>
                  {role === 'donor' && (
                    <><strong>Navigation Guidance:</strong> Start at Bandra West ➔ Turn onto SV Road North ➔ Lilavati ER Bay. Estimated transit: 8 mins.</>
                  )}
                  {role === 'hospital' && (
                    <><strong>Inbound Transit:</strong> Donor Neha Patil is 2.1 km away approaching ER. Courier #MC-44 carrying 4 units of O- is arriving in 12 mins.</>
                  )}
                  {role === 'blood_bank' && (
                    <><strong>Cold-Chain Fleet:</strong> Courier #MC-44 en route to Lilavati Hospital. Box #CC-108 thermal telemetry: 3.8°C (Optimal).</>
                  )}
                  {role === 'ngo' && (
                    <><strong>Active Camp:</strong> Bandra West Station Camp is live today. 48 compatible rare donors in 2 km perimeter.</>
                  )}
                  {role === 'admin' && (
                    <><strong>City Operations:</strong> 10 hospitals and 8 blood banks communicating via live SSE connection. Zero packet drops.</>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => showToast('Map telemetry refreshed with real-time GPS coordinates', 'info')}
                  className="px-3 py-1 bg-white rounded-lg border font-bold shadow-xs text-slate-800 hover:bg-slate-50"
                >
                  Refresh GPS
                </button>
              </div>
            </div>

            {/* Leaflet Interactive Map Container */}
            <div className="h-[580px] rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-white p-2">
              <MapContainer center={[19.0760, 72.8777]} zoom={12} scrollWheelZoom={true} className="h-full w-full rounded-2xl">
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Shortage Hotspot Circle in South Mumbai */}
                <Circle
                  center={[19.0039, 72.8436]}
                  radius={2500}
                  pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.15 }}
                />

                {/* Hospitals */}
                {(mapFilter === 'all' || mapFilter === 'hospitals') &&
                  mockData.hospitals.map((h) => (
                    <Marker key={h.id} position={[h.lat, h.lng]} icon={createMarkerIcon('hospital')}>
                      <Popup>
                        <div className="text-xs p-1">
                          <strong className="text-blue-900 block font-bold text-sm">{h.name}</strong>
                          <p className="text-slate-500">{h.area} • {h.type}</p>
                          <p className="font-mono mt-1 text-slate-700">{h.contact}</p>
                          {h.id === 'H1' && (
                            <span className="mt-1 inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                              🚨 ACTIVE EMERGENCY REQ-2026-1048
                            </span>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* Blood Banks */}
                {(mapFilter === 'all' || mapFilter === 'blood_banks') &&
                  bloodBanks.map((b) => (
                    <Marker key={b.id} position={[b.lat, b.lng]} icon={createMarkerIcon('blood_bank')}>
                      <Popup>
                        <div className="text-xs p-1">
                          <strong className="text-emerald-900 block font-bold text-sm">{b.name}</strong>
                          <p className="text-slate-500">{b.area}</p>
                          <p className="font-bold text-red-600 mt-1">O- Units Available: {b.inventory['O-'] || 0}</p>
                          <p className="text-[11px] text-slate-500">Contact: {b.contact}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* Active Emergency at Lilavati */}
                <Marker position={[19.0514, 72.8295]} icon={createMarkerIcon('emergency')}>
                  <Popup>
                    <div className="text-xs p-1">
                      <strong className="text-red-700 block font-black text-sm">🚨 CRITICAL EMERGENCY</strong>
                      <p className="font-bold text-slate-800">Lilavati Hospital (O- • 4 Units)</p>
                      <p className="text-slate-500">Required in 42 mins</p>
                      <p className="text-emerald-700 font-bold mt-1">● Neha Patil en route (ETA 8m)</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Responding Donor: Neha Patil (Special Pulsing Pin) */}
                {(mapFilter === 'all' || mapFilter === 'donors' || role === 'donor' || role === 'hospital') && (
                  <Marker position={[19.0596, 72.8295]} icon={createMarkerIcon('active_donor', 'O-')}>
                    <Popup>
                      <div className="text-xs p-1">
                        <strong className="text-rose-700 block font-bold text-sm">🩸 Neha Patil (Donor - O-)</strong>
                        <p className="text-slate-500">Bandra West • Universal Donor</p>
                        <p className="text-emerald-700 font-bold mt-1">● Responding to Lilavati ER (2.1 km)</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Cold Chain Courier #MC-44 */}
                {(mapFilter === 'all' || mapFilter === 'fleet' || role === 'blood_bank' || role === 'hospital') && (
                  <Marker position={[19.0450, 72.8350]} icon={createMarkerIcon('courier')}>
                    <Popup>
                      <div className="text-xs p-1">
                        <strong className="text-blue-900 block font-bold text-sm">🚚 Cold-Chain Courier #MC-44</strong>
                        <p className="text-slate-500">Payload: 4 Units O- for Lilavati Hospital</p>
                        <p className="text-emerald-700 font-bold mt-1">Box #CC-108 Temp: 3.8°C Monitored</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* NGO Donation Camps */}
                {(mapFilter === 'all' || mapFilter === 'fleet' || role === 'ngo') && (
                  <>
                    <Marker position={[19.0544, 72.8402]} icon={createMarkerIcon('camp')}>
                      <Popup>
                        <div className="text-xs p-1">
                          <strong className="text-amber-800 block font-bold text-sm">⛺ Bandra West Station Camp</strong>
                          <p className="text-slate-500">Organized by Think Foundation</p>
                          <p className="font-bold text-slate-800 mt-1">Target: 60 Units Whole Blood</p>
                        </div>
                      </Popup>
                    </Marker>
                    <Marker position={[19.0178, 72.8478]} icon={createMarkerIcon('camp')}>
                      <Popup>
                        <div className="text-xs p-1">
                          <strong className="text-amber-800 block font-bold text-sm">⛺ Dadar Central Rotary Camp</strong>
                          <p className="text-slate-500">Organized by Think Foundation & Rotary</p>
                          <p className="font-bold text-slate-800 mt-1">Sunday Special Drive</p>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}

                {/* Other Donors Sample */}
                {(mapFilter === 'all' || mapFilter === 'donors') &&
                  donors.slice(0, 12).map((d) => (
                    <Marker key={d.id} position={[d.latitude, d.longitude]} icon={createMarkerIcon('donor', d.bloodGroup)}>
                      <Popup>
                        <div className="text-xs p-1">
                          <strong>{d.name}</strong> ({d.bloodGroup})
                          <p className="text-slate-500">{d.area}</p>
                          <p className="text-slate-400 text-[10px]">Verified Lifesaver</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </div>
          </div>
        )}

        {/* VIEW 5: INVENTORY (ROLE-SPECIFIC) */}
        {activeTab === 'inventory' && (
          <div className="space-y-5">
            {/* Header Banner */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    role === 'donor'
                      ? 'bg-rose-100 text-rose-700'
                      : role === 'blood_bank'
                      ? 'bg-emerald-100 text-emerald-800'
                      : role === 'ngo'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {role === 'donor'
                      ? '🩸 Community Shortage Telemetry'
                      : role === 'blood_bank'
                      ? '🏦 Real-Time MySQL Stock Editor'
                      : role === 'ngo'
                      ? '🎯 Collection Deficit Quotas'
                      : role === 'admin'
                      ? '⚡ Citywide Strategic Reserve'
                      : '🏥 Hospital ICU Reserves & Requisition'}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    {role === 'donor'
                      ? 'Public Blood Shortage Telemetry & Lifesaver Pledge'
                      : role === 'blood_bank'
                      ? 'Red Cross Blood Centre — Live Stock Adjuster'
                      : role === 'ngo'
                      ? 'Citywide Blood Deficit Targets for Community Blood Drives'
                      : role === 'admin'
                      ? 'Citywide Strategic Blood Reserve & Facility Matrix'
                      : 'Lilavati Hospital Blood Bank & ICU Transfusion Reserves'}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {role === 'donor'
                    ? 'Current municipal blood telemetry. O- and A- blood groups are critically depleted across Mumbai hospitals.'
                    : role === 'blood_bank'
                    ? 'Connected directly to MySQL database `BloodBank`. Use the [- 1] and [+ 1] buttons to adjust inventory in real time.'
                    : role === 'ngo'
                    ? 'Current deficit gap between hospital ICU requirements and available municipal blood stocks.'
                    : role === 'admin'
                    ? 'Consolidated reserves across all 8 licensed blood banks with regulatory safety threshold monitoring.'
                    : 'Manage in-house ICU blood reserves and place direct requisition orders to central blood banks.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={refreshAllData} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>

            {/* ROLE 1: HOSPITAL INVENTORY & DIRECT REQUISITION PANEL */}
            {role === 'hospital' && (
              <div className="space-y-4">
                {/* Hospital Direct Requisition Card */}
                <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 rounded-3xl text-white shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/20 text-white">
                        ICU Transfusion Service
                      </span>
                      <h3 className="text-lg font-bold mt-1">Direct Emergency Requisition to Central Blood Bank</h3>
                      <p className="text-xs text-white/80 mt-0.5">Place an immediate transfer order to restock Lilavati ICU surgical reserves.</p>
                    </div>
                  </div>

                  <form onSubmit={handleHospitalRequisition} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 text-xs">
                    <div>
                      <label className="block text-white/70 font-semibold mb-1">Blood Group</label>
                      <select
                        value={reqBloodGroup}
                        onChange={(e) => setReqBloodGroup(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 text-white font-bold"
                      >
                        {mockData.bloodGroups.map((bg) => (
                          <option key={bg} value={bg} className="text-slate-900">{bg}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-white/70 font-semibold mb-1">Units Required</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={reqUnits}
                        onChange={(e) => setReqUnits(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 text-white font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white/70 font-semibold mb-1">Target Blood Bank</label>
                      <select
                        value={reqTargetBank}
                        onChange={(e) => setReqTargetBank(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 text-white font-bold"
                      >
                        {bloodBanks.map((b) => (
                          <option key={b.id} value={b.id} className="text-slate-900">{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-500/30"
                      >
                        Submit Requisition Order →
                      </button>
                    </div>
                  </form>
                </div>

                {/* Lilavati Hospital On-Site Reserves */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Lilavati Hospital On-Site Emergency Storage</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
                      <span className="font-bold text-red-700 text-base">O- (3 Units)</span>
                      <p className="text-[11px] text-red-600 font-semibold mt-1">● BELOW SAFETY THRESHOLD (Min: 6)</p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                      <span className="font-bold text-amber-800 text-base">A- (5 Units)</span>
                      <p className="text-[11px] text-amber-700 font-semibold mt-1">● LOW STOCK (Min: 6)</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="font-bold text-slate-800 text-base">B+ (14 Units)</span>
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">● ADEQUATE</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="font-bold text-slate-800 text-base">O+ (18 Units)</span>
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">● HEALTHY BUFFER</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ROLE 2: DONOR SHORTAGE TELEMETRY & PLEDGE */}
            {role === 'donor' && (
              <div className="space-y-4">
                {/* Critical Shortage Hero Card */}
                <div className="p-6 bg-gradient-to-r from-rose-600 to-red-700 rounded-3xl text-white shadow-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse" />
                    <span className="font-black text-xs uppercase tracking-wide">Critical Shortage Alert</span>
                  </div>
                  <h3 className="text-xl font-black">O- Negative is Depleted: Only 5 Units Left Across Mumbai</h3>
                  <p className="text-xs text-white/90 max-w-2xl leading-relaxed">
                    Hospitals across Mumbai have requested emergency O- whole blood for accident and surgery patients. Because your blood group is O-, you have the rare ability to save any patient in need.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => showToast('Pledge recorded! You earned 100 LifePoints. Slot confirmed at Red Cross Centre.', 'success')}
                      className="px-5 py-2.5 bg-white text-rose-700 font-black text-xs rounded-xl shadow-md hover:bg-rose-50"
                    >
                      Pledge O- Donation Today (+100 LifePoints)
                    </button>
                    <span className="text-xs text-white/80">Every donation saves up to 3 lives.</span>
                  </div>
                </div>

                {/* Eligibility Check */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span><strong>Neha Patil Eligibility:</strong> Last donation was 68 days ago. You are eligible to donate whole blood today!</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg shrink-0">
                    Eligible to Donate
                  </span>
                </div>
              </div>
            )}

            {/* ROLE 3: BLOOD BANK INTERACTIVE REAL-TIME MYSQL STOCK ADJUSTER */}
            {role === 'blood_bank' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span><strong>Red Cross Blood Centre (BB1):</strong> Click <strong>[- 1]</strong> or <strong>[+ 1]</strong> to adjust real inventory counts. Each adjustment writes directly to MySQL table `blood_bank_inventory`.</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-white text-emerald-800 rounded-lg font-bold border border-emerald-200 shrink-0">
                    Live DB Sync
                  </span>
                </div>

                {/* 8 Interactive Blood Group Adjuster Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {mockData.bloodGroups.map((bg) => {
                    const currentBank = bloodBanks.find((b) => b.id === 'BB1') || bloodBanks[0];
                    const count = currentBank?.inventory[bg] || 0;
                    const isCrit = count < 6;
                    const isLow = count < 12;

                    return (
                      <div key={bg} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                              {bg}
                            </span>
                            <span className={'px-2 py-0.5 rounded text-[10px] font-bold ' + (isCrit ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}>
                              {isCrit ? 'CRITICAL' : isLow ? 'LOW' : 'OK'}
                            </span>
                          </div>
                          <p className="text-2xl font-black text-slate-900 mt-2">
                            {count} <span className="text-xs font-normal text-slate-500">units</span>
                          </p>
                          <p className="text-[10px] text-slate-400">Min Buffer: 8 units</p>
                        </div>

                        {/* Interactive +/- Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleStockAdjust('BB1', bg, -1)}
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-lg active:scale-95 transition-all"
                            title="Decrease 1 unit in MySQL"
                          >
                            - 1
                          </button>
                          <button
                            onClick={() => handleStockAdjust('BB1', bg, +1)}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg active:scale-95 transition-all"
                            title="Add 1 unit in MySQL"
                          >
                            + 1
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cold Storage Diagnostics */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Facility Cold-Storage Telemetry</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Main Blood Refrigerator #1</span>
                      <p className="text-lg font-black text-emerald-700 mt-1">4.1°C</p>
                      <p className="text-[11px] text-slate-500">Safe Range: 2.0°C - 6.0°C</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Cryo-Plasma Deep Freezer</span>
                      <p className="text-lg font-black text-blue-700 mt-1">-31.8°C</p>
                      <p className="text-[11px] text-slate-500">Safe Range: &lt; -25.0°C</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Platelet Agitator Incubator</span>
                      <p className="text-lg font-black text-amber-700 mt-1">22.2°C</p>
                      <p className="text-[11px] text-slate-500">Safe Range: 20.0°C - 24.0°C</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ROLE 4: NGO DEFICIT TARGETS FOR DRIVES */}
            {role === 'ngo' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-700 shrink-0" />
                    <span><strong>Think Foundation Quota Targets:</strong> Focus upcoming weekend donation drives on the critical deficit groups below:</span>
                  </div>
                  <button
                    onClick={() => showToast('Campaign launched: Think Foundation Emergency Drive for O- / A-!', 'success')}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shrink-0"
                  >
                    + Launch Drive Campaign
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="w-9 h-9 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center">O-</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">10% OF QUOTA</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">O- Universal Whole Blood</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Target: 50 Units • Current Reserve: 5 Units</p>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-red-600 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                    <p className="text-[11px] text-red-600 font-semibold">Deficit Gap: -45 Units</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="w-9 h-9 rounded-xl bg-amber-600 text-white font-black text-sm flex items-center justify-center">A-</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">20% OF QUOTA</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">A- Rare Negative</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Target: 40 Units • Current Reserve: 8 Units</p>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-amber-600 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                    <p className="text-[11px] text-amber-700 font-semibold">Deficit Gap: -32 Units</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">B-</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">40% OF QUOTA</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">B- Blood Group</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Target: 30 Units • Current Reserve: 12 Units</p>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                    <p className="text-[11px] text-blue-700 font-semibold">Deficit Gap: -18 Units</p>
                  </div>
                </div>
              </div>
            )}

            {/* 8 Aggregated Units Cards (Visible to Admin & Default) */}
            {(role === 'admin' || role === 'donor' || role === 'ngo') && (
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
            )}

            {/* Blood Bank Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>Facility-Wise Inventory Across Mumbai Hub</span>
                <span className="text-slate-400 font-normal">8 Licensed Blood Centres</span>
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

        {/* VIEW 6: MYSQL DATABASE & BACKEND API VIEW */}
        {activeTab === 'api' && (
          <BackendApiView onToast={showToast} />
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
