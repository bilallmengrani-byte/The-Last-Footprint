import { useEffect, useMemo, useRef, useState } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { MissionRecord } from '../data/missions';
import { soundEngine } from '../audio/soundEngine';

interface TactileSimConsoleProps {
  mission: MissionRecord;
  isCompleted: boolean;
  onCompleteSim: () => void;
  onCloseSim: () => void;
}

export function TactileSimConsole({
  mission,
  isCompleted,
  onCompleteSim,
  onCloseSim,
}: TactileSimConsoleProps) {
  const sim = mission.engineeringSim;

  return (
    <section
      aria-label={`${sim.title} interactive simulation`}
      className="fixed inset-x-0 top-[53px] bottom-[44%] z-15 flex flex-col p-3 md:inset-y-0 md:bottom-0 md:left-0 md:right-[450px] lg:right-[480px] md:top-[53px] md:p-5 pointer-events-none"
    >
      <div className="pointer-events-auto hairline-box reticle-frame flex h-full w-full flex-col overflow-hidden bg-[#05070b]/94">
        {/* Console Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#8b95a5] truncate">
              <span className="text-[#c77d98]">Tactile Flight Console</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{sim.cameraFeedLabel}</span>
            </div>
            <h3 className="font-display text-lg md:text-xl uppercase tracking-[0.06em] text-[#ededef] truncate">
              {sim.title}
            </h3>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-[0.12em] whitespace-nowrap ${
                isCompleted ? 'text-[#d4a36a]' : 'text-[#8b95a5]'
              }`}
            >
              {isCompleted && <Check className="w-3 h-3" />}
              <span>{isCompleted ? 'Completed' : 'Active Task'}</span>
            </span>

            <button
              type="button"
              onClick={() => {
                soundEngine.playRelayClick();
                onCloseSim();
              }}
              className="inline-flex items-center gap-1.5 border border-white/20 px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#c2c8d2] hover:border-white/50 hover:text-white cursor-pointer whitespace-nowrap"
            >
              <X className="w-3 h-3" />
              <span>3D View</span>
            </button>
          </div>
        </div>

        {/* Objective Strip */}
        <div className="border-b border-white/10 bg-[#070b12] px-4 py-2 text-xs text-[#b5becb]">
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#d4a36a] mr-2">
            Task:
          </span>
          <span>{sim.objective}</span>
        </div>

        {/* Simulation Body */}
        <div className="flex-1 min-h-0 overflow-y-auto archive-scroll p-3 md:p-4 flex flex-col gap-3">
          {sim.type === 'eagle-descent' && (
            <EagleDescentSim
              alreadyCompleted={isCompleted}
              educationalNote={sim.educationalNote}
              onComplete={onCompleteSim}
            />
          )}
          {sim.type === 'lrv-vip-aim' && (
            <LrvVipAimSim
              alreadyCompleted={isCompleted}
              educationalNote={sim.educationalNote}
              onComplete={onCompleteSim}
            />
          )}
          {sim.type === 'sojourner-apxs' && (
            <SojournerApxsSim
              alreadyCompleted={isCompleted}
              educationalNote={sim.educationalNote}
              onComplete={onCompleteSim}
            />
          )}
          {sim.type === 'opportunity-dust' && (
            <OpportunityDustSim
              alreadyCompleted={isCompleted}
              educationalNote={sim.educationalNote}
              onComplete={onCompleteSim}
            />
          )}
          {sim.type === 'ingenuity-flight' && (
            <IngenuityFlightSim
              alreadyCompleted={isCompleted}
              educationalNote={sim.educationalNote}
              onComplete={onCompleteSim}
            />
          )}
          {sim.type === 'pioneer-rtg' && (
            <PioneerRtgSim
              alreadyCompleted={isCompleted}
              educationalNote={sim.educationalNote}
              onComplete={onCompleteSim}
            />
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. APOLLO 11 EAGLE: LUNAR DESCENT LPD & 1202 PROGRAM ALARM CONSOLE         */
/* -------------------------------------------------------------------------- */
function EagleDescentSim({
  alreadyCompleted,
  educationalNote,
  onComplete,
}: {
  alreadyCompleted: boolean;
  educationalNote: string;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pitchDeg, setPitchDeg] = useState(0); // -18 left, +18 right (glides laterally)
  const [throttle, setThrottle] = useState(56); // 20..95%
  const [alarmCleared, setAlarmCleared] = useState(false);
  const [alarmTriggered, setAlarmTriggered] = useState(false);

  const simRef = useRef({
    altitude: 145,
    sinkRate: 4.8,
    crossrange: -24, // -40..0 is boulder-strewn West Crater; +14..+48 is smooth Mare zone
    fuelSec: 46,
    alarmTriggered: false,
    alarmCleared: false,
    status: 'active' as 'active' | 'landed' | 'hazard' | 'empty',
  });

  const [hud, setHud] = useState({
    altitude: 145,
    sinkRate: 4.8,
    crossrange: -24,
    fuelSec: 46,
    status: 'active' as 'active' | 'landed' | 'hazard' | 'empty',
  });

  const resetSim = () => {
    soundEngine.playRelayClick();
    simRef.current = {
      altitude: 145,
      sinkRate: 4.8,
      crossrange: -24,
      fuelSec: 46,
      alarmTriggered: false,
      alarmCleared: false,
      status: 'active',
    };
    setPitchDeg(0);
    setThrottle(56);
    setAlarmTriggered(false);
    setAlarmCleared(false);
    setHud({
      altitude: 145,
      sinkRate: 4.8,
      crossrange: -24,
      fuelSec: 46,
      status: 'active',
    });
  };

  useEffect(() => {
    simRef.current.alarmCleared = alarmCleared;
  }, [alarmCleared]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const s = simRef.current;
      if (s.status === 'active') {
        // Trigger 1202 Executive Overflow alarm around 112m altitude
        if (!s.alarmTriggered && s.altitude <= 112) {
          s.alarmTriggered = true;
          setAlarmTriggered(true);
          soundEngine.playCautionBeep();
        }

        // Lunar gravity ~1.62 m/s^2; hover throttle ~55%
        const thrustAccel = (throttle / 55) * 1.62;
        const netAccel = 1.62 - thrustAccel; // positive = speeds up downward
        s.sinkRate = Math.max(-1.5, Math.min(12, s.sinkRate + netAccel * dt * 2.1));
        s.altitude = Math.max(0, s.altitude - s.sinkRate * dt * 2.2);

        // Pitch glides laterally across Mare Tranquillitatis
        s.crossrange = Math.max(-45, Math.min(52, s.crossrange + (pitchDeg / 18) * 11 * dt));

        // Propellant burn scales gently with throttle
        const burnMult = 0.55 + (throttle / 100) * 0.9;
        s.fuelSec = Math.max(0, s.fuelSec - dt * burnMult);

        if (s.fuelSec <= 0 && s.altitude > 4) {
          s.status = 'empty';
          soundEngine.playCautionBeep();
        } else if (s.altitude <= 0.2) {
          const inFlatZone = s.crossrange >= 12 && s.crossrange <= 46;
          const safeSpeed = s.sinkRate <= 1.5;
          if (inFlatZone && safeSpeed && s.alarmCleared) {
            s.status = 'landed';
            soundEngine.playSuccessTone();
            onComplete();
          } else {
            s.status = 'hazard';
            soundEngine.playCautionBeep();
          }
        }

        setHud({
          altitude: s.altitude,
          sinkRate: s.sinkRate,
          crossrange: s.crossrange,
          fuelSec: s.fuelSec,
          status: s.status,
        });
      }

      // Render LM Forward Window LPD Viewport
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#04060a';
      ctx.fillRect(0, 0, w, h);

      // Subtle horizon & stars
      const horizonY = h * 0.34 - pitchDeg * 0.8;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(w, horizonY);
      ctx.stroke();

      // Lunar Mare Surface Gradient
      const surfGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      surfGrad.addColorStop(0, '#181b21');
      surfGrad.addColorStop(1, '#2d3139');
      ctx.fillStyle = surfGrad;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      // Map crossrange (-45..+52) horizontally relative to camera center
      const camOffsetPx = -s.crossrange * 4.2;
      const scale = 0.65 + (1 - Math.min(1, s.altitude / 150)) * 0.65;

      // West Crater Boulder Field (around x = -22m)
      const craterX = w * 0.5 + (-22 - s.crossrange) * 4.2 * scale;
      const craterY = horizonY + (h - horizonY) * 0.52;
      ctx.strokeStyle = 'rgba(199, 125, 152, 0.72)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(craterX, craterY, 68 * scale, 22 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Boulder ticks inside West Crater
      [-32, -16, 4, 24, 38].forEach((bx, idx) => {
        ctx.fillStyle = 'rgba(199, 125, 152, 0.55)';
        ctx.fillRect(craterX + bx * scale, craterY + (idx % 2 === 0 ? -5 : 4), 4, 3);
      });
      ctx.fillStyle = '#c77d98';
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillText('WEST CRATER BOULDERS', craterX - 60, craterY - 28 * scale);

      // Flat Mare Landing Zone (around x = +28m)
      const flatX = w * 0.5 + (28 - s.crossrange) * 4.2 * scale;
      const flatY = horizonY + (h - horizonY) * 0.55;
      ctx.strokeStyle = 'rgba(212, 163, 106, 0.85)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(flatX, flatY, 54 * scale, 18 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#d4a36a';
      ctx.fillText('SMOOTH BASALT ZONE', flatX - 54, flatY - 24 * scale);

      // Dust plume ring when low altitude
      if (s.altitude < 30 && s.status === 'active') {
        const dustAlpha = (1 - s.altitude / 30) * 0.25;
        ctx.fillStyle = `rgba(210, 214, 222, ${dustAlpha.toFixed(2)})`;
        ctx.fillRect(0, h - 22, w, 22);
      }

      // LM Forward Window LPD Reticle & Tick Marks (center)
      const cx = w * 0.5;
      const cy = h * 0.62;
      ctx.strokeStyle = 'rgba(237, 237, 239, 0.72)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy);
      ctx.lineTo(cx - 5, cy);
      ctx.moveTo(cx + 5, cy);
      ctx.lineTo(cx + 18, cy);
      ctx.moveTo(cx, cy - 18);
      ctx.lineTo(cx, cy - 5);
      ctx.moveTo(cx, cy + 5);
      ctx.lineTo(cx, cy + 18);
      ctx.stroke();

      // Slight horizon pitch marker
      void camOffsetPx;
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [pitchDeg, throttle, onComplete]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative border border-white/15 bg-[#04060a]">
        <canvas
          ref={canvasRef}
          width={640}
          height={250}
          className="w-full h-[210px] md:h-[245px] block cursor-crosshair"
        />

        {/* 1202 Program Alarm Strip inside cockpit window */}
        {alarmTriggered && !alarmCleared && hud.status === 'active' && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between border border-[#c77d98] bg-[#0a0609]/95 px-3 py-2">
            <div className="font-mono-tech text-[11px] text-[#c77d98]">
              ▲ PROG ALARM 1202 · EXECUTIVE OVERFLOW — RESET TO CONFIRM PRIORITY SCHEDULING
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playRelayClick();
                setAlarmCleared(true);
              }}
              className="border border-[#c77d98] px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#ededef] hover:bg-[#c77d98]/20 cursor-pointer shrink-0 ml-2"
            >
              Reset 1202
            </button>
          </div>
        )}

        {/* Top-Right Tabular Telemetry Readout */}
        <div className="absolute bottom-2.5 left-3 right-3 grid grid-cols-4 gap-2 border border-white/10 bg-[#05070b]/85 px-3 py-1.5 font-mono-tech text-[11px]">
          <div>
            <span className="text-[#6c7686] block text-[9px]">ALTITUDE</span>
            <span className="text-[#ededef]">{hud.altitude.toFixed(1)} m</span>
          </div>
          <div>
            <span className="text-[#6c7686] block text-[9px]">SINK RATE</span>
            <span className={hud.sinkRate > 1.5 ? 'text-[#c77d98]' : 'text-[#d4a36a]'}>
              {hud.sinkRate.toFixed(2)} m/s
            </span>
          </div>
          <div>
            <span className="text-[#6c7686] block text-[9px]">CROSSRANGE</span>
            <span className={hud.crossrange >= 12 ? 'text-[#d4a36a]' : 'text-[#ededef]'}>
              {hud.crossrange >= 0 ? `+${hud.crossrange.toFixed(0)}` : hud.crossrange.toFixed(0)} m
            </span>
          </div>
          <div>
            <span className="text-[#6c7686] block text-[9px]">HOVER FUEL</span>
            <span className={hud.fuelSec < 12 ? 'text-[#c77d98]' : 'text-[#ededef]'}>
              {hud.fuelSec.toFixed(1)} s
            </span>
          </div>
        </div>
      </div>

      {/* Tactile Flight Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-white/10 bg-[#070b12] p-3">
          <div className="flex justify-between font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#a1aab8] mb-1.5">
            <span>Manual Pitch (Glide Past Boulders)</span>
            <span className="text-[#ededef]">{pitchDeg > 0 ? `+${pitchDeg}°` : `${pitchDeg}°`}</span>
          </div>
          <input
            type="range"
            min={-18}
            max={18}
            step={1}
            value={pitchDeg}
            disabled={hud.status !== 'active'}
            onChange={(e) => setPitchDeg(Number(e.target.value))}
            className="tuner-range"
          />
          <div className="flex justify-between font-mono-tech text-[9px] text-[#6c7686]">
            <span>← WEST CRATER</span>
            <span>FLAT BASALT →</span>
          </div>
        </div>

        <div className="border border-white/10 bg-[#070b12] p-3">
          <div className="flex justify-between font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#a1aab8] mb-1.5">
            <span>Descent Engine Throttle</span>
            <span className="text-[#ededef]">{throttle}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={95}
            step={1}
            value={throttle}
            disabled={hud.status !== 'active'}
            onChange={(e) => setThrottle(Number(e.target.value))}
            className="tuner-range"
          />
          <div className="flex justify-between font-mono-tech text-[9px] text-[#6c7686]">
            <span>DESCEND FASTER</span>
            <span>HOVER / BRAKE</span>
          </div>
        </div>
      </div>

      {/* Status / Debrief Footer */}
      {(hud.status !== 'active' || alreadyCompleted) && (
        <div
          className={`border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
            hud.status === 'landed' || alreadyCompleted
              ? 'border-[#d4a36a]/50 bg-[#080c14]'
              : 'border-[#c77d98]/50 bg-[#0c070a]'
          }`}
        >
          <div className="text-xs leading-relaxed text-[#c2c8d2]">
            <div className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#d4a36a] mb-0.5">
              {hud.status === 'landed'
                ? '✓ TRANQUILLITY BASE TOUCHDOWN — CONTACT LIGHT'
                : hud.status === 'empty'
                  ? '▲ PROPELLANT EXHAUSTED — ABORT REQUIRED'
                  : hud.status === 'hazard'
                    ? '▲ HARD / BOULDER TOUCHDOWN — RETRY APPROACH'
                    : '✓ ARCHIVE SIMULATION LOGGED'}
            </div>
            <p>{educationalNote}</p>
          </div>
          <button
            type="button"
            onClick={resetSim}
            className="inline-flex items-center gap-1.5 border border-white/25 px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#ededef] hover:border-[#d4a36a] shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retry Descent</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. APOLLO 15 LRV-1: VIP PARKING & LCRU S-BAND TELEVISION ALIGNMENT         */
/* -------------------------------------------------------------------------- */
function LrvVipAimSim({
  alreadyCompleted,
  educationalNote,
  onComplete,
}: {
  alreadyCompleted: boolean;
  educationalNote: string;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [distanceM, setDistanceM] = useState(28); // Target: 90..110 m east of LM Falcon
  const [dishAzimuth, setDishAzimuth] = useState(-22); // Target: +12 (+/- 5)
  const [dishElev, setDishElev] = useState(32); // Target: +54 (+/- 5)
  const [tvTilt, setTvTilt] = useState(-4); // Target: +8..+18 deg to frame Falcon ascent
  const [broadcastConfirmed, setBroadcastConfirmed] = useState(alreadyCompleted);

  const signalStrength = useMemo(() => {
    const azErr = Math.abs(dishAzimuth - 12);
    const elErr = Math.abs(dishElev - 54);
    const totalErr = Math.sqrt(azErr * azErr + elErr * elErr);
    return Math.max(0, Math.round(100 - totalErr * 2.1));
  }, [dishAzimuth, dishElev]);

  const inVipZone = distanceM >= 90 && distanceM <= 112;
  const dishLocked = signalStrength >= 90;
  const cameraFramed = tvTilt >= 6 && tvTilt <= 19;
  const readyToConfirm = inVipZone && dishLocked && cameraFramed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#04060a';
    ctx.fillRect(0, 0, w, h);

    // Lunar Horizon shifted by GCTA camera tilt
    const horizonY = h * 0.64 + tvTilt * 2.4;

    // Distant Earth in black lunar sky
    const earthX = w * 0.68 + (12 - dishAzimuth) * 2.5;
    const earthY = horizonY - 95 + (54 - dishElev) * 1.4;
    ctx.fillStyle = '#7fa7be';
    ctx.beginPath();
    ctx.arc(earthX, earthY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 163, 106, 0.7)';
    ctx.beginPath();
    ctx.arc(w * 0.68, horizonY - 95, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#8b95a5';
    ctx.fillText('EARTH S-BAND TARGET', w * 0.68 - 54, horizonY - 114);

    // Apennine Mountains silhouette
    ctx.fillStyle = '#15181e';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(w * 0.22, horizonY - 26);
    ctx.lineTo(w * 0.48, horizonY - 12);
    ctx.lineTo(w * 0.75, horizonY - 34);
    ctx.lineTo(w, horizonY - 8);
    ctx.lineTo(w, horizonY);
    ctx.closePath();
    ctx.fill();

    // Lunar Regolith floor
    const floorGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    floorGrad.addColorStop(0, '#272a30');
    floorGrad.addColorStop(1, '#121419');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // LM Falcon scale based on standoff distance (farther = smaller)
    const lmScale = Math.max(0.45, Math.min(1.6, 85 / Math.max(25, distanceM)));
    const lmX = w * 0.42;
    const lmY = horizonY - 8;

    // LM Descent stage + Ascent stage silhouette
    ctx.strokeStyle = '#d4a36a';
    ctx.lineWidth = 1.3;
    // Legs
    ctx.beginPath();
    ctx.moveTo(lmX - 18 * lmScale, lmY);
    ctx.lineTo(lmX - 10 * lmScale, lmY - 18 * lmScale);
    ctx.moveTo(lmX + 18 * lmScale, lmY);
    ctx.lineTo(lmX + 10 * lmScale, lmY - 18 * lmScale);
    ctx.stroke();
    // Descent Gold Octagon
    ctx.fillStyle = '#8f6939';
    ctx.fillRect(lmX - 12 * lmScale, lmY - 24 * lmScale, 24 * lmScale, 12 * lmScale);
    // Upper Ascent Stage
    ctx.fillStyle = '#9aa3b2';
    ctx.fillRect(lmX - 9 * lmScale, lmY - 39 * lmScale, 18 * lmScale, 15 * lmScale);
    ctx.fillStyle = '#ededef';
    ctx.fillText(`LM FALCON (${distanceM} m)`, lmX - 46, lmY + 15);

    // GCTA TV Reticle Box at center
    ctx.strokeStyle = cameraFramed ? '#d4a36a' : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(w * 0.28, h * 0.22, w * 0.3, h * 0.46);
    ctx.fillStyle = cameraFramed ? '#d4a36a' : '#8b95a5';
    ctx.fillText(
      cameraFramed ? 'GCTA FRAMING: READY FOR ASCENT LIFTOFF' : 'ADJUST TV TILT TO FRAME FALCON',
      w * 0.28,
      h * 0.19,
    );
  }, [distanceM, dishAzimuth, dishElev, tvTilt, cameraFramed]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative border border-white/15 bg-[#04060a]">
        <canvas ref={canvasRef} width={640} height={240} className="w-full h-[205px] md:h-[235px] block" />
        <div className="absolute bottom-2.5 left-3 right-3 grid grid-cols-3 gap-2 border border-white/10 bg-[#05070b]/85 px-3 py-1.5 font-mono-tech text-[11px]">
          <div>
            <span className="text-[#6c7686] block text-[9px]">VIP STANDOFF</span>
            <span className={inVipZone ? 'text-[#d4a36a]' : 'text-[#ededef]'}>
              {distanceM} m {inVipZone ? '● SAFE' : '(TARGET 100 m)'}
            </span>
          </div>
          <div>
            <span className="text-[#6c7686] block text-[9px]">S-BAND EARTH LOCK</span>
            <span className={dishLocked ? 'text-[#d4a36a]' : 'text-[#c77d98]'}>
              {signalStrength}% {dishLocked ? '● LOCKED' : '(AIM AT EARTH)'}
            </span>
          </div>
          <div>
            <span className="text-[#6c7686] block text-[9px]">GCTA TV TILT</span>
            <span className={cameraFramed ? 'text-[#d4a36a]' : 'text-[#ededef]'}>
              {tvTilt > 0 ? `+${tvTilt}°` : `${tvTilt}°`} {cameraFramed ? '● FRAMED' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="border border-white/10 bg-[#070b12] p-3">
          <div className="flex justify-between font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#a1aab8]">
            <span>T-Handle Drive East</span>
            <span className="text-[#ededef]">{distanceM} m</span>
          </div>
          <input
            type="range"
            min={20}
            max={140}
            value={distanceM}
            onChange={(e) => setDistanceM(Number(e.target.value))}
            className="tuner-range mt-1"
          />
        </div>

        <div className="border border-white/10 bg-[#070b12] p-3">
          <div className="flex justify-between font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#a1aab8]">
            <span>GCTA TV Camera Elevation</span>
            <span className="text-[#ededef]">{tvTilt > 0 ? `+${tvTilt}°` : `${tvTilt}°`}</span>
          </div>
          <input
            type="range"
            min={-12}
            max={28}
            value={tvTilt}
            onChange={(e) => setTvTilt(Number(e.target.value))}
            className="tuner-range mt-1"
          />
        </div>

        <div className="border border-white/10 bg-[#070b12] p-3">
          <div className="flex justify-between font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#a1aab8]">
            <span>Umbrella Dish Azimuth</span>
            <span className="text-[#ededef]">{dishAzimuth}°</span>
          </div>
          <input
            type="range"
            min={-40}
            max={40}
            value={dishAzimuth}
            onChange={(e) => setDishAzimuth(Number(e.target.value))}
            className="tuner-range mt-1"
          />
        </div>

        <div className="border border-white/10 bg-[#070b12] p-3">
          <div className="flex justify-between font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#a1aab8]">
            <span>Umbrella Dish Elevation</span>
            <span className="text-[#ededef]">{dishElev}°</span>
          </div>
          <input
            type="range"
            min={20}
            max={80}
            value={dishElev}
            onChange={(e) => setDishElev(Number(e.target.value))}
            className="tuner-range mt-1"
          />
        </div>
      </div>

      <div className="border border-white/10 bg-[#080c14] p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs text-[#c2c8d2] leading-relaxed">
          {broadcastConfirmed ? (
            <>
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#d4a36a] mb-0.5">
                ✓ VIP SITE PARKED — HOUSTON TV RELAY ARMED
              </div>
              <p>{educationalNote}</p>
            </>
          ) : (
            <p>
              Park inside the 90–112 m VIP zone, lock the 0.9 m dish above 90%, and tilt the RCA
              camera onto Falcon before arming Houston control.
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={!readyToConfirm || broadcastConfirmed}
          onClick={() => {
            soundEngine.playSuccessTone();
            setBroadcastConfirmed(true);
            onComplete();
          }}
          className="border border-[#d4a36a] px-3.5 py-2 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#ededef] disabled:opacity-35 hover:bg-[#d4a36a]/15 shrink-0 cursor-pointer"
        >
          {broadcastConfirmed ? 'Relay Armed' : 'Arm Houston TV'}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. SOJOURNER ROVER: ARES VALLIS IMP SURFACE CAMERA & APXS ROCK APPROACH    */
/* -------------------------------------------------------------------------- */
const ARES_BOULDERS = [
  { x: 185, y: 125, r: 22, label: 'HAZARD ROCK' },
  { x: 330, y: 78, r: 24, label: 'YOGI OUTCROP' },
  { x: 365, y: 178, r: 20, label: 'GRAVEL RIDGE' },
];
const BARNACLE_BILL = { x: 495, y: 118, r: 24 };

function SojournerApxsSim({
  alreadyCompleted,
  educationalNote,
  onComplete,
}: {
  alreadyCompleted: boolean;
  educationalNote: string;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pos, setPos] = useState({ x: 96, y: 150, headingDeg: 0 });
  const [warning, setWarning] = useState<string | null>(null);
  const [apxsDone, setApxsDone] = useState(alreadyCompleted);

  const distToRock = Math.hypot(pos.x - BARNACLE_BILL.x, pos.y - BARNACLE_BILL.y);
  // Rear of rover points at headingDeg + 180°
  const angleToRockRad = Math.atan2(BARNACLE_BILL.y - pos.y, BARNACLE_BILL.x - pos.x);
  const rearAngleRad = ((pos.headingDeg + 180) * Math.PI) / 180;
  const angleDiff = Math.abs(
    Math.atan2(Math.sin(angleToRockRad - rearAngleRad), Math.cos(angleToRockRad - rearAngleRad)),
  );
  const readyForApxs = distToRock <= 58 && angleDiff <= 0.65;

  const moveRover = (stepDist: number, turnDeg: number) => {
    soundEngine.playRelayClick();
    setPos((prev) => {
      const nextHeading = (prev.headingDeg + turnDeg + 360) % 360;
      const rad = (nextHeading * Math.PI) / 180;
      const nx = Math.max(55, Math.min(570, prev.x + Math.cos(rad) * stepDist));
      const ny = Math.max(36, Math.min(205, prev.y + Math.sin(rad) * stepDist));

      for (const b of ARES_BOULDERS) {
        if (Math.hypot(nx - b.x, ny - b.y) < b.r + 22) {
          soundEngine.playCautionBeep();
          setWarning(`LASER STRIPER HAZARD: ${b.label} DETECTED — STEER CLEAR`);
          return { ...prev, headingDeg: nextHeading };
        }
      }
      setWarning(null);
      return { x: nx, y: ny, headingDeg: nextHeading };
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#150c09';
    ctx.fillRect(0, 0, w, h);

    // Subtle IMP horizon grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Sagan Memorial Station ramp on left
    ctx.fillStyle = '#363b42';
    ctx.fillRect(10, 118, 48, 64);
    ctx.font = '9px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#8b95a5';
    ctx.fillText('SAGAN RAMP', 8, 108);

    // Ares Vallis Hazard Boulders
    ARES_BOULDERS.forEach((b) => {
      ctx.fillStyle = '#47251b';
      ctx.strokeStyle = 'rgba(199, 125, 152, 0.55)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a1aab8';
      ctx.fillText(b.label, b.x - 24, b.y + b.r + 11);
    });

    // Target Rock: Barnacle Bill
    ctx.fillStyle = '#5c3324';
    ctx.strokeStyle = readyForApxs || apxsDone ? '#d4a36a' : '#c2c8d2';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(BARNACLE_BILL.x, BARNACLE_BILL.y, BARNACLE_BILL.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d4a36a';
    ctx.fillText('BARNACLE BILL (TARGET)', BARNACLE_BILL.x - 45, BARNACLE_BILL.y - 30);

    // Draw Sojourner Rover + 5 Laser Hazard Striper Rays
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate((pos.headingDeg * Math.PI) / 180);

    // Forward laser hazard lines
    ctx.strokeStyle = 'rgba(199, 125, 152, 0.45)';
    [-0.28, -0.14, 0, 0.14, 0.28].forEach((ang) => {
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(16 + Math.cos(ang) * 46, Math.sin(ang) * 46);
      ctx.stroke();
    });

    // Solar deck body
    ctx.fillStyle = '#1b2844';
    ctx.strokeStyle = '#d4a36a';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-15, -11, 30, 22);
    ctx.strokeRect(-15, -11, 30, 22);

    // 6 wheels
    ctx.fillStyle = '#9aa3b2';
    [-12, 0, 12].forEach((wx) => {
      ctx.fillRect(wx - 3, -15, 6, 3);
      ctx.fillRect(wx - 3, 12, 6, 3);
    });

    // Rear APXS indicator
    ctx.fillStyle = readyForApxs ? '#d4a36a' : '#c77d98';
    ctx.fillRect(-21, -4, 6, 8);

    ctx.restore();
  }, [pos, readyForApxs, apxsDone]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative border border-white/15 bg-[#150c09]">
        <canvas ref={canvasRef} width={640} height={230} className="w-full h-[200px] md:h-[225px] block" />
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between border border-white/10 bg-[#05070b]/88 px-3 py-1.5 font-mono-tech text-[10px]">
          <span className={warning ? 'text-[#c77d98]' : 'text-[#a1aab8]'}>
            {warning ??
              (apxsDone
                ? '✓ APXS SCAN COMPLETE: ANDESITIC SILICA-RICH CRUST CONFIRMED'
                : readyForApxs
                  ? '● REAR APXS ALIGNED TO BARNACLE BILL — READY TO DEPLOY'
                  : `STEER TO BARNACLE BILL & TURN TAIL-FIRST (${Math.round(distToRock)} cm)`)}
          </span>
          <span className="text-[#ededef] shrink-0 ml-2">16W GaAs · 80C85</span>
        </div>
      </div>

      {/* Rover Command Pad */}
      <div className="flex flex-wrap items-center justify-between gap-2 border border-white/10 bg-[#070b12] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => moveRover(0, -30)}
            className="border border-white/20 px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#ededef] hover:border-[#d4a36a] cursor-pointer"
          >
            Yaw Left -30°
          </button>
          <button
            type="button"
            onClick={() => moveRover(28, 0)}
            className="border border-white/20 px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#ededef] hover:border-[#d4a36a] cursor-pointer"
          >
            Drive Forward
          </button>
          <button
            type="button"
            onClick={() => moveRover(0, 30)}
            className="border border-white/20 px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#ededef] hover:border-[#d4a36a] cursor-pointer"
          >
            Yaw Right +30°
          </button>
          <button
            type="button"
            onClick={() => moveRover(0, 180)}
            className="border border-white/20 px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#d4a36a] hover:border-white cursor-pointer"
          >
            Rotate 180° (Tail-First)
          </button>
          <button
            type="button"
            onClick={() => moveRover(-22, 0)}
            className="border border-white/20 px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#ededef] hover:border-[#d4a36a] cursor-pointer"
          >
            Reverse Step
          </button>
        </div>

        <button
          type="button"
          disabled={!readyForApxs || apxsDone}
          onClick={() => {
            soundEngine.playSuccessTone();
            setApxsDone(true);
            onComplete();
          }}
          className="border border-[#d4a36a] px-3.5 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#ededef] disabled:opacity-35 hover:bg-[#d4a36a]/15 cursor-pointer"
        >
          {apxsDone ? 'APXS Recorded' : 'Deploy Rear APXS'}
        </button>
      </div>

      {apxsDone && (
        <div className="border border-[#d4a36a]/40 bg-[#080c14] p-3 text-xs text-[#c2c8d2] leading-relaxed">
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#d4a36a] block mb-0.5">
            ✓ PATHFINDER FLIGHT LOG — SOL 6 APXS CONTACT
          </span>
          {educationalNote}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. OPPORTUNITY (MER-B): PANCAM HORIZON & SOL 5111 DUST SURVIVAL CONSOLE    */
/* -------------------------------------------------------------------------- */
function OpportunityDustSim({
  alreadyCompleted,
  educationalNote,
  onComplete,
}: {
  alreadyCompleted: boolean;
  educationalNote: string;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tau, setTau] = useState(4.2); // climbs toward 10.8 storm peak
  const [armOff, setArmOff] = useState(false);
  const [mastOff, setMastOff] = useState(false);
  const [tesOff, setTesOff] = useState(false);
  const [wingTilt, setWingTilt] = useState(0); // optimal +10..+16 deg toward zenith
  const [txSent, setTxSent] = useState(alreadyCompleted);

  const loadsShed = armOff && mastOff && tesOff;
  const tiltOptimal = wingTilt >= 8 && wingTilt <= 18;
  const loadWatts = 64 - (armOff ? 18 : 0) - (mastOff ? 16 : 0) - (tesOff ? 14 : 0);
  const netPowerW = Math.round(
    Math.max(4, (140 / (1 + tau * 0.42)) * (tiltOptimal ? 1.25 : 0.92)) - loadWatts,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const render = (time: number) => {
      const w = canvas.width;
      const h = canvas.height;

      // Sky darkens exponentially with dust opacity tau
      const darkness = Math.min(0.95, tau / 11.2);
      const r = Math.round(132 * (1 - darkness) + 18);
      const g = Math.round(74 * (1 - darkness) + 10);
      const b = Math.round(48 * (1 - darkness) + 8);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, w, h);

      // Endeavour Crater Perseverance Valley ridge
      ctx.fillStyle = '#1b110d';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.62);
      ctx.lineTo(w * 0.25, h * 0.52);
      ctx.lineTo(w * 0.6, h * 0.58);
      ctx.lineTo(w, h * 0.48);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Subtle drifting Martian dust bands (minimal, non-cartoon)
      ctx.fillStyle = `rgba(170, 108, 72, ${(0.08 + darkness * 0.22).toFixed(2)})`;
      for (let i = 0; i < 6; i++) {
        const xOff = ((time * 0.04 * (i + 1)) % (w + 180)) - 180;
        ctx.fillRect(xOff, 25 + i * 32, 160, 2);
      }

      // Pancam reticle
      ctx.strokeStyle = 'rgba(237, 237, 239, 0.35)';
      ctx.strokeRect(18, 16, w - 36, h - 32);
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#ededef';
      ctx.fillText(`OPTICAL DEPTH TAU: ${tau.toFixed(1)}`, 28, 34);
      ctx.fillStyle = netPowerW >= 0 ? '#d4a36a' : '#c77d98';
      ctx.fillText(`NET SOLAR MARGIN: ${netPowerW >= 0 ? `+${netPowerW}` : netPowerW} Wh`, 28, 50);

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [tau, netPowerW]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative border border-white/15 bg-[#120b08]">
        <canvas ref={canvasRef} width={640} height={215} className="w-full h-[185px] md:h-[210px] block" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-white/10 bg-[#070b12] p-3 space-y-2">
          <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8b95a5]">
            1. Shed Non-Essential Loads ({loadWatts} W Draw)
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                ['IDD Arm', armOff, () => setArmOff((v) => !v)],
                ['Mast Motor', mastOff, () => setMastOff((v) => !v)],
                ['Mini-TES', tesOff, () => setTesOff((v) => !v)],
              ] as const
            ).map(([label, isOff, toggle]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  soundEngine.playRelayClick();
                  toggle();
                }}
                className={`border py-1.5 px-2 font-mono-tech text-[10px] uppercase cursor-pointer ${
                  isOff
                    ? 'border-[#d4a36a] bg-[#d4a36a]/15 text-[#d4a36a]'
                    : 'border-white/20 text-[#ededef]'
                }`}
              >
                {label}: {isOff ? 'OFF' : 'ON'}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-white/10 bg-[#070b12] p-3">
          <div className="flex justify-between font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#a1aab8]">
            <span>2. Storm Opacity / Zenith Slope Trim</span>
            <span className="text-[#ededef]">{wingTilt > 0 ? `+${wingTilt}°` : `${wingTilt}°`}</span>
          </div>
          <input
            type="range"
            min={-15}
            max={22}
            value={wingTilt}
            onChange={(e) => setWingTilt(Number(e.target.value))}
            className="tuner-range mt-1"
          />
          <div className="flex items-center justify-between mt-1 font-mono-tech text-[10px] text-[#6c7686]">
            <span>OPTIMAL ZENITH TILT: +8° TO +18°</span>
            <button
              type="button"
              onClick={() => setTau((t) => (t < 10 ? 10.8 : 4.2))}
              className="text-[#a1aab8] hover:text-white underline cursor-pointer"
            >
              {tau < 10 ? 'Simulate Peak Tau 10.8' : 'Reset Tau 4.2'}
            </button>
          </div>
        </div>
      </div>

      <div className="border border-white/10 bg-[#080c14] p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs text-[#c2c8d2] leading-relaxed">
          {txSent ? (
            <>
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#d4a36a] mb-0.5">
                ✓ SOL 5111 FINAL PACKET TRANSMITTED — SLEEP MODE ACTIVE
              </div>
              <p>{educationalNote}</p>
            </>
          ) : (
            <p>
              Power down all three science subsystems and tilt Opportunity’s arrays between +8° and
              +18° to transmit its final June 10, 2018 packet.
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={!loadsShed || !tiltOptimal || txSent}
          onClick={() => {
            soundEngine.playSuccessTone();
            setTau(10.8);
            setTxSent(true);
            onComplete();
          }}
          className="border border-[#d4a36a] px-3.5 py-2 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#ededef] disabled:opacity-35 hover:bg-[#d4a36a]/15 shrink-0 cursor-pointer"
        >
          {txSent ? 'Final Frame Sent' : 'Transmit Final Frame'}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. INGENUITY: 2,500 RPM COAXIAL LIFT & FLIGHT 72 OPTICAL-FLOW NAV CAM      */
/* -------------------------------------------------------------------------- */
function IngenuityFlightSim({
  alreadyCompleted,
  educationalNote,
  onComplete,
}: {
  alreadyCompleted: boolean;
  educationalNote: string;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flightMode, setFlightMode] = useState<'flight1' | 'flight72'>('flight1');
  const [rpm, setRpm] = useState(1400); // 1000..2700 (need >= 2480 in 1% Mars air)
  const [collectiveCut, setCollectiveCut] = useState(false);
  const [f1Passed, setF1Passed] = useState(alreadyCompleted);
  const [f72Passed, setF72Passed] = useState(alreadyCompleted);

  const hasLift = rpm >= 2480;

  useEffect(() => {
    if (flightMode === 'flight1' && hasLift && !f1Passed) {
      setF1Passed(true);
      soundEngine.playRelayClick();
    }
  }, [flightMode, hasLift, f1Passed]);

  useEffect(() => {
    if (f1Passed && f72Passed) {
      onComplete();
    }
  }, [f1Passed, f72Passed, onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const render = (time: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#090a0d';
      ctx.fillRect(0, 0, w, h);

      if (flightMode === 'flight1') {
        // Textured rocky terrain at Wright Brothers Field -> strong feature lock
        const driftX = hasLift ? Math.sin(time * 0.001) * 6 : 0;
        for (let i = 0; i < 24; i++) {
          const rx = ((i * 83) % (w - 40)) + 20 + driftX;
          const ry = ((i * 59) % (h - 50)) + 25;
          ctx.fillStyle = '#3c3e45';
          ctx.fillRect(rx, ry, 8 + (i % 4) * 3, 6 + (i % 3) * 2);
          // Optical flow lock bracket
          if (hasLift && i % 3 === 0) {
            ctx.strokeStyle = '#d4a36a';
            ctx.strokeRect(rx - 4, ry - 4, 18, 16);
          }
        }
        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.fillStyle = hasLift ? '#d4a36a' : '#8b95a5';
        ctx.fillText(
          hasLift
            ? '● WRIGHT BROTHERS FIELD · HOVER STABLE AT 2,537+ RPM (18 LOCKED FEATURES)'
            : 'SPIN COAXIAL ROTORS TO >= 2,480 RPM FOR 1% MARS AIR LIFT',
          16,
          22,
        );
      } else {
        // Smooth featureless sand ripples in Valinor Hills -> 0 tracking features
        const slide = collectiveCut ? 0 : (time * 0.05) % 48;
        ctx.strokeStyle = 'rgba(182, 130, 96, 0.32)';
        ctx.lineWidth = 2;
        for (let y = -20; y < h + 40; y += 26) {
          ctx.beginPath();
          ctx.moveTo(0, y + slide);
          ctx.bezierCurveTo(w * 0.35, y - 8 + slide, w * 0.65, y + 8 + slide, w, y + slide);
          ctx.stroke();
        }
        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.fillStyle = collectiveCut ? '#d4a36a' : '#c77d98';
        ctx.fillText(
          collectiveCut
            ? '✓ COLLECTIVE DROPPED — GROUND CONTACT RECORDED (BLADE TIP DAMAGED)'
            : '▲ FLIGHT 72: FEATURELESS SAND RIPPLES · 0 TRACKED FEATURES · DRIFTING',
          16,
          22,
        );
      }

      // Center downward nav reticle
      ctx.strokeStyle = 'rgba(237, 237, 239, 0.35)';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.54, 34, 0, Math.PI * 2);
      ctx.stroke();

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [flightMode, hasLift, collectiveCut]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            soundEngine.playRelayClick();
            setFlightMode('flight1');
          }}
          className={`flex-1 border py-1.5 px-3 font-mono-tech text-[10px] uppercase tracking-[0.12em] cursor-pointer ${
            flightMode === 'flight1'
              ? 'border-[#d4a36a] bg-[#d4a36a]/15 text-[#ededef]'
              : 'border-white/15 text-[#8b95a5]'
          }`}
        >
          Flight 1 · 1% Air Lift {f1Passed ? '(Done)' : ''}
        </button>
        <button
          type="button"
          onClick={() => {
            soundEngine.playCautionBeep();
            setFlightMode('flight72');
          }}
          className={`flex-1 border py-1.5 px-3 font-mono-tech text-[10px] uppercase tracking-[0.12em] cursor-pointer ${
            flightMode === 'flight72'
              ? 'border-[#c77d98] bg-[#c77d98]/15 text-[#ededef]'
              : 'border-white/15 text-[#8b95a5]'
          }`}
        >
          Flight 72 · Sand Ripple Drift {f72Passed ? '(Done)' : ''}
        </button>
      </div>

      <div className="relative border border-white/15 bg-[#090a0d]">
        <canvas ref={canvasRef} width={640} height={210} className="w-full h-[180px] md:h-[205px] block" />
      </div>

      {flightMode === 'flight1' ? (
        <div className="border border-white/10 bg-[#070b12] p-3">
          <div className="flex justify-between font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#a1aab8]">
            <span>Coaxial Blade Speed (1.2 m Carbon Rotors)</span>
            <span className={hasLift ? 'text-[#d4a36a]' : 'text-[#ededef]'}>{rpm} RPM</span>
          </div>
          <input
            type="range"
            min={1200}
            max={2650}
            step={10}
            value={rpm}
            onChange={(e) => setRpm(Number(e.target.value))}
            className="tuner-range mt-1"
          />
          <div className="mt-1 flex justify-between font-mono-tech text-[10px] text-[#6c7686]">
            <span>EARTH HELICOPTER (~450 RPM)</span>
            <span>MARS HOVER (~2,537 RPM)</span>
          </div>
        </div>
      ) : (
        <div className="border border-white/10 bg-[#070b12] p-3 flex items-center justify-between gap-3">
          <div className="text-xs text-[#c2c8d2]">
            Without rocks for optical-flow lock, lateral velocity goes undetected. Drop collective
            immediately to halt horizontal drift.
          </div>
          <button
            type="button"
            disabled={collectiveCut}
            onClick={() => {
              soundEngine.playSuccessTone();
              setCollectiveCut(true);
              setF72Passed(true);
            }}
            className="border border-[#c77d98] px-3.5 py-2 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#ededef] disabled:opacity-40 hover:bg-[#c77d98]/20 shrink-0 cursor-pointer"
          >
            {collectiveCut ? 'Collective Cut' : 'Cut Collective Now'}
          </button>
        </div>
      )}

      {f1Passed && f72Passed && (
        <div className="border border-[#d4a36a]/40 bg-[#080c14] p-3 text-xs text-[#c2c8d2] leading-relaxed">
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#d4a36a] block mb-0.5">
            ✓ BOTH FLIGHT STAGES ANALYZED
          </span>
          {educationalNote}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. PIONEER 10: SNAP-19 RTG BUS & 82.1 AU DEEP SPACE CARRIER CONSOLE        */
/* -------------------------------------------------------------------------- */
const PIONEER_EPOCHS = [
  { year: '1973 · 5.2 AU (Jupiter Flyby)', rtgWatts: 155, snrDb: 42 },
  { year: '1983 · 30 AU (Beyond Neptune)', rtgWatts: 108, snrDb: 28 },
  { year: '1997 · 67 AU (End Routine Science)', rtgWatts: 74, snrDb: 15 },
  { year: '2003 · 82.1 AU (Final Signal)', rtgWatts: 53, snrDb: 6 },
];

function PioneerRtgSim({
  alreadyCompleted,
  educationalNote,
  onComplete,
}: {
  alreadyCompleted: boolean;
  educationalNote: string;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [epochIdx, setEpochIdx] = useState(0);
  const [loads, setLoads] = useState({
    plasma: true,
    uv: true,
    ipp: true,
    geiger: true,
  });
  const [logged82Au, setLogged82Au] = useState(alreadyCompleted);

  const epoch = PIONEER_EPOCHS[epochIdx];
  // Spacecraft house + 2.74m S-Band TX baseline = 48W
  const instrumentW =
    (loads.plasma ? 14 : 0) +
    (loads.uv ? 12 : 0) +
    (loads.ipp ? 18 : 0) +
    (loads.geiger ? 10 : 0);
  const totalReqW = 48 + instrumentW;
  const powerOk = epoch.rtgWatts >= totalReqW;

  useEffect(() => {
    if (epochIdx === 3 && powerOk && !logged82Au) {
      soundEngine.playSuccessTone();
      setLogged82Au(true);
      onComplete();
    }
  }, [epochIdx, powerOk, logged82Au, onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const render = (time: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#04060a';
      ctx.fillRect(0, 0, w, h);

      // Left: Canopus Star Tracker Reticle
      const cx = w * 0.25;
      const cy = h * 0.5;
      ctx.strokeStyle = 'rgba(127, 167, 190, 0.35)';
      ctx.beginPath();
      ctx.arc(cx, cy, 62, 0, Math.PI * 2);
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ededef';
      ctx.beginPath();
      ctx.arc(cx + Math.sin(time * 0.002) * 1.5, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#7fa7be';
      ctx.fillText('CANOPUS LOCK', cx - 36, cy + 78);

      // Right: DSN 70m Carrier Spectrum Waterfall
      const specX = w * 0.48;
      const specW = w * 0.48;
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeRect(specX, 20, specW, h - 42);

      ctx.strokeStyle = powerOk ? '#d4a36a' : '#c77d98';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = 0; x <= specW; x += 2) {
        const norm = (x - specW * 0.5) / 14;
        const spike = powerOk ? Math.exp(-norm * norm) * (24 + epoch.snrDb * 1.5) : 0;
        const noise = Math.sin(x * 1.7 + time * 0.01) * 4 + Math.cos(x * 0.9 - time * 0.008) * 3;
        const y = h - 44 - spike + noise;
        if (x === 0) ctx.moveTo(specX + x, y);
        else ctx.lineTo(specX + x, y);
      }
      ctx.stroke();

      ctx.fillStyle = powerOk ? '#d4a36a' : '#c77d98';
      ctx.fillText(
        powerOk
          ? `DSN 2292.037 MHz CARRIER LOCKED (${epoch.snrDb} dB)`
          : '▲ BUS UNDERVOLTAGE — SHED INSTRUMENTS TO TRANSMIT',
        specX + 10,
        36,
      );

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [epoch, powerOk]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative border border-white/15 bg-[#04060a]">
        <canvas ref={canvasRef} width={640} height={195} className="w-full h-[170px] md:h-[190px] block" />
      </div>

      {/* Epoch Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {PIONEER_EPOCHS.map((ep, idx) => (
          <button
            key={ep.year}
            type="button"
            onClick={() => {
              soundEngine.playRelayClick();
              setEpochIdx(idx);
            }}
            className={`border px-2 py-2 text-left font-mono-tech text-[10px] cursor-pointer ${
              idx === epochIdx
                ? 'border-[#d4a36a] bg-[#d4a36a]/15 text-[#ededef]'
                : 'border-white/15 text-[#8b95a5] hover:border-white/35'
            }`}
          >
            <div className="truncate">{ep.year.split(' · ')[0]}</div>
            <div className="text-[#a1aab8] truncate">{ep.rtgWatts}W SNAP-19</div>
          </button>
        ))}
      </div>

      {/* SNAP-19 Instrument Shed Switches */}
      <div className="border border-white/10 bg-[#070b12] p-3">
        <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase tracking-[0.12em] mb-2">
          <span className="text-[#8b95a5]">
            RTG Available: <strong className="text-[#ededef]">{epoch.rtgWatts} W</strong> · TX Base:
            48 W
          </span>
          <span className={powerOk ? 'text-[#d4a36a]' : 'text-[#c77d98]'}>
            Total Load: {totalReqW} W
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {(
            [
              ['plasma', 'Plasma (14W)'],
              ['uv', 'UV Phot (12W)'],
              ['ipp', 'IPP Cam (18W)'],
              ['geiger', 'Geiger (10W)'],
            ] as const
          ).map(([key, label]) => {
            const on = loads[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  soundEngine.playRelayClick();
                  setLoads((prev) => ({ ...prev, [key]: !prev[key] }));
                }}
                className={`border px-2 py-1.5 font-mono-tech text-[10px] uppercase cursor-pointer ${
                  on
                    ? 'border-white/25 text-[#ededef]'
                    : 'border-[#d4a36a]/50 bg-[#05070b] text-[#d4a36a]'
                }`}
              >
                {label}: {on ? 'ON' : 'SHED'}
              </button>
            );
          })}
        </div>
      </div>

      {logged82Au && (
        <div className="border border-[#d4a36a]/40 bg-[#080c14] p-3 text-xs text-[#c2c8d2] leading-relaxed">
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#d4a36a] block mb-0.5">
            ✓ 82.1 AU FINAL CARRIER SUSTAINED (JANUARY 23, 2003)
          </span>
          {educationalNote}
        </div>
      )}
    </div>
  );
}
