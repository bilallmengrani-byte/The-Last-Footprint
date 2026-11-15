import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import gsap from 'gsap';
import {
  DESTINATIONS,
  DestinationId,
  MISSIONS,
  MissionId,
  SpacecraftHotspot,
} from '../data/missions';
import { StarfieldSkybox } from './StarfieldSkybox';
import { PlanetaryHub } from './PlanetaryHub';
import { PostProcessing } from './PostProcessing';

const LazySpacecraftStage = React.lazy(() => import('./SpacecraftModels'));

export type ExperienceView = 'intro' | 'hub' | 'destination' | 'mission' | 'closing';

interface SpaceViewportProps {
  view: ExperienceView;
  activeDestination: DestinationId | null;
  activeMissionId: MissionId | null;
  activeHotspot: SpacecraftHotspot | null;
  entryIntensity: number;
  hideHotspotPins?: boolean;
  onSelectDestination: (id: DestinationId) => void;
  onSelectHotspot: (hotspot: SpacecraftHotspot) => void;
  onWebglFallback: () => void;
}

interface ProjectedMarkerItem {
  id: string;
  worldPos: [number, number, number];
}

const HUB_MARKERS: Array<{
  id: DestinationId;
  code: string;
  title: string;
  accent?: boolean;
  worldPos: [number, number, number];
}> = [
  {
    id: 'moon',
    code: 'DEST-01 · 2 ARTIFACTS',
    title: 'The Moon',
    worldPos: [-2.35, 2.55, -4.4],
  },
  {
    id: 'mars',
    code: 'DEST-02 · 3 ARTIFACTS',
    title: 'Mars',
    accent: true,
    worldPos: [1.15, 0.25, 1.9],
  },
  {
    id: 'deep-space',
    code: 'DEST-03 · 1 ARTIFACT',
    title: 'Deep Space',
    worldPos: [-5.4, -1.35, -7.2],
  },
];

const HUB_CAM_POS = new THREE.Vector3(-0.35, 0.2, 6.2);
const HUB_CAM_TARGET = new THREE.Vector3(-0.3, 0.15, -1.6);

const CLOSING_CAM_POS = new THREE.Vector3(-2.6, 1.5, 9.8);
const CLOSING_CAM_TARGET = new THREE.Vector3(-1.4, 0.2, -3.5);

const MISSION_DEFAULT_POS = new THREE.Vector3(2.85, 1.55, 3.2);
const MISSION_DEFAULT_TARGET = new THREE.Vector3(0, 0.25, 0);

// Pre-allocated vector for 60fps marker projection without garbage collection
const _projVec = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

interface MarkerProjectorProps {
  items: ProjectedMarkerItem[];
  markerElsRef: React.MutableRefObject<Record<string, HTMLButtonElement | null>>;
}

/**
 * Projects 3D world coordinates onto standard React DOM overlay buttons
 * via direct transform updates—avoiding @react-three/drei Html createRoot/unmount issues in React 19.
 */
function MarkerProjector({ items, markerElsRef }: MarkerProjectorProps) {
  const { camera, size } = useThree();

  useFrame(() => {
    for (const item of items) {
      const el = markerElsRef.current[item.id];
      if (!el) continue;

      _projVec.set(item.worldPos[0], item.worldPos[1], item.worldPos[2]);
      _projVec.project(camera);

      const inFront = _projVec.z >= -1 && _projVec.z <= 1;
      const inBounds =
        _projVec.x >= -1.15 &&
        _projVec.x <= 1.15 &&
        _projVec.y >= -1.15 &&
        _projVec.y <= 1.15;

      if (!inFront || !inBounds) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        continue;
      }

      const x = (_projVec.x * 0.5 + 0.5) * size.width;
      const y = (-_projVec.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
    }
  });

  return null;
}

