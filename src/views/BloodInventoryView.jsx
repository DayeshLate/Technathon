import React, { useState } from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import { mockData } from '../data/mockData';
import {
  Droplet,
  AlertTriangle,
  Plus,
  Building2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Sliders,
  X
} from 'lucide-react';

export default function BloodInventoryView() {
  const {
    bloodBanks,
    getInventoryAggregates,
    updateInventoryUnit,
    showToast
  } = useRedRelay();

  const [selectedBankId, setSelectedBankId] = useState('ALL');
  const [searchBankQuery, setSearchBankQuery] = useState('');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [modalBankId, setModalBankId] = useState('BB1');
  const [modalBloodGroup, setModalBloodGroup] = useState('O-');
  const [modalUnitChange, setModalUnitChange] = useState(5);

  const inventorySummary = getInventoryAggregates();

  const getStatus = (available, threshold) => {
    if (available < 22) {
      return { label: 'CRITICAL', color: 'text-red-700 bg-red-100 border-red-200', dot: 'bg-red-500' };
    }
    if (available < 45) {
      return { label: 'LOW', color: 'text-amber-800 bg-amber-100 border-amber-200', dot: 'bg-amber-500' };
    }
    return { label: 'HEALTHY', color: 'text-emerald-700 bg-emerald-100 border-emerald-200', dot: 'bg-emerald-500' };
  };

  const handleUpdateStock = (e) => {
    e.preventDefault();
    updateInventoryUnit(modalBankId, modalBloodGroup, Number(modalUnitChange));
    setIsUpdateModalOpen(false);
  };

  return (
    <div className=space-y-6 pb-16>
      
      {/* Header */}
      <div className=bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4>
        <div>
          <div className=flex items-center gap-2>
            <div className=p-2 rounded-xl bg-red-100 text-red-600>
              <Droplet className=w-5 h-5 fill-red-600 />
            </div>
            <h1 className=text-xl font-bold text-slate-900 font-display>
              Citywide Blood Inventory Telemetry
            </h1>
          </div>
          <p className=text-xs text-slate-500 mt-1>
            Real-time stock monitoring across 8 licensed blood centres in the Greater Mumbai Metropolitan region.
          </p>
        </div>

        <button
          onClick={() => setIsUpdateModalOpen(true)}
          className=px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-semibold shadow-md shadow-red-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto
        >
          <Plus className=w-4 h-4 />
          <span>Update Inventory</span>
        </button>
      </div>

      {/* 8 Blood Group Cards Grid */}
      <div className=grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4>
        {mockData.bloodGroups.map((bg) => {
          const data = inventorySummary[bg] || { available: 0, reserved: 0, threshold: 20 };
          const status = getStatus(data.available, data.threshold);
          return (
            <div
              key={bg}
              className=bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between
            >
              <div>
                <div className=flex items-center justify-between mb-3>
                  <div className=w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center font-black text-xl font-display shadow-sm>
                    {bg}
                  </div>
                  <span
                    className={px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 }
                  >
                    <span className={w-2 h-2 rounded-full }></span>
                    {status.label}
                  </span>
                </div>

                <div className=space-y-2 mt-4 text-xs>
                  <div className=flex justify-between items-center py-1 border-b border-slate-100>
                    <span className=text-slate-500>Available Units:</span>
                    <span className=font-extrabold text-base text-slate-900>{data.available}</span>
                  </div>
                  <div className=flex justify-between items-center py-1 border-b border-slate-100>
                    <span className=text-slate-500>Reserved Units:</span>
                    <span className=font-semibold text-amber-600>{data.reserved}</span>
                  </div>
                  <div className=flex justify-between items-center py-1>
                    <span className=text-slate-500>Critical Threshold:</span>
                    <span className=font-semibold text-slate-700>{data.threshold}</span>
                  </div>
                </div>
              </div>

              {/* Progress bar relative to threshold */}
              <div className=mt-4 pt-3 border-t border-slate-100>
                <div className=w-full h-2 rounded-full bg-slate-100 overflow-hidden>
                  <div
                    className={h-full rounded-full }
                    style={{ width: ${Math.min(100, Math.round((data.available / 60) * 100))}% }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Blood Bank Detailed Inventory Table */}
      <div className=bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden>
        <div className=p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4>
          <div>
            <h3 className=text-sm font-bold text-slate-900>
              Facility-Wise Stock Breakdown
            </h3>
            <p className=text-xs text-slate-500>
              Live inventory levels reported by each registered blood bank
            </p>
          </div>

          <div className=flex items-center gap-3>
            <div className=relative>
              <input
                type=text
                placeholder=Search blood bank...
                value={searchBankQuery}
                onChange={(e) => setSearchBankQuery(e.target.value)}
                className=text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:bg-white focus:outline-none
              />
              <Search className=w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 />
            </div>

            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className=text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800
            >
              <option value=ALL>All 8 Blood Banks</option>
              {bloodBanks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className=overflow-x-auto>
          <table className=w-full text-left border-collapse text-xs>
            <thead>
              <tr className=bg-slate-50 text-slate-500 font-semibold border-b border-slate-100>
                <th className=py-3 px-4>Blood Bank Facility</th>
                <th className=py-3 px-4>Location / Area</th>
                <th className=py-3 px-4>Contact</th>
                <th className=py-3 px-3 text-center>A+</th>
                <th className=py-3 px-3 text-center>A-</th>
                <th className=py-3 px-3 text-center>B+</th>
                <th className=py-3 px-3 text-center>B-</th>
                <th className=py-3 px-3 text-center>AB+</th>
                <th className=py-3 px-3 text-center>AB-</th>
                <th className=py-3 px-3 text-center>O+</th>
                <th className=py-3 px-3 text-center>O-</th>
                <th className=py-3 px-4 text-right>Quick Stock</th>
              </tr>
            </thead>
            <tbody className=divide-y divide-slate-100>
              {bloodBanks
                .filter((b) => {
                  if (selectedBankId !== 'ALL' && b.id !== selectedBankId) return false;
                  if (searchBankQuery && !b.name.toLowerCase().includes(searchBankQuery.toLowerCase()) && !b.area.toLowerCase().includes(searchBankQuery.toLowerCase())) return false;
                  return true;
                })
                .map((bank) => (
                  <tr key={bank.id} className=hover:bg-slate-50/70 transition-colors>
                    <td className=py-3.5 px-4>
                      <div className=flex items-center gap-2>
                        <Building2 className=w-4 h-4 text-emerald-600 shrink-0 />
                        <div>
                          <p className=font-bold text-slate-900>{bank.name}</p>
                          <span className=font-mono text-[10px] text-slate-400>ID: {bank.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className=py-3.5 px-4 text-slate-600>{bank.area}</td>
                    <td className=py-3.5 px-4 font-mono text-slate-500>{bank.contact}</td>
                    {mockData.bloodGroups.map((bg) => {
                      const units = bank.inventory[bg] || 0;
                      const isLow = units < 8;
                      return (
                        <td key={bg} className=py-3.5 px-3 text-center>
                          <span
                            className={inline-block px-1.5 py-0.5 rounded font-bold text-[11px] }
                          >
                            {units}
                          </span>
                        </td>
                      );
                    })}
                    <td className=py-3.5 px-4 text-right>
                      <button
                        onClick={() => {
                          setModalBankId(bank.id);
                          setIsUpdateModalOpen(true);
                        }}
                        className=px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Inventory Modal */}
      {isUpdateModalOpen && (
        <div className=fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4>
          <div className=bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150>
            <div className=flex items-center justify-between pb-3 border-b border-slate-100>
              <h3 className=font-bold text-base text-slate-900>
                Update Blood Unit Stock
              </h3>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className=text-slate-400 hover:text-slate-700
              >
                <X className=w-5 h-5 />
              </button>
            </div>

            <form onSubmit={handleUpdateStock} className=space-y-4 mt-4 text-xs>
              <div>
                <label className=block font-semibold text-slate-700 mb-1>
                  Select Blood Bank Facility
                </label>
                <select
                  value={modalBankId}
                  onChange={(e) => setModalBankId(e.target.value)}
                  className=w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold
                >
                  {bloodBanks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.area})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className=block font-semibold text-slate-700 mb-1>
                  Blood Group
                </label>
                <div className=grid grid-cols-4 gap-1.5>
                  {mockData.bloodGroups.map((bg) => (
                    <button
                      type=button
                      key={bg}
                      onClick={() => setModalBloodGroup(bg)}
                      className={py-1.5 rounded-lg font-bold }
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className=block font-semibold text-slate-700 mb-1>
                  Units Adjustment (+ to add, - to dispatch)
                </label>
                <div className=flex items-center gap-2>
                  <button
                    type=button
                    onClick={() => setModalUnitChange((prev) => prev - 1)}
                    className=w-8 h-8 rounded-lg bg-slate-200 text-slate-800 font-bold text-base
                  >
                    -
                  </button>
                  <input
                    type=number
                    value={modalUnitChange}
                    onChange={(e) => setModalUnitChange(Number(e.target.value))}
                    className=w-full text-center bg-slate-50 border border-slate-200 rounded-xl py-1.5 font-bold text-slate-900
                  />
                  <button
                    type=button
                    onClick={() => setModalUnitChange((prev) => prev + 1)}
                    className=w-8 h-8 rounded-lg bg-slate-200 text-slate-800 font-bold text-base
                  >
                    +
                  </button>
                </div>
              </div>

              <div className=pt-2 flex justify-end gap-2>
                <button
                  type=button
                  onClick={() => setIsUpdateModalOpen(false)}
                  className=px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100
                >
                  Cancel
                </button>
                <button
                  type=submit
                  className=px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm
                >
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
