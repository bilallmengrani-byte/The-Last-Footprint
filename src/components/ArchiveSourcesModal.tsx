import { X, ExternalLink, Check } from 'lucide-react';
import { MISSION_LIST, MissionId } from '../data/missions';

interface ArchiveSourcesModalProps {
  mode: 'archive' | 'sources';
  lockedMissions: MissionId[];
  completedSims?: MissionId[];
  directorChoices?: Record<string, string>;
  inspectedHotspots: Record<string, string[]>;
  onClose: () => void;
  onSelectMission: (id: MissionId) => void;
  onTriggerClosing: () => void;
}

export function ArchiveSourcesModal({
  mode,
  lockedMissions,
  completedSims,
  directorChoices,
  inspectedHotspots,
  onClose,
  onSelectMission,
  onTriggerClosing,
}: ArchiveSourcesModalProps) {
  const allLogged = lockedMissions.length === MISSION_LIST.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'archive' ? 'Archive Discovery Log' : 'About and NASA Sources'}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 md:p-8"
    >
      <div className="hairline-box archive-scroll max-h-[88vh] w-full max-w-3xl overflow-y-auto p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="hud-label text-[#c77d98]">
              {mode === 'archive'
                ? 'Archive Discovery Log'
                : 'Provenance & Official NASA Sources'}
            </p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl uppercase tracking-[0.06em] text-[#ededef]">
              {mode === 'archive'
                ? `Logged Artifacts (${lockedMissions.length} / ${MISSION_LIST.length})`
                : 'The Last Footprint — Abandoned but Not Forgotten'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="border border-white/15 p-2 text-[#a1aab8] hover:border-white/40 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {mode === 'archive' ? (
          <div className="pt-5 space-y-4">
            <p className="text-sm text-[#b5becb] leading-relaxed">
              Tune each spacecraft’s carrier alignment, complete its tactile engineering console,
              and log your Flight Director decisions across all {MISSION_LIST.length} historical
              encounters.
            </p>

            <div className="divide-y divide-white/10 border border-white/10">
              {MISSION_LIST.map((m) => {
                const isLocked = lockedMissions.includes(m.id);
                const simDone = completedSims?.includes(m.id) ?? false;
                const hotspotsDone = (inspectedHotspots[m.id] ?? []).length;
                const decisionChapters = m.chapters.filter((ch) => Boolean(ch.decisionPrompt));
                const decisionsDone = decisionChapters.filter(
                  (ch) => Boolean(ch.decisionPrompt && directorChoices?.[`${m.id}:${ch.decisionPrompt.id}`]),
                ).length;

                return (
                  <div
                    key={m.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-mono-tech text-[11px] text-[#8b95a5]">
                        <span>{m.indexCode}</span>
                        <span>·</span>
                        <span>{m.destinationLabel}</span>
                        <span>·</span>
                        <span>NSSDCA {m.cosparId}</span>
                      </div>
                      <h3 className="mt-0.5 font-display text-xl uppercase tracking-[0.04em] text-[#ededef]">
                        {m.name}
                      </h3>
                      <p className="mt-1 font-mono-tech text-[11px] text-[#a1aab8]">
                        {hotspotsDone}/{m.hotspots.length} Assemblies ·{' '}
                        <span className={simDone ? 'text-[#d4a36a]' : ''}>
                          Console {simDone ? 'Complete' : 'Pending'}
                        </span>{' '}
                        ·{' '}
                        <span
                          className={
                            decisionsDone === decisionChapters.length ? 'text-[#d4a36a]' : ''
                          }
                        >
                          Director Log {decisionsDone}/{decisionChapters.length}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 font-mono-tech text-[11px] uppercase tracking-[0.12em] ${
                          isLocked ? 'text-[#d4a36a]' : 'text-[#6c7686]'
                        }`}
                      >
                        {isLocked && <Check className="w-3.5 h-3.5" />}
                        <span>{isLocked ? 'Logged' : 'Unlogged'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectMission(m.id);
                          onClose();
                        }}
                        className="border border-white/25 px-3 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#ededef] hover:border-[#d4a36a] cursor-pointer whitespace-nowrap"
                      >
                        Open Encounter
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <span className="text-xs text-[#8b95a5]">
                {allLogged
                  ? `All ${MISSION_LIST.length} artifacts logged. The closing wide-space sequence is unlocked.`
                  : `Complete signal tuning inside each mission to log all ${MISSION_LIST.length} artifacts.`}
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTriggerClosing();
                }}
                className="border border-[#d4a36a]/60 px-4 py-2 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#ededef] hover:border-[#d4a36a] cursor-pointer whitespace-nowrap"
              >
                View Closing Sequence
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-5 space-y-5 text-sm text-[#c2c8d2] leading-relaxed">
            <p>
              <strong className="text-[#ededef] font-medium">The Last Footprint</strong>{' '}
              (<em>Abandoned but Not Forgotten</em>) is a documentary space-history archive built
              for the NASA Space Apps Challenge. Its premise is quiet and factual: a spacecraft can
              stop operating without its journey becoming meaningless.
            </p>

            <div className="border border-white/10 bg-[#060910] p-4 space-y-2 text-xs">
              <div className="hud-label text-[#d4a36a]">Factual Accuracy & Visual Notice</div>
              <p>
                All mission dates, COSPAR IDs, flight counts, distances, and operational endings
                come exclusively from our curated NSSDCA and NASA mission data catalog. Any metric
                not verified in that file explicitly renders as{' '}
                <span className="font-mono-tech text-[#d4a36a]">TO BE VERIFIED</span>.
              </p>
              <p>
                Planetary globes combine NASA-derived 2K equirectangular imagery and elevation maps:
                NASA Blue Marble &amp; Black Marble (Earth), NASA Lunar Reconnaissance Orbiter
                mosaic &amp; LOLA laser altimetry DEM (SVS-4720, Moon), and NASA Viking / Mars
                Global Surveyor mosaic (Mars), incorporating Three.js planetary maps and Solar
                System Scope textures (CC BY 4.0). Starfields map J2000 equatorial coordinates, and
                spacecraft hardware assemblies are procedural 3D reconstructions for spatial context.
              </p>
            </div>

            <div className="space-y-2">
              <div className="hud-label">Primary NASA &amp; Imagery Data Resources</div>
              {[
                {
                  name: 'NASA Space Science Data Coordinated Archive (NSSDCA)',
                  url: 'https://nssdc.gsfc.nasa.gov/',
                },
                {
                  name: 'NSSDCA Master Catalog — Apollo 15 Lunar Module / ALSEP / LRV (1971-063C)',
                  url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C',
                },
                {
                  name: 'NASA Science: Mars Pathfinder & Sojourner Rover',
                  url: 'https://science.nasa.gov/mission/mars-pathfinder/',
                },
                {
                  name: 'NASA Scientific Visualization Studio — CGI Moon Kit (LRO/LOLA)',
                  url: 'https://svs.gsfc.nasa.gov/4720',
                },
                {
                  name: 'NASA Image and Video Library',
                  url: 'https://images.nasa.gov/',
                },
                {
                  name: 'NASA Scientific Visualization Studio — Opportunity Final Panorama',
                  url: 'https://svs.gsfc.nasa.gov/13158',
                },
                {
                  name: 'Solar System Scope — NASA-Derived Planetary Textures (CC BY 4.0)',
                  url: 'https://www.solarsystemscope.com/textures/',
                },
              ].map((ref) => (
                <a
                  key={ref.url}
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between border border-white/10 px-4 py-2.5 text-xs text-[#ededef] hover:border-white/35 transition-colors"
                >
                  <span>{ref.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8b95a5]" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
