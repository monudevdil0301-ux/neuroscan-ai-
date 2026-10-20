import React from 'react';
import { X, Printer, ShieldAlert, Activity } from 'lucide-react';
import type { DiagnosticAssessment, PatientProfile, TremorAnalysisResult, VoiceAnalysisResult, SpiralAnalysisResult } from '../types';

interface ClinicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  assessment: DiagnosticAssessment;
  tremor: TremorAnalysisResult;
  voice: VoiceAnalysisResult;
  spiral: SpiralAnalysisResult;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  isOpen,
  onClose,
  patient,
  assessment,
  tremor,
  voice,
  spiral,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Action Bar */}
        <div className="no-print bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">
              Clinical Decision Support (CDS) Report Preview
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 space-y-6 text-slate-100 print:text-slate-900 print:p-6 print:space-y-4">
          {/* Clinic Header */}
          <div className="flex items-start justify-between border-b-2 border-cyan-500/80 pb-4 print:border-cyan-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-cyan-400 print:text-cyan-800">
                  NEUROSCAN AI
                </span>
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 print:bg-slate-200 print:text-slate-800">
                  Clinical Motor Exam
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Quantitative Multi-Modal Movement Disorder Assessment System
              </p>
              <p className="text-[11px] text-slate-500 print:text-slate-600">
                Movement Disorder Society-Unified Parkinson's Disease Rating Scale (MDS-UPDRS III) Protocol
              </p>
            </div>

            <div className="text-right text-xs space-y-1 font-mono">
              <div className="text-slate-400 print:text-slate-600">
                Report ID: <span className="font-bold text-white print:text-black">{assessment.sessionHash}</span>
              </div>
              <div className="text-slate-400 print:text-slate-600">
                Date: <span className="text-white print:text-black">{assessment.assessmentDate}</span>
              </div>
              <div className="text-slate-400 print:text-slate-600">
                Software: <span className="text-cyan-400 print:text-cyan-800">v2.4-PROD</span>
              </div>
            </div>
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300 text-xs">
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Patient ID</span>
              <span className="font-mono font-bold text-white print:text-black">{patient.id}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Age / Gender</span>
              <span className="text-white print:text-black font-medium">{patient.age} yrs / {patient.gender}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Handedness</span>
              <span className="text-white print:text-black font-medium">{patient.handedness} Dominant</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Prior Diagnosis</span>
              <span className="text-white print:text-black font-medium">
                {patient.hasPreviousDiagnosis ? 'Confirmed Parkinsonism' : 'None / De Novo'}
              </span>
            </div>
          </div>

          {/* Diagnostic Result Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:border-slate-300 print:bg-slate-50 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Overall Diagnostic Impression
              </span>
              <h2 className="text-xl font-bold text-cyan-400 print:text-cyan-900 mt-0.5">
                {assessment.riskCategory}
              </h2>
            </div>

            <div className="flex items-center gap-6 text-right">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Risk Score
                </span>
                <span className="text-2xl font-black font-mono text-white print:text-black">
                  {assessment.compositeRiskScore} / 100
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Est. MDS-UPDRS
                </span>
                <span className="text-2xl font-black font-mono text-cyan-400 print:text-cyan-900">
                  {assessment.estimatedMdsUpdrsScore} pts
                </span>
              </div>
            </div>
          </div>

          {/* Biomarkers Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black">
              Biomarker Quantification Breakdown
            </h4>
            <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300 rounded-lg overflow-hidden">
              <thead className="bg-slate-950 print:bg-slate-200 text-slate-400 print:text-slate-700 font-mono text-[11px]">
                <tr>
                  <th className="py-2 px-3">Test Modality</th>
                  <th className="py-2 px-3">Measured Biomarker</th>
                  <th className="py-2 px-3">Normative Range</th>
                  <th className="py-2 px-3">MDS-UPDRS Item</th>
                  <th className="py-2 px-3">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-300 text-[11px]">
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-200 print:text-black">Computer Vision</td>
                  <td className="py-2 px-3 font-mono">Rest Tremor: {tremor.dominantFrequency.toFixed(1)} Hz</td>
                  <td className="py-2 px-3 text-slate-400 print:text-slate-600">N/A (4-6 Hz is PD)</td>
                  <td className="py-2 px-3 font-mono">Item 3.17</td>
                  <td className="py-2 px-3 font-bold uppercase">{tremor.status}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-200 print:text-black">Finger Tapping</td>
                  <td className="py-2 px-3 font-mono">Rhythm CV: {tremor.tapRhythmCV.toFixed(1)}% | Decay: {tremor.amplitudeDecay.toFixed(1)}%</td>
                  <td className="py-2 px-3 text-slate-400 print:text-slate-600">&lt; 15.0% CV</td>
                  <td className="py-2 px-3 font-mono">Item 3.4</td>
                  <td className="py-2 px-3 font-bold uppercase">{tremor.amplitudeDecay > 20 ? 'abnormal' : 'normal'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-200 print:text-black">Acoustic Voice</td>
                  <td className="py-2 px-3 font-mono">Jitter: {voice.jitterPercent.toFixed(2)}% | Shimmer: {voice.shimmerPercent.toFixed(2)}%</td>
                  <td className="py-2 px-3 text-slate-400 print:text-slate-600">&lt; 1.04% Jitter</td>
                  <td className="py-2 px-3 font-mono">Item 3.1</td>
                  <td className="py-2 px-3 font-bold uppercase">{voice.status}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-200 print:text-black">Spiral Kinematics</td>
                  <td className="py-2 px-3 font-mono">Jerk: {spiral.drawingVelocityJerk.toFixed(2)} | Micrographia: {spiral.micrographiaRatio.toFixed(2)}</td>
                  <td className="py-2 px-3 text-slate-400 print:text-slate-600">&lt; 2.50 Jerk</td>
                  <td className="py-2 px-3 font-mono">Item 3.16</td>
                  <td className="py-2 px-3 font-bold uppercase">{spiral.status}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Observations & Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300">
              <h5 className="font-bold uppercase tracking-wider text-slate-400 mb-2">
                Automated Clinical Observations
              </h5>
              <ul className="space-y-1 list-disc list-inside text-slate-300 print:text-slate-800">
                {assessment.clinicalObservations.map((obs, i) => (
                  <li key={i}>{obs}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300">
              <h5 className="font-bold uppercase tracking-wider text-cyan-400 print:text-cyan-800 mb-2">
                Recommended Neurological Next Steps
              </h5>
              <ul className="space-y-1 list-disc list-inside text-slate-300 print:text-slate-800">
                {assessment.neurologicalRecommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Signature & Disclaimer */}
          <div className="border-t border-slate-800 print:border-slate-300 pt-4 flex items-end justify-between text-xs">
            <div className="space-y-1 max-w-md">
              <div className="flex items-center gap-1.5 text-amber-400 print:text-amber-700 font-bold text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Investigational Clinical Decision Support Tool</span>
              </div>
              <p className="text-[10px] text-slate-400 print:text-slate-600 leading-tight">
                This report is generated for screening and telehealth triage purposes. It does not replace a comprehensive in-person examination by a board-certified neurologist. Validated under MDS-UPDRS Part III clinical guidelines.
              </p>
            </div>

            <div className="text-right">
              <div className="w-48 border-b border-slate-600 print:border-slate-800 mb-1" />
              <span className="text-[11px] text-slate-400 print:text-slate-600 font-mono">
                Attending Neurologist Signature
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
