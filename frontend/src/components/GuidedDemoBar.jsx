import React, { useState, useEffect } from 'react';
import { useRedRelay } from '../context/RedRelayContext';
import { Play, Pause, SkipForward, RotateCcw, ChevronUp, ChevronDown, Sparkles, Check, ArrowRight } from 'lucide-react';

export default function GuidedDemoBar({ setCurrentView, onOpenCreateModal }) {
  const {
    demoSteps,
    demoStepIndex,
    executeDemoStep,
    advanceDemo,
    resetDemo,
    isDemoRunning,
    setIsDemoRunning
  } = useRedRelay();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentStep = demoSteps[demoStepIndex];
  const progressPercent = Math.round(((demoStepIndex + 1) / demoSteps.length) * 100);

  // Auto-play timer effect
  useEffect(() => {
    let interval = null;
    if (isDemoRunning) {
      interval = setInterval(() => {
        if (demoStepIndex < demoSteps.length - 1) {
          executeDemoStep(demoStepIndex + 2);
          // auto switch views to showcase current action
          handleViewSync(demoStepIndex + 2);
        } else {
          setIsDemoRunning(false);
        }
      }, 4200);
    }
    return () => clearInterval(interval);
  }, [isDemoRunning, demoStepIndex]);

  const handleViewSync = (stepNum) => {
    if (stepNum === 1) setCurrentView('dashboard');
    if (stepNum === 2) onOpenCreateModal();
    if (stepNum === 3) onOpenCreateModal();
    if (stepNum === 4 || stepNum === 5) setCurrentView('details');
    if (stepNum === 6) setCurrentView('ai');
    if (stepNum === 7) setCurrentView('donor_dashboard');
    if (stepNum === 8) setCurrentView('bank_dashboard');
    if (stepNum === 9) setCurrentView('details');
    if (stepNum === 10) setCurrentView('bank_dashboard');
    if (stepNum === 11) setCurrentView('details');
    if (stepNum === 12) setCurrentView('analytics');
  };

  const handleStepClick = (idx) => {
    executeDemoStep(idx + 1);
    handleViewSync(idx + 1);
  };

  return (
    <div className=bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 text-white border-b border-red-500/20 shadow-md>
      <div className=max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5>
        <div className=flex flex-col md:flex-row md:items-center justify-between gap-3>
          
          {/* Header & Current Step Info */}
          <div className=flex items-center gap-3>
            <div className=flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/30 border border-red-500/40 text-red-400 shrink-0>
              <Sparkles className=w-4 h-4 animate-spin-slow />
            </div>

            <div>
              <div className=flex items-center gap-2>
                <span className=text-[11px] font-bold tracking-wider uppercase text-red-400>
                  Hackathon 12-Step Live Demo
                </span>
                <span className=text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono font-semibold border border-red-500/30>
                  Step {demoStepIndex + 1} of 12
                </span>
                <span className=text-[11px] text-slate-400 hidden sm:inline>
                  • Role: <span className=text-white font-medium capitalize>{currentStep?.targetRole.replace('_', ' ')}</span>
                </span>
              </div>
              <p className=text-xs font-semibold text-slate-100 flex items-center gap-1.5 mt-0.5>
                <span>{currentStep?.title}</span>
                <span className=text-slate-400 font-normal hidden lg:inline>— {currentStep?.description}</span>
              </p>
            </div>
          </div>

          {/* Stepper Controls */}
          <div className=flex items-center gap-2 self-end md:self-center shrink-0>
            {/* Auto Play Button */}
            <button
              onClick={() => setIsDemoRunning(!isDemoRunning)}
              className={lex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all }
            >
              {isDemoRunning ? (
                <>
                  <Pause className=w-3.5 h-3.5 /> Pause Auto
                </>
              ) : (
                <>
                  <Play className=w-3.5 h-3.5 /> Auto-Play Demo
                </>
              )}
            </button>

            {/* Next Step */}
            <button
              onClick={() => {
                const next = demoStepIndex + 2;
                if (next <= 12) {
                  executeDemoStep(next);
                  handleViewSync(next);
                } else {
                  executeDemoStep(1);
                  handleViewSync(1);
                }
              }}
              className=flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors
            >
              <span>Next</span>
              <SkipForward className=w-3.5 h-3.5 />
            </button>

            {/* Reset */}
            <button
              onClick={resetDemo}
              className=p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors
              title=Reset Demo
            >
              <RotateCcw className=w-4 h-4 />
            </button>

            {/* Toggle mini list */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className=p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors
              title={isCollapsed ? 'Expand step dots' : 'Collapse'}
            >
              {isCollapsed ? <ChevronDown className=w-4 h-4 /> : <ChevronUp className=w-4 h-4 />}
            </button>
          </div>
        </div>

        {/* Mini Step Track Indicators */}
        {!isCollapsed && (
          <div className=mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none>
            {demoSteps.map((s, idx) => {
              const isPast = idx < demoStepIndex;
              const isCurrent = idx === demoStepIndex;
              return (
                <button
                  key={s.step}
                  onClick={() => handleStepClick(idx)}
                  className={lex-1 min-w-[70px] text-left p-1 rounded transition-all group }
                  title={${s.title}: }
                >
                  <div className=flex items-center gap-1>
                    <span
                      className={w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold }
                    >
                      {isPast ? <Check className=w-2 h-2 /> : s.step}
                    </span>
                    <span className=text-[10px] truncate font-medium>
                      Step {s.step}
                    </span>
                  </div>
                  <div className=w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden>
                    <div
                      className={h-full }
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
