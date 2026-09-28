import React, { useState } from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import { mockData } from '../data/mockData';
import {
  Heart,
  Award,
  Calendar,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Share2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function DonorDashboard({ setCurrentView }) {
  const {
    requests,
    respondAsDonor,
    setSelectedRequestId,
    showToast
  } = useRedRelay();

  const [isAvailable, setIsAvailable] = useState(true);

  // Active emergency near donor (e.g. Lilavati Hospital REQ-2026-1048)
  const nearbyEmergency = requests.find((r) => r.id === 'REQ-2026-1048') || requests[0];

  const donationHistory = [
    { id: 'DON-982', date: '2026-06-12', hospital: 'Lilavati Hospital & Research Centre', bloodGroup: 'O-', units: 1, status: 'Completed' },
    { id: 'DON-841', date: '2026-02-18', hospital: 'KEM Hospital Parel', bloodGroup: 'O-', units: 1, status: 'Completed' },
    { id: 'DON-712', date: '2025-10-04', hospital: 'Tata Memorial Centre', bloodGroup: 'O-', units: 1, status: 'Completed' },
    { id: 'DON-604', date: '2025-06-22', hospital: 'Hinduja National Hospital', bloodGroup: 'O-', units: 1, status: 'Completed' }
  ];

  return (
    <div className=space-y-6 pb-16>
      
      {/* Donor Persona Profile Header */}
      <div className=bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden>
        <div className=space-y-2 relative z-10>
          <div className=flex items-center gap-2>
            <span className=px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider>
              Verified Lifesaver Profile
            </span>
            <span className=px-2.5 py-0.5 bg-emerald-400 text-emerald-950 rounded-full text-[10px] font-bold>
              Gold Tier
            </span>
          </div>
          <h1 className=text-2xl sm:text-3xl font-extrabold font-display>
            Neha Patil
          </h1>
          <p className=text-xs sm:text-sm text-rose-100 flex items-center gap-2>
            <span>Donor ID: #D104</span>
            <span>•</span>
            <span className=font-bold bg-white text-rose-700 px-2 py-0.5 rounded-md>O- Universal Donor</span>
            <span>•</span>
            <span>Bandra West, Mumbai</span>
          </p>
        </div>

        {/* Availability Switch */}
        <div className=bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-left relative z-10 self-start sm:self-auto>
          <div className=flex items-center justify-between gap-4>
            <div>
              <p className=text-[11px] font-bold uppercase tracking-wider text-rose-200>Emergency Dispatch Status</p>
              <p className=text-xs font-semibold text-white mt-0.5>
                {isAvailable ? 'AVAILABLE FOR RELAY' : 'PAUSED / OFF-DUTY'}
              </p>
            </div>
            <button
              onClick={() => {
                setIsAvailable(!isAvailable);
                showToast(Status updated to , 'info');
              }}
              className={w-12 h-6 flex items-center rounded-full p-1 transition-colors }
            >
              <span className=bg-white w-4 h-4 rounded-full shadow-md></span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Impact Metric Cards */}
      <div className=grid grid-cols-2 sm:grid-cols-4 gap-4>
        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <div className=flex items-center justify-between text-slate-400 mb-2>
            <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Donations</span>
            <div className=p-1.5 rounded-lg bg-red-50 text-red-600>
              <Heart className=w-4 h-4 fill-red-600 />
            </div>
          </div>
          <p className=text-3xl font-black text-slate-900 font-display>12</p>
          <p className=text-[11px] text-slate-500 mt-1>Recorded hospital units</p>
        </div>

        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <div className=flex items-center justify-between text-slate-400 mb-2>
            <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Lives Impacted</span>
            <div className=p-1.5 rounded-lg bg-emerald-50 text-emerald-600>
              <Award className=w-4 h-4 />
            </div>
          </div>
          <p className=text-3xl font-black text-emerald-600 font-display>36</p>
          <p className=text-[11px] text-slate-500 mt-1>Direct pediatric & trauma impact</p>
        </div>

        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <div className=flex items-center justify-between text-slate-400 mb-2>
            <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Current Status</span>
            <div className=p-1.5 rounded-lg bg-blue-50 text-blue-600>
              <ShieldCheck className=w-4 h-4 />
            </div>
          </div>
          <p className=text-xl font-bold text-blue-700 font-display mt-1>
            {isAvailable ? 'AVAILABLE' : 'OFFLINE'}
          </p>
          <p className=text-[11px] text-slate-500 mt-1>GPS geofence active</p>
        </div>

        <div className=bg-white p-5 rounded-2xl border border-slate-200 shadow-xs>
          <div className=flex items-center justify-between text-slate-400 mb-2>
            <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-500>Next Eligible Date</span>
            <div className=p-1.5 rounded-lg bg-purple-50 text-purple-600>
              <Calendar className=w-4 h-4 />
            </div>
          </div>
          <p className=text-lg font-bold text-slate-900 font-display mt-1>15 Oct 2026</p>
          <p className=text-[11px] text-emerald-600 font-semibold mt-1>Cooldown satisfied ✓</p>
        </div>
      </div>

      {/* Emergency Requests Near You Alert Box */}
      <div className=bg-white rounded-3xl border-2 border-red-500 shadow-md p-6 relative overflow-hidden>
        <div className=flex items-center justify-between mb-4>
          <div className=flex items-center gap-2 text-red-600>
            <AlertTriangle className=w-5 h-5 animate-pulse />
            <h3 className=font-bold text-base text-slate-900>
              🚨 Emergency Blood Request In Your Proximity
            </h3>
          </div>
          <span className=px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse>
            HIGH MATCH (92%)
          </span>
        </div>

        <div className=bg-red-50/60 rounded-2xl p-4 border border-red-100 flex flex-col md:flex-row md:items-center justify-between gap-4>
          <div className=space-y-1 text-xs>
            <div className=flex items-center gap-2>
              <span className=px-2 py-0.5 rounded font-mono font-bold bg-red-600 text-white>
                {nearbyEmergency.id}
              </span>
              <h4 className=font-bold text-sm text-slate-900>
                {nearbyEmergency.bloodGroup} Blood Needed at {nearbyEmergency.hospitalName}
              </h4>
            </div>
            <p className=text-slate-600>
              Patient Case: <strong className=text-slate-900>{nearbyEmergency.patientCaseId}</strong> • Urgency: <strong className=text-red-700>{nearbyEmergency.urgency}</strong>
            </p>
            <div className=flex items-center gap-4 text-slate-500 pt-1>
              <span className=flex items-center gap-1 font-semibold text-slate-800>
                <MapPin className=w-3.5 h-3.5 text-red-600 />
                2.1 km away ({nearbyEmergency.location})
              </span>
              <span className=flex items-center gap-1 font-bold text-amber-700>
                <Clock className=w-3.5 h-3.5 />
                {nearbyEmergency.requiredByMinutes} min remaining
              </span>
              <span className=font-semibold text-slate-700>
                Units: {nearbyEmergency.unitsRequired} Pints
              </span>
            </div>
          </div>

          {/* Accept / Decline CTA Buttons */}
          <div className=flex items-center gap-2.5 self-end md:self-center shrink-0>
            <button
              onClick={() => {
                respondAsDonor('D104', nearbyEmergency.id, 'ACCEPT');
                setSelectedRequestId(nearbyEmergency.id);
                setCurrentView('details');
              }}
              className=px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-red-500/30 transition-all flex items-center gap-1.5
            >
              <CheckCircle2 className=w-4 h-4 />
              <span>ACCEPT REQUEST</span>
            </button>
            <button
              onClick={() => respondAsDonor('D104', nearbyEmergency.id, 'DECLINE')}
              className=px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1
            >
              <XCircle className=w-4 h-4 />
              <span>DECLINE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Donation History Table */}
      <div className=bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden>
        <div className=p-5 border-b border-slate-100 flex items-center justify-between>
          <div>
            <h3 className=text-sm font-bold text-slate-900>
              Your Verified Donation Journey
            </h3>
            <p className=text-xs text-slate-500>
              Official electronic donor certificates accredited by Red Cross & National Blood Transfusion Council
            </p>
          </div>
        </div>

        <div className=overflow-x-auto>
          <table className=w-full text-left border-collapse text-xs>
            <thead>
              <tr className=bg-slate-50 text-slate-500 font-semibold border-b border-slate-100>
                <th className=py-3 px-4>Certificate ID</th>
                <th className=py-3 px-4>Date</th>
                <th className=py-3 px-4>Hospital Facility</th>
                <th className=py-3 px-4>Blood Group</th>
                <th className=py-3 px-4>Units Given</th>
                <th className=py-3 px-4>Clinical Status</th>
                <th className=py-3 px-4 text-right>Certificate</th>
              </tr>
            </thead>
            <tbody className=divide-y divide-slate-100>
              {donationHistory.map((item) => (
                <tr key={item.id} className=hover:bg-slate-50 transition-colors>
                  <td className=py-3.5 px-4 font-mono font-bold text-slate-700>{item.id}</td>
                  <td className=py-3.5 px-4 text-slate-600>{item.date}</td>
                  <td className=py-3.5 px-4 font-semibold text-slate-900>{item.hospital}</td>
                  <td className=py-3.5 px-4>
                    <span className=px-2 py-0.5 rounded font-bold text-xs bg-red-100 text-red-700>
                      {item.bloodGroup}
                    </span>
                  </td>
                  <td className=py-3.5 px-4 font-semibold text-slate-700>{item.units} Unit</td>
                  <td className=py-3.5 px-4>
                    <span className=px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800>
                      {item.status} ✓
                    </span>
                  </td>
                  <td className=py-3.5 px-4 text-right>
                    <button
                      onClick={() => showToast(Digital Badge & Certificate  verified, 'info')}
                      className=text-xs text-red-600 hover:text-red-700 font-semibold
                    >
                      Download PDF
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