interface CameraChoreographerProps {
  view: ExperienceView;
  activeDestination: DestinationId | null;
  activeMissionId: MissionId | null;
  activeHotspot: SpacecraftHotspot | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

function CameraChoreographer({
  view,
  activeDestination,
  activeMissionId,
  activeHotspot,
  controlsRef,
}: CameraChoreographerProps) {
  const { camera } = useThree();
  const desiredPos = useRef(new THREE.Vector3().copy(HUB_CAM_POS));
  const desiredTarget = useRef(new THREE.Vector3().copy(HUB_CAM_TARGET));
  const userDragging = useRef(false);
  const introAnimating = useRef(false);

  // GSAP Cinematic Opening Camera Track
  useEffect(() => {
    if (view !== 'intro') {
      introAnimating.current = false;
      return;
    }

    introAnimating.current = true;
    camera.position.set(-5.8, 2.35, 3.8);
    desiredTarget.current.set(-4.2, 1.8, -5.5);
    camera.lookAt(desiredTarget.current);

    const tl = gsap.timeline({
      onComplete: () => {
        introAnimating.current = false;
      },
    });

    tl.to(camera.position, {
      x: -1.8,
      y: 0.7,
      z: 5.2,
      duration: 5.5,
      ease: 'power2.inOut',
    })
      .to(
        desiredTarget.current,
        {
          x: -0.3,
          y: 0.15,
          z: -1.6,
          duration: 5.5,
          ease: 'power2.inOut',
        },
        0,
      )
      .to(camera.position, {
        x: HUB_CAM_POS.x,
        y: HUB_CAM_POS.y,
        z: HUB_CAM_POS.z,
        duration: 5.0,
        ease: 'power2.out',
      });

    return () => {
      tl.kill();
      introAnimating.current = false;
    };
  }, [view, camera]);

  // Update target destination / mission / hotspot vectors
  useEffect(() => {
    if (view === 'intro') return;

    if (view === 'hub') {
      desiredPos.current.copy(HUB_CAM_POS);
      desiredTarget.current.copy(HUB_CAM_TARGET);
    } else if (view === 'closing') {
      desiredPos.current.copy(CLOSING_CAM_POS);
      desiredTarget.current.copy(CLOSING_CAM_TARGET);
    } else if (view === 'destination' && activeDestination) {
      const d = DESTINATIONS[activeDestination];
      desiredPos.current.set(...d.cameraPosition);
      desiredTarget.current.set(...d.cameraTarget);
    } else if (view === 'mission' && activeMissionId) {
      if (activeHotspot) {
        desiredPos.current.set(...activeHotspot.cameraOffset);
        desiredTarget.current.set(...activeHotspot.position);
      } else {
        desiredPos.current.copy(MISSION_DEFAULT_POS);
        desiredTarget.current.copy(MISSION_DEFAULT_TARGET);
      }
    }
    userDragging.current = false;
  }, [view, activeDestination, activeMissionId, activeHotspot]);

  // Yield scripted glide immediately when user interacts with OrbitControls
  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    const onStart = () => {
      userDragging.current = true;
    };
    ctrl.addEventListener('start', onStart);
    return () => {
      ctrl.removeEventListener('start', onStart);
    };
  }, [controlsRef, view]);

  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (introAnimating.current) {
      camera.lookAt(desiredTarget.current);
      if (ctrl) ctrl.target.copy(desiredTarget.current);
      return;
    }

    if (!userDragging.current) {
      const dampLambda = view === 'mission' ? 3.2 : 2.1;
      camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        desiredPos.current.x,
        dampLambda,
        delta,
      );
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        desiredPos.current.y,
        dampLambda,
        delta,
      );
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        desiredPos.current.z,
        dampLambda,
        delta,
      );

      if (ctrl) {
        ctrl.target.x = THREE.MathUtils.damp(
          ctrl.target.x,
          desiredTarget.current.x,
          dampLambda,
          delta,
        );
        ctrl.target.y = THREE.MathUtils.damp(
          ctrl.target.y,
          desiredTarget.current.y,
          dampLambda,
          delta,
        );
        ctrl.target.z = THREE.MathUtils.damp(
          ctrl.target.z,
          desiredTarget.current.z,
          dampLambda,
          delta,
        );
      }
    }

    if (ctrl) ctrl.update();
  });

  return null;
}

