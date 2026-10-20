import React, { useState } from 'react';
import { Brain, Zap, Sparkles } from 'lucide-react';

interface PathophysiologyExplorerProps {
  currentRiskScore: number;
}

export const PathophysiologyExplorer: React.FC<PathophysiologyExplorerProps> = ({ currentRiskScore }) => {
  const [levodopaState, setLevodopaState] = useState<'OFF' | 'ON'>('OFF');
  const [dopamineDeficitPct, setDopamineDeficitPct] = useState<number>(
    Math.min(85, Math.max(15, Math.round(currentRiskScore * 0.8 + 10)))
  );

  const toggleLevodopa = () => {
    setLevodopaState((prev) => (prev === 'OFF' ? 'ON' : 'OFF'));
  };

  const effectiveTremorReduction = levodopaState === 'ON' ? 68 : 0;
  const effectiveBradykinesiaGain = levodopaState === 'ON' ? 54 : 0;

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">
            Nigrostriatal Pathophysiology & Pharmacodynamics (Levodopa Response)
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 uppercase">
            MDS-UPDRS Item IV Benchmark
          </span>
        </div>

        {/* ON / OFF State Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Levodopa Challenge State:</span>
          <button
            onClick={toggleLevodopa}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              levodopaState === 'ON'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-300'
                : 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Medication: {levodopaState} State</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Diagram + Dopamine Slider */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left: Dopaminergic Circuit Model (7 cols) */}
        <div className="md:col-span-7 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Basal Ganglia Nigrostriatal Loop Simulation
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              SNc Loss: {dopamineDeficitPct}%
            </span>
          </div>

          {/* SVG Diagram of Basal Ganglia */}
          <div className="relative w-full h-44 bg-slate-900 rounded-lg p-2 border border-slate-800 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 400 160" className="w-full h-full">
              {/* Cortex */}
              <rect x="20" y="20" width="90" height="40" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="65" y="44" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle">Motor Cortex</text>

              {/* Striatum */}
              <rect x="155" y="20" width="90" height="40" rx="6" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" />
              <text x="200" y="44" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle">Striatum (Ca/Pu)</text>

              {/* Substantia Nigra Pars Compacta */}
              <rect
                x="155"
                y="100"
                width="90"
                height="40"
                rx="6"
                fill={levodopaState === 'ON' ? '#064e3b' : '#4c0519'}
                stroke={levodopaState === 'ON' ? '#10b981' : '#f43f5e'}
                strokeWidth="1.5"
              />
              <text x="200" y="120" fill="#e2e8f0" fontSize="9" fontWeight="bold" textAnchor="middle">Substantia Nigra</text>
              <text x="200" y="132" fill={levodopaState === 'ON' ? '#6ee7b7' : '#fda4af'} fontSize="8" textAnchor="middle">
                {levodopaState === 'ON' ? '+ Exogenous DA' : `-${dopamineDeficitPct}% DA Loss`}
              </text>

              {/* Thalamus */}
              <rect x="290" y="20" width="90" height="40" rx="6" fill="#1e293b" stroke="#818cf8" strokeWidth="1.5" />
              <text x="335" y="44" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle">VL Thalamus</text>

              {/* Connection Lines */}
              <path d="M 110 40 L 155 40" stroke="#64748b" strokeWidth="2" strokeDasharray="3,3" />
              <path d="M 245 40 L 290 40" stroke="#64748b" strokeWidth="2" strokeDasharray="3,3" />
              {/* DA projection line */}
              <path
                d="M 200 100 L 200 60"
                stroke={levodopaState === 'ON' ? '#10b981' : '#f43f5e'}
                strokeWidth="3"
                markerEnd="url(#arrow)"
              />
            </svg>

            {/* Status Overlay */}
            <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
              {levodopaState === 'ON' ? '🟢 Dopamine Replacement Active' : '🔴 Dopamine Depleted State (Rest Tremor Active)'}
            </div>
          </div>

          {/* Dopamine Deficit Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Substantia Nigra Dopamine Depletion:</span>
              <span className="font-mono text-white font-bold">{dopamineDeficitPct}% Deficit</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              value={dopamineDeficitPct}
              onChange={(e) => setDopamineDeficitPct(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (Asymptomatic)</span>
              <span>50–70% (Clinical Threshold)</span>
              <span>95% (Advanced)</span>
            </div>
          </div>
        </div>

        {/* Right: Pharmacological Impact & Clinical Response (5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-200 block mb-1">
              Levodopa Challenge Test Metrics
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In clinical neurology, a <strong>&gt;30% improvement in MDS-UPDRS Part III motor score</strong> following an acute Levodopa dose confirms idiopathic Parkinson's vs. atypical syndromes.
            </p>
          </div>

          <div className="space-y-3 my-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Tremor Amplitude Suppression</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {effectiveTremorReduction > 0 ? `-${effectiveTremorReduction}%` : '0% (Baseline)'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${effectiveTremorReduction}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Tapping Cadence & Bradykinesia Recovery</span>
                <span className="font-mono text-teal-400 font-bold">
                  {effectiveBradykinesiaGain > 0 ? `+${effectiveBradykinesiaGain}%` : '0% (Fatigued)'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${effectiveBradykinesiaGain}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-850 text-[11px] text-slate-300">
            <strong>Clinical Insight:</strong>{' '}
            {levodopaState === 'ON'
              ? 'Marked therapeutic responsiveness observed, indicating intact postsynaptic D2/D1 striatal receptors.'
              : 'Subject exhibits untreated motor dysfunction with 4–6 Hz oscillatory bursts and bradykinesia.'}
          </div>
        </div>
      </div>
    </div>
  );
};
