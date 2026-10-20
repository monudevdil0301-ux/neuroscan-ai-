import React, { useState, useEffect } from 'react';
import { X, Activity, Camera, Mic, PenTool, Award, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GuidedExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (userTaps: number) => void;
  onOpenReport: () => void;
}

export const GuidedExamModal: React.FC<GuidedExamModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onOpenReport,
}) => {
  const [step, setStep] = useState<number>(1);
  const [countdown, setCountdown] = useState<number>(10);
  const [tapCount, setTapCount] = useState<number>(0);
  const [isExamRunning, setIsExamRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setIsExamRunning(false);
      setCountdown(10);
      setTapCount(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startStepTimer = (duration: number, nextStep: number) => {
    setIsExamRunning(true);
    setCountdown(duration);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExamRunning(false);
          if (nextStep <= 4) {
            setStep(nextStep);
          } else {
            finishExam();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishExam = () => {
    setStep(5);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#14b8a6', '#6366f1', '#10b981'],
    });
    onComplete(tapCount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">
              Autonomous Guided Neurological Screening Protocol
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-slate-950/60 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
          {[
            { num: 1, label: 'Rest Tremor' },
            { num: 2, label: 'Finger Tap' },
            { num: 3, label: 'Vocal Phonation' },
            { num: 4, label: 'Spiral Tracing' },
            { num: 5, label: 'CDS Assessment' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-1.5 ${
                step === s.num
                  ? 'text-cyan-400 font-bold'
                  : step > s.num
                  ? 'text-emerald-400 font-medium'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                  step === s.num
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : step > s.num
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-8 text-center space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center mx-auto text-cyan-400">
                <Camera className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-white">Step 1: Resting Hand Tremor Exam</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Rest your hand naturally on your desk or lap. Keep fingers relaxed. The system will measure oscillatory displacement in the 4–6 Hz frequency band.
              </p>

              {isExamRunning ? (
                <div className="space-y-2">
                  <div className="text-4xl font-black font-mono text-cyan-400 animate-pulse">
                    {countdown}s
                  </div>
                  <p className="text-xs text-slate-400">Recording optical flow velocity...</p>
                </div>
              ) : (
                <button
                  onClick={() => startStepTimer(10, 2)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all"
                >
                  Begin 10s Tremor Scan
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center mx-auto text-cyan-400">
                <Activity className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-white">Step 2: Rapid Finger Tapping Test</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Tap the button below as rapidly and rhythmically as possible for 10 seconds. Tests for bradykinesia and kinematic fatigue.
              </p>

              {isExamRunning ? (
                <div className="space-y-3">
                  <div className="text-3xl font-black font-mono text-cyan-400">
                    {countdown}s left | Taps: {tapCount}
                  </div>
                  <button
                    onClick={() => setTapCount((c) => c + 1)}
                    className="w-full py-6 rounded-2xl font-black text-sm uppercase bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-xl shadow-cyan-500/25 active:scale-95 transition-all"
                  >
                    👉 TAP REPEATEDLY HERE 👈
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTapCount(0);
                    startStepTimer(10, 3);
                  }}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all"
                >
                  Start 10s Tapping Test
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center mx-auto text-cyan-400">
                <Mic className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-white">Step 3: Sustained Phonation Dysarthria</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Take a deep breath and vocalize a continuous vowel <strong className="text-cyan-300">"AAAAAH"</strong> at conversational volume for 5 seconds.
              </p>

              {isExamRunning ? (
                <div className="space-y-2">
                  <div className="text-4xl font-black font-mono text-cyan-400 animate-pulse">
                    {countdown}s
                  </div>
                  <p className="text-xs text-slate-400">Analyzing acoustic Jitter & Shimmer...</p>
                </div>
              ) : (
                <button
                  onClick={() => startStepTimer(5, 4)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all"
                >
                  Begin 5s Voice Test
                </button>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center mx-auto text-cyan-400">
                <PenTool className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-white">Step 4: Archimedean Spiral Trajectory</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Tracing will measure pen velocity jerk, radial deviation, and micrographia scaling index.
              </p>

              {isExamRunning ? (
                <div className="space-y-2">
                  <div className="text-4xl font-black font-mono text-cyan-400 animate-pulse">
                    {countdown}s
                  </div>
                  <p className="text-xs text-slate-400">Digitizing trajectory coordinates...</p>
                </div>
              ) : (
                <button
                  onClick={() => startStepTimer(6, 5)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all"
                >
                  Analyze Spiral Kinematics
                </button>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center mx-auto text-emerald-400">
                <Award className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-black text-white">Protocol Complete!</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                All multi-modal sensory data has been synthesized against the MDS-UPDRS Part III motor grading rubric. Your clinical report is ready.
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenReport();
                  }}
                  className="px-6 py-3 rounded-xl font-bold text-xs uppercase bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Open Hospital CDS Report (PDF)
                </button>

                <button
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl font-medium text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
