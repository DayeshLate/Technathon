import React from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  GitMerge,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  Search
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function AiIntelligenceView({ setCurrentView }) {
  const { aiInsights, setSelectedRequestId } = useRedRelay();

  return (
    <div className=space-y-6 pb-16>
      
      {/* Header with Disclaimer */}
      <div className=bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6>
        <div className=space-y-2>
          <div className=flex items-center gap-2>
            <span className=px-3 py-1 bg-purple-500/30 border border-purple-400/40 rounded-full text-xs font-bold uppercase tracking-wider text-purple-200>
              Computational Intelligence & Diagnostics
            </span>
            <span className=px-2.5 py-0.5 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black uppercase>
              Prototype AI Simulation
            </span>
          </div>
          <h1 className=text-2xl sm:text-3xl font-extrabold font-display>
            AI Demand & Fraud Prevention Center
          </h1>
          <p className=text-xs sm:text-sm text-purple-200 max-w-2xl>
            Simulated heuristic models analyzing real-time hospital admission trends, duplicate clinical submissions, and rare blood group supply depletion curves.
          </p>
        </div>

        <div className=p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs text-purple-100 max-w-xs self-start sm:self-auto>
          <p className=font-semibold text-white flex items-center gap-1.5 mb-1>
            <Info className=w-4 h-4 text-purple-300 />
            Hackathon Notice
          </p>
          <p className=text-[11px] leading-relaxed opacity-90>
            Simulated calculations for demonstration. Not clinically or medically validated for independent triage.
          </p>
        </div>
      </div>

      {/* Module 1: Demand Forecasting (Line Chart) */}
      <div className=bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4>
        <div className=flex flex-col sm:flex-row sm:items-center justify-between gap-2>
          <div>
            <div className=flex items-center gap-2>
              <span className=px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold>
                Module 01
              </span>
              <h3 className=text-base font-bold text-slate-900>
                Predictive Blood Requirement Forecasting (7-Day Projection)
              </h3>
            </div>
            <p className=text-xs text-slate-500 mt-1>
              Time-series projection combining scheduled elective surgeries, historical trauma rates, and seasonal Dengue/platelet demand.
            </p>
          </div>

          <div className=px-3.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1.5>
            <TrendingUp className=w-4 h-4 text-red-600 />
            <span>O- Demand surge: +24% predicted</span>
          </div>
        </div>

        {/* Prediction Callout Banner */}
        <div className=p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 flex items-center gap-3>
          <Sparkles className=w-5 h-5 text-purple-600 shrink-0 />
          <p className=leading-relaxed>
            <strong>Key AI Projection:</strong> {aiInsights.keyPrediction} Recommendation: Pre-emptively dispatch mobile donation vans to Dadar and Bandra nodes.
          </p>
        </div>

        <div className=h-72 w-full pt-2>
          <ResponsiveContainer width=100% height=100%>
            <LineChart data={aiInsights.demandForecasting}>
              <CartesianGrid strokeDasharray=3 3 vertical={false} stroke=#f1f5f9 />
              <XAxis dataKey=day tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type=monotone dataKey=demandO_Neg stroke=#dc2626 strokeWidth={3} name=O- Predicted Units dot={{ r: 4 }} activeDot={{ r: 7 }} />
              <Line type=monotone dataKey=demandO_Pos stroke=#3b82f6 strokeWidth={2} name=O+ Predicted Units dot={{ r: 3 }} />
              <Line type=monotone dataKey=demandB_Pos stroke=#10b981 strokeWidth={2} name=B+ Predicted Units dot={{ r: 3 }} />
              <Line type=monotone dataKey=avgShortageProb stroke=#f59e0b strokeWidth={2} strokeDasharray=5 5 name=Shortage Probability (%) />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Module 2 (Matching Weights) & Module 3 (Fraud/Duplicate Detection) */}
      <div className=grid grid-cols-1 lg:grid-cols-2 gap-6>
        
        {/* Module 3: Fraud / Duplicate Detection */}
        <div className=bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between>
          <div>
            <div className=flex items-center justify-between mb-3>
              <div className=flex items-center gap-2>
                <span className=px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold>
                  Module 03
                </span>
                <h3 className=text-base font-bold text-slate-900>
                  Fraud & Duplicate Request Guard
                </h3>
              </div>
              <span className=px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200>
                1 Flag Under Review
              </span>
            </div>
            <p className=text-xs text-slate-500 mb-4>
              Identifies overlapping requests from parallel wards or duplicate hospital admissions to avoid blood inventory hoarding.
            </p>

            {/* Duplicate Flag Card */}
            {aiInsights.duplicateAlerts.map((dup) => (
              <div
                key={dup.id}
                className=bg-amber-50/60 rounded-2xl p-4 border border-amber-200 text-xs space-y-2.5
              >
                <div className=flex items-center justify-between>
                  <span className=font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-amber-200>
                    {dup.primaryRequestId}
                  </span>
                  <span className=px-2.5 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px]>
                    SIMILARITY: {dup.similarityScore}%
                  </span>
                </div>

                <p className=font-semibold text-slate-800>
                  Potential duplicate detected for request originating at {dup.hospital}.
                </p>

                <p className=text-slate-600 text-[11px] leading-relaxed>
                  {dup.details}
                </p>

                <div className=pt-2 border-t border-amber-200/80 flex items-center justify-between text-[11px]>
                  <span className=text-slate-400>Flagged: {dup.timestamp}</span>
                  <button
                    onClick={() => {
                      setSelectedRequestId(dup.primaryRequestId);
                      setCurrentView('details');
                    }}
                    className=font-bold text-red-600 hover:text-red-700
                  >
                    Inspect Flagged Case →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className=mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500>
            <ShieldAlert className=w-4 h-4 text-emerald-600 />
            <span>Anti-hoarding algorithm prevented 6 duplicate dispatches this week.</span>
          </div>
        </div>

        {/* Module 4: Anomaly Alerts */}
        <div className=bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between>
          <div>
            <div className=flex items-center justify-between mb-3>
              <div className=flex items-center gap-2>
                <span className=px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold>
                  Module 04
                </span>
                <h3 className=text-base font-bold text-slate-900>
                  Epidemic & Anomaly Spike Detection
                </h3>
              </div>
              <span className=px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700>
                2 Anomalies Active
              </span>
            </div>
            <p className=text-xs text-slate-500 mb-4>
              Real-time statistical outlier detection flagging abnormal spikes in regional blood requirement velocity.
            </p>

            <div className=space-y-3>
              {aiInsights.anomalies.map((anom) => (
                <div
                  key={anom.id}
                  className=p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs space-y-1
                >
                  <div className=flex items-center justify-between>
                    <span className=font-bold text-slate-900 flex items-center gap-1.5>
                      <AlertTriangle className={w-3.5 h-3.5 } />
                      {anom.type}: {anom.region}
                    </span>
                    <span className={px-2 py-0.5 rounded text-[10px] font-bold }>
                      {anom.severity}
                    </span>
                  </div>
                  <p className=text-slate-600 leading-snug>
                    {anom.description}
                  </p>
                  <span className=text-[10px] text-slate-400 block pt-0.5>
                    Detected {anom.detectedAt}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className=mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs>
            <span className=text-slate-500>Autonomous Sentinel Protocol</span>
            <button
              onClick={() => setCurrentView('map')}
              className=text-red-600 hover:text-red-700 font-bold
            >
              Overlay Hotspots on Map →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
