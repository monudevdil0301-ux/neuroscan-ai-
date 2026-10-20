import React, { useState } from 'react';
import { Brain } from 'lucide-react';

import type {
  ClinicalPresetId,
  DiagnosticAssessment,
  PatientProfile,
  TremorAnalysisResult,
  VoiceAnalysisResult,
  SpiralAnalysisResult,
} from './types';
import { CLINICAL_PRESETS } from './data/clinicalBenchmarks';
import { computeCompositeAssessment } from './utils/signalProcessing';

import { Navbar } from './components/Navbar';
import { TremorModule } from './components/TremorModule';
import { VoiceModule } from './components/VoiceModule';
import { SpiralModule } from './components/SpiralModule';
import { DiagnosticSummary } from './components/DiagnosticSummary';
import { ClinicalReportModal } from './components/ClinicalReportModal';
import { ScientificLiteratureModal } from './components/ScientificLiteratureModal';

export const App: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<ClinicalPresetId>('early-pd');
  const [patient, setPatient] = useState<PatientProfile>(CLINICAL_PRESETS['early-pd'].patient);
  const [tremor, setTremor] = useState<TremorAnalysisResult>(CLINICAL_PRESETS['early-pd'].tremor);
  const [voice, setVoice] = useState<VoiceAnalysisResult>(CLINICAL_PRESETS['early-pd'].voice);
  const [spiral, setSpiral] = useState<SpiralAnalysisResult>(CLINICAL_PRESETS['early-pd'].spiral);
  const [assessment, setAssessment] = useState<DiagnosticAssessment>(CLINICAL_PRESETS['early-pd'].diagnostic);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLiteratureOpen, setIsLiteratureOpen] = useState(false);

  const handleSelectPreset = (id: ClinicalPresetId) => {
    setSelectedPresetId(id);
    const p = CLINICAL_PRESETS[id];
    setPatient(p.patient);
    setTremor(p.tremor);
    setVoice(p.voice);
    setSpiral(p.spiral);
    const diag = computeCompositeAssessment(p.tremor, p.voice, p.spiral);
    setAssessment(diag);
  };

  const handleUpdateTremor = (newTremor: TremorAnalysisResult) => {
    setTremor(newTremor);
    setAssessment(computeCompositeAssessment(newTremor, voice, spiral));
  };

  const handleUpdateVoice = (newVoice: VoiceAnalysisResult) => {
    setVoice(newVoice);
    setAssessment(computeCompositeAssessment(tremor, newVoice, spiral));
  };

  const handleUpdateSpiral = (newSpiral: SpiralAnalysisResult) => {
    setSpiral(newSpiral);
    setAssessment(computeCompositeAssessment(tremor, voice, newSpiral));
  };

  const handleResetSession = () => {
    handleSelectPreset('healthy');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentPreset={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenLiterature={() => setIsLiteratureOpen(true)}
        onResetSession={handleResetSession}
        riskScore={assessment.compositeRiskScore}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Clinical Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-850 border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-semibold">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Next-Gen Decentralized Neuromuscular Screening</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                Multi-Modal AI Screening for{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  Parkinson's & Movement Disorders
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                NeuroScan AI bridges the clinical specialist gap by capturing sub-clinical resting tremor (4–6 Hz), bradykinesia rhythm fatigue, acoustic dysarthria perturbation (Jitter/Shimmer), and micrographia directly through standard webcams, microphones, and touchscreens.
              </p>
            </div>

            {/* Current Active Patient Info Card */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shrink-0 min-w-[280px] shadow-lg">
              <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-mono">SUBJECT FILE</span>
                <span className="font-bold text-cyan-400 font-mono">{patient.id}</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Demographics:</span>
                  <span className="font-medium text-slate-200">{patient.age} yrs, {patient.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dominant Hand:</span>
                  <span className="font-medium text-slate-200">{patient.handedness}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cohort Profile:</span>
                  <span className="font-semibold text-teal-400">{CLINICAL_PRESETS[selectedPresetId].badge}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80 line-clamp-2">
                {patient.notes}
              </p>
            </div>
          </div>
        </div>

        {/* 3 Interactive Biomarker Modules */}
        <div className="space-y-6">
          <TremorModule
            initialResult={tremor}
            onUpdate={handleUpdateTremor}
          />

          <VoiceModule
            initialResult={voice}
            onUpdate={handleUpdateVoice}
          />

          <SpiralModule
            initialResult={spiral}
            onUpdate={handleUpdateSpiral}
          />
        </div>

        {/* Diagnostic Assessment & Explainable AI */}
        <DiagnosticSummary
          assessment={assessment}
          onOpenReport={() => setIsReportOpen(true)}
        />
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">NeuroScan AI</span>
            <span>•</span>
            <span>EurekaDev 2026 Global Innovation Challenge (Coding Track)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsLiteratureOpen(true)}
              className="hover:text-cyan-400 transition-colors"
            >
              Scientific References & Citations
            </button>
            <span>•</span>
            <button
              onClick={() => setIsReportOpen(true)}
              className="hover:text-cyan-400 transition-colors"
            >
              Export CDS Report
            </button>
            <span>•</span>
            <span className="text-slate-600">Investigational Software Only</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ClinicalReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        patient={patient}
        assessment={assessment}
        tremor={tremor}
        voice={voice}
        spiral={spiral}
      />

      <ScientificLiteratureModal
        isOpen={isLiteratureOpen}
        onClose={() => setIsLiteratureOpen(false)}
      />
    </div>
  );
};

export default App;
