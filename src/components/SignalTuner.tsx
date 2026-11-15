import { useEffect, useMemo, useRef, useState } from 'react';
import { MissionRecord } from '../data/missions';
import { soundEngine } from '../audio/soundEngine';

interface SignalTunerProps {
  mission: MissionRecord;
  isLocked: boolean;
  onLockSignal: () => void;
}

export function SignalTuner({ mission, isLocked, onLockSignal }: SignalTunerProps) {
  const [dial, setDial] = useState<number>(() =>
    isLocked ? mission.signalTargetNormalized : Math.max(0.08, (mission.signalTargetNormalized + 0.34) % 0.92),
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setDial(
      isLocked
        ? mission.signalTargetNormalized
        : Math.max(0.08, (mission.signalTargetNormalized + 0.34) % 0.92),
    );
  }, [mission.id, mission.signalTargetNormalized, isLocked]);

  const proximity = useMemo(() => {
    const diff = Math.abs(dial - mission.signalTargetNormalized);
    return Math.max(0, 1 - diff / 0.14);
  }, [dial, mission.signalTargetNormalized]);

  const inLockWindow = proximity >= 0.88;

  // Modulate procedural carrier audio while tuning
  useEffect(() => {
    soundEngine.setSignalTuning(!isLocked, proximity);
    return () => {
      soundEngine.setSignalTuning(false, 0);
    };
  }, [isLocked, proximity]);

  // Auto-lock when dial holds steady inside the carrier peak
  useEffect(() => {
    if (isLocked || !inLockWindow) return;
    const timer = window.setTimeout(() => {
      soundEngine.playLockChime();
      onLockSignal();
    }, 320);
    return () => window.clearTimeout(timer);
  }, [isLocked, inLockWindow, onLockSignal]);

  // Draw live carrier-wave oscilloscope on lightweight 2D canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const renderWave = (time: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Hairline center reference axis
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Carrier waveform + noise inversely proportional to proximity
      ctx.strokeStyle = isLocked
        ? '#d4a36a'
        : inLockWindow
          ? '#ededef'
          : 'rgba(161, 170, 184, 0.72)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();

      const noiseAmp = isLocked ? 1.2 : (1 - proximity) * 11.5 + 1.5;
      const signalAmp = isLocked ? 12 : 3 + proximity * 10;
      const tSec = time * 0.004;

      for (let x = 0; x < w; x += 2) {
        const normX = x / w;
        const envelope = Math.sin(normX * Math.PI);
        const carrier = Math.sin(normX * 26 + tSec * 2.4) * signalAmp * envelope;
        const jitter =
          Math.sin(x * 1.9 + tSec * 9.0) * Math.cos(x * 0.7 - tSec * 5.0) * noiseAmp;
        const y = h / 2 + carrier + jitter;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      rafId = requestAnimationFrame(renderWave);
    };

    rafId = requestAnimationFrame(renderWave);
    return () => cancelAnimationFrame(rafId);
  }, [isLocked, inLockWindow, proximity]);

  return (
    <div className="hairline-box p-4">
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="hud-label text-[#a1aab8]">
          DSN Carrier Alignment · {mission.cosparId}
        </span>
        <span
          className={`font-mono-tech text-[11px] uppercase tracking-[0.14em] ${
            isLocked ? 'text-[#d4a36a]' : 'text-[#8b95a5]'
          }`}
        >
          {isLocked ? 'Archive Logged' : `${Math.round(proximity * 100)}% Carrier`}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={360}
        height={44}
        className="w-full h-[44px] border border-white/10 bg-[#05070b] mb-3"
      />

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={dial}
          disabled={isLocked}
          aria-label="Tune spacecraft carrier frequency"
          onChange={(e) => setDial(parseFloat(e.target.value))}
          className="tuner-range flex-1"
        />
        {!isLocked && (
          <button
            type="button"
            onClick={() => {
              setDial(mission.signalTargetNormalized);
              soundEngine.playLockChime();
              onLockSignal();
            }}
            className="border border-white/25 px-3 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#ededef] hover:border-[#d4a36a] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Lock Signal
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] font-mono-tech text-[#6c7686]">
        <span>{mission.signalBandLabel}</span>
        <span>{mission.signalBandVerified ? 'ARCHIVE RECORD' : 'TO BE VERIFIED'}</span>
      </div>
    </div>
  );
}
