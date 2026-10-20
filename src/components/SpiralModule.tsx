import React, { useState, useEffect, useRef } from 'react';
import { PenTool, RotateCcw, Sparkles } from 'lucide-react';
import type { SpiralAnalysisResult } from '../types';
import { analyzeSpiralDrawing } from '../utils/signalProcessing';

interface SpiralModuleProps {
  initialResult: SpiralAnalysisResult;
  onUpdate: (result: SpiralAnalysisResult) => void;
}

export const SpiralModule: React.FC<SpiralModuleProps> = ({ initialResult, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number; time: number }[]>([]);
  const [currentResult, setCurrentResult] = useState<SpiralAnalysisResult>(initialResult);

  useEffect(() => {
    setCurrentResult(initialResult);
    drawBaseCanvas();
  }, [initialResult]);

  useEffect(() => {
    drawBaseCanvas();
  }, []);

  const drawBaseCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = (Math.min(canvas.width, canvas.height) / 2) * 0.85;
    const b = maxRadius / (4 * 2 * Math.PI);

    ctx.save();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();

    const totalSteps = 400;
    for (let i = 0; i < totalSteps; i++) {
      const theta = (i / totalSteps) * (4 * 2 * Math.PI);
      const r = b * theta;
      const x = centerX + r * Math.cos(theta);
      const y = centerY + r * Math.sin(theta);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('START (TRACE OUTWARD)', centerX - 60, centerY - 10);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    drawBaseCanvas();
    const newPoints = [{ x, y, time: Date.now() }];
    setPoints(newPoints);
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = Date.now();
    const prevPoint = points[points.length - 1];
    const newPoint = { x, y, time: now };
    const updatedPoints = [...points, newPoint];
    setPoints(updatedPoints);

    const dt = Math.max(1, now - prevPoint.time) / 1000;
    const dist = Math.hypot(x - prevPoint.x, y - prevPoint.y);
    const speed = dist / dt;

    ctx.strokeStyle = speed > 400 || dist > 20 ? '#f43f5e' : '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (points.length > 20) {
      const result = analyzeSpiralDrawing(points, canvas.width, canvas.height);
      setCurrentResult(result);
      onUpdate(result);
    }
  };

  const clearCanvas = () => {
    setPoints([]);
    drawBaseCanvas();
  };

  const simulateClinicalSpiral = (isPathological: boolean, isMicrographia: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBaseCanvas();

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = (Math.min(canvas.width, canvas.height) / 2) * (isMicrographia ? 0.52 : 0.85);
    const b = maxRadius / (4 * 2 * Math.PI);

    const simPoints: { x: number; y: number; time: number }[] = [];
    const steps = 300;
    const startTime = Date.now();

    for (let i = 0; i < steps; i++) {
      const theta = (i / steps) * (4 * 2 * Math.PI);
      let r = b * theta;

      if (isPathological) {
        const tremorOsc = Math.sin(theta * 14) * (isMicrographia ? 7 : 12);
        r += tremorOsc;
      }

      const x = centerX + r * Math.cos(theta);
      const y = centerY + r * Math.sin(theta);
      const time = startTime + (i / steps) * (isPathological ? 14000 : 8000);
      simPoints.push({ x, y, time });
    }

    let currIdx = 0;
    const anim = () => {
      if (currIdx >= simPoints.length - 1) {
        setPoints(simPoints);
        const result = analyzeSpiralDrawing(simPoints, canvas.width, canvas.height);
        setCurrentResult(result);
        onUpdate(result);
        return;
      }

      const p1 = simPoints[currIdx];
      const p2 = simPoints[currIdx + 1];

      ctx.strokeStyle = isPathological ? '#f43f5e' : '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      currIdx += 4;
      requestAnimationFrame(anim);
    };

    anim();
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PenTool className="w-5 h-5 text-cyan-400" />
              Spiral Kinematics & Micrographia (MDS-UPDRS 3.16)
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
                ? 'Kinematic Ataxia / Micrographia'
                : currentResult.status === 'borderline'
                ? 'Mild Dysmetria'
                : 'Intact Coordination'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Archimedean spiral tracking for kinematic jerk, radial deviation, and spatial amplitude shrinkage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => simulateClinicalSpiral(currentResult.status === 'abnormal', currentResult.micrographiaRatio < 0.75)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
            title="Simulate Current Trajectory"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate Preset Trace</span>
          </button>

          <button
            onClick={clearCanvas}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
            title="Clear Drawing Board"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-xl bg-slate-950 border border-slate-800 p-3">
          <div className="relative touch-none cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="rounded-lg shadow-inner bg-slate-950 border border-slate-800/80"
            />
            {!isDrawing && points.length === 0 && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <span className="text-[11px] font-mono text-cyan-500/80 bg-slate-900/90 px-3 py-1.5 rounded-full border border-cyan-800/60 shadow-lg">
                  Draw outward along the dashed line
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Kinematic Jerk</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-lg font-bold font-mono ${
                    currentResult.drawingVelocityJerk > 4.5
                      ? 'text-rose-400'
                      : currentResult.drawingVelocityJerk > 2.8
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {currentResult.drawingVelocityJerk.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Smoothness: &lt;2.50</span>
            </div>

            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Micrographia Ratio</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-lg font-bold font-mono ${
                    currentResult.micrographiaRatio < 0.7
                      ? 'text-rose-400'
                      : currentResult.micrographiaRatio < 0.82
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {currentResult.micrographiaRatio.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Normal: &gt;0.85</span>
            </div>

            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Radial Variance</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold text-white font-mono">
                  {currentResult.radialDeviationVariance.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">px</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Tremor dispersion</span>
            </div>

            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">MDS-UPDRS Kinetic</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold text-white font-mono">
                  {currentResult.mdsUpdrsSubscore}
                </span>
                <span className="text-xs text-slate-400">/ 4 pts</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Item 3.16</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Kinematic Analysis Summary</span>
              <span className="font-mono text-[11px] text-cyan-400">
                Duration: {currentResult.durationSeconds}s ({currentResult.pointCount} data points)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentResult.details}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Pen acceleration derivative normalized against trajectory arc-length.</span>
            <span className="font-mono text-[11px] text-cyan-400">Euler Kinematics Model</span>
          </div>
        </div>
      </div>
    </div>
  );
};
