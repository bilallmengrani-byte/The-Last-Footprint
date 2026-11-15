import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, FileText, X } from 'lucide-react';
import { MissionBeat, MissionRecord, SpacecraftHotspot } from '../data/missions';
import { MissionDossier } from './MissionDossier';
import { soundEngine } from '../audio/soundEngine';

gsap.registerPlugin(ScrollTrigger);

interface MissionPanelProps {
  mission: MissionRecord;
  beats: MissionBeat[];
  scrollProgressRef: React.MutableRefObject<number>;
  prefersReducedMotion: boolean;
  isSignalLocked: boolean;
  inspectedHotspots: string[];
  activeHotspot: SpacecraftHotspot | null;
  onLockSignal: () => void;
  onSelectHotspot: (hotspot: SpacecraftHotspot | null) => void;
  onBackToDestination: () => void;
  onNextMission: () => void;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(1e-5, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function computeBeatOpacity(index: number, total: number, progress: number, beatProgress: number): number {
  if (total <= 1) return 1;
  if (index === 0) {
    return 1 - smoothstep(0.065, 0.125, progress);
  }
  if (index === total - 1) {
    return smoothstep(0.875, 0.935, progress);
  }
  const fadeIn = smoothstep(beatProgress - 0.125, beatProgress - 0.065, progress);
  const fadeOut = 1 - smoothstep(beatProgress + 0.065, beatProgress + 0.125, progress);
  return fadeIn * fadeOut;
}

export function MissionPanel({
  mission,
  beats,
  scrollProgressRef,
  prefersReducedMotion,
  isSignalLocked,
  inspectedHotspots,
  activeHotspot,
  onLockSignal,
  onSelectHotspot,
  onBackToDestination,
  onNextMission,
}: MissionPanelProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressLineFillRef = useRef<HTMLDivElement>(null);
  const captionElsRef = useRef<Array<HTMLDivElement | null>>([]);

  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeBeatIdx, setActiveBeatIdx] = useState(0);
  const [atFinalBeat, setAtFinalBeat] = useState(false);
  const [showDossierDrawer, setShowDossierDrawer] = useState(false);

  const applyProgressToDom = useCallback(
    (p: number) => {
      scrollProgressRef.current = p;

      if (progressLineFillRef.current) {
        progressLineFillRef.current.style.transform = `scaleY(${Math.max(0.015, p)})`;
      }

      // Find closest beat index for left-rail markers and reduced-motion crossfades
      let nearestIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < beats.length; i++) {
        const d = Math.abs(p - beats[i].progress);
        if (d < minDist) {
          minDist = d;
          nearestIdx = i;
        }
      }
      setActiveBeatIdx(nearestIdx);
      setAtFinalBeat(p >= 0.89);

      if (!prefersReducedMotion) {
        for (let i = 0; i < beats.length; i++) {
          const el = captionElsRef.current[i];
          if (!el) continue;
          const op = computeBeatOpacity(i, beats.length, p, beats[i].progress);
          el.style.opacity = op.toFixed(3);
          el.style.pointerEvents = op > 0.35 ? 'auto' : 'none';
        }
      }
    },
    [beats, prefersReducedMotion, scrollProgressRef],
  );

  const prevBeatIdx = useRef(activeBeatIdx);
  useEffect(() => {
    if (prevBeatIdx.current !== activeBeatIdx) {
      soundEngine.play('beat');
      prevBeatIdx.current = activeBeatIdx;
    }
  }, [activeBeatIdx]);

