import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useRedRelay } from '../context/RedRelayContext';
import { mockData } from '../data/mockData';
import {
  MapPin,
  Building2,
  Heart,
  Droplet,
  AlertTriangle,
  Layers,
  Filter,
  ArrowRight,
  ShieldAlert,
  Clock,
  Radio
} from 'lucide-react';

// Custom L.divIcon generators for crisp modern pins
const createCustomIcon = (type, label = '', bgGroup = '') => {
  let innerHtml = '';
  let size = [36, 36];

  if (type === 'hospital') {
    innerHtml = 
      <div style=background: #1e3a8a; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-weight: bold; font-size: 13px;>
        🏥
      </div>;
  } else if (type === 'blood_bank') {
    innerHtml = 
      <div style=background: #059669; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 13px;>
        🩸
      </div>;
  } else if (type === 'donor') {
    innerHtml = 
      <div style=background: #e11d48; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.25); font-weight: 800; font-size: 10px;>
        
      </div>;
    size = [28, 28];
  } else if (type === 'emergency') {
    innerHtml = 
      <div style=position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;>
        <span style=position: absolute; width: 40px; height: 40px; background: rgba(220, 38, 38, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;></span>
        <div style=background: #dc2626; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.6); font-weight: 900; font-size: 12px;>
          🚨
        </div>
      </div>;
    size = [44, 44];
  }

  return L.divIcon({
    html: innerHtml,
    className: 'custom-leaflet-marker',
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
    popupAnchor: [0, -size[1] / 2]
  });
};

export default function LiveMap({ setCurrentView }) {
  const {
    requests,
    bloodBanks,
    donors,
    setSelectedRequestId
  } = useRedRelay();

  // Filters
  const [filterHospitals, setFilterHospitals] = useState(true);
  const [filterBanks, setFilterBanks] = useState(true);
  const [filterDonors, setFilterDonors] = useState(true);
  const [filterEmergencies, setFilterEmergencies] = useState(true);
  const [filterShortages, setFilterShortages] = useState(true);

  // Shortage zones (hotspots)
  const shortageZones = [
    {
      id: 'SZ1',
      name: 'South Mumbai & Parel Corridor',
      lat: 19.0039,
      lng: 72.8436,
      radius: 2800,
      reason: 'O- and A- units under emergency reserve threshold',
      severity: 'Critical'
    },
    {
      id: 'SZ2',
      name: 'Bandra-Kurla Emergency Belt',
      lat: 19.0660,
      lng: 72.8680,
      radius: 2200,
      reason: 'Surge in trauma cases on Western Express Highway',
      severity: 'High'
    }
  ];

  // Center of Mumbai
  const mumbaiCenter = [19.0760, 72.8777];

  return (
    <div className=space-y-4 pb-16>
      
      {/* Header and Filter Toolbar */}
      <div className=bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4>
        <div>
          <div className=flex items-center gap-2>
            <div className=p-2 rounded-xl bg-emerald-100 text-emerald-700>
              <MapPin className=w-5 h-5 />
            </div>
            <h1 className=text-xl font-bold text-slate-900 font-display>
              Live Mumbai Geo-Intelligence Grid
            </h1>
            <span className=px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800>
              Real-Time Mesh
            </span>
          </div>
          <p className=text-xs text-slate-500 mt-1>
            Geospatial tracking of trauma centers, blood banks, available donors, and critical shortage radiuses.
          </p>
        </div>

        {/* Filter Chips */}
        <div className=flex flex-wrap items-center gap-2 text-xs font-semibold>
          <button
            onClick={() => setFilterHospitals(!filterHospitals)}
            className={px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 }
          >
            <span>🏥</span>
            <span>Hospitals</span>
          </button>

          <button
            onClick={() => setFilterBanks(!filterBanks)}
            className={px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 }
          >
            <span>🩸</span>
            <span>Blood Banks</span>
          </button>

          <button
            onClick={() => setFilterDonors(!filterDonors)}
            className={px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 }
          >
            <span>❤️</span>
            <span>Donors</span>
          </button>

          <button
            onClick={() => setFilterEmergencies(!filterEmergencies)}
            className={px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 }
          >
            <span>🚨</span>
            <span>Emergencies</span>
          </button>

          <button
            onClick={() => setFilterShortages(!filterShortages)}
            className={px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 }
          >
            <span>⚠️</span>
            <span>Shortage Zones</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className=bg-white rounded-3xl border border-slate-200 shadow-md p-2 h-[640px] relative overflow-hidden>
        <MapContainer
          center={mumbaiCenter}
          zoom={12}
          scrollWheelZoom={true}
          className=rounded-2xl
        >
          <TileLayer
            attribution='&copy; <a href=https://www.openstreetmap.org/copyright>OpenStreetMap</a> contributors'
            url=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
          />

          {/* Shortage Hotspot Circles */}
          {filterShortages &&
            shortageZones.map((zone) => (
              <Circle
                key={zone.id}
                center={[zone.lat, zone.lng]}
                radius={zone.radius}
                pathOptions={{
                  color: '#dc2626',
                  fillColor: '#ef4444',
                  fillOpacity: 0.18,
                  weight: 2,
                  dashArray: '6, 6'
                }}
              >
                <Popup>
                  <div className=p-1 text-xs>
                    <div className=flex items-center gap-1.5 text-red-700 font-bold mb-1>
                      <ShieldAlert className=w-4 h-4 />
                      <span>{zone.name}</span>
                    </div>
                    <p className=text-slate-600 mb-1>{zone.reason}</p>
                    <span className=px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700>
                      Severity: {zone.severity}
                    </span>
                  </div>
                </Popup>
              </Circle>
            ))}

          {/* Hospitals */}
          {filterHospitals &&
            mockData.hospitals.map((hosp) => (
              <Marker
                key={hosp.id}
                position={[hosp.lat, hosp.lng]}
                icon={createCustomIcon('hospital')}
              >
                <Popup>
                  <div className=p-1 text-xs space-y-1.5 max-w-xs>
                    <div className=flex items-center gap-1 text-blue-900 font-bold text-sm>
                      <Building2 className=w-4 h-4 text-blue-600 />
                      <span>{hosp.name}</span>
                    </div>
                    <p className=text-slate-500 font-medium>{hosp.area} • {hosp.type}</p>
                    <p className=text-slate-600>
                      Contact: <span className=font-mono text-slate-800>{hosp.contact}</span>
                    </p>
                    <div className=pt-1 border-t border-slate-100 flex items-center justify-between>
                      <span className=text-[10px] font-semibold text-emerald-600>
                        ● Direct Relay Linked
                      </span>
                      <button
                        onClick={() => setCurrentView('details')}
                        className=px-2 py-1 rounded bg-blue-600 text-white font-semibold text-[10px]
                      >
                        Inspect Ward
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Blood Banks */}
          {filterBanks &&
            bloodBanks.map((bank) => (
              <Marker
                key={bank.id}
                position={[bank.lat, bank.lng]}
                icon={createCustomIcon('blood_bank')}
              >
                <Popup>
                  <div className=p-1 text-xs space-y-1.5 max-w-xs>
                    <div className=flex items-center gap-1 text-emerald-900 font-bold text-sm>
                      <Droplet className=w-4 h-4 text-emerald-600 />
                      <span>{bank.name}</span>
                    </div>
                    <p className=text-slate-500 font-medium>{bank.area}</p>
                    <div className=bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] grid grid-cols-4 gap-1 text-center font-bold>
                      <span className=text-red-700>O-: {bank.inventory['O-'] || 0}</span>
                      <span className=text-slate-800>O+: {bank.inventory['O+'] || 0}</span>
                      <span className=text-slate-800>B+: {bank.inventory['B+'] || 0}</span>
                      <span className=text-slate-800>A+: {bank.inventory['A+'] || 0}</span>
                    </div>
                    <div className=pt-1 flex items-center justify-between>
                      <span className=font-mono text-slate-500>{bank.contact}</span>
                      <button
                        onClick={() => setCurrentView('inventory')}
                        className=px-2 py-1 rounded bg-emerald-600 text-white font-semibold text-[10px]
                      >
                        View Stock
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Active Emergency Requests */}
          {filterEmergencies &&
            requests
              .filter((r) => r.status !== 'FULFILLED' && r.status !== 'CANCELLED')
              .map((req) => (
                <Marker
                  key={req.id}
                  position={[req.latitude, req.longitude]}
                  icon={createCustomIcon('emergency')}
                >
                  <Popup>
                    <div className=p-1 text-xs space-y-2 max-w-xs>
                      <div className=flex items-center justify-between>
                        <span className=px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-red-600 text-white>
                          {req.id}
                        </span>
                        <span className=text-red-600 font-black text-xs animate-pulse>
                          {req.urgency.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className=font-bold text-slate-900 text-sm>{req.hospitalName}</h4>
                        <p className=text-slate-500>{req.location}</p>
                      </div>
                      <div className=bg-red-50 p-2 rounded-lg border border-red-200 text-slate-800 space-y-1>
                        <div className=flex justify-between>
                          <span>Blood Needed:</span>
                          <strong className=text-red-700 text-sm font-black>{req.bloodGroup} • {req.unitsRequired} Units</strong>
                        </div>
                        <div className=flex justify-between text-amber-700>
                          <span>Time Left:</span>
                          <strong>{req.requiredByMinutes} min</strong>
                        </div>
                        <div className=flex justify-between text-slate-600 text-[10px]>
                          <span>Matched Donors:</span>
                          <strong>{req.compatibleDonorsFound || 8} within 5km</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRequestId(req.id);
                          setCurrentView('details');
                        }}
                        className=w-full py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-center block transition-colors
                      >
                        Track Emergency Relay →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

          {/* Donors */}
          {filterDonors &&
            donors.slice(0, 30).map((donor) => (
              <Marker
                key={donor.id}
                position={[donor.latitude, donor.longitude]}
                icon={createCustomIcon('donor', '', donor.bloodGroup)}
              >
                <Popup>
                  <div className=p-1 text-xs space-y-1 max-w-xs>
                    <div className=flex items-center justify-between>
                      <span className=font-bold text-slate-900>{donor.name}</span>
                      <span className=px-2 py-0.5 rounded font-bold text-xs bg-red-100 text-red-700>
                        {donor.bloodGroup}
                      </span>
                    </div>
                    <p className=text-slate-500>{donor.area}</p>
                    <p className=text-slate-600>
                      Status: <strong className={donor.available ? 'text-emerald-600' : 'text-slate-500'}>
                        {donor.available ? 'Available' : 'Cooldown'}
                      </strong>
                    </p>
                    <p className=text-[10px] text-slate-400>
                      Impact: {donor.livesImpacted} Lives Saved
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* Floating Legend Overlay */}
        <div className=absolute bottom-6 right-6 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl text-xs space-y-1.5 hidden sm:block>
          <p className=font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-2>
            Map Legend
          </p>
          <div className=flex items-center gap-2>
            <span className=w-3.5 h-3.5 rounded-full bg-blue-900></span>
            <span className=text-slate-700>Apex Hospital (10)</span>
          </div>
          <div className=flex items-center gap-2>
            <span className=w-3.5 h-3.5 rounded-full bg-emerald-600></span>
            <span className=text-slate-700>Blood Bank (8)</span>
          </div>
          <div className=flex items-center gap-2>
            <span className=w-3.5 h-3.5 rounded-full bg-red-500 animate-ping></span>
            <span className=text-slate-700 font-semibold>Active Emergency</span>
          </div>
          <div className=flex items-center gap-2>
            <span className=w-3.5 h-3.5 rounded-full bg-rose-600></span>
            <span className=text-slate-700>GPS Donor Pin</span>
          </div>
          <div className=flex items-center gap-2>
            <span className=w-3.5 h-3.5 border-2 border-dashed border-red-500 rounded-full bg-red-500/20></span>
            <span className=text-slate-700>Critical Shortage Zone</span>
          </div>
        </div>
      </div>

    </div>
  );
}
