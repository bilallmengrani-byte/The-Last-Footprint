import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface IntroOverlayProps {
  isMuted: boolean;
  onToggleAudio: () => void;
  onComplete: () => void;
}

export function IntroOverlay({ isMuted, onToggleAudio, onComplete }: IntroOverlayProps) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setStage(1), 2200);
    const t2 = window.setTimeout(() => setStage(2), 5600);
    const tEnd = window.setTimeout(() => onComplete(), 11200);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(tEnd);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-6 md:p-10 pointer-events-none">
      {/* Top quiet transmission bar */}
      <div className="flex items-center justify-between pointer-events-auto">
        <span className="hud-label text-[#8b95a5]">
          NASA Space Apps Archive · Deep Space Telemetry
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleAudio}
            className="inline-flex items-center gap-2 border border-white/20 bg-[#05070b]/80 px-3 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#c2c8d2] hover:border-white/50 hover:text-white cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Enable Audio' : 'Audio On'}</span>
          </button>

          <button
            type="button"
            onClick={onComplete}
            className="border border-white/25 bg-[#05070b]/80 px-4 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#ededef] hover:border-[#d4a36a] cursor-pointer"
          >
            Skip Intro
          </button>
        </div>
      </div>

      {/* Center documentary title reveal */}
      <div className="mx-auto max-w-2xl text-center transition-opacity duration-1000">
        <div
          className={`transition-all duration-1000 ${
            stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <p className="hud-label text-[#c77d98] mb-3">Abandoned but Not Forgotten</p>
          <h1 className="font-display text-5xl md:text-7xl font-medium uppercase tracking-[0.1em] text-[#ededef]">
            The Last Footprint
          </h1>
        </div>

        <p
          className={`mt-5 text-sm md:text-base text-[#b5becb] tracking-wide transition-all duration-1000 ${
            stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          Every machine has a story. Every journey leaves something behind.
        </p>
      </div>

      {/* Bottom cue */}
      <div className="flex items-center justify-between text-[11px] font-mono-tech text-[#6c7686]">
        <span>MARE TRANQUILLITATIS · HADLEY RILLE · ARES VALLIS · MERIDIANI · JEZERO · OUTER SOLAR SYSTEM</span>
        <button
          type="button"
          onClick={onComplete}
          className="pointer-events-auto uppercase tracking-[0.14em] text-[#a1aab8] hover:text-white cursor-pointer"
        >
          Enter Archive
        </button>
      </div>
    </div>
  );
}
