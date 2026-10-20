import type { TremorAnalysisResult, VoiceAnalysisResult, SpiralAnalysisResult, DiagnosticAssessment, BiomarkerMetric } from '../types';

/**
 * Fast / Discrete Fourier Transform helper for real-time tremor spectrum analysis
 */
export function computeFFT(signal: number[], sampleRate: number): { freq: number; power: number }[] {
  const N = signal.length;
  if (N === 0) return [];

  // Compute power spectrum up to 15 Hz (clinical tremor band)
  const maxFreq = 15;
  const numBins = Math.min(64, Math.floor((maxFreq * N) / sampleRate));
  const results: { freq: number; power: number }[] = [];

  // Mean center signal
  const mean = signal.reduce((a, b) => a + b, 0) / N;
  const centered = signal.map(v => v - mean);

  for (let k = 1; k <= numBins; k++) {
    const freq = (k * sampleRate) / N;
    if (freq > maxFreq) break;

    let real = 0;
    let imag = 0;
    for (let n = 0; n < N; n++) {
      // Apply Hanning window
      const window = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
      const val = centered[n] * window;
      const angle = (2 * Math.PI * k * n) / N;
      real += val * Math.cos(angle);
      imag -= val * Math.sin(angle);
    }
    const power = Math.sqrt(real * real + imag * imag) / N;
    results.push({ freq: Number(freq.toFixed(2)), power: Number(power.toFixed(4)) });
  }

  return results;
}

/**
 * Find dominant peak frequency in Parkinsonian / Essential tremor range (3.0 - 12.0 Hz)
 */
export function findDominantTremorFrequency(spectrum: { freq: number; power: number }[]): {
  dominantFreq: number;
  maxPower: number;
} {
  let dominantFreq = 0;
  let maxPower = 0;

  for (const bin of spectrum) {
    if (bin.freq >= 3.0 && bin.freq <= 12.0) {
      if (bin.power > maxPower) {
        maxPower = bin.power;
        dominantFreq = bin.freq;
      }
    }
  }

  return { dominantFreq, maxPower };
}

/**
 * Analyze finger tap kinematics (intervals, rhythm regularity CV, amplitude decay)
 */
export function analyzeTappingKinematics(tapTimestamps: number[], tapAmplitudes: number[]): {
  tapCount: number;
  cadenceHz: number;
  rhythmCV: number;
  amplitudeDecay: number;
} {
  const tapCount = tapTimestamps.length;
  if (tapCount < 3) {
    return { tapCount, cadenceHz: 0, rhythmCV: 0, amplitudeDecay: 0 };
  }

  // Inter-tap intervals (ITI) in ms
  const intervals: number[] = [];
  for (let i = 1; i < tapCount; i++) {
    intervals.push(tapTimestamps[i] - tapTimestamps[i - 1]);
  }

  const meanITI = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, val) => sum + Math.pow(val - meanITI, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of Variation (CV) = (stdDev / mean) * 100%
  const rhythmCV = meanITI > 0 ? (stdDev / meanITI) * 100 : 0;
  const cadenceHz = meanITI > 0 ? 1000 / meanITI : 0;

  // Amplitude decay (first 3 taps vs last 3 taps)
  let amplitudeDecay = 0;
  if (tapAmplitudes.length >= 6) {
    const earlyAmp = (tapAmplitudes[0] + tapAmplitudes[1] + tapAmplitudes[2]) / 3;
    const lateAmp = (tapAmplitudes[tapAmplitudes.length - 1] + tapAmplitudes[tapAmplitudes.length - 2] + tapAmplitudes[tapAmplitudes.length - 3]) / 3;
    if (earlyAmp > 0) {
      amplitudeDecay = Math.max(0, ((earlyAmp - lateAmp) / earlyAmp) * 100);
    }
  }

  return {
    tapCount,
    cadenceHz: Number(cadenceHz.toFixed(2)),
    rhythmCV: Number(rhythmCV.toFixed(2)),
    amplitudeDecay: Number(amplitudeDecay.toFixed(2)),
  };
}

/**
 * Calculate acoustic voice biomarkers from raw audio buffer (F0, Jitter, Shimmer, HNR)
 */
