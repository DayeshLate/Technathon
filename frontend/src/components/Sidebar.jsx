import React from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import {
  LayoutDashboard,
  AlertCircle,
  GitMerge,
  Droplet,
  MapPin,
  HeartHandshake,
  BrainCircuit,
  BarChart3,
  Building,
  Users,
  Radio,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView }) {
  const { role, requests } = useRedRelay();

  const activeEmergencyCount = requests.filter(
    (r) => r.status !== 'FULFILLED' && r.status !== 'CANCELLED'
  ).length;

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'details', label: 'Emergency Tracker', icon: AlertCircle, badge: activeEmergencyCount > 0 ? ${activeEmergencyCount} Live : null, badgeColor: 'bg-red-500 text-white animate-pulse' },
    { id: 'matching', label: 'Smart Matching', icon: GitMerge, badge: 'AI Engine', badgeColor: 'bg-blue-100 text-blue-700' },
    { id: 'inventory', label: 'Blood Inventory', icon: Droplet, badge: null },
    { id: 'map', label: 'Live Geo-Intelligence', icon: MapPin, badge: 'Mumbai', badgeColor: 'bg-emerald-100 text-emerald-700' },
    { id: 'donor_dashboard', label: 'Donor Network', icon: HeartHandshake, badge: role === 'donor' ? 'Active' : null, badgeColor: 'bg-rose-100 text-rose-700' },
    { id: 'bank_dashboard', label: 'Blood Bank Hub', icon: Building, badge: role === 'blood_bank' ? 'Active' : null, badgeColor: 'bg-teal-100 text-teal-700' },
    { id: 'ngo_dashboard', label: 'NGO Mobilization', icon: Users, badge: null },
    { id: 'ai', label: 'AI & Fraud Intel', icon: BrainCircuit, badge: 'Smart', badgeColor: 'bg-purple-100 text-purple-700' },
    { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3, badge: null },
  ];

  return (
    <aside className=w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between shrink-0 hidden lg:flex>
      <div className=p-4 space-y-6>
        {/* Network Status Ticker */}
        <div className=p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm>
          <div className=flex items-center justify-between text-xs mb-1>
            <span className=text-slate-400 font-medium>Relay Mesh Status</span>
            <span className=flex items-center gap-1.5 text-emerald-400 font-semibold>
              <span className=w-2 h-2 rounded-full bg-emerald-400 animate-ping></span>
              Synchronized
            </span>
          </div>
          <p className=text-sm font-bold text-slate-100>
            Mumbai Central Mesh
          </p>
          <div className=mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-300>
            <span className=flex items-center gap-1>
              <Clock className=w-3 h-3 text-red-400 /> Avg 8m response
            </span>
            <span className=flex items-center gap-1 text-emerald-300>
              <ShieldCheck className=w-3 h-3 /> 10 Apex Nodes
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className=space-y-1>
          <p className=px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2>
            Main Operations
          </p>
          {navigationItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all }
              >
                <div className=flex items-center gap-3>
                  <item.icon
                    className={w-4 h-4 }
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={px-2 py-0.5 text-[10px] font-bold rounded-full }
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Emergency Hotline */}
      <div className=p-4 border-t border-slate-100>
        <div className=p-3 rounded-xl bg-red-50 border border-red-100 text-slate-800>
          <div className=flex items-center gap-2 mb-1>
            <Radio className=w-4 h-4 text-red-600 animate-pulse />
            <span className=text-xs font-bold text-red-700>24/7 Red Relay Hotline</span>
          </div>
          <p className=text-[11px] text-slate-600>
            Civic Emergency: <strong className=text-slate-900>1800-RED-RELAY</strong>
          </p>
          <p className=text-[10px] text-slate-400 mt-1>
            Mumbai Multi-Sector Protocol
          </p>
        </div>
      </div>
    </aside>
  );
}
