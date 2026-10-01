import React, { useState } from 'react';
import {
  Users,
  Megaphone,
  HeartHandshake,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Send,
  Plus,
  CheckCircle2,
  Sparkles,
  Calendar
} from 'lucide-react';
import api from '../services/api';

export default function NgoDashboard({
  ngos = [],
  onNavigateTab,
  onToast
}) {
  const [selectedNgoId, setSelectedNgoId] = useState('NGO-1');
  const [mobilizedCount, setMobilizedCount] = useState({});

  const currentNgo = ngos.find((n) => n.id === selectedNgoId) || ngos[0] || {
    id: 'NGO-1',
    name: 'Think Foundation Mumbai',
    area: 'Bandra / Dadar',
    contact: '+91 22 2444 8899',
    description: 'Autonomous Community Blood Mobilization Network'
  };

  const [campaigns, setCampaigns] = useState([
    {
      id: 'CAMP-1',
      title: 'URGENT O- DONATION DRIVE',
      location: 'Mumbai Central & Dadar',
      bloodGroup: 'O-',
      urgency: 'Critical',
      required: 15,
      current: 9,
      organizer: 'Think Foundation Blood Mission'
    },
    {
      id: 'CAMP-2',
      title: 'THALASSEMIA REPEAT DONOR SPRINT',
      location: 'KEM & Sion Corridor',
      bloodGroup: 'B+',
      urgency: 'High',
      required: 40,
      current: 32,
      organizer: 'Mumbai Youth Red Cross'
    },
    {
      id: 'CAMP-3',
      title: 'WESTERN EXPRESSWAY TRAUMA STANDBY',
      location: 'Andheri & Borivali Hubs',
      bloodGroup: 'All Types',
      urgency: 'Normal',
      required: 50,
      current: 28,
      organizer: 'Lions Club Coordination Cell'
    }
  ]);

  const handleMobilize = (campId) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campId ? { ...c, current: Math.min(c.required, c.current + 2) } : c))
    );
    setMobilizedCount((prev) => ({ ...prev, [campId]: (prev[campId] || 0) + 2 }));
    if (onToast) onToast('Emergency WhatsApp & SMS blast dispatched! +2 volunteers mobilized.', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* NGO Banner Header */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-800 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider">
              Community Volunteer Network
            </span>
            <span className="px-2.5 py-0.5 bg-amber-300 text-amber-950 rounded-full text-[10px] font-bold">
              Non-Profit Partner
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {currentNgo.name}
          </h1>

          <p className="text-xs sm:text-sm text-amber-100 flex flex-wrap items-center gap-2.5 font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-300" /> {currentNgo.area}, Mumbai
            </span>
            <span>•</span>
            <span>Contact: {currentNgo.contact}</span>
            <span>•</span>
            <span className="text-emerald-300 font-bold">Active Volunteer Cell</span>
          </p>
        </div>

        <button
          onClick={() => {
            if (onToast) onToast('Dispatched citywide blood drive announcement!', 'success');
          }}
          className="px-5 py-3 bg-white text-slate-900 hover:bg-amber-50 rounded-2xl font-bold text-xs shadow-md transition-all self-start sm:self-auto flex items-center gap-2"
        >
          <Megaphone className="w-4 h-4 text-amber-600" />
          <span>Launch Community Drive</span>
        </button>
      </div>

      {/* 4 NGO KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Volunteers</span>
          <p className="text-3xl font-black text-slate-900 mt-2">184</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">Registered in Mumbai</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Drives Conducted</span>
          <p className="text-3xl font-black text-amber-600 mt-2">24</p>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">This quarter</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pints Mobilized</span>
          <p className="text-3xl font-black text-red-600 mt-2">642</p>
          <span className="text-[11px] text-red-600 font-semibold mt-1 inline-block">Direct to Blood Banks</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Scheduled Camps</span>
          <p className="text-3xl font-black text-purple-600 mt-2">3</p>
          <span className="text-[11px] text-purple-700 font-semibold mt-1 inline-block">Upcoming this month</span>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          Active NGO Volunteer Mobilization Drives
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {campaigns.map((camp) => (
            <div key={camp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-200 text-slate-700">
                    {camp.id}
                  </span>
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-red-100 text-red-700">
                    {camp.bloodGroup} Target
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">{camp.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1">{camp.location}</p>

                <div className="my-3">
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-500">Mobilized Progress</span>
                    <span className="text-amber-700">{camp.current} / {camp.required} Pints</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (camp.current / camp.required) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleMobilize(camp.id)}
                className="mt-2 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                📢 Broadcast WhatsApp Alert (+2)
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
