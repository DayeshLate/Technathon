import React from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import {
  Heart,
  Activity,
  ShieldAlert,
  Zap,
  Radio,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Building2,
  Layers,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function LandingPage({ onOpenCreateModal, setCurrentView }) {
  const { setRole, executeDemoStep } = useRedRelay();

  const handleStartDemo = () => {
    executeDemoStep(1);
    setCurrentView('dashboard');
  };

  const pillars = [
    {
      title: 'Real-Time Coordination',
      desc: 'Seamlessly unites 10+ hospitals, 8 apex blood banks and regional NGOs into a synchronized lifesaving grid.',
      icon: Radio,
      color: 'from-red-500 to-rose-600',
      badge: '< 8 min response'
    },
    {
      title: 'AI Smart Matching',
      desc: 'Multivariate algorithm weighs ABO/Rh compatibility, live distance, donor cooldown and clinical priority scores.',
      icon: Sparkles,
      color: 'from-blue-500 to-indigo-600',
      badge: '98% accuracy'
    },
    {
      title: 'Predictive Intelligence',
      desc: '7-day demand forecasting and statistical anomaly detection anticipate blood shortages before crisis strikes.',
      icon: Activity,
      color: 'from-purple-500 to-violet-600',
      badge: 'Proactive Alert'
    },
    {
      title: 'Fraud & Duplicate Shield',
      desc: 'Automated lexical & clinical pattern analysis flags duplicate or suspicious hospital entries to prevent hoarding.',
      icon: ShieldAlert,
      color: 'from-amber-500 to-orange-600',
      badge: 'Duplicate Guard'
    }
  ];

  const steps = [
    { num: '01', title: 'Request', desc: 'Hospital logs clinical emergency with blood group, pint requirements and countdown window.', icon: Building2 },
    { num: '02', title: 'Match', desc: 'Algorithm cross-examines 50+ local donors and 8 blood bank reserves within radius.', icon: Sparkles },
    { num: '03', title: 'Alert', desc: 'Automated high-priority notifications dispatch to closest verified, eligible donors.', icon: Radio },
    { num: '04', title: 'Fulfill', desc: 'Blood bank reserves transit stock while committed donors arrive via GPS relay.', icon: CheckCircle2 },
    { num: '05', title: 'Learn', desc: 'Demand models update real-time citywide inventory levels to optimize emergency buffers.', icon: Activity }
  ];

  return (
    <div className=space-y-16 pb-16>
      
      {/* Hero Section */}
      <section className=relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20 bg-gradient-to-b from-red-50/50 via-white to-slate-50 rounded-3xl border border-red-100/60 shadow-xs>
        <div className=absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-red-200/30 rounded-full blur-3xl pointer-events-none></div>
        <div className=absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none></div>

        <div className=relative max-w-5xl mx-auto px-4 sm:px-6 text-center>
          
          {/* Badge */}
          <div className=inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100/80 border border-red-200 text-red-700 text-xs font-semibold mb-6 shadow-xs>
            <span className=w-2 h-2 rounded-full bg-red-600 animate-ping></span>
            <span>Intelligent Digital Blood Relay Network • Mumbai Hub</span>
          </div>

          {/* Title */}
          <h1 className=text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight font-display>
            RED <span className=text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-red-700>RELAY</span>
          </h1>
          <p className=mt-2 text-xl sm:text-2xl font-bold text-slate-700>
            Connect. Coordinate. Save.
          </p>

          {/* Subtitle */}
          <p className=mt-5 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed>
            An intelligent blood coordination platform that breaks institutional silos between hospitals, blood banks, donors, and NGOs to eliminate critical shortages during life-or-death emergencies.
          </p>

          {/* CTAs */}
          <div className=mt-8 flex flex-wrap items-center justify-center gap-3.5>
            <button
              onClick={onOpenCreateModal}
              className=px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-sm shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] flex items-center gap-2
            >
              <span>+ Request Blood Immediately</span>
              <ArrowRight className=w-4 h-4 />
            </button>

            <button
              onClick={() => {
                setRole('donor');
                setCurrentView('donor_dashboard');
              }}
              className=px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200 shadow-xs transition-all flex items-center gap-2
            >
              <Heart className=w-4 h-4 text-rose-500 fill-rose-500 />
              <span>Become a Donor</span>
            </button>

            <button
              onClick={() => setCurrentView('map')}
              className=px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2
            >
              <MapPin className=w-4 h-4 text-emerald-400 />
              <span>View Live Mumbai Map</span>
            </button>

            <button
              onClick={handleStartDemo}
              className=px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center gap-2
            >
              <Zap className=w-4 h-4 fill-slate-950 />
              <span>Launch 1-Click Hackathon Demo</span>
            </button>
          </div>

          {/* Metrics Ribbon */}
          <div className=mt-12 pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left>
            <div className=p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs>
              <p className=text-2xl font-extrabold text-slate-900 font-display>10 Apex</p>
              <p className=text-xs font-medium text-slate-500 mt-0.5>Mumbai Trauma Hospitals</p>
            </div>
            <div className=p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs>
              <p className=text-2xl font-extrabold text-red-600 font-display>8 Banks</p>
              <p className=text-xs font-medium text-slate-500 mt-0.5>Real-time Stock Synchronization</p>
            </div>
            <div className=p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs>
              <p className=text-2xl font-extrabold text-slate-900 font-display>52 Ready</p>
              <p className=text-xs font-medium text-slate-500 mt-0.5>GPS Geofenced Donors</p>
            </div>
            <div className=p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs>
              <p className=text-2xl font-extrabold text-emerald-600 font-display>8 min</p>
              <p className=text-xs font-medium text-slate-500 mt-0.5>Average Response Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Technology Pillars */}
      <section className=space-y-6>
        <div className=text-center max-w-2xl mx-auto>
          <span className=text-xs font-bold uppercase tracking-wider text-red-600>
            System Pillars
          </span>
          <h2 className=text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-display>
            Built for High-Stakes Emergency Healthcare
          </h2>
          <p className=text-xs sm:text-sm text-slate-500 mt-2>
            Every second counts when trauma patients require rare blood types. Red Relay eliminates manual phone trees with automated geospatial dispatch.
          </p>
        </div>

        <div className=grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5>
          {pillars.map((p, i) => (
            <div
              key={i}
              className=bg-white rounded-3xl p-6 border border-slate-200 hover:border-red-200 shadow-xs hover:shadow-md transition-all group
            >
              <div className=flex items-center justify-between mb-4>
                <div className={w-12 h-12 rounded-2xl bg-gradient-to-tr  text-white flex items-center justify-center shadow-md}>
                  <p.icon className=w-6 h-6 />
                </div>
                <span className=px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 group-hover:bg-red-50 group-hover:text-red-700 transition-colors>
                  {p.badge}
                </span>
              </div>
              <h3 className=text-base font-bold text-slate-900 mb-2>
                {p.title}
              </h3>
              <p className=text-xs text-slate-600 leading-relaxed>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How Red Relay Works (1 to 5) */}
      <section className=bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden>
        <div className=relative z-10 max-w-4xl mx-auto text-center mb-12>
          <span className=text-xs font-bold uppercase tracking-wider text-red-400>
            Lifecycle Architecture
          </span>
          <h2 className=text-2xl sm:text-3xl font-bold mt-1 text-white font-display>
            How Red Relay Coordinates Under 8 Minutes
          </h2>
          <p className=text-xs sm:text-sm text-slate-400 mt-2>
            From initial hospital trauma admission to verified donor arrival and post-incident inventory rebalancing.
          </p>
        </div>

        <div className=grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10>
          {steps.map((s, idx) => (
            <div
              key={s.num}
              className=bg-slate-800/80 backdrop-blur-xs border border-slate-700 rounded-2xl p-5 relative hover:border-red-500/60 transition-all flex flex-col justify-between
            >
              <div>
                <div className=flex items-center justify-between text-slate-400 mb-3>
                  <span className=text-xs font-mono font-bold text-red-400>{s.num}</span>
                  <s.icon className=w-4 h-4 text-slate-300 />
                </div>
                <h4 className=text-sm font-bold text-slate-100 mb-1.5>{s.title}</h4>
                <p className=text-xs text-slate-400 leading-relaxed>{s.desc}</p>
              </div>
              <div className=mt-4 pt-3 border-t border-slate-700/60 text-[10px] text-slate-500 font-mono>
                Phase {idx + 1} Protocol
              </div>
            </div>
          ))}
        </div>

        <div className=mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10>
          <p className=text-xs text-slate-400>
            Demonstration covers real Mumbai locations: Bandra, Dadar, Parel, Andheri, Kurla, Powai and Thane.
          </p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className=px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors
          >
            <span>Enter Operational Dashboard</span>
            <ChevronRight className=w-4 h-4 />
          </button>
        </div>
      </section>

    </div>
  );
}
