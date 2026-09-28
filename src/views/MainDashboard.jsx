import React, { useState } from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import { mockData } from '../data/mockData';
import {
  Activity,
  AlertTriangle,
  Clock,
  Heart,
  Droplet,
  CheckCircle2,
  TrendingUp,
  MapPin,
  ArrowUpRight,
  Filter,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function MainDashboard({ setCurrentView, onOpenCreateModal }) {
  const {
    role,
    requests,
    setSelectedRequestId,
    getInventoryAggregates,
    donors
  } = useRedRelay();

  const [timeframe, setTimeframe] = useState('7D');

  const inventorySummary = getInventoryAggregates();
  const totalUnits = Object.values(inventorySummary).reduce(
    (acc, curr) => acc + curr.available,
    0
  );

  const activeRequests = requests.filter(
    (r) => r.status !== 'FULFILLED' && r.status !== 'CANCELLED'
  );

  const criticalShortagesCount = Object.entries(inventorySummary).filter(
    ([bg, val]) => val.available < 25
  ).length;

  const availableDonorsCount = donors.filter((d) => d.available).length;

  // Chart data: Blood group inventory distribution
  const inventoryChartData = mockData.bloodGroups.map((bg) => ({
    bloodGroup: bg,
    available: inventorySummary[bg]?.available || 0,
    reserved: inventorySummary[bg]?.reserved || 0,
    isCritical: (inventorySummary[bg]?.available || 0) < 25
  }));

  // Chart data: Trend of requests & response times over last 7 days
  const trendData = [
    { day: 'Mon', requests: 14, fulfilled: 12, responseTime: 9.2 },
    { day: 'Tue', requests: 19, fulfilled: 17, responseTime: 8.5 },
    { day: 'Wed', requests: 16, fulfilled: 15, responseTime: 7.9 },
    { day: 'Thu', requests: 22, fulfilled: 20, responseTime: 8.1 },
    { day: 'Fri', requests: 25, fulfilled: 23, responseTime: 8.8 },
    { day: 'Sat', requests: 28, fulfilled: 26, responseTime: 8.0 },
    { day: 'Sun (Today)', requests: 31, fulfilled: 29, responseTime: 7.8 }
  ];

  // Fulfillment Donut chart
  const fulfillmentData = [
    { name: 'Fulfilled', value: 89, color: '#10b981' },
    { name: 'In Transit / Matching', value: 8, color: '#3b82f6' },
    { name: 'Pending Blood Bank', value: 3, color: '#f59e0b' }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CREATED':
        return <span className=px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700>Created</span>;
      case 'MATCHING':
        return <span className=px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 animate-pulse>Matching Donors</span>;
      case 'DONORS_IDENTIFIED':
        return <span className=px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700>8 Donors Matched</span>;
      case 'BLOOD_BANK_CHECK':
        return <span className=px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700>Bank Checked</span>;
      case 'ALERT_SENT':
        return <span className=px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700>Alerts Dispatched</span>;
      case 'PARTIALLY_FULFILLED':
        return <span className=px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-800>Partially Fulfilled</span>;
      case 'FULFILLED':
        return <span className=px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700>Fulfilled ✓</span>;
      default:
        return <span className=px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700>{status}</span>;
    }
  };

  return (
    <div className=space-y-6 pb-12>
      
      {/* Top Banner & Quick Trigger */}
      <div className=flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs>
        <div>
          <div className=flex items-center gap-2>
            <h1 className=text-xl font-bold text-slate-900 font-display>
              Operational Command Hub
            </h1>
            <span className=px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700>
              Live Network
            </span>
          </div>
          <p className=text-xs text-slate-500 mt-1>
            Real-time telemetry across 10 trauma hospitals and 8 regional blood centres in Mumbai.
          </p>
        </div>

        <div className=flex items-center gap-2.5>
          <button
            onClick={() => setCurrentView('map')}
            className=px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors
          >
            <MapPin className=w-3.5 h-3.5 text-slate-500 />
            <span>Open Map Grid</span>
          </button>
          <button
            onClick={onOpenCreateModal}
            className=px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-semibold shadow-sm shadow-red-500/30 flex items-center gap-1.5 transition-all
          >
            <Plus className=w-4 h-4 />
            <span>+ Create Emergency Request</span>
          </button>
        </div>
      </div>

      {/* Critical Shortage Warning Banner */}
      <div className=p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-rose-500/10 to-amber-500/10 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3>
        <div className=flex items-center gap-3>
          <div className=p-2 rounded-xl bg-red-600 text-white animate-pulse>
            <AlertTriangle className=w-5 h-5 />
          </div>
          <div>
            <h4 className=text-xs font-bold text-red-900 uppercase tracking-wide>
              Critical Shortage Alert: O- & A- Units Depleted in South Mumbai
            </h4>
            <p className=text-xs text-red-700/90 mt-0.5>
              Available O- reserve is currently at 5 units (Threshold: 20). Automated NGO donation drives initiated.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCurrentView('inventory')}
          className=self-end sm:self-center px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 shrink-0
        >
          Inspect Stock →
        </button>
      </div>

      {/* 6 Key Performance Metric Cards */}
      <div className=grid grid-cols-2 lg:grid-cols-6 gap-4>
        
        {/* Card 1 */}
        <div className=bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden>
          <div className=flex items-center justify-between text-slate-400>
            <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Active Emergencies</span>
            <div className=p-1.5 rounded-lg bg-red-50 text-red-600>
              <AlertTriangle className=w-4 h-4 animate-bounce />
            </div>
          </div>
          <p className=text-2xl font-extrabold text-slate-900 mt-2 font-display>
            {activeRequests.length + 9}
          </p>
          <div className=flex items-center gap-1 text-[11px] text-red-600 font-semibold mt-1>
            <TrendingUp className=w-3 h-3 />
            <span>4 High Priority</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className=bg-white p-4 rounded-2xl border border-slate-200 shadow-xs>
          <div className=flex items-center justify-between text-slate-400>
            <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Units Available</span>
            <div className=p-1.5 rounded-lg bg-blue-50 text-blue-600>
              <Droplet className=w-4 h-4 />
            </div>
          </div>
          <p className=text-2xl font-extrabold text-slate-900 mt-2 font-display>
            {totalUnits.toLocaleString()}
          </p>
          <div className=flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1>
            <span>8 Blood Banks Synchronized</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className=bg-white p-4 rounded-2xl border border-slate-200 shadow-xs>
          <div className=flex items-center justify-between text-slate-400>
            <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Donors Online</span>
            <div className=p-1.5 rounded-lg bg-rose-50 text-rose-600>
              <Heart className=w-4 h-4 />
            </div>
          </div>
          <p className=text-2xl font-extrabold text-slate-900 mt-2 font-display>
            {availableDonorsCount + 300}
          </p>
          <div className=flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1>
            <span className=w-1.5 h-1.5 rounded-full bg-emerald-500></span>
            <span>Ready for Instant Alert</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className=bg-white p-4 rounded-2xl border border-slate-200 shadow-xs>
          <div className=flex items-center justify-between text-slate-400>
            <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Critical Shortages</span>
            <div className=p-1.5 rounded-lg bg-amber-50 text-amber-600>
              <ShieldAlert className=w-4 h-4 />
            </div>
          </div>
          <p className=text-2xl font-extrabold text-amber-700 mt-2 font-display>
            {criticalShortagesCount}
          </p>
          <div className=text-[11px] text-amber-600 font-medium mt-1>
            <span>O- and A- under buffer</span>
          </div>
        </div>

        {/* Card 5 */}
        <div className=bg-white p-4 rounded-2xl border border-slate-200 shadow-xs>
          <div className=flex items-center justify-between text-slate-400>
            <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Fulfilled Today</span>
            <div className=p-1.5 rounded-lg bg-emerald-50 text-emerald-600>
              <CheckCircle2 className=w-4 h-4 />
            </div>
          </div>
          <p className=text-2xl font-extrabold text-slate-900 mt-2 font-display>
            29
          </p>
          <div className=flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1>
            <span>+18% vs Yesterday</span>
          </div>
        </div>

        {/* Card 6 */}
        <div className=bg-white p-4 rounded-2xl border border-slate-200 shadow-xs>
          <div className=flex items-center justify-between text-slate-400>
            <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Avg Response Time</span>
            <div className=p-1.5 rounded-lg bg-purple-50 text-purple-600>
              <Clock className=w-4 h-4 />
            </div>
          </div>
          <p className=text-2xl font-extrabold text-slate-900 mt-2 font-display>
            8 min
          </p>
          <div className=flex items-center gap-1 text-[11px] text-purple-600 font-semibold mt-1>
            <span>Hospital-to-donor link</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className=grid grid-cols-1 lg:grid-cols-3 gap-6>
        
        {/* Chart 1: Request Volume Trend */}
        <div className=lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs>
          <div className=flex items-center justify-between mb-4>
            <div>
              <h3 className=text-sm font-bold text-slate-900>
                Emergency Demand & Fulfillment Velocity
              </h3>
              <p className=text-xs text-slate-500>
                Daily incoming emergency cases vs completed dispatches (Mumbai Hub)
              </p>
            </div>
            <div className=flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium>
              <button
                onClick={() => setTimeframe('7D')}
                className={px-2.5 py-1 rounded-lg }
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeframe('30D')}
                className={px-2.5 py-1 rounded-lg }
              >
                30 Days
              </button>
            </div>
          </div>

          <div className=h-64 w-full>
            <ResponsiveContainer width=100% height=100%>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id=reqGrad x1=0 y1=0 x2=0 y2=1>
                    <stop offset=5% stopColor=#dc2626 stopOpacity={0.25} />
                    <stop offset=95% stopColor=#dc2626 stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id=fulGrad x1=0 y1=0 x2=0 y2=1>
                    <stop offset=5% stopColor=#10b981 stopOpacity={0.25} />
                    <stop offset=95% stopColor=#10b981 stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray=3 3 vertical={false} stroke=#f1f5f9 />
                <XAxis dataKey=day tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type=monotone dataKey=requests stroke=#dc2626 strokeWidth={2.5} fillOpacity={1} fill=url(#reqGrad) name=Incoming Requests />
                <Area type=monotone dataKey=fulfilled stroke=#10b981 strokeWidth={2.5} fillOpacity={1} fill=url(#fulGrad) name=Units Fulfilled />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Request Fulfillment Breakdown Donut */}
        <div className=bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between>
          <div>
            <h3 className=text-sm font-bold text-slate-900>
              Fulfillment Health Index
            </h3>
            <p className=text-xs text-slate-500>
              Resolution distribution of last 100 requests
            </p>
          </div>

          <div className=h-48 w-full my-auto flex items-center justify-center>
            <ResponsiveContainer width=100% height=100%>
              <PieChart>
                <Pie
                  data={fulfillmentData}
                  cx=50%
                  cy=50%
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey=value
                >
                  {fulfillmentData.map((entry, index) => (
                    <Cell key={cell-} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className=space-y-2 pt-3 border-t border-slate-100 text-xs>
            <div className=flex items-center justify-between>
              <span className=flex items-center gap-1.5 text-slate-600>
                <span className=w-2.5 h-2.5 rounded-full bg-emerald-500></span>
                Fulfilled Safely
              </span>
              <span className=font-bold text-slate-900>89%</span>
            </div>
            <div className=flex items-center justify-between>
              <span className=flex items-center gap-1.5 text-slate-600>
                <span className=w-2.5 h-2.5 rounded-full bg-blue-500></span>
                In Transit Relay
              </span>
              <span className=font-bold text-slate-900>8%</span>
            </div>
            <div className=flex items-center justify-between>
              <span className=flex items-center gap-1.5 text-slate-600>
                <span className=w-2.5 h-2.5 rounded-full bg-amber-500></span>
                Bank Reserve Wait
              </span>
              <span className=font-bold text-slate-900>3%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Blood Group Availability Matrix Bar Chart */}
      <div className=bg-white p-5 rounded-3xl border border-slate-200 shadow-xs>
        <div className=flex items-center justify-between mb-4>
          <div>
            <h3 className=text-sm font-bold text-slate-900>
              Citywide Blood Group Inventory Distribution
            </h3>
            <p className=text-xs text-slate-500>
              Aggregated units available across 8 blood banks. Notice severe shortfall in O- and A-.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('inventory')}
            className=text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1
          >
            <span>Full Inventory Matrix</span>
            <ArrowUpRight className=w-3.5 h-3.5 />
          </button>
        </div>

        <div className=h-56 w-full>
          <ResponsiveContainer width=100% height=100%>
            <BarChart data={inventoryChartData}>
              <CartesianGrid strokeDasharray=3 3 vertical={false} stroke=#f1f5f9 />
              <XAxis dataKey=bloodGroup tick={{ fontSize: 12, fontWeight: 600, fill: '#1e293b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey=available radius={[6, 6, 0, 0]} name=Available Units>
                {inventoryChartData.map((entry, index) => (
                  <Cell
                    key={ar-}
                    fill={entry.isCritical ? '#dc2626' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Recent Emergency Requests Feed */}
      <div className=bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden>
        <div className=p-5 border-b border-slate-100 flex items-center justify-between>
          <div>
            <h3 className=text-sm font-bold text-slate-900>
              Recent Emergency Blood Requests
            </h3>
            <p className=text-xs text-slate-500>
              Click any emergency case to inspect live AI matching and relay progress
            </p>
          </div>
          <span className=text-xs text-slate-400>
            {requests.length} total monitored
          </span>
        </div>

        <div className=overflow-x-auto>
          <table className=w-full text-left border-collapse text-xs>
            <thead>
              <tr className=bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100>
                <th className=py-3 px-4>Request ID</th>
                <th className=py-3 px-4>Hospital & Location</th>
                <th className=py-3 px-4>Blood Group</th>
                <th className=py-3 px-4>Units Needed</th>
                <th className=py-3 px-4>Urgency</th>
                <th className=py-3 px-4>Time Window</th>
                <th className=py-3 px-4>Relay Status</th>
                <th className=py-3 px-4 text-right>Action</th>
              </tr>
            </thead>
            <tbody className=divide-y divide-slate-100>
              {requests.slice(0, 6).map((req) => (
                <tr
                  key={req.id}
                  className={hover:bg-slate-50/80 transition-colors }
                >
                  <td className=py-3 px-4>
                    <div className=flex items-center gap-1.5>
                      <span className=font-mono font-bold text-slate-800>
                        {req.id}
                      </span>
                      {req.isSuspicious && (
                        <span className=px-1.5 py-0.2 text-[9px] font-bold bg-amber-200 text-amber-900 rounded title={req.fraudReason}>
                          Flagged
                        </span>
                      )}
                    </div>
                  </td>
                  <td className=py-3 px-4>
                    <p className=font-semibold text-slate-800>{req.hospitalName}</p>
                    <p className=text-[11px] text-slate-400>{req.location}</p>
                  </td>
                  <td className=py-3 px-4>
                    <span className=inline-block px-2 py-0.5 rounded-md font-bold text-xs bg-red-100 text-red-700>
                      {req.bloodGroup}
                    </span>
                  </td>
                  <td className=py-3 px-4 font-semibold text-slate-800>
                    {req.unitsFulfilled}/{req.unitsRequired} Units
                  </td>
                  <td className=py-3 px-4>
                    <span
                      className={px-2 py-0.5 rounded-full text-[10px] font-bold }
                    >
                      {req.urgency}
                    </span>
                  </td>
                  <td className=py-3 px-4 text-slate-600 font-medium>
                    <span className=flex items-center gap-1 text-red-600 font-semibold>
                      <Clock className=w-3.5 h-3.5 />
                      {req.requiredByMinutes} min left
                    </span>
                  </td>
                  <td className=py-3 px-4>
                    {getStatusBadge(req.status)}
                  </td>
                  <td className=py-3 px-4 text-right>
                    <button
                      onClick={() => {
                        setSelectedRequestId(req.id);
                        setCurrentView('details');
                      }}
                      className=px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors
                    >
                      Track Relay →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
