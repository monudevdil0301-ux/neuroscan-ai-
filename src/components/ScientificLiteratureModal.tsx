import React from 'react';
import { X, BookOpen, Award, FileCode } from 'lucide-react';
import { SCIENTIFIC_CITATIONS } from '../data/scientificLiterature';

interface ScientificLiteratureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScientificLiteratureModal: React.FC<ScientificLiteratureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">
              Scientific Methodology, Clinical Foundations & Citations
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Scientific Abstract */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              <Award className="w-4 h-4" />
              <span>Scientific Foundation & Validation</span>
            </div>
            <p className="leading-relaxed text-slate-300 text-xs">
              <strong>NeuroScan AI</strong> bridges clinical neurology and consumer digital health by translating gold-standard in-clinic neurological exams into decentralized browser-based signal processing pipelines. By combining computer vision kinematics (frame differencing & optical flow), Web Audio acoustic phonation analysis, and touch/pointer digitizer trajectory tracking, NeuroScan AI extracts quantitative digital biomarkers aligned with the <em>Movement Disorder Society Unified Parkinson’s Disease Rating Scale (MDS-UPDRS Part III)</em>.
            </p>
          </div>

          {/* Mathematical Formulations */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Mathematical Formulations Implemented</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-850 space-y-1">
                <span className="text-cyan-400 font-semibold block">1. Vocal Acoustic Jitter (Local %):</span>
                <p className="text-slate-300">
                  Jitter = [ (1 / (N - 1)) * Σ |T_i - T_(i+1)| ] / [ (1 / N) * Σ T_i ] * 100%
                </p>
                <span className="text-slate-500 text-[10px] block">
                  Measures cycle-to-cycle fundamental period variability. Pathological: &gt; 1.04%
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-850 space-y-1">
                <span className="text-cyan-400 font-semibold block">2. Vocal Acoustic Shimmer (%):</span>
                <p className="text-slate-300">
                  Shimmer = [ (1 / (N - 1)) * Σ |A_i - A_(i+1)| ] / [ (1 / N) * Σ A_i ] * 100%
                </p>
                <span className="text-slate-500 text-[10px] block">
                  Measures cycle-to-cycle peak amplitude perturbation. Pathological: &gt; 3.81%
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-850 space-y-1">
                <span className="text-cyan-400 font-semibold block">3. Kinematic Jerk Metric (Spiral Smoothness):</span>
                <p className="text-slate-300">
                  Jerk = (1 / T) * ∫ (d³x / dt³)² dt
                </p>
                <span className="text-slate-500 text-[10px] block">
                  Third time derivative of position; quantifies ataxia and sub-movement tremor spikes.
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-855 space-y-1">
                <span className="text-cyan-400 font-semibold block">4. Power Spectral Density Peak (FFT):</span>
                <p className="text-slate-300">
                  PSD(f) = (1 / N) * | Σ x(n) * w(n) * e^(-j 2π f n / N) |²
                </p>
                <span className="text-slate-500 text-[10px] block">
                  Hanning-windowed discrete Fourier transform targeting 4.0–6.0 Hz Parkinsonian peak.
                </span>
              </div>
            </div>
          </div>

          {/* References */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Peer-Reviewed Literature & Benchmark Citations
            </h4>

            <div className="space-y-3">
              {SCIENTIFIC_CITATIONS.map((cit) => (
                <div
                  key={cit.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h5 className="font-bold text-slate-100 text-xs leading-snug">
                      {cit.title}
                    </h5>
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                      {cit.year}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-medium">
                    {cit.authors} — <span className="italic text-slate-300">{cit.journal}</span>. DOI: {cit.doi}
                  </p>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {cit.summary}
                  </p>

                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-cyan-400 font-medium">
                      Implementation: {cit.clinicalRelevance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
