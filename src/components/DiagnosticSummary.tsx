import React from 'react';
import { FileText, CheckCircle2, ChevronRight, BarChart3, Stethoscope, AlertTriangle, Download, GitFork } from 'lucide-react';
import type { DiagnosticAssessment } from '../types';

interface DiagnosticSummaryProps {
  assessment: DiagnosticAssessment;
  onOpenReport: () => void;
}

export const DiagnosticSummary: React.FC<DiagnosticSummaryProps> = ({ assessment, onOpenReport }) => {
  const { compositeRiskScore, riskCategory, estimatedMdsUpdrsScore, confidenceInterval, biomarkers, clinicalObservations, neurologicalRecommendations } = assessment;

  const isHighRisk = compositeRiskScore >= 40;
  const isModerate = compositeRiskScore >= 20 && compositeRiskScore < 40;

  const strokeColor = isHighRisk ? '#f43f5e' : isModerate ? '#f59e0b' : '#10b981';

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (compositeRiskScore / 100) * circumference;

  // Export raw JSON dataset
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(assessment, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `neuroscan-telemetry-${assessment.sessionHash}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Multi-Modal Clinical Diagnostic Assessment
            </h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
              ID: {assessment.sessionHash}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated digital motor, acoustic, and kinematic biomarkers weighted against MDS-UPDRS Part III
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-750 rounded-xl transition-all"
            title="Download Raw Telemetry as JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Raw Data (.JSON)</span>
          </button>

          <button
            onClick={onOpenReport}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Full CDS Clinical Report</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        <div className="md:col-span-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-center gap-5">
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="#1e293b"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke={strokeColor}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {compositeRiskScore}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Index / 100</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              Composite Risk
            </span>
            <h4
              className={`text-base font-bold mt-0.5 ${
                isHighRisk ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {riskCategory}
            </h4>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Confidence: {confidenceInterval[0]}%–{confidenceInterval[1]}%
            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              MDS-UPDRS Part III
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
              Motor Exam
            </span>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {estimatedMdsUpdrsScore}
            </span>
            <span className="text-xs text-slate-400">/ 12 pts (sampled)</span>
          </div>

          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div>• Tremor at Rest (3.17): <span className="text-slate-200 font-mono font-medium">{assessment.biomarkers[0].status === 'abnormal' ? '2-3 pts' : '0-1 pts'}</span></div>
            <div>• Finger Tapping (3.4): <span className="text-slate-200 font-mono font-medium">{assessment.biomarkers[1].status === 'abnormal' ? '2-3 pts' : '0-1 pts'}</span></div>
            <div>• Speech/Phonation (3.1): <span className="text-slate-200 font-mono font-medium">{assessment.biomarkers[3].status === 'abnormal' ? '2 pts' : '0 pts'}</span></div>
          </div>
        </div>

        <div className="md:col-span-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between h-full">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Primary Clinical Action
          </span>

          <p className="text-xs text-slate-200 font-medium my-2 leading-relaxed">
            {neurologicalRecommendations[0]}
          </p>

          <div className="text-[11px] text-slate-400 font-mono">
            Assessment Date: {assessment.assessmentDate}
          </div>
        </div>
      </div>

      {/* Differential Diagnosis Clinical Matrix */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <GitFork className="w-4 h-4 text-cyan-400" />
            Automated Differential Diagnosis Matrix
          </h3>
          <span className="text-[11px] font-mono text-cyan-400">Bhatia et al. Clinical Framework</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className={`p-3 rounded-lg border ${compositeRiskScore >= 40 && assessment.biomarkers[0].value <= 6.2 ? 'bg-cyan-950/40 border-cyan-500/60' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-200">Idiopathic Parkinson's</span>
              <span className="text-[10px] font-mono font-bold text-cyan-400">
                {compositeRiskScore >= 40 && assessment.biomarkers[0].value <= 6.2 ? 'Primary Match' : 'Secondary'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Characterized by 4–6 Hz pill-rolling rest tremor, progressive tapping amplitude decay, and micrographia.
            </p>
          </div>

          <div className={`p-3 rounded-lg border ${assessment.biomarkers[0].value > 7.0 ? 'bg-cyan-950/40 border-cyan-500/60' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-200">Essential Tremor (ET)</span>
              <span className="text-[10px] font-mono font-bold text-cyan-400">
                {assessment.biomarkers[0].value > 7.0 ? 'Primary Match' : 'Low Probability'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              High-frequency (8–12 Hz) action/kinetic tremor with preserved tapping rhythm and absent micrographia.
            </p>
          </div>

          <div className={`p-3 rounded-lg border ${compositeRiskScore < 20 ? 'bg-emerald-950/40 border-emerald-500/60' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-200">Normative Aging</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400">
                {compositeRiskScore < 20 ? 'Normal' : 'Excluded'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Kinematics and acoustic perturbation indices within healthy population percentiles (&lt;1.04% Jitter).
            </p>
          </div>
        </div>
      </div>

      {/* Biomarker Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Explainable AI (XAI) Biomarker Feature Matrix
          </h3>
          <span className="text-xs text-slate-500">6 Normalized Clinical Biomarkers</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Biomarker Feature</th>
                <th className="py-2.5 px-3">Measured Value</th>
                <th className="py-2.5 px-3">Clinical Reference Interval</th>
                <th className="py-2.5 px-3">Weight</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
              {biomarkers.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-200">{b.name}</div>
                    <div className="text-[10px] text-slate-400">{b.description}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-100">
                    {b.value.toFixed(2)} {b.unit}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {b.normalRange}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {(b.weight * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        b.status === 'abnormal'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                          : b.status === 'borderline'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {b.status === 'abnormal' ? (
                        <>
                          <AlertTriangle className="w-3 h-3" /> Abnormal
                        </>
                      ) : b.status === 'borderline' ? (
                        <>
                          <AlertTriangle className="w-3 h-3" /> Borderline
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Normal
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observations & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Automated Neurological Observations
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {clinicalObservations.map((obs, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Clinical Decision Support Guidance
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {neurologicalRecommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
