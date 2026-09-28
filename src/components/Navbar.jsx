import React, { useState } from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import {
  Activity,
  Bell,
  CheckCircle,
  AlertTriangle,
  Heart,
  PlusCircle,
  Play,
  Layers,
  ChevronDown,
  Building2,
  UserCheck,
  ShieldAlert,
  Users
} from 'lucide-react';

export default function Navbar({ onOpenCreateModal, currentView, setCurrentView }) {
  const {
    role,
    setRole,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedRequestId,
    demoStepIndex
  } = useRedRelay();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roles = [
    { id: 'hospital', label: 'Hospital Coordinator', sub: 'Lilavati Hospital', icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { id: 'blood_bank', label: 'Blood Bank Officer', sub: 'Rotary Blood Bank', icon: Layers, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'donor', label: 'Volunteer Donor', sub: 'Neha Patil (O-)', icon: Heart, color: 'text-rose-600 bg-rose-50' },
    { id: 'ngo', label: 'NGO / Community', sub: 'Think Foundation', icon: Users, color: 'text-amber-600 bg-amber-50' },
    { id: 'admin', label: 'System Admin', sub: 'Command Center', icon: ShieldAlert, color: 'text-purple-600 bg-purple-50' }
  ];

  const currentRoleObj = roles.find((r) => r.id === role) || roles[0];

  return (
    <header className=sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs>
      <div className=max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4>
        {/* Logo and Tagline */}
        <div className=flex items-center gap-3 cursor-pointer onClick={() => setCurrentView('landing')}>
          <div className=relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-md shadow-red-500/20>
            {/* Blood drop with network ring */}
            <svg className=w-6 h-6 viewBox=0 0 24 24 fill=currentColor>
              <path d=M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z />
            </svg>
            <span className=absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full></span>
          </div>
          <div>
            <div className=flex items-center gap-1.5>
              <span className=font-extrabold text-xl tracking-tight text-slate-900 font-display>
                RED<span className=text-red-600>RELAY</span>
              </span>
              <span className=px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded-md uppercase tracking-wider>
                Live Prototype
              </span>
            </div>
            <p className=text-[11px] font-medium text-slate-500 hidden sm:block>
              Connect. Coordinate. Save.
            </p>
          </div>
        </div>

        {/* Center Quick Navigation */}
        <nav className=hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-medium>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={px-3 py-1.5 rounded-lg transition-all }
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('details')}
            className={px-3 py-1.5 rounded-lg transition-all }
          >
            Live Tracking
          </button>
          <button
            onClick={() => setCurrentView('matching')}
            className={px-3 py-1.5 rounded-lg transition-all }
          >
            Smart Matching
          </button>
          <button
            onClick={() => setCurrentView('inventory')}
            className={px-3 py-1.5 rounded-lg transition-all }
          >
            Inventory
          </button>
          <button
            onClick={() => setCurrentView('map')}
            className={px-3 py-1.5 rounded-lg transition-all }
          >
            Live Map
          </button>
          <button
            onClick={() => setCurrentView('ai')}
            className={px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 }
          >
            <span>AI Intel</span>
            <span className=w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping></span>
          </button>
        </nav>

        {/* Right Action Cluster */}
        <div className=flex items-center gap-3>
          {/* Create Emergency Request Button */}
          <button
            onClick={onOpenCreateModal}
            className=flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-red-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]
          >
            <PlusCircle className=w-4 h-4 />
            <span className=hidden sm:inline>+ Create</span> Emergency Request
          </button>

          {/* Notifications Dropdown */}
          <div className=relative>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className=relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors
              title=Notifications
            >
              <Bell className=w-5 h-5 />
              {unreadCount > 0 && (
                <span className=absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs animate-pulse>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className=absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-3 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150>
                <div className=flex items-center justify-between pb-2 border-b border-slate-100 px-1>
                  <div className=flex items-center gap-2>
                    <h3 className=font-semibold text-slate-800 text-sm>Notifications</h3>
                    <span className=px-1.5 py-0.5 text-[10px] bg-red-50 text-red-600 font-semibold rounded-full>
                      {unreadCount} unread
                    </span>
                  </div>
                  <button
                    onClick={markAllNotificationsRead}
                    className=text-xs text-red-600 hover:text-red-700 font-medium
                  >
                    Mark all read
                  </button>
                </div>

                <div className=max-h-72 overflow-y-auto space-y-1.5 py-2>
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        if (notif.requestId) {
                          setSelectedRequestId(notif.requestId);
                          setCurrentView('details');
                        }
                        setShowNotifications(false);
                      }}
                      className={p-2.5 rounded-xl transition-all cursor-pointer text-left border }
                    >
                      <div className=flex items-start justify-between gap-2>
                        <span className=text-xs font-semibold text-slate-800>
                          {notif.title}
                        </span>
                        <span className=text-[10px] text-slate-400 shrink-0>
                          {notif.time}
                        </span>
                      </div>
                      <p className=text-xs text-slate-600 mt-1 line-clamp-2>
                        {notif.message}
                      </p>
                      {notif.requestId && (
                        <span className=inline-block mt-1 text-[10px] font-mono text-red-600 bg-white px-1.5 py-0.5 rounded border border-red-200>
                          {notif.requestId}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher Pill */}
          <div className=relative>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className=flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-medium text-slate-700
            >
              <div className={p-1 rounded-lg }>
                <currentRoleObj.icon className=w-3.5 h-3.5 />
              </div>
              <div className=text-left hidden lg:block>
                <p className=text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none>
                  Active Role
                </p>
                <p className=text-xs font-semibold text-slate-800 leading-tight>
                  {currentRoleObj.label}
                </p>
              </div>
              <ChevronDown className=w-3.5 h-3.5 text-slate-400 />
            </button>

            {showRoleMenu && (
              <div className=absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150>
                <div className=px-2 py-1.5 border-b border-slate-100 mb-1>
                  <p className=text-[11px] font-bold uppercase tracking-wider text-slate-400>
                    Switch Demo Persona
                  </p>
                </div>
                <div className=space-y-1>
                  {roles.map((r) => {
                    const isSelected = r.id === role;
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          setRole(r.id);
                          setShowRoleMenu(false);
                        }}
                        className={w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all }
                      >
                        <div className={p-1.5 rounded-lg }>
                          <r.icon className=w-4 h-4 />
                        </div>
                        <div className=flex-1>
                          <p className=text-xs font-medium>{r.label}</p>
                          <p className=text-[10px] text-slate-400>{r.sub}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle className=w-4 h-4 text-red-600 />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
