import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import {
  DESTINATIONS,
  DestinationId,
  MISSIONS,
  MISSION_LIST,
  MissionId,
  SpacecraftHotspot,
} from './data/missions';
import { ExperienceView, SpaceViewport } from './three/SpaceViewport';
import { IntroOverlay } from './components/IntroOverlay';
import { MissionDossier } from './components/MissionDossier';
import { MissionPanel } from './components/MissionPanel';
import { ArchiveSourcesModal } from './components/ArchiveSourcesModal';
import { Fallback2DArchive } from './components/Fallback2DArchive';
import { soundEngine } from './audio/soundEngine';

const STORAGE_KEY = 'last-footprint-archive-v1';

interface SavedProgress {
  lockedMissions: MissionId[];
  inspectedHotspots: Record<string, string[]>;
}

function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lockedMissions: [], inspectedHotspots: {} };
    const parsed = JSON.parse(raw) as SavedProgress;
    return {
      lockedMissions: Array.isArray(parsed.lockedMissions) ? parsed.lockedMissions : [],
      inspectedHotspots: parsed.inspectedHotspots ?? {},
    };
  } catch {
    return { lockedMissions: [], inspectedHotspots: {} };
  }
}

export default function App() {
  const [view, setView] = useState<ExperienceView>('intro');
  const [activeDestination, setActiveDestination] = useState<DestinationId | null>(null);
  const [activeMissionId, setActiveMissionId] = useState<MissionId | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<SpacecraftHotspot | null>(null);
  const [entryIntensity, setEntryIntensity] = useState(0);

  const [isMuted, setIsMuted] = useState(true);
  const [use2DMode, setUse2DMode] = useState(false);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [modalMode, setModalMode] = useState<'archive' | 'sources' | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  const [progress, setProgress] = useState<SavedProgress>(() => loadProgress());
  const entryTimerRef = useRef<number | null>(null);
  const missionProgressRef = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  // Respect prefers-reduced-motion on initial load and live OS preference updates
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setPrefersReducedMotion(true);
      setView('hub');
    }
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const triggerEntryTransition = useCallback((destId: DestinationId) => {
    if (entryTimerRef.current) window.clearTimeout(entryTimerRef.current);
    const level = destId === 'mars' ? 0.92 : destId === 'moon' ? 0.35 : 0.55;
    setEntryIntensity(level);
    entryTimerRef.current = window.setTimeout(() => {
      setEntryIntensity(0);
    }, 1750);
  }, []);

  const handleToggleAudio = useCallback(() => {
    const nextMuted = !isMuted;
    soundEngine.setMuted(nextMuted);
    setIsMuted(nextMuted);
  }, [isMuted]);

  const handleSelectDestination = useCallback(
    (destId: DestinationId) => {
      setActiveDestination(destId);
      setActiveMissionId(null);
      setActiveHotspot(null);
      setView('destination');
      triggerEntryTransition(destId);
    },
    [triggerEntryTransition],
  );

  const handleSelectMission = useCallback((missionId: MissionId) => {
    const mission = MISSIONS[missionId];
    missionProgressRef.current = 0;
    setActiveDestination(mission.destinationId);
    setActiveMissionId(missionId);
    setActiveHotspot(null);
    setView('mission');
  }, []);

  const handleReturnToHub = useCallback(() => {
    missionProgressRef.current = 0;
    setActiveDestination(null);
    setActiveMissionId(null);
    setActiveHotspot(null);
    setEntryIntensity(0);
    setView('hub');
  }, []);

  const handleLockSignal = useCallback((missionId: MissionId) => {
    setProgress((prev) => {
      if (prev.lockedMissions.includes(missionId)) return prev;
      return {
        ...prev,
        lockedMissions: [...prev.lockedMissions, missionId],
      };
    });
  }, []);

  const handleSelectHotspot = useCallback(
    (hotspot: SpacecraftHotspot | null) => {
      setActiveHotspot(hotspot);
      if (!hotspot || !activeMissionId) return;
      setProgress((prev) => {
        const existing = prev.inspectedHotspots[activeMissionId] ?? [];
        if (existing.includes(hotspot.id)) return prev;
        return {
          ...prev,
          inspectedHotspots: {
            ...prev.inspectedHotspots,
            [activeMissionId]: [...existing, hotspot.id],
          },
        };
      });
    },
    [activeMissionId],
  );

  const handleNextMission = useCallback(() => {
    if (!activeMissionId) return;
    const idx = MISSION_LIST.findIndex((m) => m.id === activeMissionId);
    if (idx >= 0 && idx < MISSION_LIST.length - 1) {
      handleSelectMission(MISSION_LIST[idx + 1].id);
    } else {
      setActiveMissionId(null);
      setActiveDestination(null);
      setView('closing');
    }
  }, [activeMissionId, handleSelectMission]);

  const activeMission = activeMissionId ? MISSIONS[activeMissionId] : null;
  const activeDestConfig = activeDestination ? DESTINATIONS[activeDestination] : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#05070b] text-[#ededef]">
      {/* 3D Cinematic Stage OR Low-Spec 2D Archive Fallback */}
      {use2DMode ? (
        <Fallback2DArchive
          activeDestination={activeDestination}
          activeMissionId={activeMissionId}
          onSelectDestination={handleSelectDestination}
          onSelectMission={handleSelectMission}
        />
      ) : (
        <SpaceViewport
          view={view}
          activeDestination={activeDestination}
          activeMissionId={activeMissionId}
          activeHotspot={activeHotspot}
          entryIntensity={entryIntensity}
          scrollProgressRef={missionProgressRef}
          prefersReducedMotion={prefersReducedMotion}
          onSelectDestination={handleSelectDestination}
          onSelectHotspot={(hs) => handleSelectHotspot(hs)}
          onWebglFallback={() => setUse2DMode(true)}
        />
      )}

      {/* Intro Opening Sequence */}
      {view === 'intro' && (
        <IntroOverlay
          isMuted={isMuted}
          onToggleAudio={handleToggleAudio}
          onComplete={() => setView('hub')}
        />
      )}

      {/* Main Persistent Top Navigation Bar (Three-zone contract, hidden during intro) */}
      {view !== 'intro' && (
        <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-4 border-b border-white/10 bg-[#05070b]/82 px-5 py-3 md:px-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={handleReturnToHub}
            className="pointer-events-auto text-left font-display text-lg md:text-xl font-medium uppercase tracking-[0.14em] text-[#ededef] whitespace-nowrap shrink-0 cursor-pointer"
          >
            The Last Footprint
          </button>

          {/* Zone 2: Clean single-line text links */}
          <nav
            aria-label="Primary Archive Navigation"
            className="pointer-events-auto hidden md:flex items-center gap-7 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#a1aab8]"
          >
            <button
              type="button"
              onClick={handleReturnToHub}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'hub' ? 'text-[#ededef] underline underline-offset-4' : ''
              }`}
            >
              Explore
            </button>
            <button
              type="button"
              onClick={() => setModalMode('archive')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Archive Log ({progress.lockedMissions.length}/{MISSION_LIST.length})
            </button>
            <button
              type="button"
              onClick={() => setModalMode('sources')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              About & Sources
            </button>
            <button
              type="button"
              onClick={() => setUse2DMode((v) => !v)}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {use2DMode ? '3D Stage' : '2D Mode'}
            </button>
          </nav>

          {/* Zone 3: Single Primary Utility Action (Audio + mobile log shortcut) */}
          <div className="pointer-events-auto flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setModalMode('archive')}
              className="md:hidden border border-white/20 px-2.5 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#ededef] whitespace-nowrap cursor-pointer"
            >
              Log {progress.lockedMissions.length}/{MISSION_LIST.length}
            </button>
            <button
              type="button"
              onClick={handleToggleAudio}
              aria-label={isMuted ? 'Unmute ambient audio' : 'Mute ambient audio'}
              className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#ededef] hover:border-[#d4a36a] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-[#8b95a5]" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#d4a36a]" />
              )}
              <span className="hidden sm:inline">{isMuted ? 'Audio Off' : 'Audio On'}</span>
            </button>
          </div>
        </header>
      )}

      {/* Hub View: Collapsible Bottom Dock leaving 3D viewport center unobstructed */}
      {view === 'hub' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex flex-col items-center px-4">
          <button
            type="button"
            onClick={() => setHudCollapsed((c) => !c)}
            className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 border border-white/15 bg-[#05070b]/90 px-3 py-1 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#a1aab8] hover:text-white cursor-pointer"
          >
            {hudCollapsed ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span>Show Archive Dock</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>Hide HUD</span>
              </>
            )}
          </button>

          {!hudCollapsed && (
            <div className="pointer-events-auto hairline-box w-full max-w-4xl px-5 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="hud-label text-[#c77d98]">Abandoned but Not Forgotten</div>
                <p className="mt-0.5 text-xs text-[#c2c8d2]">
                  Select a celestial region in space or choose a destination below to inspect
                  humanity’s silent explorers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {(['moon', 'mars', 'deep-space'] as DestinationId[]).map((dId) => (
                  <button
                    key={dId}
                    type="button"
                    onClick={() => handleSelectDestination(dId)}
                    className="border border-white/20 px-3.5 py-2 font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#ededef] hover:border-[#d4a36a] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {DESTINATIONS[dId].name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Destination Encounter Selection Drawer */}
      {view === 'destination' && activeDestConfig && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center px-4">
          <div className="pointer-events-auto hairline-box w-full max-w-4xl p-5 md:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3.5">
              <div>
                <div className="hud-label text-[#c77d98]">
                  {activeDestConfig.code} · {activeDestConfig.contextLabel}
                </div>
                <h2 className="mt-1 font-display text-2xl md:text-3xl uppercase tracking-[0.06em] text-[#ededef]">
                  {activeDestConfig.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleReturnToHub}
                className="inline-flex items-center gap-1.5 border border-white/20 px-3 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#a1aab8] hover:border-white/45 hover:text-white cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Hub</span>
              </button>
            </div>

            <p className="mt-3 text-xs md:text-sm text-[#b5becb] leading-relaxed">
              {activeDestConfig.description}
            </p>

            <div
              className={`mt-4 grid grid-cols-1 gap-3 ${
                activeDestConfig.missionIds.length >= 3
                  ? 'sm:grid-cols-3'
                  : activeDestConfig.missionIds.length === 2
                    ? 'sm:grid-cols-2'
                    : 'sm:grid-cols-1 max-w-md mx-auto'
              }`}
            >
              {activeDestConfig.missionIds.map((mId) => {
                const m = MISSIONS[mId];
                const isLogged = progress.lockedMissions.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMission(m.id)}
                    className="reticle-frame border border-white/15 bg-[#060910] p-4 text-left hover:border-[#d4a36a] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between font-mono-tech text-[10px] text-[#8b95a5]">
                      <span>
                        ARTIFACT {m.indexCode} · {m.cosparId}
                      </span>
                      <span className={isLogged ? 'text-[#d4a36a]' : 'text-[#6c7686]'}>
                        {isLogged ? 'LOGGED' : 'UNLOGGED'}
                      </span>
                    </div>
                    <div className="mt-1.5 font-display text-lg uppercase tracking-[0.04em] text-[#ededef]">
                      {m.name}
                    </div>
                    <div className="mt-1 text-xs text-[#a1aab8]">{m.statusLabel}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mission Encounter / Story View */}
      {view === 'mission' &&
        activeMission &&
        (activeMission.id === 'opportunity' &&
        activeMission.beats &&
        activeMission.beats.length > 0 &&
        !use2DMode ? (
          <MissionPanel
            mission={activeMission}
            beats={activeMission.beats}
            scrollProgressRef={missionProgressRef}
            prefersReducedMotion={prefersReducedMotion}
            isSignalLocked={progress.lockedMissions.includes(activeMission.id)}
            inspectedHotspots={progress.inspectedHotspots[activeMission.id] ?? []}
            activeHotspot={activeHotspot}
            onLockSignal={() => handleLockSignal(activeMission.id)}
            onSelectHotspot={handleSelectHotspot}
            onBackToDestination={() => {
              missionProgressRef.current = 0;
              setActiveMissionId(null);
              setActiveHotspot(null);
              setView('destination');
            }}
            onNextMission={handleNextMission}
          />
        ) : (
          <>
            {/* Left-bottom quiet 3D viewport hint (keeps center unobstructed) */}
            <div className="pointer-events-none fixed bottom-5 left-6 z-20 hidden lg:block">
              <div className="hairline-box px-3.5 py-2 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8b95a5]">
                3D Reconstruction · Drag to Orbit · Scroll to Zoom · Click Markers
              </div>
            </div>

            {/* Right Dossier Panel (responsive full-height drawer on desktop, lower sheet on mobile) */}
            <div className="fixed inset-x-0 bottom-0 top-[54%] z-20 md:inset-y-0 md:left-auto md:right-0 md:top-[53px] md:w-[450px] lg:w-[480px]">
              <MissionDossier
                mission={activeMission}
                isSignalLocked={progress.lockedMissions.includes(activeMission.id)}
                inspectedHotspots={progress.inspectedHotspots[activeMission.id] ?? []}
                activeHotspot={activeHotspot}
                onLockSignal={() => handleLockSignal(activeMission.id)}
                onSelectHotspot={handleSelectHotspot}
                onBackToDestination={() => {
                  setActiveMissionId(null);
                  setActiveHotspot(null);
                  setView('destination');
                }}
                onNextMission={handleNextMission}
              />
            </div>
          </>
        ))}

      {/* Closing / Legacy Reflection View */}
      {view === 'closing' && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center p-6">
          <div className="pointer-events-auto hairline-box max-w-2xl p-8 text-center">
            <p className="hud-label text-[#c77d98] mb-3">
              Archive Complete · Project Narrative Reflection
            </p>
            <h2 className="font-display text-3xl md:text-5xl uppercase tracking-[0.08em] text-[#ededef]">
              Abandoned, Yet Enduring
            </h2>
            <p className="mt-4 text-sm md:text-base leading-relaxed text-[#c2c8d2]">
              These machines travelled farther than people could, explored worlds once only
              imagined, and made discoveries that outlasted their operational lives. Their signals
              fell silent, yet every future mission navigates by the footprints they left behind.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleReturnToHub}
                className="border border-[#d4a36a] px-5 py-2 font-mono-tech text-xs uppercase tracking-[0.14em] text-[#ededef] hover:bg-[#d4a36a]/15 cursor-pointer"
              >
                Return to Exploration Hub
              </button>
              <button
                type="button"
                onClick={() => setModalMode('sources')}
                className="border border-white/25 px-5 py-2 font-mono-tech text-xs uppercase tracking-[0.14em] text-[#a1aab8] hover:text-white cursor-pointer"
              >
                Review NSSDCA Sources
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Log / Sources Modal */}
      {modalMode && (
        <ArchiveSourcesModal
          mode={modalMode}
          lockedMissions={progress.lockedMissions}
          inspectedHotspots={progress.inspectedHotspots}
          onClose={() => setModalMode(null)}
          onSelectMission={handleSelectMission}
          onTriggerClosing={() => {
            setActiveMissionId(null);
            setActiveDestination(null);
            setView('closing');
          }}
        />
      )}
    </div>
  );
}