export function SpaceViewport({
  view,
  activeDestination,
  activeMissionId,
  activeHotspot,
  entryIntensity,
  hideHotspotPins = false,
  onSelectDestination,
  onSelectHotspot,
  onWebglFallback,
}: SpaceViewportProps) {
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const markerElsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const [contextLost, setContextLost] = useState(false);

  const activeMission = activeMissionId ? MISSIONS[activeMissionId] : null;
  const isMissionStage = view === 'mission' && activeMission !== null;

  const projectedItems = useMemo<ProjectedMarkerItem[]>(() => {
    if (view === 'hub') {
      return HUB_MARKERS.map((m) => ({ id: m.id, worldPos: m.worldPos }));
    }
    if (isMissionStage && activeMission && !hideHotspotPins) {
      return activeMission.hotspots.map((hs) => ({
        id: hs.id,
        worldPos: hs.position,
      }));
    }
    return [];
  }, [view, isMissionStage, activeMission, hideHotspotPins]);

  return (
    <div className="fixed inset-0 z-0 bg-[#05070b]">
      {contextLost ? (
        <div className="flex h-full w-full items-center justify-center p-8 text-center">
          <div className="hairline-box max-w-md p-6">
            <p className="hud-label mb-2 text-[#d4a36a]">Graphics Context Interrupted</p>
            <p className="text-sm text-[#a1aab8] mb-4">
              The hardware WebGL context paused to preserve system memory. Switch to 2D Archive Mode
              to continue exploring all verified mission records.
            </p>
            <button
              type="button"
              onClick={onWebglFallback}
              className="border border-white/25 px-4 py-2 font-mono-tech text-xs uppercase tracking-[0.14em] text-white hover:border-[#d4a36a]"
            >
              Open 2D Archive Mode
            </button>
          </div>
        </div>
      ) : (
        <>
          <Canvas
            dpr={isSoftwareGl ? 1 : [1, 1.5]}
            shadows={false}
            camera={{ position: [-0.35, 0.2, 6.2], fov: 44, near: 0.1, far: 160 }}
            gl={{
              antialias: !isSoftwareGl,
              powerPreference: 'high-performance',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 0.96,
            }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
              const dom = gl.domElement;
              dom.addEventListener('webglcontextlost', (ev) => {
                ev.preventDefault();
                setContextLost(true);
              });
              dom.addEventListener('webglcontextrestored', () => {
                setContextLost(false);
              });
            }}
          >
            {/* Harsh high-contrast space sunlight: single strong shadow-less directional light + minimal space fill */}
            <directionalLight
              position={[-14, 4.2, 6.5]}
              intensity={4.8}
              color="#fff8ef"
              castShadow={false}
            />
            <ambientLight intensity={isMissionStage ? 0.045 : 0.014} color="#161f2e" />

            <StarfieldSkybox
              showConstellations={
                view === 'destination' || activeMissionId === 'pioneer-10'
              }
              highlightAldebaran={
                activeDestination === 'deep-space' || activeMissionId === 'pioneer-10'
              }
              driftSpeed={0}
            />

            {!isMissionStage && (
              <PlanetaryHub
                onSelectDestination={onSelectDestination}
                entryIntensity={entryIntensity}
                introActive={view === 'intro'}
              />
            )}

            {isMissionStage && activeMission && (
              <Suspense fallback={null}>
                <LazySpacecraftStage
                  missionId={activeMission.id}
                  hotspots={activeMission.hotspots}
                  activeHotspotId={activeHotspot?.id ?? null}
                  onSelectHotspot={onSelectHotspot}
                />
              </Suspense>
            )}

            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.55}
              zoomSpeed={0.65}
              minDistance={
                isMissionStage
                  ? 1.7
                  : view === 'destination' && activeDestination === 'mars'
                    ? 4.1
                    : view === 'destination' && activeDestination === 'moon'
                      ? 0.85
                      : 2.2
              }
              maxDistance={isMissionStage ? 6.8 : 13.5}
              enabled={view !== 'intro'}
            />

            <CameraChoreographer
              view={view}
              activeDestination={activeDestination}
              activeMissionId={activeMissionId}
              activeHotspot={activeHotspot}
              controlsRef={controlsRef}
            />

            <MarkerProjector items={projectedItems} markerElsRef={markerElsRef} />

            <PostProcessing
              isSoftwareGl={isSoftwareGl}
              entryIntensity={entryIntensity}
              isMissionStage={isMissionStage}
            />
          </Canvas>

          {/* Standard DOM Projected 3D Markers (Zero secondary createRoot calls) */}
          <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
            {view === 'hub' &&
              HUB_MARKERS.map((marker) => (
                <button
                  key={marker.id}
                  ref={(el) => {
                    markerElsRef.current[marker.id] = el;
                  }}
                  type="button"
                  onClick={() => onSelectDestination(marker.id)}
                  style={{ opacity: 0, top: 0, left: 0 }}
                  className={`reticle-frame hairline-box fixed px-3 py-1.5 text-left transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                    activeDestination === marker.id
                      ? 'border-[#d4a36a] text-[#ededef]'
                      : 'text-[#c2c8d2] hover:border-white/40 hover:text-white'
                  }`}
                >
                  <div
                    className={`hud-label text-[9px] ${
                      marker.accent ? 'text-[#c77d98]' : 'text-[#8b95a5]'
                    }`}
                  >
                    {marker.code}
                  </div>
                  <div className="font-display text-sm tracking-[0.14em] uppercase">
                    {marker.title}
                  </div>
                </button>
              ))}

            {isMissionStage &&
              !hideHotspotPins &&
              activeMission &&
              activeMission.hotspots.map((hs, idx) => {
                const isActive = hs.id === activeHotspot?.id;
                return (
                  <button
                    key={hs.id}
                    ref={(el) => {
                      markerElsRef.current[hs.id] = el;
                    }}
                    type="button"
                    onClick={() => onSelectHotspot(hs)}
                    style={{ opacity: 0, top: 0, left: 0 }}
                    className={`hairline-box fixed px-2 py-1 text-left transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'border-[#d4a36a] text-[#ededef]'
                        : 'border-white/25 text-[#c8ced8] hover:border-white/60 hover:text-white'
                    }`}
                  >
                    <span className="font-mono-tech text-[10px] tracking-[0.12em] uppercase">
                      0{idx + 1} · {hs.label}
                    </span>
                  </button>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
