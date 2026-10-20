export interface BiomarkerMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  normalRange: string;
  status: 'normal' | 'borderline' | 'abnormal';
  description: string;
  weight: number;
}

export interface TremorAnalysisResult {
  dominantFrequency: number; // Hz (4-6 Hz is classic Parkinsonian rest tremor)
  tremorAmplitude: number; // mm / norm
  peakPsd: number; // Power spectral density
  frequencySpectrum: { freq: number; power: number }[];
  tapCount: number;
  tapCadenceHz: number;
  tapRhythmCV: number; // Coefficient of variation of inter-tap intervals (<15% normal, >25% pathological)
  amplitudeDecay: number; // % drop over test duration (fatigue / bradykinesia)
  mdsUpdrsSubscore: number; // 0 to 4
  status: 'normal' | 'borderline' | 'abnormal';
  details: string;
}

export interface VoiceAnalysisResult {
  fundamentalFrequency: number; // F0 in Hz (approx 120Hz male, 210Hz female)
  jitterPercent: number; // Pitch perturbation (<1.04% normal, >1.5% pathological)
  shimmerPercent: number; // Amplitude perturbation (<3.81% normal, >5.0% pathological)
  hnrDb: number; // Harmonic-to-Noise Ratio (>20 dB normal, <15 dB pathological)
  pitchStabilityScore: number; // 0-100%
  mdsUpdrsSubscore: number; // 0 to 4 (speech)
  status: 'normal' | 'borderline' | 'abnormal';
  details: string;
}

export interface SpiralAnalysisResult {
  durationSeconds: number;
  drawingVelocityJerk: number; // Kinematic smoothness / jerk index
  radialDeviationVariance: number; // Distance error from ideal spiral
  micrographiaRatio: number; // Shrinkage compared to standard template (>0.85 normal, <0.70 micrographia)
  pointCount: number;
  mdsUpdrsSubscore: number; // 0 to 4 (kinetic tremor / drawing)
  status: 'normal' | 'borderline' | 'abnormal';
  details: string;
}

export interface DiagnosticAssessment {
  compositeRiskScore: number; // 0 to 100
  riskCategory: 'Normal / Healthy Range' | 'Mild Neuromuscular Anomaly' | 'Moderate Parkinsonian Features' | 'High / Severe Motor Impairment';
  estimatedMdsUpdrsScore: number; // Sum of motor subscores 0 - 12
  confidenceInterval: [number, number]; // e.g. [82%, 91%]
  biomarkers: BiomarkerMetric[];
  clinicalObservations: string[];
  neurologicalRecommendations: string[];
  assessmentDate: string;
  sessionHash: string;
}

export interface PatientProfile {
  id: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  handedness: 'Right' | 'Left' | 'Ambidextrous';
  notes?: string;
  hasPreviousDiagnosis: boolean;
}

export type ClinicalPresetId = 'healthy' | 'early-pd' | 'moderate-pd' | 'essential-tremor';

export interface ClinicalPreset {
  id: ClinicalPresetId;
  title: string;
  badge: string;
  description: string;
  patient: PatientProfile;
  tremor: TremorAnalysisResult;
  voice: VoiceAnalysisResult;
  spiral: SpiralAnalysisResult;
  diagnostic: DiagnosticAssessment;
}