  // Initialize GSAP ScrollTrigger pinned cinematic drive
  useEffect(() => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;

    scroller.scrollTop = 0;
    applyProgressToDom(0);

    const trigger = ScrollTrigger.create({
      trigger: track,
      scroller,
      start: 'top top',
      end: 'bottom bottom',
      scrub: prefersReducedMotion ? true : 0.45,
      onUpdate: (self) => {
        const p = self.progress;
        if (p > 0.012) {
          setHasScrolled(true);
        }
        applyProgressToDom(p);
      },
    });

    const handleResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      trigger.kill();
    };
  }, [mission.id, prefersReducedMotion, applyProgressToDom]);

  const jumpToBeat = (beatProgress: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const targetTop = maxScroll * beatProgress;
    setHasScrolled(true);
    scroller.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      {/* Scrollable full-screen track driving GSAP ScrollTrigger over pinned 3D canvas */}
      <div
        ref={scrollerRef}
        onWheel={() => {
          if (!hasScrolled) setHasScrolled(true);
        }}
        onTouchMove={() => {
          if (!hasScrolled) setHasScrolled(true);
        }}
        className="archive-scroll pointer-events-auto h-full w-full overflow-y-auto overflow-x-hidden"
        aria-label={`${mission.name} scroll-driven mission chronicle`}
      >
        <div ref={trackRef} className="relative w-full h-[560vh]">
          {/* Sticky Full-Screen Documentary Stage */}
          <div className="sticky top-0 h-screen w-full overflow-hidden pointer-events-none">
            {/* Subtle bottom gradient scrim for legible white documentary captions on sunlit Mars terrain */}
            <div
              className="absolute inset-x-0 bottom-0 h-56 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to top, rgba(5, 7, 11, 0.82) 0%, rgba(5, 7, 11, 0.36) 55%, rgba(5, 7, 11, 0) 100%)',
              }}
            />

            {/* Top Contextual Bar below persistent Header */}
            <div className="absolute inset-x-0 top-[66px] z-20 flex items-center justify-between gap-4 px-5 md:px-10">
              <div className="pointer-events-auto flex items-center gap-4 min-w-0">
                <button
                  type="button"
                  onClick={onBackToDestination}
                  className="inline-flex items-center gap-2 border border-white/15 bg-[#05070b]/75 px-3 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#c2c8d2] hover:border-white/45 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{mission.destinationLabel}</span>
                </button>

                <div className="hidden sm:flex items-center gap-2 font-mono-tech text-[11px] tracking-[0.14em] text-[#8b95a5] truncate">
                  <span className="uppercase">Artifact {mission.indexCode}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#ededef] uppercase">{mission.name}</span>
                  <span aria-hidden="true">·</span>
                  <span>{mission.cosparId}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDossierDrawer(true)}
                className="pointer-events-auto inline-flex items-center gap-2 border border-white/15 bg-[#05070b]/75 px-3 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#c2c8d2] hover:border-[#d4a36a] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Technical Dossier</span>
              </button>
            </div>

            {/* Left Thin Vertical Progress Line & Beat Ticks */}
            <nav
              aria-label="Mission narrative progress"
              className="pointer-events-auto absolute left-5 md:left-9 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
            >
              <div className="relative h-[44vh] w-6 flex justify-center">
                {/* Base 1px vertical track */}
                <div className="h-full w-px bg-white/15" />

                {/* Filled 1px vertical amber line driven by scroll progress */}
                <div
                  ref={progressLineFillRef}
                  className="absolute top-0 w-px h-full bg-[#d4a36a] origin-top"
                  style={{ transform: 'scaleY(0.015)' }}
                />

                {/* Interactive beat ticks along the progress line */}
                {beats.map((beat, idx) => {
                  const isActive = idx === activeBeatIdx;
                  return (
                    <button
                      key={beat.id}
                      type="button"
                      onClick={() => jumpToBeat(beat.progress)}
                      onMouseEnter={() => soundEngine.play('hover')}
                      aria-label={`Beat ${idx + 1}: ${beat.timestampLabel}`}
                      title={beat.timestampLabel}
                      style={{ top: `${beat.progress * 100}%` }}
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center group py-2 px-3 cursor-pointer"
                    >
                      <span
                        className={`block h-px transition-all ${
                          isActive
                            ? 'w-3.5 bg-[#d4a36a]'
                            : 'w-2 bg-white/35 group-hover:w-3 group-hover:bg-white/75'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Lower-Left Documentary Captions (Smooth Fades, Zero Snapping) */}
            <div className="absolute bottom-14 left-12 right-6 md:left-24 md:right-auto z-20 max-w-xl grid">
              {beats.map((beat, idx) => {
                const isReducedVisible = idx === activeBeatIdx;
                return (
                  <div
                    key={beat.id}
                    ref={(el) => {
                      captionElsRef.current[idx] = el;
                    }}
                    style={
                      prefersReducedMotion
                        ? { gridArea: '1 / 1', opacity: isReducedVisible ? 1 : 0 }
                        : { gridArea: '1 / 1', opacity: idx === 0 ? 1 : 0 }
                    }
                    className={`reduced-motion-fade ${
                      prefersReducedMotion && !isReducedVisible
                        ? 'pointer-events-none'
                        : 'pointer-events-auto'
                    }`}
                  >
                    {/* Clean unboxed FACT / NARRATION tag + timestamp */}
                    <div className="flex items-center gap-2.5 font-mono-tech text-[11px] uppercase tracking-[0.18em] mb-2.5">
                      <span
                        className={
                          beat.tag === 'FACT' ? 'text-[#d4a36a]' : 'text-[#a1aab8]'
                        }
                      >
                        {beat.tag}
                      </span>
                      <span aria-hidden="true" className="text-[#6c7686]">
                        ·
                      </span>
                      <span className="text-[#8b95a5]">{beat.timestampLabel}</span>
                    </div>

                    <p className="font-body text-base sm:text-lg md:text-[21px] font-normal leading-[1.55] tracking-[0.01em] text-[#ededef]">
                      {beat.caption}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Subtle "SCROLL" hint that fades after first scroll */}
            <div
              className={`reduced-motion-fade pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 transition-opacity duration-700 ${
                hasScrolled ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.28em] text-[#a1aab8]">
                Scroll
              </span>
              <span className="block h-5 w-px bg-white/30" />
            </div>

            {/* Final-Beat Quiet Archive Completion Actions */}
            <div
              className={`reduced-motion-fade absolute bottom-14 right-6 md:right-12 z-20 flex flex-wrap items-center gap-3 transition-opacity duration-700 ${
                atFinalBeat ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            >
              {isSignalLocked ? (
                <span className="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#d4a36a] px-2">
                  Archive Record Logged
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playLockChime();
                    onLockSignal();
                  }}
                  className="border border-[#d4a36a]/70 bg-[#05070b]/85 px-4 py-2 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#ededef] hover:bg-[#d4a36a]/15 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Log Signal in Archive
                </button>
              )}

              <button
                type="button"
                onClick={onNextMission}
                className="border border-white/25 bg-[#05070b]/85 px-4 py-2 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#c2c8d2] hover:border-white/60 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
              >
                Next Artifact
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Slide-Over Technical Dossier & Signal Tuner Drawer */}
      {showDossierDrawer && (
        <div className="pointer-events-auto fixed inset-y-0 right-0 top-[53px] z-30 w-full md:w-[460px] lg:w-[490px] bg-[#05070b]/96 border-l border-white/15 flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <span className="hud-label text-[#a1aab8]">
              NSSDCA Technical Dossier · {mission.cosparId}
            </span>
            <button
              type="button"
              onClick={() => setShowDossierDrawer(false)}
              aria-label="Close technical dossier"
              className="inline-flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#a1aab8] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <MissionDossier
              mission={mission}
              isSignalLocked={isSignalLocked}
              inspectedHotspots={inspectedHotspots}
              activeHotspot={activeHotspot}
              onLockSignal={onLockSignal}
              onSelectHotspot={onSelectHotspot}
              onBackToDestination={onBackToDestination}
              onNextMission={onNextMission}
            />
          </div>
        </div>
      )}
    </div>
  );
}
