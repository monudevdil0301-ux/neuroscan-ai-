import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Activity, AlertCircle } from 'lucide-react';
import type { VoiceAnalysisResult } from '../types';
import { analyzeVoiceAcoustics } from '../utils/signalProcessing';

interface VoiceModuleProps {
  initialResult: VoiceAnalysisResult;
  onUpdate: (result: VoiceAnalysisResult) => void;
}

export const VoiceModule: React.FC<VoiceModuleProps> = ({ initialResult, onUpdate }) => {
  const [isMicActive, setIsMicActive] = useState(false);
  const [isTestingPhonation, setIsTestingPhonation] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [micError, setMicError] = useState<string | null>(null);
  const [isPlayingSynthSample, setIsPlayingSynthSample] = useState(false);

  const [currentResult, setCurrentResult] = useState<VoiceAnalysisResult>(initialResult);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const fftCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawSimulatedVoiceCanvases = (result: VoiceAnalysisResult) => {
    const waveCanvas = waveformCanvasRef.current;
    if (waveCanvas) {
      const wCtx = waveCanvas.getContext('2d');
      if (wCtx) {
        wCtx.fillStyle = '#090d16';
        wCtx.fillRect(0, 0, waveCanvas.width, waveCanvas.height);

        wCtx.strokeStyle = result.status === 'abnormal' ? '#f43f5e' : result.status === 'borderline' ? '#f59e0b' : '#06b6d4';
        wCtx.lineWidth = 2;
        wCtx.beginPath();

        const N = waveCanvas.width;
        const f0 = result.fundamentalFrequency || 130;
        const jitter = result.jitterPercent || 0.5;

        for (let x = 0; x < N; x++) {
          const t = x / 35;
          const jitterNoise = (Math.sin(x * 0.4) * (jitter / 100)) * 12;
          const y = (waveCanvas.height / 2) + Math.sin(t * (f0 / 22) + jitterNoise) * (waveCanvas.height * 0.35);
          if (x === 0) wCtx.moveTo(x, y);
          else wCtx.lineTo(x, y);
        }
        wCtx.stroke();
      }
    }

    const fCanvas = fftCanvasRef.current;
    if (fCanvas) {
      const fCtx = fCanvas.getContext('2d');
      if (fCtx) {
        fCtx.fillStyle = '#090d16';
        fCtx.fillRect(0, 0, fCanvas.width, fCanvas.height);

        const barCount = 32;
        const barWidth = (fCanvas.width / barCount) * 0.75;
        let bx = 0;
        for (let i = 0; i < barCount; i++) {
          const harmonicFactor = i % 4 === 1 ? 0.9 : i % 2 === 0 ? 0.4 : 0.15;
          const decay = Math.exp(-i / 10);
          const barHeight = Math.max(4, (harmonicFactor * decay) * fCanvas.height * 0.85);

          fCtx.fillStyle = i < 6 ? '#22d3ee' : result.status === 'abnormal' ? '#f43f5e' : '#0ea5e9';
          fCtx.fillRect(bx, fCanvas.height - barHeight, barWidth, barHeight);
          bx += barWidth + 2;
        }
      }
    }
  };

  useEffect(() => {
    setCurrentResult(initialResult);
    if (!isMicActive && !isPlayingSynthSample) {
      drawSimulatedVoiceCanvases(initialResult);
    }
  }, [initialResult]);

  useEffect(() => {
    return () => {
      stopMic();
      stopSynthSample();
    };
  }, []);

  const stopMic = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setIsMicActive(false);
  };

  const toggleMic = async () => {
    setMicError(null);
    if (isMicActive) {
      stopMic();
    } else {
      stopSynthSample();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyserRef.current = analyser;

        setIsMicActive(true);
        startVisualizerLoop(analyser);
      } catch (err: any) {
        console.error("Microphone access error:", err);
        setMicError("Microphone access was blocked or unavailable. You can use the acoustic audio simulation!");
        setIsMicActive(false);
      }
    }
  };

  const startVisualizerLoop = (analyser: AnalyserNode) => {
    const timeData = new Float32Array(analyser.fftSize);
    const freqData = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getFloatTimeDomainData(timeData);
      analyser.getByteFrequencyData(freqData);

      const waveCanvas = waveformCanvasRef.current;
      if (waveCanvas) {
        const wCtx = waveCanvas.getContext('2d');
        if (wCtx) {
          wCtx.fillStyle = '#090d16';
          wCtx.fillRect(0, 0, waveCanvas.width, waveCanvas.height);

          wCtx.strokeStyle = currentResult.status === 'abnormal' ? '#f43f5e' : '#06b6d4';
          wCtx.lineWidth = 2;
          wCtx.beginPath();

          const sliceWidth = waveCanvas.width / timeData.length;
          let x = 0;
          for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i];
            const y = (v + 1) * (waveCanvas.height / 2);
            if (i === 0) wCtx.moveTo(x, y);
            else wCtx.lineTo(x, y);
            x += sliceWidth;
          }
          wCtx.stroke();
        }
      }

      const fCanvas = fftCanvasRef.current;
      if (fCanvas) {
        const fCtx = fCanvas.getContext('2d');
        if (fCtx) {
          fCtx.fillStyle = '#090d16';
          fCtx.fillRect(0, 0, fCanvas.width, fCanvas.height);

          const barWidth = (fCanvas.width / 40) * 0.8;
          let bx = 0;
          for (let i = 0; i < 40; i++) {
            const barHeight = (freqData[i] / 255) * fCanvas.height;
            fCtx.fillStyle = i < 8 ? '#22d3ee' : '#0ea5e9';
            fCtx.fillRect(bx, fCanvas.height - barHeight, barWidth, barHeight);
            bx += barWidth + 2;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
  };

  const startPhonationTest = () => {
    if (!isMicActive) {
      toggleMic();
    }
    setIsTestingPhonation(true);
    setCountdown(5);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTestingPhonation(false);
          if (analyserRef.current && audioContextRef.current) {
            const buffer = new Float32Array(analyserRef.current.fftSize);
            analyserRef.current.getFloatTimeDomainData(buffer);
            const analysis = analyzeVoiceAcoustics(buffer, audioContextRef.current.sampleRate);
            setCurrentResult(analysis);
            onUpdate(analysis);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playSynthesizedSample = (isPathological: boolean) => {
    stopSynthSample();
    stopMic();

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    const fundamental = isPathological ? 140 : 130;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(fundamental, ctx.currentTime);

    if (isPathological) {
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(5.2, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(6.0, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
    }

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    gain.connect(analyser);
    analyserRef.current = analyser;

    osc.start();
    setIsPlayingSynthSample(true);
    startVisualizerLoop(analyser);

    setTimeout(() => {
      stopSynthSample();
    }, 4000);
  };

  const stopSynthSample = () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlayingSynthSample(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mic className="w-5 h-5 text-cyan-400" />
              Vocal Dysarthria & Acoustic Phonation (MDS-UPDRS 3.1)
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                currentResult.status === 'abnormal'
                  ? 'bg-rose-950/70 text-rose-400 border-rose-800/60'
                  : currentResult.status === 'borderline'
                  ? 'bg-amber-950/70 text-amber-400 border-amber-800/60'
                  : 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60'
              }`}
            >
              {currentResult.status === 'abnormal'
                ? 'Dysarthria Indication'
                : currentResult.status === 'borderline'
                ? 'Mild Perturbation'
                : 'Intact Phonation'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            5-second sustained vowel (/a:/) frequency perturbation (Jitter, Shimmer, HNR)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => playSynthesizedSample(currentResult.status === 'abnormal')}
            disabled={isPlayingSynthSample}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
            title="Auditory Phonation Simulation"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isPlayingSynthSample ? 'Playing Vowel...' : 'Hear Vowel Sample'}</span>
          </button>

          <button
            onClick={toggleMic}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              isMicActive
                ? 'bg-rose-900/60 hover:bg-rose-900 text-rose-200 border-rose-700'
                : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
            }`}
          >
            {isMicActive ? (
              <>
                <MicOff className="w-3.5 h-3.5" /> Stop Mic
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" /> Enable Mic
              </>
            )}
          </button>
        </div>
      </div>

      {micError && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{micError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-slate-950 border border-slate-800 p-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">
                Sustained Vowel "/a:/" Test
              </span>
              <span className="text-[11px] font-mono text-cyan-400">Duration: 5.0s</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Take a deep breath and hold a steady vowel sound <strong className="text-cyan-300">"AAAAAH"</strong> at comfortable conversational pitch and volume.
            </p>
          </div>

          <div className="my-4 text-center">
            {isTestingPhonation ? (
              <div className="space-y-2">
                <div className="text-3xl font-extrabold font-mono text-cyan-400 animate-pulse">
                  {countdown}s
                </div>
                <p className="text-xs text-cyan-300 font-medium">Keep sustaining vowel sound...</p>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-cyan-400 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="text-xs text-slate-400 block">Pitch Stability Index</span>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">
                  {currentResult.pitchStabilityScore}%
                </span>
              </div>
            )}
          </div>

          <button
            onClick={startPhonationTest}
            disabled={isTestingPhonation}
            className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all transform active:scale-98 ${
              isTestingPhonation
                ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-wait'
                : 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 shadow-md shadow-cyan-500/20'
            }`}
          >
            {isTestingPhonation ? 'Listening & Analyzing...' : '🎙️ Start Sustained Vowel Test'}
          </button>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-300 font-mono">
                  AUDIO TIME-DOMAIN
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  F0: {currentResult.fundamentalFrequency} Hz
                </span>
              </div>
              <canvas
                ref={waveformCanvasRef}
                width={260}
                height={85}
                className="w-full h-[85px] rounded bg-slate-950"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-300 font-mono">
                  HARMONICS SPECTRUM
                </span>
                <span className="text-[10px] text-slate-500 font-mono">0 - 4 kHz</span>
              </div>
              <canvas
                ref={fftCanvasRef}
                width={260}
                height={85}
                className="w-full h-[85px] rounded bg-slate-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Acoustic Jitter</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-lg font-bold font-mono ${
                    currentResult.jitterPercent > 1.8
                      ? 'text-rose-400'
                      : currentResult.jitterPercent > 1.04
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {currentResult.jitterPercent.toFixed(2)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Normal: &lt;1.04%</span>
            </div>

            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Acoustic Shimmer</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-lg font-bold font-mono ${
                    currentResult.shimmerPercent > 5.5
                      ? 'text-rose-400'
                      : currentResult.shimmerPercent > 3.81
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {currentResult.shimmerPercent.toFixed(2)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Normal: &lt;3.81%</span>
            </div>

            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Harmonic-Noise (HNR)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-lg font-bold font-mono ${
                    currentResult.hnrDb < 15
                      ? 'text-rose-400'
                      : currentResult.hnrDb < 20
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {currentResult.hnrDb.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">dB</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Normal: &gt;20 dB</span>
            </div>

            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">MDS-UPDRS Speech</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold text-white font-mono">
                  {currentResult.mdsUpdrsSubscore}
                </span>
                <span className="text-xs text-slate-400">/ 4 pts</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Item 3.1</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
            <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>{currentResult.details}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
