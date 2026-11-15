import { useEffect, useState } from 'react';
import { ExternalLink, ArrowLeft, Check, Crosshair } from 'lucide-react';
import { MissionRecord, SpacecraftHotspot, TO_BE_VERIFIED } from '../data/missions';
import { SignalTuner } from './SignalTuner';
import { soundEngine } from '../audio/soundEngine';

interface MissionDossierProps {
  mission: MissionRecord;
  isSignalLocked: boolean;
  isSimCompleted?: boolean;
  stageMode?: '3d-inspect' | 'cockpit-sim';
  inspectedHotspots: string[];
  directorChoices?: Record<string, string>;
  activeHotspot: SpacecraftHotspot | null;
  onLockSignal: () => void;
  onToggleStageMode?: (mode: '3d-inspect' | 'cockpit-sim') => void;
  onSelectDirectorChoice?: (decisionId: string, optionId: string) => void;
  onSelectHotspot: (hotspot: SpacecraftHotspot | null) => void;
  onBackToDestination: () => void;
  onNextMission: () => void;
}

export function MissionDossier({
  mission,
  isSignalLocked,
  isSimCompleted,
  stageMode,
  inspectedHotspots,
  directorChoices,
  activeHotspot,
  onLockSignal,
  onToggleStageMode,
  onSelectDirectorChoice,
  onSelectHotspot,
  onBackToDestination,
  onNextMission,
}: MissionDossierProps) {
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'story' | 'timeline' | 'sources'>('story');

  useEffect(() => {
    setActiveChapterIdx(0);
    setActiveTab('story');
  }, [mission.id]);

  const currentChapter = mission.chapters[activeChapterIdx] ?? mission.chapters[0];
  const decision = currentChapter.decisionPrompt;
  const chosenOptionId = decision ? directorChoices?.[`${mission.id}:${decision.id}`] : undefined;
  const chosenOption = decision?.options?.find((opt: any) => opt.id === chosenOptionId) ?? null;

  return (
    <aside
      aria-label={`${mission.name} mission dossier`}
      className="hairline-box archive-scroll flex h-full w-full flex-col overflow-y-auto p-5 md:p-6"
    >
      {/* Top Return & Identity */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
        <button
          type="button"
          onClick={onBackToDestination}
          className="inline-flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#a1aab8] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{mission.destinationLabel}</span>
        </button>

        <span className="font-mono-tech text-[11px] tracking-[0.14em] text-[#8b95a5] whitespace-nowrap">
          ARTIFACT {mission.indexCode} · {mission.cosparId}
        </span>
      </div>

      {/* Mission Header */}
      <div className="pt-4 pb-4 border-b border-white/10">
        <p className="hud-label text-[#c77d98] mb-1.5">{mission.statusLabel}</p>
        <h2 className="font-display text-2xl md:text-3xl font-medium tracking-[0.04em] uppercase text-[#ededef] leading-tight">
          {mission.name}
        </h2>
        <p className="mt-1.5 text-xs font-mono-tech text-[#8b95a5]">
          {mission.hardwareType} · {mission.agency}
        </p>

        <dl className="mt-4 grid grid-cols-1 gap-2 text-xs">
          <div className="flex justify-between gap-3 border-b border-white/5 pb-1.5">
            <dt className="text-[#6c7686] uppercase font-mono-tech text-[10px] tracking-[0.12em]">
              Location
            </dt>
            <dd className="text-right text-[#d0d6e0]">{mission.siteName}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-white/5 pb-1.5">
            <dt className="text-[#6c7686] uppercase font-mono-tech text-[10px] tracking-[0.12em]">
              Launched
            </dt>
            <dd className="text-right font-mono-tech text-[#d0d6e0]">{mission.launchDate}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-white/5 pb-1.5">
            <dt className="text-[#6c7686] uppercase font-mono-tech text-[10px] tracking-[0.12em]">
              Arrival
            </dt>
            <dd className="text-right font-mono-tech text-[#d0d6e0]">
              {mission.arrivalOrLandingDate}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6c7686] uppercase font-mono-tech text-[10px] tracking-[0.12em]">
              End of Ops
            </dt>
            <dd className="text-right font-mono-tech text-[#d0d6e0]">
              {mission.endOfOperationsDate}
            </dd>
          </div>
        </dl>
      </div>

      {/* Gamified Signal Tuning & Discovery Log */}
      <div className="py-4 border-b border-white/10">
        <SignalTuner
          mission={mission}
          isLocked={isSignalLocked}
          onLockSignal={onLockSignal}
        />
      </div>

      {/* Verified Telemetry Callouts (strict TO BE VERIFIED handling) */}
      <div className="py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2.5">
          <span className="hud-label">Verified Record Callouts</span>
          <span className="font-mono-tech text-[10px] text-[#6c7686]">NSSDCA BASELINE</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {mission.telemetry.map((m) => {
            const isMissing = !m.verified || m.value === TO_BE_VERIFIED;
            return (
              <div key={m.label} className="border border-white/10 bg-[#060910] p-2.5">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#6c7686]">
                  {m.label}
                </div>
                <div
                  className={`mt-1 font-mono-tech text-xs ${
                    isMissing ? 'text-[#d4a36a]' : 'text-[#ededef]'
                  }`}
                >
                  {m.value}
                </div>
                <div className="mt-1 text-[10px] text-[#6c7686] truncate" title={m.sourceNote}>
                  {m.sourceNote}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Hardware Hotspot Inspector */}
      <div className="py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2.5">
          <span className="hud-label">3D Reconstruction Hotspots</span>
          <span className="font-mono-tech text-[10px] text-[#8b95a5]">
            {inspectedHotspots.length}/{mission.hotspots.length} INSPECTED
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {mission.hotspots.map((hs, idx) => {
            const selected = activeHotspot?.id === hs.id;
            const visited = inspectedHotspots.includes(hs.id);
            return (
              <button
                key={hs.id}
                type="button"
                onClick={() => onSelectHotspot(selected ? null : hs)}
                className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-[0.1em] transition-colors cursor-pointer ${
                  selected
                    ? 'border-[#d4a36a] bg-[#d4a36a]/15 text-[#ededef]'
                    : 'border-white/15 text-[#a1aab8] hover:border-white/40 hover:text-white'
                }`}
              >
                {visited && <Check className="w-2.5 h-2.5 text-[#d4a36a]" />}
                <span>0{idx + 1} {hs.label}</span>
              </button>
            );
          })}
        </div>

        {activeHotspot ? (
          <div className="border border-[#d4a36a]/40 bg-[#080c14] p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-display text-sm uppercase tracking-[0.08em] text-[#ededef]">
                {activeHotspot.label}
              </span>
              <span className="font-mono-tech text-[10px] text-[#d4a36a]">
                {activeHotspot.factBasis}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#b5becb]">{activeHotspot.summary}</p>
          </div>
        ) : (
          <p className="text-xs text-[#6c7686]">
            Select any numbered assembly marker on the 3D craft or above to inspect its function.
            Visual model is an illustrative 3D reconstruction based on NASA engineering specs.
          </p>
        )}
      </div>

      {/* Narrative / Timeline / Sources Tabs */}
      <div className="pt-4">
        <div className="flex items-center gap-4 border-b border-white/10 pb-2 mb-4">
          {(
            [
              ['story', 'Six-Chapter Story'],
              ['timeline', 'Milestones'],
              ['sources', 'Sources & Imagery'],
            ] as const
          ).map(([tabKey, tabLabel]) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={`font-mono-tech text-[11px] uppercase tracking-[0.14em] pb-1 border-b transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tabKey
                  ? 'border-[#d4a36a] text-[#ededef]'
                  : 'border-transparent text-[#6c7686] hover:text-[#a1aab8]'
              }`}
            >
              {tabLabel}
            </button>
          ))}
        </div>

        {activeTab === 'story' && (
          <div>
            {/* Chapter Stepper with interactive indicator */}
            <div className="grid grid-cols-6 gap-1 mb-4">
              {mission.chapters.map((ch, idx) => {
                const hasInteractive = Boolean(ch.decisionPrompt || ch.simTriggerLabel);
                const decisionDone = ch.decisionPrompt
                  ? Boolean(directorChoices[`${mission.id}:${ch.decisionPrompt.id}`])
                  : false;
                return (
                  <button
                    key={ch.index}
                    type="button"
                    onClick={() => {
                      soundEngine.playRelayClick();
                      setActiveChapterIdx(idx);
                    }}
                    className={`border py-1.5 font-mono-tech text-[11px] transition-colors cursor-pointer ${
                      idx === activeChapterIdx
                        ? 'border-[#d4a36a] bg-[#d4a36a]/15 text-[#ededef]'
                        : decisionDone
                          ? 'border-white/25 text-[#d4a36a] hover:border-white/40'
                          : 'border-white/10 text-[#6c7686] hover:border-white/30 hover:text-[#c2c8d2]'
                    }`}
                  >
                    {ch.index}
                    {hasInteractive ? ' ·' : ''}
                  </button>
                );
              })}
            </div>

            <div className="mb-4">
              <div className="hud-label text-[#d4a36a] mb-1">
                Chapter {currentChapter.index} · {currentChapter.heading}
              </div>
              <h3 className="font-display text-xl uppercase tracking-[0.05em] text-[#ededef] mb-2">
                {currentChapter.subheading}
              </h3>
              <p className="text-sm leading-relaxed text-[#c2c8d2]">{currentChapter.body}</p>
            </div>

            {/* Chapter-Linked Tactile Cockpit / Camera Simulation Launcher */}
            {mission.engineeringSim && (currentChapter.simTriggerLabel ||
              activeChapterIdx === mission.engineeringSim.chapterHintIndex) && (
              <div className="mb-4 border border-[#d4a36a]/45 bg-[#080c14] p-3.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="hud-label text-[#d4a36a]">Interactive Engineering Task</span>
                  <span className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8b95a5]">
                    {isSimCompleted ? '✓ Completed' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-[#b5becb] leading-relaxed mb-2.5">
                  {mission.engineeringSim.objective}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playRelayClick();
                    onToggleStageMode(stageMode === 'cockpit-sim' ? '3d-inspect' : 'cockpit-sim');
                  }}
                  className="inline-flex items-center gap-2 border border-[#d4a36a] px-3 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#ededef] hover:bg-[#d4a36a]/15 transition-colors cursor-pointer"
                >
                  <Crosshair className="w-3.5 h-3.5 text-[#d4a36a]" />
                  <span>
                    {stageMode === 'cockpit-sim'
                      ? 'Return to 3D Craft'
                      : currentChapter.simTriggerLabel ?? `Open ${mission.engineeringSim.title}`}
                  </span>
                </button>
              </div>
            )}

            {/* Flight Director Narrative Decision Block */}
            {decision && (
              <div className="mb-4 border border-white/15 bg-[#060910] p-3.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="hud-label text-[#c77d98]">Flight Director Decision</span>
                  <span className="font-mono-tech text-[10px] text-[#8b95a5]">
                    {decision.contextLabel}
                  </span>
                </div>

                <p className="text-xs text-[#ededef] leading-relaxed mb-3">{decision.prompt}</p>

                {!chosenOption ? (
                  <div className="space-y-1.5">
                    {decision.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playRelayClick();
                          onSelectDirectorChoice(decision.id, opt.id);
                        }}
                        className="w-full border border-white/15 bg-[#080c14] px-3 py-2 text-left text-xs text-[#c2c8d2] hover:border-[#d4a36a] hover:text-white transition-colors cursor-pointer"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 border-t border-white/10 pt-2.5">
                    <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase tracking-[0.12em]">
                      <span
                        className={
                          chosenOption.isHistoricalAction ? 'text-[#d4a36a]' : 'text-[#c77d98]'
                        }
                      >
                        {chosenOption.isHistoricalAction
                          ? '✓ Matched NASA Flight Team'
                          : 'Alternative Action Logged'}
                      </span>
                      <span className="text-[#6c7686]">Recorded</span>
                    </div>
                    <p className="text-xs text-[#ededef] leading-relaxed">
                      {chosenOption.outcomeText}
                    </p>
                    <p className="text-[11px] text-[#9ca5b4] leading-relaxed border-t border-white/10 pt-2">
                      <span className="font-mono-tech uppercase text-[10px] text-[#8b95a5] mr-1.5">
                        Historical Record:
                      </span>
                      {decision.historicalNote}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={activeChapterIdx === 0}
                onClick={() => setActiveChapterIdx((i) => Math.max(0, i - 1))}
                className="font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#a1aab8] disabled:opacity-30 hover:text-white cursor-pointer"
              >
                Previous Chapter
              </button>
              {activeChapterIdx < mission.chapters.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveChapterIdx((i) => Math.min(mission.chapters.length - 1, i + 1))
                  }
                  className="font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#d4a36a] hover:text-white cursor-pointer"
                >
                  Next Chapter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNextMission}
                  className="font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#d4a36a] hover:text-white cursor-pointer"
                >
                  Next Artifact
                </button>
              )}
            </div>

            <blockquote className="mt-5 border-t border-white/10 pt-3 text-xs italic text-[#9ca5b4]">
              {mission.reflectionStatement}
            </blockquote>
          </div>
        )}

        {activeTab === 'timeline' && (
          <ol className="space-y-3">
            {mission.timeline.map((item) => (
              <li key={item.date + item.title} className="border-b border-white/10 pb-3">
                <div className="font-mono-tech text-[11px] text-[#d4a36a]">{item.date}</div>
                <div className="font-display text-base uppercase tracking-[0.05em] text-[#ededef] mt-0.5">
                  {item.title}
                </div>
                <p className="text-xs text-[#a1aab8] mt-1 leading-relaxed">{item.detail}</p>
              </li>
            ))}
          </ol>
        )}

        {activeTab === 'sources' && (
          <div className="space-y-4">
            <div className="border border-white/10 bg-[#060910] p-3">
              <div className="hud-label mb-1">Authentic Archival Imagery Note</div>
              <p className="text-xs text-[#c2c8d2] leading-relaxed">
                {mission.authenticVisualNote.caption}
              </p>
              <div className="mt-2 font-mono-tech text-[10px] text-[#8b95a5]">
                {mission.authenticVisualNote.credit} · {mission.authenticVisualNote.archiveId}
              </div>
              <a
                href={mission.authenticVisualNote.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 font-mono-tech text-[11px] text-[#d4a36a] hover:underline"
              >
                <span>Open NASA Official Visual Record</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2">
              <div className="hud-label">NSSDCA & NASA Source Citations</div>
              {mission.sources.map((src) => (
                <a
                  key={src.url}
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block border border-white/10 p-3 hover:border-white/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#ededef]">
                    <span>{src.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 text-[#8b95a5]" />
                  </div>
                  <div className="mt-1 font-mono-tech text-[10px] text-[#6c7686]">
                    {src.organization}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
