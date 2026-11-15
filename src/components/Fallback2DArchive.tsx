import { DESTINATIONS, DestinationId, MISSIONS, MissionId } from '../data/missions';

interface Fallback2DArchiveProps {
  activeDestination: DestinationId | null;
  activeMissionId: MissionId | null;
  onSelectDestination: (id: DestinationId) => void;
  onSelectMission: (id: MissionId) => void;
}

/**
 * Low-power / 2D Archive Mode fallback inspired by the PRD planetary composition,
 * providing smooth star-chart navigation on older hardware or when WebGL is disabled.
 */
export function Fallback2DArchive({
  activeDestination,
  activeMissionId,
  onSelectDestination,
  onSelectMission,
}: Fallback2DArchiveProps) {
  const mission = activeMissionId ? MISSIONS[activeMissionId] : null;
  const destination = activeDestination ? DESTINATIONS[activeDestination] : null;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#05070b]">
      {/* Procedural Starfield & Planetary Composition SVG */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="earthGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#4c7db8" />
            <stop offset="55%" stopColor="#173258" />
            <stop offset="100%" stopColor="#070d18" />
          </radialGradient>
          <radialGradient id="moonGrad" cx="38%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#9fa3aa" />
            <stop offset="70%" stopColor="#52555c" />
            <stop offset="100%" stopColor="#14161b" />
          </radialGradient>
          <radialGradient id="marsGrad" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#a4533c" />
            <stop offset="52%" stopColor="#5d291d" />
            <stop offset="100%" stopColor="#120908" />
          </radialGradient>
          <radialGradient id="marsRim" cx="50%" cy="50%" r="50%">
            <stop offset="93%" stopColor="rgba(199,125,152,0)" />
            <stop offset="98%" stopColor="rgba(199,125,152,0.45)" />
            <stop offset="100%" stopColor="rgba(199,125,152,0)" />
          </radialGradient>
        </defs>

        <rect width="1440" height="900" fill="#05070b" />

        {/* Subtle J2000 reference stars */}
        {[
          [140, 120, 1.5],
          [220, 480, 1.2],
          [380, 190, 1.8],
          [520, 650, 1.3],
          [690, 130, 1.6],
          [760, 290, 1.1],
          [940, 90, 1.7],
          [1120, 140, 1.4],
          [1290, 210, 1.5],
          [180, 740, 1.9],
          [310, 810, 1.2],
          [610, 410, 1.4],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#dce6f5" opacity={0.65} />
        ))}

        {/* Taurus / Aldebaran Reference Trajectory Line */}
        <line
          x1="180"
          y1="740"
          x2="470"
          y2="560"
          stroke="rgba(212,163,106,0.28)"
          strokeDasharray="4 6"
          strokeWidth="1"
        />

        {/* Earth (Upper-Left) */}
        <circle cx="310" cy="235" r="108" fill="url(#earthGrad)" />
        <circle
          cx="310"
          cy="235"
          r="111"
          fill="none"
          stroke="rgba(112,174,232,0.35)"
          strokeWidth="2"
        />

        {/* Moon (Near Earth) */}
        <circle cx="485" cy="285" r="28" fill="url(#moonGrad)" />

        {/* Mars (Large Foreground Right) */}
        <circle cx="1090" cy="690" r="460" fill="url(#marsGrad)" />
        <circle cx="1090" cy="690" r="466" fill="url(#marsRim)" />
      </svg>

      {/* Interactive 2D Reticle Anchors when in Hub/Destination */}
      {!mission && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-6">
          <div className="pointer-events-auto grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
            {(['moon', 'mars', 'deep-space'] as DestinationId[]).map((dId) => {
              const dest = DESTINATIONS[dId];
              const isSelected = activeDestination === dId;
              return (
                <div
                  key={dId}
                  className={`reticle-frame hairline-box p-5 transition-colors ${
                    isSelected ? 'border-[#d4a36a]' : 'border-white/15'
                  }`}
                >
                  <div className="hud-label mb-1 text-[#c77d98]">{dest.code}</div>
                  <h3 className="font-display text-2xl uppercase tracking-[0.06em] text-[#ededef]">
                    {dest.name}
                  </h3>
                  <p className="mt-1 font-mono-tech text-[11px] text-[#8b95a5]">
                    {dest.contextLabel}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-[#b5becb]">
                    {dest.description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                    {dest.missionIds.map((mId) => (
                      <button
                        key={mId}
                        type="button"
                        onClick={() => {
                          onSelectDestination(dId);
                          onSelectMission(mId);
                        }}
                        className="border border-white/20 px-3 py-2 text-left font-mono-tech text-[11px] uppercase tracking-[0.1em] text-[#ededef] hover:border-[#d4a36a] cursor-pointer"
                      >
                        Inspect {MISSIONS[mId].name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clean 2D Schematic Plate behind Mission Dossier when inspecting */}
      {mission && destination && (
        <div className="pointer-events-none fixed inset-y-0 left-0 hidden lg:flex w-[calc(100%-460px)] items-center justify-center p-12">
          <div className="hairline-box max-w-lg p-6">
            <div className="hud-label text-[#d4a36a] mb-2">
              2D Schematic Archive Mode · {destination.name}
            </div>
            <h3 className="font-display text-3xl uppercase tracking-[0.06em] text-[#ededef]">
              {mission.name}
            </h3>
            <p className="mt-2 font-mono-tech text-xs text-[#8b95a5]">
              {mission.coordinatesLabel} · NSSDCA {mission.cosparId}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#c2c8d2]">
              {mission.finalStateSummary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
