import React from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toast } = useRedRelay();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className=w-5 h-5 text-emerald-500 shrink-0 />,
    warning: <AlertTriangle className=w-5 h-5 text-amber-500 shrink-0 />,
    info: <Info className=w-5 h-5 text-blue-500 shrink-0 />
  };

  const borders = {
    success: 'border-emerald-200 bg-white shadow-emerald-500/10',
    warning: 'border-amber-200 bg-white shadow-amber-500/10',
    info: 'border-blue-200 bg-white shadow-blue-500/10'
  };

  return (
    <div className=fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-200>
      <div className={lex items-start gap-3 p-4 rounded-2xl border shadow-xl }>
        {icons[toast.type] || icons.info}
        <div className=flex-1 text-xs text-slate-800 font-medium leading-relaxed>
          {toast.message}
        </div>
      </div>
    </div>
  );
}
