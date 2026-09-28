import React, { useState } from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import { mockData } from '../data/mockData';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  Download,
  Share2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function AnalyticsDashboard() {
  const { historicalAnalytics, showToast } = useRedRelay();
  const [filterPeriod, setFilterPeriod] = useState('7D');

  // Chart data: Blood group distribution across 100 historical requests
  const bloodGroupCounts = {};
  mockData.bloodGroups.forEach((bg) => (bloodGroupCounts[bg] = 0));
  historicalAnalytics.forEach((h) => {
    if (bloodGroupCounts[h.bloodGroup] !== undefined) {
      bloodGroupCounts[h.bloodGroup] += h.units;
    }
  });

  const bloodGroupChartData = Object.entries(bloodGroupCounts).map(([bg, count]) => ({
    bloodGroup: bg,
    units: count
  }));

  // Daily request trend
  const dailyData = [
    { day: 'Day 1', requests: 12, responseTime: 8.5 },
    { day: 'Day 2', requests: 18, responseTime: 8.1 },
    { day: 'Day 3', requests: 15, responseTime: 7.9 },
    { day: 'Day 4', requests: 22, responseTime: 7.6 },
    { day: 'Day 5', requests: 25, responseTime: 8.0 },
    { day: 'Day 6', requests: 28, responseTime: 7.8 },
    { day: 'Day 7 (Today)', requests: 31, responseTime: 7.4 }
  ];

  // Hotspots table data
  const hotspotData = [
    { area: 'Parel & Lower Parel', requests: 38, avgResponse: '7.2 min', shortage: 'Critical', fulfillment: '94%' },
    { area: 'Bandra & Khar West', requests: 29, avgResponse: '6.8 min', shortage: 'High', fulfillment: '96%' },
    { area: 'Andheri & Juhu', requests: 26, avgResponse: '8.4 min', shortage: 'Moderate', fulfillment: '91%' },
    { area: 'Kurla & Sion Corridor', requests: 24, avgResponse: '8.1 min', shortage: 'Critical', fulfillment: '88%' },
    { area: 'Powai & Ghatkopar', requests: 18, avgResponse: '9.0 min', shortage: 'Normal', fulfillment: '95%' }
  ];

  const donutColors = ['#10b981', '#3b82f6', '#f59e0b', '#dc2626'];
  const donutData = [
    { name: 'Fulfilled Under 15m', value: 74 },
    { name: 'Fulfilled Under 30m', value: 18 },
    { name: 'Partially Fulfilled', value: 6 },
    { name: 'Rerouted / Diverted', value: 2 }
  ];

  return (
    <div className=space-y-6 pb-16>
      
      {/* Header and Filter Toolbar */}
      <div className=bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4>
        <div>
          <div className=flex items-center gap-2>
            <div className=p-2 rounded-xl bg-slate-900 text-white>
              <BarChart3 className=w-5 h-5 />
            </div>
            <h1 className=text-xl font-bold text-slate-900 font-display>
              System-Wide Telemetry & Performance Analytics
            </h1>
          </div>
          <p className=text-xs text-slate-500 mt-1>
            Historical benchmarking based on 100+ clinical trauma cases across Mumbai hospitals.
          </p>
        </div>

        <div className=flex items-center gap-3>
          <div className=flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold>
            {['Today', '7D', '30D'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPeriod(p)}
                className={px-3 py-1.5 rounded-lg transition-all }
              >
                {p === '7D' ? '7 Days' : p === '30D' ? '30 Days' : 'Today'}
              </button>
            ))}
          </div>

          <button
            onClick={() => showToast('Analytics CSV report exported successfully.', 'success')}
            className=p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors
            title=Export Report
          >
            <Download className=w-4 h-4 />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className=grid grid-cols-2 sm:grid-cols-4 gap-4>
        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-400>Total Cases Handled</span>
          <p className=text-3xl font-black text-slate-900 font-display mt-1>104</p>
          <p className=text-[11px] text-emerald-600 font-semibold mt-1>92.3% Successful match</p>
        </div>

        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-400>Average Transit Time</span>
          <p className=text-3xl font-black text-blue-600 font-display mt-1>7.8 min</p>
          <p className=text-[11px] text-slate-500 mt-1>-34% faster than standard protocol</p>
        </div>

        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-400>Donor Conversion Rate</span>
          <p className=text-3xl font-black text-rose-600 font-display mt-1>68.4%</p>
          <p className=text-[11px] text-slate-500 mt-1>Responded within 4 minutes</p>
        </div>

        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-400>Total Units Relayed</span>
          <p className=text-3xl font-black text-emerald-600 font-display mt-1>328</p>
          <p className=text-[11px] text-slate-500 mt-1>Pints delivered safely</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className=grid grid-cols-1 lg:grid-cols-2 gap-6>
        
        {/* Chart 1: Units Requested by Blood Group */}
        <div className=bg-white p-5 rounded-3xl border border-slate-200 shadow-xs>
          <h3 className=text-sm font-bold text-slate-900 mb-1>
            Blood Units Demand Breakdown by Blood Group
          </h3>
          <p className=text-xs text-slate-500 mb-4>
            Aggregated demand volume across historical dataset
          </p>
          <div className=h-64 w-full>
            <ResponsiveContainer width=100% height=100%>
              <BarChart data={bloodGroupChartData}>
                <CartesianGrid strokeDasharray=3 3 vertical={false} stroke=#f1f5f9 />
                <XAxis dataKey=bloodGroup tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey=units fill=#dc2626 radius={[6, 6, 0, 0]} name=Units Requested />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Average Response Time Speedup */}
        <div className=bg-white p-5 rounded-3xl border border-slate-200 shadow-xs>
          <h3 className=text-sm font-bold text-slate-900 mb-1>
            Relay Response Time Trend (Minutes to Match)
          </h3>
          <p className=text-xs text-slate-500 mb-4>
            Minutes elapsed from hospital emergency creation to verified donor confirmation
          </p>
          <div className=h-64 w-full>
            <ResponsiveContainer width=100% height=100%>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id=respGrad x1=0 y1=0 x2=0 y2=1>
                    <stop offset=5% stopColor=#3b82f6 stopOpacity={0.25} />
                    <stop offset=95% stopColor=#3b82f6 stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray=3 3 vertical={false} stroke=#f1f5f9 />
                <XAxis dataKey=day tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[5, 11]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type=monotone dataKey=responseTime stroke=#3b82f6 strokeWidth={2.5} fill=url(#respGrad) name=Avg Minutes />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Emergency Hotspots Table */}
      <div className=bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden>
        <div className=p-5 border-b border-slate-100 flex items-center justify-between>
          <div>
            <h3 className=text-sm font-bold text-slate-900>
              Regional Trauma & Blood Shortage Hotspots
            </h3>
            <p className=text-xs text-slate-500>
              Corridor density analysis across Mumbai medical hubs
            </p>
          </div>
          <span className=text-xs font-semibold text-slate-500>
            5 Active Zones
          </span>
        </div>

        <div className=overflow-x-auto>
          <table className=w-full text-left border-collapse text-xs>
            <thead>
              <tr className=bg-slate-50 text-slate-500 font-semibold border-b border-slate-100>
                <th className=py-3 px-4>Medical Sector / Corridor</th>
                <th className=py-3 px-4>Emergency Cases</th>
                <th className=py-3 px-4>Avg Relay Velocity</th>
                <th className=py-3 px-4>Shortage Vulnerability</th>
                <th className=py-3 px-4>Fulfillment Rate</th>
                <th className=py-3 px-4 text-right>Protocol</th>
              </tr>
            </thead>
            <tbody className=divide-y divide-slate-100>
              {hotspotData.map((h, i) => (
                <tr key={i} className=hover:bg-slate-50 transition-colors>
                  <td className=py-3.5 px-4 font-bold text-slate-900>{h.area}</td>
                  <td className=py-3.5 px-4 font-semibold text-slate-700>{h.requests} cases</td>
                  <td className=py-3.5 px-4 font-mono text-blue-600 font-bold>{h.avgResponse}</td>
                  <td className=py-3.5 px-4>
                    <span
                      className={px-2.5 py-0.5 rounded-full text-[10px] font-bold }
                    >
                      {h.shortage}
                    </span>
                  </td>
                  <td className=py-3.5 px-4 font-bold text-emerald-600>{h.fulfillment}</td>
                  <td className=py-3.5 px-4 text-right>
                    <span className=text-[11px] font-semibold text-slate-500>Standard Relay</span>
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