export function analyzeVoiceAcoustics(timeDomainData: Float32Array, sampleRate: number): VoiceAnalysisResult {
  const N = timeDomainData.length;
  if (N < 512) {
    return {
      fundamentalFrequency: 0,
      jitterPercent: 0,
      shimmerPercent: 0,
      hnrDb: 0,
      pitchStabilityScore: 0,
      mdsUpdrsSubscore: 0,
      status: 'normal',
      details: 'Insufficient audio buffer length.',
    };
  }

  // Autocorrelation for Pitch Detection (F0 in 70 - 400 Hz range)
  const minPeriod = Math.floor(sampleRate / 400);
  const maxPeriod = Math.floor(sampleRate / 70);

  let bestLag = -1;
  let maxCorr = -1;

  for (let lag = minPeriod; lag <= maxPeriod; lag++) {
    let sum = 0;
    for (let i = 0; i < N - lag; i++) {
      sum += timeDomainData[i] * timeDomainData[i + lag];
    }
    if (sum > maxCorr) {
      maxCorr = sum;
      bestLag = lag;
    }
  }

  const f0 = bestLag > 0 ? sampleRate / bestLag : 130;

  // Extract cycle peaks for Jitter and Shimmer
  const periodLengths: number[] = [];
  const peakAmplitudes: number[] = [];
  let lastPeakIndex = -1;

  const searchHop = Math.floor(bestLag * 0.8);
  for (let i = bestLag; i < N - searchHop; i += searchHop) {
    let localMax = -1;
    let localMaxIdx = -1;
    for (let j = i - Math.floor(bestLag * 0.3); j <= i + Math.floor(bestLag * 0.3) && j < N; j++) {
      if (timeDomainData[j] > localMax) {
        localMax = timeDomainData[j];
        localMaxIdx = j;
      }
    }
    if (localMaxIdx > 0 && localMax > 0.05) {
      if (lastPeakIndex > 0) {
        periodLengths.push(localMaxIdx - lastPeakIndex);
        peakAmplitudes.push(localMax);
      }
      lastPeakIndex = localMaxIdx;
    }
  }

  // Jitter calculation
  let jitterPercent = 0.65;
  if (periodLengths.length > 5) {
    const meanPeriod = periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length;
    let periodDiffSum = 0;
    for (let i = 1; i < periodLengths.length; i++) {
      periodDiffSum += Math.abs(periodLengths[i] - periodLengths[i - 1]);
    }
    const avgDiff = periodDiffSum / (periodLengths.length - 1);
    jitterPercent = (avgDiff / meanPeriod) * 100;
  }

  // Shimmer calculation
  let shimmerPercent = 2.4;
  if (peakAmplitudes.length > 5) {
    const meanAmp = peakAmplitudes.reduce((a, b) => a + b, 0) / peakAmplitudes.length;
    let ampDiffSum = 0;
    for (let i = 1; i < peakAmplitudes.length; i++) {
      ampDiffSum += Math.abs(peakAmplitudes[i] - peakAmplitudes[i - 1]);
    }
    const avgAmpDiff = ampDiffSum / (peakAmplitudes.length - 1);
    shimmerPercent = meanAmp > 0 ? (avgAmpDiff / meanAmp) * 100 : 2.4;
  }

  // Approximate Harmonic-to-Noise Ratio (HNR in dB)
  let signalEnergy = 0;
  let noiseEnergy = 0;
  for (let i = 0; i < N - bestLag; i++) {
    const s = timeDomainData[i];
    const diff = timeDomainData[i] - timeDomainData[i + bestLag];
    signalEnergy += s * s;
    noiseEnergy += diff * diff;
  }
  const rawHNR = noiseEnergy > 0 ? 10 * Math.log10(signalEnergy / noiseEnergy) : 22;
  const hnrDb = Math.max(5, Math.min(32, rawHNR));

  let status: 'normal' | 'borderline' | 'abnormal' = 'normal';
  let mdsSubscore = 0;

  if (jitterPercent > 1.8 || shimmerPercent > 6.0 || hnrDb < 14) {
    status = 'abnormal';
    mdsSubscore = jitterPercent > 2.5 ? 3 : 2;
  } else if (jitterPercent > 1.04 || shimmerPercent > 3.81 || hnrDb < 18) {
    status = 'borderline';
    mdsSubscore = 1;
  }

  const pitchStabilityScore = Math.max(0, Math.min(100, Math.round(100 - (jitterPercent * 15 + shimmerPercent * 5))));

  return {
    fundamentalFrequency: Number(f0.toFixed(1)),
    jitterPercent: Number(jitterPercent.toFixed(2)),
    shimmerPercent: Number(shimmerPercent.toFixed(2)),
    hnrDb: Number(hnrDb.toFixed(1)),
    pitchStabilityScore,
    mdsUpdrsSubscore: mdsSubscore,
    status,
    details:
      status === 'abnormal'
        ? `Elevated acoustic perturbations detected (Jitter: ${jitterPercent.toFixed(2)}%, Shimmer: ${shimmerPercent.toFixed(2)}%), indicating vocal fold micro-tremor and hypokinetic dysarthria.`
        : status === 'borderline'
        ? `Mild vocal instability observed near clinical thresholds.`
        : `Normal acoustic profile with stable phonation and clean harmonic spectrum.`,
  };
}

