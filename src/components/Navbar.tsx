import React from 'react';
import { Activity, FileText, BookOpen, RotateCcw, Sparkles, PlayCircle, Database } from 'lucide-react';
import type { ClinicalPresetId } from '../types';
import { CLINICAL_PRESETS } from '../data/clinicalBenchmarks';

interface NavbarProps {
  currentPreset: ClinicalPresetId;
  onSelectPreset: (presetId: ClinicalPresetId) => void;
  onOpenReport: () => void;
  onOpenLiterature: () => void;
  onOpenValidationModal: () => void;
  onStartGuidedExam: () => void;
  onResetSession: () => void;
  riskScore: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPreset,
  onSelectPreset,
  onOpenReport,
  onOpenLiterature,
  onOpenValidationModal,
  onStartGuidedExam,
  onResetSession,
  riskScore,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                NeuroScan AI
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                MDS-UPDRS v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Multi-Modal Motor & Acoustic Biomarker Screening
            </p>
          </div>
        </div>

        {/* Clinical Preset Quick Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 hidden md:inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Clinical Benchmark:
          </span>
          <select
            value={currentPreset}
            onChange={(e) => onSelectPreset(e.target.value as ClinicalPresetId)}
            className="bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 hover:border-slate-600 transition-colors"
          >
            {Object.values(CLINICAL_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onStartGuidedExam}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-lg shadow-md shadow-amber-500/20 transition-all transform active:scale-95"
            title="Start Guided Patient Exam Wizard"
          >
            <PlayCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Guided Exam</span>
          </button>

          <button
            onClick={onOpenValidationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-all"
            title="Real-World Clinical Trial Datasets (Oxford, PaHaW, mPower)"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Real Datasets</span>
          </button>

          <button
            onClick={onOpenLiterature}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-all"
            title="Scientific Methodology & Literature"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Citations</span>
          </button>

          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 rounded-lg shadow-md shadow-cyan-500/20 transition-all transform active:scale-95"
            title="Export Clinical Decision Support Report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CDS Report</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-900/20 text-[10px] font-bold">
              {riskScore}%
            </span>
          </button>

          <button
            onClick={onResetSession}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Reset to Baseline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
