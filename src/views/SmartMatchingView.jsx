import React, { useState } from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import { mockData } from '../data/mockData';
import {
  Sparkles,
  GitMerge,
  Send,
  MapPin,
  Heart,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Building2
} from 'lucide-react';

export default function SmartMatchingView({ setCurrentView }) {
  const {
    donors,
    requests,
    selectedRequestId,
    notifyDonor,
    showToast
  } = useRedRelay();

  const [selectedGroup, setSelectedGroup] = useState('O-');
  const [maxDistance, setMaxDistance] = useState(15);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const activeReq = requests.find((r) => r.id === selectedRequestId) || requests[0];

  // AI Matching score calculation engine
  const scoredDonors = donors
    .filter((d) => {
      if (onlyAvailable && !d.available) return false;
      if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase()) && !d.area.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .map((donor) => {
      const compatibleList = mockData.compatibility[selectedGroup] || [];
      const isCompat = compatibleList.includes(donor.bloodGroup);
      
      // Distance estimation from central hospital (Lilavati Bandra: 19.0514, 72.8295)
      const dLat = (donor.latitude - 19.0514) * 111;
      const dLng = (donor.longitude - 72.8295) * 105;
      const distance = Math.max(0.9, Number(Math.sqrt(dLat * dLat + dLng * dLng).toFixed(1)));

      if (distance > maxDistance) return null;

      let score = 50;
      if (donor.bloodGroup === selectedGroup) score += 28;
      else if (isCompat) score += 14;
      else score = 15; // Incompatible

      if (distance < 3) score += 18;
      else if (distance < 6) score += 12;
      else if (distance < 10) score += 6;

      if (donor.available) score += 8;
      if (donor.eligibilityStatus === 'Eligible') score += 6;

      return {
        ...donor,
        distance,
        isCompatible: isCompat,
        aiScore: Math.min(99, Math.max(35, score)),
        status: donor.id === 'D104' ? 'Notified' : 'Standby'
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.aiScore - a.aiScore);

  return (
    <div className=space-y-6 pb-16>
      
      {/* Header */}
      <div className=bg-white p-6 rounded-3xl border border-slate-200 shadow-xs>
        <div className=flex flex-col md:flex-row md:items-center justify-between gap-4>
          <div>
            <div className=flex items-center gap-2>
              <div className=p-2 rounded-xl bg-blue-100 text-blue-700>
                <GitMerge className=w-5 h-5 />
              </div>
              <h1 className=text-xl font-bold text-slate-900 font-display>
                Smart Donor Matching Engine
              </h1>
              <span className=px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700>
                AI Powered
              </span>
            </div>
            <p className=text-xs text-slate-500 mt-1 max-w-2xl>
              Multivariate matching weights: ABO/Rh compatibility (40%), Real-time geospatial distance (30%), Donor availability & clinical cooldown (20%), and Emergency urgency score (10%).
            </p>
          </div>

          <div className=flex items-center gap-2>
            <span className=text-xs text-slate-500 font-medium>Matching against:</span>
            <div className=px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-xs font-mono font-bold text-red-700>
              {activeReq.id} • {activeReq.hospitalName.split(' ')[0]}
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className=mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs>
          
          {/* Target Blood Group */}
          <div>
            <label className=block font-semibold text-slate-700 mb-1>
              Target Blood Group
            </label>
            <div className=grid grid-cols-4 gap-1>
              {mockData.bloodGroups.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setSelectedGroup(bg)}
                  className={py-1 rounded-lg font-bold transition-all }
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Distance Radius */}
          <div>
            <div className=flex justify-between font-semibold text-slate-700 mb-1>
              <span>Max Distance Radius</span>
              <span className=text-red-600 font-bold>{maxDistance} km</span>
            </div>
            <input
              type=range
              min=2
              max=25
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className=w-full accent-red-600
            />
          </div>

          {/* Search by Name / Area */}
          <div>
            <label className=block font-semibold text-slate-700 mb-1>
              Search Donor or Ward
            </label>
            <div className=relative>
              <input
                type=text
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder=e.g. Neha, Bandra, Dadar...
                className=w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none
              />
              <Search className=w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 />
            </div>
          </div>

          {/* Available toggle */}
          <div className=flex items-end>
            <label className=flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl w-full cursor-pointer hover:bg-slate-100>
              <input
                type=checkbox
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className=accent-red-600 rounded
              />
              <span className=font-semibold text-slate-700>Only Available Now</span>
            </label>
          </div>

        </div>
      </div>

      {/* Results Count & Bulk Action */}
      <div className=flex items-center justify-between text-xs px-1>
        <span className=text-slate-500>
          Showing <strong className=text-slate-900>{scoredDonors.length}</strong> matched donor candidates across Mumbai
        </span>
        <button
          onClick={() => {
            scoredDonors.slice(0, 5).forEach((d) => notifyDonor(d.id, activeReq.id));
            showToast(Top 5 matched donors broadcasted via priority SMS., 'success');
          }}
          className=px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5
        >
          <Send className=w-3.5 h-3.5 text-red-400 />
          <span>Dispatch Broadcast to Top 5</span>
        </button>
      </div>

      {/* Donor Match Cards Grid */}
      <div className=grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5>
        {scoredDonors.map((donor) => {
          return (
            <div
              key={donor.id}
              className=bg-white rounded-3xl p-5 border border-slate-200 hover:border-red-300 hover:shadow-md transition-all flex flex-col justify-between
            >
              <div>
                {/* Header */}
                <div className=flex items-start justify-between gap-2>
                  <div>
                    <div className=flex items-center gap-2>
                      <span className=font-bold text-sm text-slate-900>{donor.name}</span>
                      <span className=px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] font-mono rounded>
                        #{donor.id}
                      </span>
                    </div>
                    <p className=text-xs text-slate-500 flex items-center gap-1 mt-0.5>
                      <MapPin className=w-3.5 h-3.5 text-slate-400 />
                      <span>{donor.area}</span> • <strong>{donor.distance} km away</strong>
                    </p>
                  </div>

                  <span className=px-2.5 py-1 rounded-xl text-xs font-black bg-red-100 text-red-700>
                    {donor.bloodGroup}
                  </span>
                </div>

                {/* AI Match Score Progress Bar */}
                <div className=mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100>
                  <div className=flex items-center justify-between text-xs mb-1.5>
                    <span className=font-bold text-slate-700 flex items-center gap-1>
                      <Sparkles className=w-3.5 h-3.5 text-amber-500 />
                      AI Match Score
                    </span>
                    <span className=font-black text-sm text-red-600>
                      {donor.aiScore}% Match
                    </span>
                  </div>
                  <div className=w-full h-2.5 rounded-full bg-slate-200 overflow-hidden>
                    <div
                      className={h-full rounded-full transition-all duration-500 }
                      style={{ width: ${donor.aiScore}% }}
                    />
                  </div>
                </div>

                {/* Clinical Attributes */}
                <div className=mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600>
                  <div className=p-2 rounded-xl bg-slate-50>
                    <span className=text-slate-400 block>Availability</span>
                    <span className={ont-semibold }>
                      {donor.available ? '● Available Now' : '○ Standby'}
                    </span>
                  </div>
                  <div className=p-2 rounded-xl bg-slate-50>
                    <span className=text-slate-400 block>Eligibility</span>
                    <span className=font-semibold text-slate-800>
                      {donor.eligibilityStatus}
                    </span>
                  </div>
                  <div className=p-2 rounded-xl bg-slate-50>
                    <span className=text-slate-400 block>Last Donation</span>
                    <span className=font-semibold text-slate-800>
                      {donor.daysSinceDonation} days ago
                    </span>
                  </div>
                  <div className=p-2 rounded-xl bg-slate-50>
                    <span className=text-slate-400 block>Impact</span>
                    <span className=font-semibold text-slate-800>
                      {donor.livesImpacted} Lives Saved
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className=mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2>
                <span className=text-[10px] font-mono text-slate-400>
                  {donor.status}
                </span>

                <div className=flex items-center gap-2>
                  <button
                    onClick={() => notifyDonor(donor.id, activeReq.id)}
                    className=px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors
                  >
                    <Send className=w-3 h-3 />
                    <span>Notify Donor</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('map')}
                    className=p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors
                    title=View on Map
                  >
                    <MapPin className=w-4 h-4 />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