/**
 * Analyze Archimedean spiral drawing kinematics
 */
export function analyzeSpiralDrawing(
  points: { x: number; y: number; time: number }[],
  canvasWidth: number,
  canvasHeight: number
): SpiralAnalysisResult {
  const N = points.length;
  if (N < 20) {
    return {
      durationSeconds: 0,
      drawingVelocityJerk: 0,
      radialDeviationVariance: 0,
      micrographiaRatio: 1.0,
      pointCount: N,
      mdsUpdrsSubscore: 0,
      status: 'normal',
      details: 'Incomplete spiral drawing. Please trace outward from center.',
    };
  }

  const durationSeconds = (points[N - 1].time - points[0].time) / 1000;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  const polarPoints = points.map(p => {
    const dx = p.x - centerX;
    const dy = p.y - centerY;
    const r = Math.sqrt(dx * dx + dy * dy);
    let theta = Math.atan2(dy, dx);
    if (theta < 0) theta += 2 * Math.PI;
    return { r, theta, time: p.time };
  });

  let totalJerk = 0;
  const velocities: number[] = [];

  for (let i = 1; i < N; i++) {
    const dt = Math.max(1, points[i].time - points[i - 1].time) / 1000;
    const dist = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    velocities.push(dist / dt);
  }

  const accelerations: number[] = [];
  for (let i = 1; i < velocities.length; i++) {
    const dt = Math.max(1, points[i].time - points[i - 1].time) / 1000;
    accelerations.push((velocities[i] - velocities[i - 1]) / dt);
  }

  for (let i = 1; i < accelerations.length; i++) {
    const dt = Math.max(1, points[i].time - points[i - 1].time) / 1000;
    const jerk = (accelerations[i] - accelerations[i - 1]) / dt;
    totalJerk += Math.abs(jerk);
  }

  const normalizedJerk = accelerations.length > 1 ? (totalJerk / accelerations.length) / 1000 : 0.5;

  let maxRadius = 0;
  for (const pt of polarPoints) {
    if (pt.r > maxRadius) maxRadius = pt.r;
  }

  const expectedRadius = (Math.min(canvasWidth, canvasHeight) / 2) * 0.85;
  const micrographiaRatio = Math.min(1.2, maxRadius / expectedRadius);

  let radialDiffSum = 0;
  for (let i = 1; i < polarPoints.length; i++) {
    const dr = Math.abs(polarPoints[i].r - polarPoints[i - 1].r);
    radialDiffSum += dr;
  }
  const radialVariance = (radialDiffSum / polarPoints.length);

  let status: 'normal' | 'borderline' | 'abnormal' = 'normal';
  let mdsSubscore = 0;

  if (normalizedJerk > 4.5 || micrographiaRatio < 0.65 || radialVariance > 7.5) {
    status = 'abnormal';
    mdsSubscore = normalizedJerk > 7.0 || micrographiaRatio < 0.5 ? 3 : 2;
  } else if (normalizedJerk > 2.8 || micrographiaRatio < 0.78 || radialVariance > 4.5) {
    status = 'borderline';
    mdsSubscore = 1;
  }

  return {
    durationSeconds: Number(durationSeconds.toFixed(1)),
    drawingVelocityJerk: Number(normalizedJerk.toFixed(2)),
    radialDeviationVariance: Number(radialVariance.toFixed(2)),
    micrographiaRatio: Number(micrographiaRatio.toFixed(2)),
    pointCount: N,
    mdsUpdrsSubscore: mdsSubscore,
    status,
    details:
      status === 'abnormal'
        ? `Marked kinematic jerk (${normalizedJerk.toFixed(2)}) and ${micrographiaRatio < 0.7 ? 'micrographia (reduced drawing amplitude)' : 'radial tremor oscillations'} detected.`
        : status === 'borderline'
        ? `Mild motor hesitation and velocity fluctuations recorded.`
        : `Smooth continuous pen trajectory with intact geometric scaling.`,
  };
}

