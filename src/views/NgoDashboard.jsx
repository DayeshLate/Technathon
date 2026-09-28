import React, { useState } from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import { mockData } from '../data/mockData';
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
  Sparkles
} from 'lucide-react';

export default function NgoDashboard({ setCurrentView }) {
  const { ngos, showToast } = useRedRelay();

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
    showToast(Emergency broadcast sent to local WhatsApp & SMS donor rings! 2 more donors mobilized., 'success');
  };

  return (
    <div className=space-y-6 pb-16>
      
      {/* Header */}
      <div className=bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6>
        <div className=space-y-2>
          <div className=flex items-center gap-2>
            <span className=px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider>
              Community Mobilization Headquarters
            </span>
          </div>
          <h1 className=text-2xl sm:text-3xl font-extrabold font-display>
            NGO & Community Rapid Relay Network
          </h1>
          <p className=text-xs sm:text-sm text-amber-100>
            Empowering grassroots organizations to rapidly mobilize neighborhood donors during hospital red-alerts.
          </p>
        </div>

        <button
          onClick={() => {
            showToast('New regional emergency campaign created across South Mumbai.', 'success');
          }}
          className=px-5 py-3 bg-white text-orange-950 font-bold text-xs rounded-xl shadow-md hover:bg-amber-50 transition-all self-start sm:self-auto flex items-center gap-1.5
        >
          <Plus className=w-4 h-4 />
          <span>Launch Emergency Campaign</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className=grid grid-cols-2 sm:grid-cols-4 gap-4>
        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Active Emergencies</span>
          <p className=text-3xl font-black text-red-600 font-display mt-2>12</p>
          <p className=text-[11px] text-slate-500 mt-1>Requiring donor mobilization</p>
        </div>

        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Donors Mobilized</span>
          <p className=text-3xl font-black text-slate-900 font-display mt-2>1,420</p>
          <p className=text-[11px] text-emerald-600 font-semibold mt-1>This month across Mumbai</p>
        </div>

        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Live Campaigns</span>
          <p className=text-3xl font-black text-amber-600 font-display mt-2>5</p>
          <p className=text-[11px] text-slate-500 mt-1>Coordinated drives</p>
        </div>

        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Regions Covered</span>
          <p className=text-3xl font-black text-slate-900 font-display mt-2>8</p>
          <p className=text-[11px] text-slate-500 mt-1>Greater Mumbai zones</p>
        </div>
      </div>

      {/* Active Emergency Campaigns */}
      <div className=space-y-4>
        <div className=flex items-center justify-between>
          <h3 className=text-base font-bold text-slate-900>
            Active Community Donation Drives
          </h3>
          <span className=text-xs text-slate-500>Directly synchronized with hospital ICU alerts</span>
        </div>

        <div className=grid grid-cols-1 md:grid-cols-3 gap-5>
          {campaigns.map((camp) => {
            const percent = Math.round((camp.current / camp.required) * 100);
            return (
              <div
                key={camp.id}
                className=bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between
              >
                <div>
                  <div className=flex items-start justify-between gap-2 mb-3>
                    <span className=px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700>
                      {camp.urgency} DRIVE
                    </span>
                    <span className=px-2 py-0.5 rounded font-black text-xs bg-slate-900 text-white>
                      {camp.bloodGroup}
                    </span>
                  </div>

                  <h4 className=font-extrabold text-slate-900 text-base mb-1>
                    {camp.title}
                  </h4>
                  <p className=text-xs text-slate-500 flex items-center gap-1 mb-3>
                    <MapPin className=w-3.5 h-3.5 text-slate-400 />
                    <span>{camp.location}</span>
                  </p>

                  <div className=bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2 text-xs>
                    <div className=flex justify-between font-semibold>
                      <span className=text-slate-600>Donors Pledged:</span>
                      <span className=text-slate-900 font-bold>
                        {camp.current} / {camp.required} donors
                      </span>
                    </div>
                    <div className=w-full h-2.5 rounded-full bg-slate-200 overflow-hidden>
                      <div
                        className=h-full rounded-full bg-gradient-to-r from-amber-500 to-red-600
                        style={{ width: ${percent}% }}
                      />
                    </div>
                    <div className=flex justify-between text-[11px] text-slate-400>
                      <span>Progress</span>
                      <span className=font-bold text-slate-700>{percent}%</span>
                    </div>
                  </div>
                </div>

                <div className=mt-5 pt-4 border-t border-slate-100>
                  <button
                    onClick={() => handleMobilize(camp.id)}
                    className=w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5
                  >
                    <Megaphone className=w-4 h-4 />
                    <span>Mobilize Community Donors</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
