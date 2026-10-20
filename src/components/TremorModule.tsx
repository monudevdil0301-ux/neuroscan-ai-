import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Hand, Activity, RefreshCw, ShieldAlert, Upload, FileVideo } from 'lucide-react';
import type { TremorAnalysisResult } from '../types';
import { computeFFT, findDominantTremorFrequency, analyzeTappingKinematics } from '../utils/signalProcessing';

interface TremorModuleProps {
  initialResult: TremorAnalysisResult;
  onUpdate: (result: TremorAnalysisResult) => void;
}

export const TremorModule: React.FC<TremorModuleProps> = ({ initialResult, onUpdate }) => {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isTappingTestActive, setIsTappingTestActive] = useState(false);
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);
  const [tapAmplitudes, setTapAmplitudes] = useState<number[]>([]);
  const [tapCountDown, setTapCountDown] = useState(10);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [uploadedVideoName, setUploadedVideoName] = useState<string | null>(null);

  const [currentResult, setCurrentResult] = useState<TremorAnalysisResult>(initialResult);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const animFrameRef = useRef<number | null>(null);
  const prevImageDataRef = useRef<ImageData | null>(null);
  const motionHistoryRef = useRef<number[]>([]);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setCurrentResult(initialResult);
    motionHistoryRef.current = [];
  }, [initialResult]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      videoRef.current.src = '';
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsWebcamActive(false);
    setIsStreamLoading(false);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadedVideoName(file.name);
      setCameraError(null);
      stopCamera();

      const videoUrl = URL.createObjectURL(file);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = videoUrl;
        videoRef.current.loop = true;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsWebcamActive(true);
            startVisionTracking();
          });
        };
      }
    } catch (err: any) {
      console.error("Video upload error:", err);
      setCameraError(`Could not load video file: ${err.message || 'Format not supported'}. Try a standard .mp4 or .webm file.`);
    }
  };

  const toggleWebcam = async () => {
    setCameraError(null);
    if (isWebcamActive) {
      stopCamera();
    } else {
      setIsStreamLoading(true);
      try {
        // Safe progressive constraints for any browser/webcam
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30 },
            },
            audio: false,
          });
        } catch {
          // Fallback to basic permissive video constraint
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              setIsWebcamActive(true);
              setIsStreamLoading(false);
              startVisionTracking();
            }).catch((playErr) => {
              console.error("Video play error:", playErr);
              setIsStreamLoading(false);
            });
          };
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setIsStreamLoading(false);
        setIsWebcamActive(false);

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError(
            "Camera permission was denied. Click the 'View site information' or lock icon in your browser address bar (next to localhost:5173), toggle 'Camera' to Allow, and refresh."
          );
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError("No physical webcam device was detected on your machine. You can use the clinical preset replay mode!");
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraError("Your webcam is currently locked by another application (e.g. Zoom, Teams, Discord, OBS). Please close other apps and try again.");
        } else {
          setCameraError(`Camera error (${err.name || 'Unknown'}): ${err.message || 'Could not start camera.'}`);
        }
      }
    }
  };

  const startVisionTracking = () => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCanvasRef.current.width = 320;
      offscreenCanvasRef.current.height = 240;
    }

    const offCanvas = offscreenCanvasRef.current;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

    const processFrame = () => {
      const video = videoRef.current;
      const overlayCanvas = canvasRef.current;
      if (!video || !overlayCanvas) return;

      const overlayCtx = overlayCanvas.getContext('2d');
      if (!overlayCtx) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (video.videoWidth > 0 && overlayCanvas.width !== video.videoWidth) {
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;
      }

      // Clear transparent HUD canvas
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      // Draw Region of Interest (ROI) HUD Box
      const roiWidth = Math.min(220, overlayCanvas.width * 0.5);
      const roiHeight = Math.min(220, overlayCanvas.height * 0.5);
      const roiX = (overlayCanvas.width - roiWidth) / 2;
      const roiY = (overlayCanvas.height - roiHeight) / 2;

      // Stroke targeting box
      overlayCtx.strokeStyle = '#06b6d4';
      overlayCtx.lineWidth = 2;
      overlayCtx.strokeRect(roiX, roiY, roiWidth, roiHeight);

      // Corner tech brackets
      const bLen = 16;
      overlayCtx.strokeStyle = '#22d3ee';
      overlayCtx.lineWidth = 3;
      // Top-left
      overlayCtx.beginPath();
      overlayCtx.moveTo(roiX, roiY + bLen); overlayCtx.lineTo(roiX, roiY); overlayCtx.lineTo(roiX + bLen, roiY);
      // Top-right
      overlayCtx.moveTo(roiX + roiWidth - bLen, roiY); overlayCtx.lineTo(roiX + roiWidth, roiY); overlayCtx.lineTo(roiX + roiWidth, roiY + bLen);
      // Bottom-left
      overlayCtx.moveTo(roiX, roiY + roiHeight - bLen); overlayCtx.lineTo(roiX, roiY + roiHeight); overlayCtx.lineTo(roiX + bLen, roiY + roiHeight);
      // Bottom-right
      overlayCtx.moveTo(roiX + roiWidth - bLen, roiY + roiHeight); overlayCtx.lineTo(roiX + roiWidth, roiY + roiHeight); overlayCtx.lineTo(roiX + roiWidth, roiY + roiHeight - bLen);
      overlayCtx.stroke();

      overlayCtx.fillStyle = '#22d3ee';
      overlayCtx.font = 'bold 11px JetBrains Mono, monospace';
      overlayCtx.fillText('TARGET: RESTING HAND / FINGER', roiX + 8, roiY - 8);

      // Compute frame difference on scaled offscreen canvas for high performance
      if (offCtx && video.readyState >= 2) {
        try {
          offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);

          const scaleX = offCanvas.width / overlayCanvas.width;
          const scaleY = offCanvas.height / overlayCanvas.height;
          const sampleX = Math.floor(roiX * scaleX);
          const sampleY = Math.floor(roiY * scaleY);
          const sampleW = Math.floor(roiWidth * scaleX);
          const sampleH = Math.floor(roiHeight * scaleY);

          const currentFrame = offCtx.getImageData(sampleX, sampleY, sampleW, sampleH);
          let motionSum = 0;

          if (prevImageDataRef.current && prevImageDataRef.current.data.length === currentFrame.data.length) {
            const currData = currentFrame.data;
            const prevData = prevImageDataRef.current.data;
            for (let i = 0; i < currData.length; i += 16) {
              const diff = Math.abs(currData[i] - prevData[i]) +
                           Math.abs(currData[i + 1] - prevData[i + 1]) +
                           Math.abs(currData[i + 2] - prevData[i + 2]);
              if (diff > 40) {
                motionSum += diff;
              }
            }
          }
          prevImageDataRef.current = currentFrame;

          const normMotion = motionSum / (sampleW * sampleH * 0.1);
          motionHistoryRef.current.push(normMotion);
          if (motionHistoryRef.current.length > 120) {
            motionHistoryRef.current.shift();
          }

          if (motionHistoryRef.current.length >= 64) {
            const fft = computeFFT(motionHistoryRef.current, 30);
            const { dominantFreq, maxPower } = findDominantTremorFrequency(fft);

            if (dominantFreq > 0) {
              let mdsScore = 0;
              let status: 'normal' | 'borderline' | 'abnormal' = 'normal';
              if (dominantFreq >= 4.0 && dominantFreq <= 6.2 && maxPower > 0.05) {
                status = 'abnormal';
                mdsScore = maxPower > 0.12 ? 3 : 2;
              } else if (dominantFreq >= 7.5 && dominantFreq <= 11.5 && maxPower > 0.05) {
                status = 'borderline';
                mdsScore = 1;
              }

              const updated: TremorAnalysisResult = {
                ...currentResult,
                dominantFrequency: dominantFreq,
                tremorAmplitude: Number(maxPower.toFixed(3)),
                peakPsd: Number(maxPower.toFixed(4)),
                frequencySpectrum: fft,
                mdsUpdrsSubscore: mdsScore,
                status,
                details:
                  status === 'abnormal'
                    ? `Live resting tremor detected at ${dominantFreq.toFixed(1)} Hz in Parkinsonian band (4–6 Hz).`
                    : status === 'borderline'
                    ? `Live ${dominantFreq.toFixed(1)} Hz kinetic oscillation detected (Essential Tremor band).`
                    : `Kinematic stability within normative physiological threshold.`,
              };
              setCurrentResult(updated);
              onUpdate(updated);
            }
          }

          drawWaveform(motionHistoryRef.current);
          drawSpectrum(currentResult.frequencySpectrum);
        } catch (e) {
          // ignore offscreen canvas read error
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);
  };

  const generateSimulatedWaveform = (freq: number, amp: number) => {
    const points: number[] = [];
    const N = 80;
    for (let i = 0; i < N; i++) {
      const t = i / 30;
      let val = 0.5;
      if (freq >= 3.0) {
        val = 0.5 + Math.sin(2 * Math.PI * freq * t) * Math.min(0.42, amp * 1.8) + (Math.sin(2 * Math.PI * (freq * 2) * t) * 0.04);
      } else {
        val = 0.5 + Math.sin(2 * Math.PI * 0.8 * t) * 0.05;
      }
      points.push(val);
    }
    return points;
  };

  const drawWaveform = (history: number[]) => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    const data = history.length >= 2 ? history : generateSimulatedWaveform(currentResult.dominantFrequency, currentResult.tremorAmplitude);

    ctx.strokeStyle = currentResult.status === 'abnormal' ? '#f43f5e' : currentResult.status === 'borderline' ? '#38bdf8' : '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const step = canvas.width / (data.length - 1);
    const midY = canvas.height / 2;

    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const y = midY - (data[i] - 0.5) * (canvas.height * 0.7);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const drawSpectrum = (spectrum: { freq: number; power: number }[]) => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const maxFreq = 15;
    const xBandStart = (4.0 / maxFreq) * canvas.width;
    const xBandEnd = (6.2 / maxFreq) * canvas.width;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
    ctx.fillRect(xBandStart, 0, xBandEnd - xBandStart, canvas.height);

    const xEtStart = (8.0 / maxFreq) * canvas.width;
    const xEtEnd = (12.0 / maxFreq) * canvas.width;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.10)';
    ctx.fillRect(xEtStart, 0, xEtEnd - xEtStart, canvas.height);

    ctx.fillStyle = '#64748b';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText('PD Band (4-6 Hz)', xBandStart + 2, 12);
    ctx.fillText('ET Band (8-12 Hz)', xEtStart + 2, 12);

    if (!spectrum || spectrum.length === 0) return;

    const barWidth = (canvas.width / spectrum.length) * 0.8;
    const maxPower = Math.max(0.15, ...spectrum.map((b) => b.power));

    spectrum.forEach((bin, idx) => {
      const x = (idx / spectrum.length) * canvas.width;
      const barH = (bin.power / maxPower) * (canvas.height - 24);
      const y = canvas.height - barH - 4;

      const isPdBand = bin.freq >= 4.0 && bin.freq <= 6.2;
      const isEtBand = bin.freq >= 8.0 && bin.freq <= 12.0;

      ctx.fillStyle = isPdBand ? '#f43f5e' : isEtBand ? '#38bdf8' : '#0ea5e9';
      ctx.fillRect(x, y, barWidth, barH);
    });
  };

  const handleTap = () => {
    const now = Date.now();
    const newTimestamps = [...tapTimestamps, now];
    const amplitude = 1.0 - (newTimestamps.length > 15 ? 0.25 : 0.05);
    const newAmplitudes = [...tapAmplitudes, amplitude];

    setTapTimestamps(newTimestamps);
    setTapAmplitudes(newAmplitudes);

    const stats = analyzeTappingKinematics(newTimestamps, newAmplitudes);
    const updated: TremorAnalysisResult = {
      ...currentResult,
      tapCount: stats.tapCount,
      tapCadenceHz: stats.cadenceHz,
      tapRhythmCV: stats.rhythmCV,
      amplitudeDecay: stats.amplitudeDecay,
    };
    setCurrentResult(updated);
    onUpdate(updated);
  };

  const startTapCountdownTest = () => {
    setTapTimestamps([]);
    setTapAmplitudes([]);
    setIsTappingTestActive(true);
    setTapCountDown(10);

    const interval = setInterval(() => {
      setTapCountDown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTappingTestActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    drawSpectrum(currentResult.frequencySpectrum);
    drawWaveform(motionHistoryRef.current);
  }, [currentResult]);

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Hand className="w-5 h-5 text-cyan-400" />
              Tremor & Bradykinesia Kinematics (MDS-UPDRS 3.4 & 3.17)
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
                ? 'Tremor Detected'
                : currentResult.status === 'borderline'
                ? 'Borderline / Kinetic'
                : 'Physiological / Normal'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time optical flow frequency analysis & 10-second repetitive finger-tapping cadence
          </p>
        </div>

        {/* Video Controls */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input for Real Patient Video */}
          <input
            type="file"
            ref={videoFileInputRef}
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />

          <button
            onClick={() => videoFileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
            title="Upload Any Real Video Recording (.mp4, .webm)"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Upload Real Video</span>
          </button>

          <button
            onClick={toggleWebcam}
            disabled={isStreamLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              isWebcamActive
                ? 'bg-rose-900/60 hover:bg-rose-900 text-rose-200 border-rose-700'
                : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
            }`}
          >
            {isStreamLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Starting Camera...
              </>
            ) : isWebcamActive ? (
              <>
                <CameraOff className="w-3.5 h-3.5" /> Stop Camera
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" /> Start Live Camera
              </>
            )}
          </button>
        </div>
      </div>

      {uploadedVideoName && (
        <div className="mb-4 p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileVideo className="w-4 h-4 text-cyan-400" />
            <span>Real Patient Video Loaded: <strong className="text-white font-mono">{uploadedVideoName}</strong></span>
          </div>
          <span className="text-[10px] font-mono bg-cyan-900/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-700">Optical Flow Active</span>
        </div>
      )}

      {cameraError && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Camera Troubleshooting Note</span>
          </div>
          <p className="leading-relaxed pl-6">{cameraError}</p>
        </div>
      )}

      {/* Main Grid: Video/Preview & Spectral Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Camera / Feed Viewport (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-slate-950 border border-slate-800 p-3 relative overflow-hidden min-h-[260px]">
          <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800/80">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transform -scale-x-100 ${isWebcamActive ? 'block' : 'hidden'}`}
              playsInline
              muted
              autoPlay
            />

            {/* Transparent HUD Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full pointer-events-none ${isWebcamActive ? 'block' : 'hidden'}`}
            />

            {!isWebcamActive && (
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-cyan-400 mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-slate-300">Live Camera Standby</p>
                <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto mt-1">
                  Click 'Start Live Camera' above to track your hand, or switch presets to view benchmark data.
                </p>
              </div>
            )}

            {isWebcamActive && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/90 border border-cyan-500/80 text-[10px] text-cyan-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                OPTICAL FLOW ACTIVE (30 FPS)
              </div>
            )}
          </div>

          {/* Interactive Tap Test Section */}
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-200">Finger Tapping Test (Item 3.4)</span>
              {isTappingTestActive ? (
                <span className="font-mono text-cyan-400 font-bold">
                  Time: {tapCountDown}s left
                </span>
              ) : (
                <button
                  onClick={startTapCountdownTest}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2"
                >
                  Start 10s Test
                </button>
              )}
            </div>

            <button
              onClick={handleTap}
              disabled={!isTappingTestActive}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all transform active:scale-98 ${
                isTappingTestActive
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-cyan-500/25 cursor-pointer ring-2 ring-cyan-300'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              {isTappingTestActive ? '👉 TAP RAPIDLY HERE 👈' : 'Click "Start 10s Test" to begin'}
            </button>
          </div>
        </div>

        {/* Real-time Charts & Kinematic Metrics (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3">
          {/* Waveform & Spectrum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-300 font-mono">
                  DISPLACEMENT WAVEFORM
                </span>
                <span className="text-[10px] text-slate-500 font-mono">t = 4.0s</span>
              </div>
              <canvas
                ref={waveformCanvasRef}
                width={260}
                height={90}
                className="w-full h-[90px] rounded bg-slate-950"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-300 font-mono">
                  FFT POWER SPECTRUM (Hz)
                </span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">
                  Peak: {currentResult.dominantFrequency.toFixed(1)} Hz
                </span>
              </div>
              <canvas
                ref={spectrumCanvasRef}
                width={260}
                height={90}
                className="w-full h-[90px] rounded bg-slate-950"
              />
            </div>
          </div>

          {/* Biomarker Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Tremor Frequency</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold text-white font-mono">
                  {currentResult.dominantFrequency.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">Hz</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Target: 4.0–6.0 Hz (PD)
              </span>
            </div>

            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Rhythm Regularity</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-lg font-bold font-mono ${
                    currentResult.tapRhythmCV > 25
                      ? 'text-rose-400'
                      : currentResult.tapRhythmCV > 15
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {currentResult.tapRhythmCV.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">CV</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Normal: &lt;15%</span>
            </div>

            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Amplitude Decay</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-lg font-bold font-mono ${
                    currentResult.amplitudeDecay > 25
                      ? 'text-rose-400'
                      : currentResult.amplitudeDecay > 15
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {currentResult.amplitudeDecay.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">decay</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Fatigue sign</span>
            </div>

            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">MDS-UPDRS Motor</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold text-white font-mono">
                  {currentResult.mdsUpdrsSubscore}
                </span>
                <span className="text-xs text-slate-400">/ 4 pts</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Clinical Grade</span>
            </div>
          </div>

          {/* Clinical Interpretation note */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
            <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>{currentResult.details}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