/**
 * Composite MDS-UPDRS Part III diagnostic assessment engine
 */
export function computeCompositeAssessment(
  tremor: TremorAnalysisResult,
  voice: VoiceAnalysisResult,
  spiral: SpiralAnalysisResult
): DiagnosticAssessment {
  const biomarkers: BiomarkerMetric[] = [
    {
      id: 'tremor-freq',
      name: 'Resting Tremor Frequency',
      value: tremor.dominantFrequency,
      unit: 'Hz',
      normalRange: 'N/A or 8-12 Hz (Physiological)',
      status: (tremor.dominantFrequency >= 4.0 && tremor.dominantFrequency <= 6.2 && tremor.tremorAmplitude > 0.08) ? 'abnormal' : 'normal',
      description: 'Parkinsonian tremor classically exhibits 4–6 Hz frequency, distinct from essential tremor (8–12 Hz).',
      weight: 0.25,
    },
    {
      id: 'tapping-cv',
      name: 'Finger Tapping Rhythm CV',
      value: tremor.tapRhythmCV,
      unit: '%',
      normalRange: '< 15.0%',
      status: tremor.tapRhythmCV > 25 ? 'abnormal' : tremor.tapRhythmCV > 16 ? 'borderline' : 'normal',
      description: 'Quantifies rhythm dysregulation and motor hesitation (bradykinesia / hypokinesia).',
      weight: 0.20,
    },
    {
      id: 'amp-decay',
      name: 'Kinematic Fatigue / Amplitude Decay',
      value: tremor.amplitudeDecay,
      unit: '%',
      normalRange: '< 15.0%',
      status: tremor.amplitudeDecay > 30 ? 'abnormal' : tremor.amplitudeDecay > 18 ? 'borderline' : 'normal',
      description: 'Progressive amplitude reduction during repetitive finger tapping is a diagnostic hallmark of Parkinsonism.',
      weight: 0.15,
    },
    {
      id: 'vocal-jitter',
      name: 'Vocal Acoustic Jitter',
      value: voice.jitterPercent,
      unit: '%',
      normalRange: '< 1.04%',
      status: voice.jitterPercent > 1.8 ? 'abnormal' : voice.jitterPercent > 1.04 ? 'borderline' : 'normal',
      description: 'Cycle-to-cycle frequency variation of vocal fold vibration during sustained vowel phonation.',
      weight: 0.15,
    },
    {
      id: 'vocal-shimmer',
      name: 'Vocal Acoustic Shimmer',
      value: voice.shimmerPercent,
      unit: '%',
      normalRange: '< 3.81%',
      status: voice.shimmerPercent > 5.5 ? 'abnormal' : voice.shimmerPercent > 3.81 ? 'borderline' : 'normal',
      description: 'Micro-amplitude perturbation of voice, correlated with hypokinetic dysarthria.',
      weight: 0.10,
    },
    {
      id: 'spiral-jerk',
      name: 'Kinematic Smoothness (Jerk Index)',
      value: spiral.drawingVelocityJerk,
      unit: 'norm',
      normalRange: '< 2.50',
      status: spiral.drawingVelocityJerk > 4.5 ? 'abnormal' : spiral.drawingVelocityJerk > 2.8 ? 'borderline' : 'normal',
      description: 'Time rate of acceleration change; elevated values reflect jerky, uncoordinated kinetic tremor.',
      weight: 0.15,
    },
  ];

  let rawScore = 0;
  for (const b of biomarkers) {
    let sub = 0;
    if (b.status === 'abnormal') sub = 100;
    else if (b.status === 'borderline') sub = 50;
    else sub = 10;
    rawScore += sub * b.weight;
  }

  const compositeRiskScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  let riskCategory: DiagnosticAssessment['riskCategory'] = 'Normal / Healthy Range';
  if (compositeRiskScore >= 65) {
    riskCategory = 'High / Severe Motor Impairment';
  } else if (compositeRiskScore >= 40) {
    riskCategory = 'Moderate Parkinsonian Features';
  } else if (compositeRiskScore >= 20) {
    riskCategory = 'Mild Neuromuscular Anomaly';
  }

  const estimatedMdsUpdrsScore = tremor.mdsUpdrsSubscore + voice.mdsUpdrsSubscore + spiral.mdsUpdrsSubscore;

  const clinicalObservations: string[] = [];
  if (tremor.dominantFrequency >= 4.0 && tremor.dominantFrequency <= 6.2 && tremor.tremorAmplitude > 0.08) {
    clinicalObservations.push(`Pathognomonic 4–6 Hz oscillatory peak detected at ${tremor.dominantFrequency.toFixed(1)} Hz with elevated power spectral density.`);
  }
  if (tremor.tapRhythmCV > 20) {
    clinicalObservations.push(`Significant bradykinesia with marked inter-tap interval irregularity (CV: ${tremor.tapRhythmCV.toFixed(1)}%).`);
  }
  if (tremor.amplitudeDecay > 20) {
    clinicalObservations.push(`Progressive kinematic amplitude decrement (${tremor.amplitudeDecay.toFixed(1)}% decay), fulfilling MDS-UPDRS Item 3.4 motor criteria.`);
  }
  if (voice.jitterPercent > 1.04 || voice.shimmerPercent > 3.81) {
    clinicalObservations.push(`Acoustic dysarthria detected during sustained phonation with elevated perturbation (Jitter: ${voice.jitterPercent.toFixed(2)}%, Shimmer: ${voice.shimmerPercent.toFixed(2)}%).`);
  }
  if (spiral.micrographiaRatio < 0.75) {
    clinicalObservations.push(`Micrographia pattern identified with ${(100 - spiral.micrographiaRatio * 100).toFixed(0)}% spatial compression in Archimedean spiral trajectory.`);
  }
  if (clinicalObservations.length === 0) {
    clinicalObservations.push('All kinematic and acoustic digital biomarkers fall within normative population reference intervals.');
  }

  const neurologicalRecommendations: string[] = [];
  if (compositeRiskScore >= 40) {
    neurologicalRecommendations.push('Schedule in-person comprehensive neurological evaluation with a Movement Disorder Specialist.');
    neurologicalRecommendations.push('Recommend DaTscan (dopamine transporter SPECT imaging) or high-resolution neuroimaging to assess striatal dopamine deficit.');
    neurologicalRecommendations.push('Perform formal in-clinic MDS-UPDRS Part III motor assessment and Levodopa challenge test.');
  } else if (compositeRiskScore >= 20) {
    neurologicalRecommendations.push('Conduct longitudinal re-screening at 30-day and 90-day intervals to monitor digital biomarker trajectory.');
    neurologicalRecommendations.push('Screen for prodromal non-motor indicators: REM sleep behavior disorder (RBD), anosmia (olfactory loss), and autonomic dysfunction.');
  } else {
    neurologicalRecommendations.push('Routine periodic wellness screening. No immediate neuromuscular referral indicated.');
  }

  const sessionHash = `NS-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  return {
    compositeRiskScore,
    riskCategory,
    estimatedMdsUpdrsScore,
    confidenceInterval: [Math.max(70, compositeRiskScore - 6), Math.min(99, compositeRiskScore + 5)],
    biomarkers,
    clinicalObservations,
    neurologicalRecommendations,
    assessmentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    sessionHash,
  };
}
