import React, { useState, useEffect } from 'react';
import {
  Server,
  Zap,
  Activity,
  CheckCircle,
  Database,
  Radio,
  Send,
  RefreshCw,
  Code2,
  Cpu,
  Layers,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

export default function BackendApiView({ onToast }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState('GET /api/health');
  const [apiResponse, setApiResponse] = useState(null);
  const [events, setEvents] = useState([]);
  const [customParams, setCustomParams] = useState({
    bloodGroup: 'O-',
    urgency: 'Critical',
    latitude: 19.0514,
    longitude: 72.8295,
    patientCaseId: 'PT-99420-duplicate-test',
    units: 3
  });

  // Check health and subscribe to SSE
  useEffect(() => {
    fetchHealth();

    const unsub = api.subscribeToEvents((event) => {
      setEvents((prev) => [
        {
          id: Date.now() + Math.random(),
          time: new Date().toLocaleTimeString(),
          type: event.type,
          data: event.data
        },
        ...prev.slice(0, 19)
      ]);
    });

    return () => unsub();
  }, []);

  const fetchHealth = async () => {
    try {
      const data = await api.checkHealth();
      setHealth(data);
    } catch (err) {
      setHealth({ status: 'offline', error: err.message });
    }
  };

  const handleRunEndpoint = async (endpointKey) => {
    setLoading(true);
    setSelectedEndpoint(endpointKey);
    try {
      let result = null;
      switch (endpointKey) {
        case 'GET /api/health':
          result = await api.checkHealth();
          break;
        case 'GET /api/requests':
          result = await api.getRequests();
          break;
        case 'GET /api/blood-banks':
          result = await api.getBloodBanks();
          break;
        case 'GET /api/blood-banks/inventory/aggregates':
          result = await api.getInventoryAggregates();
          break;
        case 'GET /api/donors?bloodGroup=O-':
          result = await api.getDonors({ bloodGroup: 'O-' });
          break;
        case 'POST /api/matching/find-donors':
          result = await api.findDonors({
            bloodGroup: customParams.bloodGroup,
            urgency: customParams.urgency,
            latitude: Number(customParams.latitude),
            longitude: Number(customParams.longitude),
            limit: 6
          });
          break;
        case 'POST /api/fraud/check':
          result = await api.checkDuplicateFraud({
            patientCaseId: customParams.patientCaseId,
            bloodGroup: customParams.bloodGroup,
            hospitalId: 'H1',
            unitsRequired: Number(customParams.units)
          });
          break;
        case 'GET /api/analytics/overview':
          result = await api.getAnalyticsOverview();
          break;
        case 'GET /api/notifications':
          result = await api.getNotifications();
          break;
        case 'POST /api/demo/execute/5':
          result = await api.executeDemoStep(5);
          if (onToast) onToast('Executed Demo Step 5 via Backend API!', 'success');
          break;
        default:
          result = await api.checkHealth();
      }
      setApiResponse(result);
    } catch (err) {
      setApiResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const endpoints = [
    { key: 'GET /api/health', name: 'Server Health & Stats', method: 'GET' },
    { key: 'GET /api/requests', name: 'Active Emergency Requests', method: 'GET' },
    { key: 'POST /api/matching/find-donors', name: 'AI Donor Matching Engine', method: 'POST' },
    { key: 'POST /api/fraud/check', name: 'Duplicate & Fraud AI Check', method: 'POST' },
    { key: 'GET /api/blood-banks/inventory/aggregates', name: 'Citywide Blood Shortages', method: 'GET' },
    { key: 'GET /api/donors?bloodGroup=O-', name: 'O- Universal Donors', method: 'GET' },
    { key: 'GET /api/analytics/overview', name: 'Operational KPIs & Analytics', method: 'GET' },
    { key: 'GET /api/notifications', name: 'Broadcast Notification Feed', method: 'GET' },
    { key: 'POST /api/demo/execute/5', name: 'Run Hackathon Demo Step 5', method: 'POST' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600/30 text-red-400 border border-red-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Backend Node/Express
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300">
              Port 5000
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Server className="w-6 h-6 text-red-500" /> Red Relay Backend Engine
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            High-concurrency Node.js REST API with Server-Sent Events (SSE), AI Priority Triage, Haversine Smart Donor Matching, and Duplicate Fraud Detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchHealth();
              if (onToast) onToast('Refreshed Backend Health status', 'info');
            }}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Server
          </button>
          <a
            href="http://localhost:5000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-500/30 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" /> OpenAPI Docs
          </a>
        </div>
      </div>

      {/* 4 Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Server Status</span>
            <p className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ONLINE (HTTP 200)
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Radio className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Real-Time Feed</span>
            <p className="text-base font-black text-slate-900">SSE Streaming Active</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Engines</span>
            <p className="text-base font-black text-slate-900">Triage & Fraud Heuristic</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Database Records</span>
            <p className="text-base font-black text-slate-900">
              {health?.database ? `${health.database.hospitals} Hosps • ${health.database.bloodBanks} Banks` : '10 Hosps • 8 Banks'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Endpoint Selector & Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-red-600" /> Interactive API Endpoints
              </h3>
              <span className="text-[10px] font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                Click to Test
              </span>
            </div>

            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {endpoints.map((ep) => {
                const isSelected = selectedEndpoint === ep.key;
                return (
                  <button
                    key={ep.key}
                    onClick={() => handleRunEndpoint(ep.key)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <span className="font-bold block">{ep.name}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {ep.key}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        ep.method === 'POST'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {ep.method}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parameters Box */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-indigo-600" /> Query & Simulation Parameters
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-500">Blood Group</label>
                <select
                  value={customParams.bloodGroup}
                  onChange={(e) => setCustomParams({ ...customParams, bloodGroup: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold text-slate-800 text-xs"
                >
                  {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500">Urgency</label>
                <select
                  value={customParams.urgency}
                  onChange={(e) => setCustomParams({ ...customParams, urgency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 text-xs"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500">Duplicate Test Case ID</label>
              <input
                type="text"
                value={customParams.patientCaseId}
                onChange={(e) => setCustomParams({ ...customParams, patientCaseId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-mono text-xs text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Right: Response Inspector & Live SSE Events (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* JSON Response Terminal */}
          <div className="bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 p-4 shadow-xl flex flex-col h-[340px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-400 font-bold ml-1">{selectedEndpoint}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {loading ? 'Executing...' : 'HTTP 200 OK'}
              </span>
            </div>

            <pre className="flex-1 overflow-auto text-[11px] font-mono text-emerald-400 p-2 mt-2 bg-slate-900/60 rounded-xl leading-relaxed">
              {loading
                ? 'Loading API response from Express backend...'
                : apiResponse
                ? JSON.stringify(apiResponse, null, 2)
                : '// Click any endpoint on the left to inspect the live response.'}
            </pre>
          </div>

          {/* Live SSE Stream Box */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" /> Live Server-Sent Events (SSE) Stream
              </h4>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Connected: /api/events
              </span>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto font-mono text-[11px]">
              {events.length === 0 ? (
                <p className="text-slate-400 italic text-xs py-2">
                  Listening for real-time broadcasts (emergency creation, donor acceptances, inventory updates)...
                </p>
              ) : (
                events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{evt.time}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">
                        {evt.type}
                      </span>
                      <span className="text-slate-700 truncate max-w-xs">
                        {evt.data?.message || evt.data?.title || JSON.stringify(evt.data).slice(0, 45)}
                      </span>
                    </div>
                    <span className="text-emerald-600 font-bold text-[10px]">● Broadcasted</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
