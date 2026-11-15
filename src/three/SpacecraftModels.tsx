import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MissionId, SpacecraftHotspot } from '../data/missions';
import { createSeededRandom } from './celestialData';
import {
  createKaptonFoilTextures,
  createRegolithTextures,
  createSolarPanelTexture,
} from './proceduralTextures';

export interface FogStateRef {
  active: boolean;
  color: THREE.Color;
  density: number;
}

interface SpacecraftStageProps {
  missionId: MissionId;
  hotspots: SpacecraftHotspot[];
  activeHotspotId: string | null;
  onSelectHotspot: (hotspot: SpacecraftHotspot) => void;
  fogStateRef?: React.MutableRefObject<FogStateRef>;
  hideMarkers?: boolean;
}

function terrainHeight(x: number, z: number, mode: 'moon' | 'mars'): number {
  const macro = Math.sin(x * 0.28) * Math.cos(z * 0.24) * 0.22;
  const ridge = Math.sin(x * 0.65 + z * 0.45) * 0.07;
  // Keep central landing footprint (-1.4..1.4) relatively flat so lander pads sit flush
  const dist = Math.sqrt(x * x + z * z);
  const flatFactor = THREE.MathUtils.smoothstep(dist, 1.3, 4.2);
  const crater =
    mode === 'moon'
      ? Math.exp(-Math.pow(Math.hypot(x - 3.6, z + 2.8) - 1.4, 2) * 1.4) * 0.14 -
        Math.exp(-Math.pow(Math.hypot(x - 3.6, z + 2.8), 2) * 0.6) * 0.28
      : Math.sin(x * 1.15 - z * 0.8) * 0.04;
  return (macro + ridge + crater) * flatFactor;
}

/**
 * Displaced 3D regolith terrain with instanced basalt boulders, horizon fog, and optional rover tracks.
 */
function TerrainHorizon({
  mode,
  withTracks = false,
  fogStateRef,
}: {
  mode: 'moon' | 'mars';
  withTracks?: boolean;
  fogStateRef?: React.MutableRefObject<FogStateRef>;
}) {
  const regolith = useMemo(() => createRegolithTextures(mode), [mode]);
  const rockMeshRef = useRef<THREE.InstancedMesh>(null);
  const fogRef = useRef<THREE.FogExp2>(null);

  useEffect(() => () => regolith.dispose(), [regolith]);

  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(28, 28, 84, 84);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, terrainHeight(x, z, mode));
    }
    geo.computeVertexNormals();
    return geo;
  }, [mode]);

  const rockCount = 54;
  const rockData = useMemo(() => {
    const rand = createSeededRandom(mode === 'moon' ? 1969 : 2004);
    const items: Array<{ pos: [number, number, number]; scale: [number, number, number]; rot: [number, number, number]; tint: string }> = [];
    for (let i = 0; i < rockCount; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 1.9 + rand() * 8.5;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = terrainHeight(x, z, mode) - 0.015;
      const s = 0.04 + Math.pow(rand(), 2.2) * 0.22;
      items.push({
        pos: [x, y, z],
        scale: [s * (0.8 + rand() * 0.6), s * (0.5 + rand() * 0.5), s * (0.8 + rand() * 0.6)],
        rot: [rand() * 0.5, rand() * Math.PI * 2, rand() * 0.5],
        tint:
          mode === 'moon'
            ? rand() > 0.5
              ? '#5a5c60'
              : '#44464a'
            : rand() > 0.5
              ? '#6e3d2d'
              : '#532d21',
      });
    }
    return items;
  }, [mode]);

  useEffect(() => {
    const mesh = rockMeshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    rockData.forEach((r, i) => {
      dummy.position.set(...r.pos);
      dummy.rotation.set(...r.rot);
      dummy.scale.set(...r.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.set(r.tint);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [rockData]);

  useFrame(() => {
    const fog = fogRef.current;
    if (!fog) return;
    if (fogStateRef?.current?.active) {
      fog.color.copy(fogStateRef.current.color);
      fog.density = fogStateRef.current.density;
    }
  });

  return (
    <group position={[0, -0.68, 0]}>
      {/* Horizon distance fog fading ground edges into deep lunar black or dusty Martian ochre */}
      <fogExp2
        ref={fogRef}
        attach="fog"
        args={[mode === 'moon' ? '#05070b' : '#1b100d', 0.095]}
      />

      {/* Undulating Regolith Ground */}
      <mesh geometry={terrainGeo}>
        <meshStandardMaterial
          map={regolith.map}
          bumpMap={regolith.bumpMap}
          bumpScale={0.045}
          roughness={0.96}
          metalness={0.02}
        />
      </mesh>

      {/* Soft Contact Grounding Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.45, 32]} />
        <meshBasicMaterial
          color={mode === 'moon' ? '#07080a' : '#190b08'}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>

      {/* Opportunity Rover Parallel Wheel Tracks */}
      {withTracks &&
        [-0.72, 0.72].map((tx, idx) => (
          <mesh
            key={idx}
            position={[tx, 0.008, -2.6]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.16, 4.4]} />
            <meshStandardMaterial color="#3c2017" roughness={0.98} metalness={0.0} />
          </mesh>
        ))}

      {/* Instanced Regolith Boulders & Basalt Stones */}
      <instancedMesh ref={rockMeshRef} args={[undefined, undefined, rockCount]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.92} metalness={0.04} />
      </instancedMesh>
    </group>
  );
}

/**
 * 01 — Apollo 11 Lunar Module Eagle Descent Stage
 */
function Apollo11DescentAssembly() {
  const kapton = useMemo(() => createKaptonFoilTextures(), []);
  useEffect(() => () => kapton.dispose(), [kapton]);

  const foilMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: kapton.map,
        bumpMap: kapton.bumpMap,
        bumpScale: 0.036,
        color: '#dfab44',
        metalness: 0.88,
        roughness: 0.32,
      }),
    [kapton],
  );

  const darkAlloyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#252931',
        metalness: 0.76,
        roughness: 0.44,
      }),
    [],
  );

  const silverStrutMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b4bac4',
        metalness: 0.82,
        roughness: 0.28,
      }),
    [],
  );

  const enginePoints = useMemo(
    () => [
      new THREE.Vector2(0.14, 0.32),
      new THREE.Vector2(0.22, 0.14),
      new THREE.Vector2(0.38, -0.15),
      new THREE.Vector2(0.48, -0.44),
    ],
    [],
  );

  const legAngles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];

  return (
    <group position={[0, 0.1, 0]}>
      <TerrainHorizon mode="moon" />

      {/* Primary Octagonal Descent Body */}
      <mesh position={[0, 0.38, 0]} material={foilMat}>
        <cylinderGeometry args={[1.15, 1.15, 0.82, 8]} />
      </mesh>

      {/* Recessed Equipment Bay Cross-Ribs */}
      {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((ang, idx) => (
        <mesh
          key={idx}
          position={[Math.sin(ang) * 1.1, 0.38, Math.cos(ang) * 1.1]}
          rotation={[0, ang, 0]}
          material={darkAlloyMat}
        >
          <boxGeometry args={[0.76, 0.76, 0.04]} />
        </mesh>
      ))}

      {/* Upper Interstage Blast Deflector Deck */}
      <mesh position={[0, 0.81, 0]} material={darkAlloyMat}>
        <cylinderGeometry args={[1.08, 1.15, 0.06, 8]} />
      </mesh>
      <mesh position={[0, 0.845, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.02, 16]} />
        <meshStandardMaterial color="#15171b" roughness={0.85} metalness={0.3} />
      </mesh>

      {/* Throttleable Descent Engine Bell */}
      <mesh position={[0, -0.1, 0]} material={darkAlloyMat}>
        <latheGeometry args={[enginePoints, 24]} />
      </mesh>

      {/* 4 Articulated Landing Legs + Footpads */}
      {legAngles.map((ang, i) => {
        const isForward = i === 0;
        return (
          <group key={i} rotation={[0, ang, 0]}>
            <mesh position={[0, 0.42, 1.24]} rotation={[0.58, 0, 0]} material={silverStrutMat}>
              <cylinderGeometry args={[0.035, 0.035, 0.92, 8]} />
            </mesh>
            <mesh position={[0, -0.02, 1.38]} rotation={[0.35, 0, 0]} material={foilMat}>
              <cylinderGeometry args={[0.055, 0.042, 1.48, 10]} />
            </mesh>
            <mesh position={[0, -0.66, 1.62]} material={silverStrutMat}>
              <cylinderGeometry args={[0.28, 0.32, 0.05, 16]} />
            </mesh>
            {isForward && (
              <group position={[0, 0.04, 1.46]} rotation={[0.35, 0, 0]}>
                <mesh position={[-0.09, 0, 0]} material={silverStrutMat}>
                  <cylinderGeometry args={[0.012, 0.012, 1.15, 6]} />
                </mesh>
                <mesh position={[0.09, 0, 0]} material={silverStrutMat}>
                  <cylinderGeometry args={[0.012, 0.012, 1.15, 6]} />
                </mesh>
                {[-0.4, -0.24, -0.08, 0.08, 0.24, 0.4].map((ry, rIdx) => (
                  <mesh
                    key={rIdx}
                    position={[0, ry, 0]}
                    rotation={[0, 0, Math.PI / 2]}
                    material={silverStrutMat}
                  >
                    <cylinderGeometry args={[0.009, 0.009, 0.18, 6]} />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}

/**
 * 02 — Apollo 15 Lunar Roving Vehicle (LRV-1)
 */
function LunarRovingVehicleAssembly() {
  const kapton = useMemo(() => createKaptonFoilTextures(), []);
  useEffect(() => () => kapton.dispose(), [kapton]);

  const aluminumMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b0b8c4',
        metalness: 0.82,
        roughness: 0.32,
      }),
    [],
  );

  const darkAlloyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#424852',
        metalness: 0.65,
        roughness: 0.55,
      }),
    [],
  );

  const meshWheelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#767f8c',
        metalness: 0.72,
        roughness: 0.45,
      }),
    [],
  );

  const seatMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2b3038',
        metalness: 0.22,
        roughness: 0.85,
      }),
    [],
  );

  const foilMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: kapton.map,
        bumpMap: kapton.bumpMap,
        bumpScale: 0.02,
        color: '#d4a242',
        metalness: 0.88,
        roughness: 0.28,
      }),
    [kapton],
  );

  const goldDishMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d4aa48',
        metalness: 0.85,
        roughness: 0.3,
        wireframe: false,
      }),
    [],
  );

  const dishPoints = useMemo(
    () => [
      new THREE.Vector2(0.001, 0),
      new THREE.Vector2(0.12, 0.04),
      new THREE.Vector2(0.26, 0.11),
      new THREE.Vector2(0.38, 0.2),
      new THREE.Vector2(0.44, 0.25),
    ],
    [],
  );

  const wheelPositions: Array<[number, number, number]> = [
    [-0.62, -0.05, 0.72],
    [0.62, -0.05, 0.72],
    [-0.62, -0.05, -0.72],
    [0.62, -0.05, -0.72],
  ];

  return (
    <group position={[0, 0.08, 0]}>
      <TerrainHorizon mode="moon" withTracks />

      {/* Main 3-Part Aluminum Tubular Chassis */}
      <mesh position={[0, 0.08, 0]} material={aluminumMat}>
        <boxGeometry args={[0.88, 0.04, 1.42]} />
      </mesh>
      {/* Chassis side frame rails */}
      {[-0.45, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0]} material={aluminumMat}>
          <cylinderGeometry args={[0.02, 0.02, 1.52, 8]} />
        </mesh>
      ))}

      {/* Front Chassis & Battery Bays */}
      <mesh position={[0, 0.15, 0.68]} material={foilMat}>
        <boxGeometry args={[0.74, 0.16, 0.38]} />
      </mesh>
      {/* Front bumper crash bar */}
      <mesh position={[0, 0.12, 0.9]} rotation={[0, 0, Math.PI / 2]} material={aluminumMat}>
        <cylinderGeometry args={[0.02, 0.02, 0.94, 8]} />
      </mesh>

      {/* Rear Tool Pallet & Geology Sample Carrier */}
      <group position={[0, 0.22, -0.68]}>
        <mesh material={darkAlloyMat}>
          <boxGeometry args={[0.78, 0.18, 0.34]} />
        </mesh>
        <mesh position={[0, 0.12, 0]} material={aluminumMat}>
          <boxGeometry args={[0.74, 0.06, 0.3]} />
        </mesh>
      </group>

      {/* Side-by-Side Foldable Astronaut Seats */}
      {[-0.23, 0.23].map((sx, idx) => (
        <group key={idx} position={[sx, 0.12, 0.05]}>
          {/* Seat cushion */}
          <mesh position={[0, 0.08, 0.04]} material={seatMat}>
            <boxGeometry args={[0.34, 0.05, 0.38]} />
          </mesh>
          {/* Seat tubular backrest */}
          <mesh position={[0, 0.32, -0.16]} rotation={[0.18, 0, 0]} material={seatMat}>
            <boxGeometry args={[0.32, 0.44, 0.04]} />
          </mesh>
          {/* Seat frame tubular supports */}
          <mesh position={[-0.17, 0.26, -0.16]} rotation={[0.18, 0, 0]} material={aluminumMat}>
            <cylinderGeometry args={[0.012, 0.012, 0.46, 6]} />
          </mesh>
          <mesh position={[0.17, 0.26, -0.16]} rotation={[0.18, 0, 0]} material={aluminumMat}>
            <cylinderGeometry args={[0.012, 0.012, 0.46, 6]} />
          </mesh>
          {/* Footrest plate */}
          <mesh position={[0, -0.02, 0.36]} rotation={[-0.2, 0, 0]} material={darkAlloyMat}>
            <boxGeometry args={[0.3, 0.02, 0.24]} />
          </mesh>
        </group>
      ))}

      {/* Center Console & T-Handle Controller */}
      <group position={[0, 0.18, 0.14]}>
        {/* Pedestal console */}
        <mesh position={[0, 0.12, 0.08]} rotation={[0.42, 0, 0]} material={darkAlloyMat}>
          <boxGeometry args={[0.16, 0.24, 0.1]} />
        </mesh>
        {/* Sun-shadow device top compass */}
        <mesh position={[0, 0.25, 0.03]} material={aluminumMat}>
          <cylinderGeometry args={[0.025, 0.025, 0.04, 10]} />
        </mesh>
        {/* T-Handle joystick post */}
        <mesh position={[0, 0.1, -0.06]} material={aluminumMat}>
          <cylinderGeometry args={[0.015, 0.015, 0.22, 6]} />
        </mesh>
        {/* T-Bar horizontal handle */}
        <mesh position={[0, 0.2, -0.06]} rotation={[0, 0, Math.PI / 2]} material={aluminumMat}>
          <cylinderGeometry args={[0.016, 0.016, 0.14, 8]} />
        </mesh>
      </group>

      {/* Forward High-Gain S-Band Dish Antenna */}
      <group position={[0.0, 0.22, 0.72]}>
        <mesh position={[0, 0.26, 0]} material={aluminumMat}>
          <cylinderGeometry args={[0.018, 0.024, 0.54, 8]} />
        </mesh>
        {/* Parabolic gold mesh umbrella */}
        <mesh position={[0, 0.54, 0.08]} rotation={[-0.45, 0, 0]} material={goldDishMat}>
          <latheGeometry args={[dishPoints, 20]} />
        </mesh>
        {/* Dish subreflector feed */}
        <mesh position={[0, 0.68, 0.18]} rotation={[-0.45, 0, 0]} material={aluminumMat}>
          <cylinderGeometry args={[0.012, 0.012, 0.24, 6]} />
        </mesh>
      </group>

      {/* Ground-Controlled Television Assembly (GCTA) Camera */}
      <group position={[0.32, 0.26, 0.82]}>
        <mesh material={aluminumMat}>
          <cylinderGeometry args={[0.015, 0.015, 0.28, 6]} />
        </mesh>
        {/* RCA TV camera body */}
        <mesh position={[0, 0.16, 0]} material={darkAlloyMat}>
          <boxGeometry args={[0.14, 0.12, 0.18]} />
        </mesh>
        {/* Optical zoom lens */}
        <mesh position={[0, 0.16, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.038, 0.048, 0.11, 12]} />
          <meshStandardMaterial color="#11161d" metalness={0.92} roughness={0.14} />
        </mesh>
      </group>

      {/* Low-Gain Antenna & LCRU Box */}
      <group position={[-0.28, 0.24, 0.72]}>
        <mesh material={foilMat}>
          <boxGeometry args={[0.22, 0.18, 0.18]} />
        </mesh>
        <mesh position={[0, 0.24, 0]} material={aluminumMat}>
          <cylinderGeometry args={[0.008, 0.008, 0.32, 6]} />
        </mesh>
      </group>

      {/* 4 Woven Steel Mesh Wheels with Spun Hubs and Fenders */}
      {wheelPositions.map((wp, idx) => {
        const isRight = wp[0] > 0;
        return (
          <group key={idx} position={wp}>
            {/* Woven wire mesh tire */}
            <mesh rotation={[0, 0, Math.PI / 2]} material={meshWheelMat}>
              <cylinderGeometry args={[0.26, 0.26, 0.16, 22]} />
            </mesh>
            {/* Spun aluminum center hub */}
            <mesh rotation={[0, 0, Math.PI / 2]} material={aluminumMat}>
              <cylinderGeometry args={[0.09, 0.09, 0.18, 14]} />
            </mesh>
            {/* Titanium chevron traction treads */}
            {[-0.05, 0.05].map((tx, ti) => (
              <mesh key={ti} position={[tx, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={darkAlloyMat}>
                <torusGeometry args={[0.258, 0.012, 6, 20]} />
              </mesh>
            ))}
            {/* Dust guard fender */}
            <mesh position={[0, 0.24, 0]} material={aluminumMat}>
              <boxGeometry args={[0.18, 0.02, 0.44]} />
            </mesh>
            {/* Suspension wishbone connecting to chassis */}
            <mesh
              position={[isRight ? -0.09 : 0.09, 0.11, 0]}
              rotation={[0, 0, isRight ? 0.45 : -0.45]}
              material={aluminumMat}
            >
              <cylinderGeometry args={[0.014, 0.014, 0.26, 6]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/**
 * 03 — Sojourner Rover (Mars Pathfinder)
 */
function SojournerRoverAssembly() {
  const solarTex = useMemo(() => createSolarPanelTexture(), []);
  const kapton = useMemo(() => createKaptonFoilTextures(), []);
  useEffect(() => {
    return () => {
      solarTex.dispose();
      kapton.dispose();
    };
  }, [solarTex, kapton]);

  const solarMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: solarTex,
        roughness: 0.28,
        metalness: 0.52,
      }),
    [solarTex],
  );

  const foilMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: kapton.map,
        bumpMap: kapton.bumpMap,
        bumpScale: 0.022,
        color: '#d4a23e',
        metalness: 0.86,
        roughness: 0.32,
      }),
    [kapton],
  );

  const titaniumMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#9ca5b0',
        metalness: 0.78,
        roughness: 0.35,
      }),
    [],
  );

  const wheelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#7a8390',
        metalness: 0.72,
        roughness: 0.4,
      }),
    [],
  );

  const sensorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#282f3a',
        metalness: 0.65,
        roughness: 0.45,
      }),
    [],
  );

  const wheelPositions: Array<[number, number, number]> = [
    [-0.34, 0.02, 0.22],
    [-0.34, 0.02, 0.0],
    [-0.34, 0.02, -0.22],
    [0.34, 0.02, 0.22],
    [0.34, 0.02, 0.0],
    [0.34, 0.02, -0.22],
  ];

  return (
    <group position={[0, 0.04, 0]}>
      <TerrainHorizon mode="mars" withTracks />

      {/* Main Warm Electronics Box (WEB) */}
      <mesh position={[0, 0.16, 0]} material={foilMat}>
        <boxGeometry args={[0.42, 0.18, 0.52]} />
      </mesh>

      {/* Gallium Arsenide Solar Array Flat Deck */}
      <mesh position={[0, 0.255, 0]} material={solarMat}>
        <boxGeometry args={[0.44, 0.015, 0.54]} />
      </mesh>
      {/* Aluminum rim around solar deck */}
      <mesh position={[0, 0.252, 0]} material={titaniumMat}>
        <boxGeometry args={[0.45, 0.01, 0.55]} />
      </mesh>

      {/* Forward Stereoscopic Cameras & Hazard Stripe Sensor */}
      <group position={[0, 0.18, 0.27]}>
        <mesh material={titaniumMat}>
          <boxGeometry args={[0.3, 0.04, 0.04]} />
        </mesh>
        {[-0.11, 0.11].map((cx, i) => (
          <mesh key={i} position={[cx, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.02, 10]} />
            <meshStandardMaterial color="#121820" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
      </group>

      {/* Slender UHF Whip Antenna */}
      <group position={[0.18, 0.26, -0.22]}>
        <mesh position={[0, 0.22, 0]} material={titaniumMat}>
          <cylinderGeometry args={[0.005, 0.008, 0.44, 6]} />
        </mesh>
      </group>

      {/* Rear Deployed APXS Robotic Arm */}
      <group position={[0, 0.12, -0.27]}>
        <mesh position={[0, -0.04, -0.08]} rotation={[-0.45, 0, 0]} material={titaniumMat}>
          <cylinderGeometry args={[0.012, 0.012, 0.2, 6]} />
        </mesh>
        {/* APXS Sensor Head */}
        <mesh position={[0, -0.09, -0.16]} rotation={[Math.PI / 3, 0, 0]} material={sensorMat}>
          <cylinderGeometry args={[0.038, 0.042, 0.08, 14]} />
        </mesh>
        {/* Brass collimator ring */}
        <mesh position={[0, -0.12, -0.19]} rotation={[Math.PI / 3, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.02, 12]} />
          <meshStandardMaterial color="#c8a048" metalness={0.88} roughness={0.25} />
        </mesh>
      </group>

      {/* 6 Cleated Aluminum Rocker-Bogie Wheels */}
      {[-0.26, 0.26].map((sx, idx) => (
        <group key={idx}>
          {/* Main Rocker Arm */}
          <mesh position={[sx, 0.1, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={titaniumMat}>
            <cylinderGeometry args={[0.012, 0.012, 0.54, 6]} />
          </mesh>
          {/* Differential Pivot Link */}
          <mesh position={[sx, 0.18, -0.05]} material={titaniumMat}>
            <cylinderGeometry args={[0.015, 0.015, 0.08, 6]} />
          </mesh>
        </group>
      ))}

      {wheelPositions.map((wp, idx) => (
        <group key={idx} position={wp}>
          {/* Cleated aluminum drum wheel */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelMat}>
            <cylinderGeometry args={[0.075, 0.075, 0.065, 16]} />
          </mesh>
          {/* Central hub axle */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={titaniumMat}>
            <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
          </mesh>
          {/* Strut connecting to rocker/bogie */}
          <mesh
            position={[wp[0] > 0 ? -0.05 : 0.05, 0.07, 0]}
            rotation={[0, 0, wp[0] > 0 ? 0.35 : -0.35]}
            material={titaniumMat}
          >
            <cylinderGeometry args={[0.01, 0.01, 0.16, 6]} />
          </mesh>
        </group>
      ))}

      {/* Background contextual silhouette of Mars Pathfinder lander petal & airbag folds */}
      <group position={[-1.9, 0.08, -2.4]} rotation={[0, 0.6, 0]}>
        {/* Open metallic landing petal */}
        <mesh position={[0, 0.06, 0]} material={titaniumMat}>
          <boxGeometry args={[0.85, 0.04, 0.95]} />
        </mesh>
        {/* Deflated airbag cluster */}
        <mesh position={[0.42, 0.08, 0.22]}>
          <sphereGeometry args={[0.28, 10, 8]} />
          <meshStandardMaterial color="#88796d" roughness={0.92} metalness={0.05} />
        </mesh>
        <mesh position={[-0.38, 0.07, -0.18]}>
          <sphereGeometry args={[0.26, 10, 8]} />
          <meshStandardMaterial color="#88796d" roughness={0.92} metalness={0.05} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 04 — Opportunity Rover (MER-B)
 */
function OpportunityRoverAssembly({
  fogStateRef,
}: {
  fogStateRef?: React.MutableRefObject<FogStateRef>;
}) {
  const solarTex = useMemo(() => createSolarPanelTexture(), []);
  const kapton = useMemo(() => createKaptonFoilTextures(), []);
  useEffect(() => {
    return () => {
      solarTex.dispose();
      kapton.dispose();
    };
  }, [solarTex, kapton]);

  const solarMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: solarTex,
        roughness: 0.32,
        metalness: 0.55,
      }),
    [solarTex],
  );

  const webGoldMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: kapton.map,
        bumpMap: kapton.bumpMap,
        bumpScale: 0.024,
        color: '#d4a03c',
        metalness: 0.85,
        roughness: 0.34,
      }),
    [kapton],
  );

  const titaniumMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#9fa7b2',
        metalness: 0.74,
        roughness: 0.38,
      }),
    [],
  );

  const wheelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2e3239',
        metalness: 0.52,
        roughness: 0.68,
      }),
    [],
  );

  const wheelPositions: Array<[number, number, number]> = [
    [-0.72, -0.45, 0.62],
    [-0.72, -0.45, 0.0],
    [-0.72, -0.45, -0.62],
    [0.72, -0.45, 0.62],
    [0.72, -0.45, 0.0],
    [0.72, -0.45, -0.62],
  ];

  return (
    <group position={[0, 0.05, 0]}>
      <TerrainHorizon mode="mars" withTracks fogStateRef={fogStateRef} />

      {/* Warm Electronics Box */}
      <mesh position={[0, 0.14, 0]} material={webGoldMat}>
        <boxGeometry args={[0.78, 0.42, 0.92]} />
      </mesh>

      {/* Deployable Solar Wing Arrays */}
      <mesh position={[0, 0.38, -0.05]} material={solarMat}>
        <boxGeometry args={[1.75, 0.04, 1.02]} />
      </mesh>
      <mesh position={[0, 0.38, 0.68]} material={solarMat}>
        <boxGeometry args={[0.92, 0.04, 0.45]} />
      </mesh>

      {/* High-Gain Dish Antenna */}
      <group position={[-0.32, 0.58, -0.34]} rotation={[0.35, 0, -0.25]}>
        <mesh material={titaniumMat}>
          <cylinderGeometry args={[0.22, 0.04, 0.08, 20]} />
        </mesh>
        <mesh position={[0, -0.1, 0]} material={titaniumMat}>
          <cylinderGeometry args={[0.02, 0.02, 0.22, 8]} />
        </mesh>
      </group>

      {/* Pancam Stereo Camera Mast */}
      <group position={[0.2, 0.85, 0.42]}>
        <mesh material={titaniumMat}>
          <cylinderGeometry args={[0.035, 0.042, 0.92, 10]} />
        </mesh>
        <mesh position={[0, 0.46, 0.04]} material={titaniumMat}>
          <boxGeometry args={[0.28, 0.11, 0.14]} />
        </mesh>
        <mesh position={[-0.08, 0.46, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.03, 12]} />
          <meshStandardMaterial color="#121e2b" metalness={0.9} roughness={0.14} />
        </mesh>
        <mesh position={[0.08, 0.46, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.03, 12]} />
          <meshStandardMaterial color="#121e2b" metalness={0.9} roughness={0.14} />
        </mesh>
      </group>

      {/* IDD Robotic Instrument Arm */}
      <group position={[0.05, 0.16, 0.65]}>
        <mesh position={[0, 0.04, 0.18]} rotation={[Math.PI / 2.4, 0, 0]} material={titaniumMat}>
          <cylinderGeometry args={[0.022, 0.022, 0.42, 8]} />
        </mesh>
        <mesh position={[0, -0.02, 0.36]} material={webGoldMat}>
          <cylinderGeometry args={[0.09, 0.09, 0.11, 12]} />
        </mesh>
      </group>

      {/* 6 Rocker-Bogie Wheels */}
      {[-0.56, 0.56].map((sx, idx) => (
        <mesh key={idx} position={[sx, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]} material={titaniumMat}>
          <cylinderGeometry args={[0.025, 0.025, 1.32, 8]} />
        </mesh>
      ))}
      {wheelPositions.map((wp, idx) => (
        <group key={idx} position={wp}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelMat}>
            <cylinderGeometry args={[0.16, 0.16, 0.14, 16]} />
          </mesh>
          <mesh
            position={[wp[0] > 0 ? -0.12 : 0.12, 0.16, 0]}
            rotation={[0, 0, wp[0] > 0 ? 0.4 : -0.4]}
            material={titaniumMat}
          >
            <cylinderGeometry args={[0.018, 0.018, 0.36, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * 03 — Ingenuity Mars Helicopter
 */
function IngenuityAssembly() {
  const solarTex = useMemo(() => createSolarPanelTexture(), []);
  const kapton = useMemo(() => createKaptonFoilTextures(), []);
  useEffect(() => {
    return () => {
      solarTex.dispose();
      kapton.dispose();
    };
  }, [solarTex, kapton]);

  const carbonMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e222a',
        metalness: 0.38,
        roughness: 0.5,
      }),
    [],
  );

  const fuselageMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: kapton.map,
        bumpMap: kapton.bumpMap,
        bumpScale: 0.02,
        color: '#d4a03c',
        metalness: 0.82,
        roughness: 0.34,
      }),
    [kapton],
  );

  const solarMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: solarTex,
        roughness: 0.28,
        metalness: 0.5,
      }),
    [solarTex],
  );

  const legOffsets: Array<[number, number]> = [
    [0.44, 0.44],
    [-0.44, 0.44],
    [-0.44, -0.44],
    [0.44, -0.44],
  ];

  return (
    <group position={[0, 0.12, 0]}>
      <TerrainHorizon mode="mars" />

      <mesh position={[0, 0.08, 0]} material={fuselageMat}>
        <boxGeometry args={[0.38, 0.32, 0.34]} />
      </mesh>

      <mesh position={[0, 0.58, 0]} material={carbonMat}>
        <cylinderGeometry args={[0.025, 0.032, 0.78, 12]} />
      </mesh>

      {/* Lower Coaxial Carbon Rotor (Flight 72 blade tip damage representation) */}
      <group position={[0, 0.58, 0]} rotation={[0, 0.45, 0]}>
        <mesh position={[-0.48, 0, 0]} material={carbonMat}>
          <boxGeometry args={[0.96, 0.018, 0.12]} />
        </mesh>
        <mesh position={[0.42, 0, 0]} rotation={[0.06, 0, -0.05]} material={carbonMat}>
          <boxGeometry args={[0.78, 0.018, 0.12]} />
        </mesh>
      </group>

      <group position={[0, 0.76, 0]} rotation={[0, -0.75, 0]}>
        <mesh material={carbonMat}>
          <boxGeometry args={[1.9, 0.018, 0.12]} />
        </mesh>
      </group>

      <mesh position={[0, 0.98, 0]} material={solarMat}>
        <boxGeometry args={[0.68, 0.025, 0.28]} />
      </mesh>

      {legOffsets.map(([lx, lz], i) => {
        const angleY = Math.atan2(lx, lz);
        return (
          <group key={i} rotation={[0, angleY, 0]}>
            <mesh position={[0, -0.34, 0.32]} rotation={[-0.48, 0, 0]} material={carbonMat}>
              <cylinderGeometry args={[0.014, 0.011, 0.95, 8]} />
            </mesh>
            <mesh position={[0, -0.75, 0.54]} material={carbonMat}>
              <cylinderGeometry args={[0.04, 0.045, 0.03, 10]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/**
 * 04 — Pioneer 10 Outer-Planet Probe
 */
function Pioneer10Assembly() {
  const kapton = useMemo(() => createKaptonFoilTextures(), []);
  useEffect(() => () => kapton.dispose(), [kapton]);

  const dishMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ccd1d8',
        metalness: 0.48,
        roughness: 0.46,
        side: THREE.DoubleSide,
      }),
    [],
  );

  const busMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: kapton.map,
        bumpMap: kapton.bumpMap,
        bumpScale: 0.024,
        color: '#d9a43e',
        metalness: 0.88,
        roughness: 0.32,
      }),
    [kapton],
  );

  const rtgMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#30353e',
        metalness: 0.68,
        roughness: 0.5,
      }),
    [],
  );

  const dishProfile = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const r = (i / 16) * 1.38;
      const y = 0.25 + r * r * 0.22;
      pts.push(new THREE.Vector2(r, y));
    }
    return pts;
  }, []);

  return (
    <group rotation={[0.26, 0.3, -0.12]}>
      <mesh material={dishMat}>
        <latheGeometry args={[dishProfile, 40]} />
      </mesh>

      {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((ang, i) => (
        <group key={i} rotation={[0, ang, 0]}>
          <mesh position={[0, 0.72, 0.48]} rotation={[-0.65, 0, 0]} material={rtgMat}>
            <cylinderGeometry args={[0.012, 0.012, 0.98, 6]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.06, 0]} material={rtgMat}>
        <cylinderGeometry args={[0.07, 0.05, 0.18, 12]} />
      </mesh>

      <mesh position={[0, 0.02, 0]} material={busMat}>
        <cylinderGeometry args={[0.58, 0.58, 0.42, 6]} />
      </mesh>

      {[-0.4, 0.4].map((zOff, i) => (
        <group key={i} position={[1.05, -0.04, zOff]} rotation={[0, zOff > 0 ? -0.3 : 0.3, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={rtgMat}>
            <cylinderGeometry args={[0.02, 0.02, 1.55, 8]} />
          </mesh>
          <mesh position={[0.78, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={rtgMat}>
            <cylinderGeometry args={[0.09, 0.09, 0.38, 12]} />
          </mesh>
        </group>
      ))}

      <group position={[-1.4, -0.05, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={rtgMat}>
          <cylinderGeometry args={[0.016, 0.024, 2.2, 8]} />
        </mesh>
        <mesh position={[-1.12, 0, 0]} material={busMat}>
          <cylinderGeometry args={[0.055, 0.055, 0.16, 10]} />
        </mesh>
      </group>

      <mesh position={[0.35, -0.18, 0.48]} rotation={[0.1, 0.55, 0]}>
        <boxGeometry args={[0.24, 0.16, 0.015]} />
        <meshStandardMaterial color="#e0b64e" metalness={0.92} roughness={0.22} />
      </mesh>
    </group>
  );
}

export default function SpacecraftStage({
  missionId,
  hotspots,
  activeHotspotId,
  onSelectHotspot,
  fogStateRef,
  hideMarkers = false,
}: SpacecraftStageProps) {
  return (
    <group>
      {missionId === 'apollo-11-descent' && <Apollo11DescentAssembly />}
      {missionId === 'lunar-roving-vehicle' && <LunarRovingVehicleAssembly />}
      {missionId === 'sojourner' && <SojournerRoverAssembly />}
      {missionId === 'opportunity' && <OpportunityRoverAssembly fogStateRef={fogStateRef} />}
      {missionId === 'ingenuity' && <IngenuityAssembly />}
      {missionId === 'pioneer-10' && <Pioneer10Assembly />}

      {/* Subtle survey pin anchors on spacecraft (hidden during scroll-driven cinematic) */}
      {!hideMarkers &&
        hotspots.map((hs) => {
          const isActive = hs.id === activeHotspotId;
          return (
            <mesh
              key={hs.id}
              position={hs.position}
              onClick={(e) => {
                e.stopPropagation();
                onSelectHotspot(hs);
              }}
            >
              <sphereGeometry args={[isActive ? 0.028 : 0.02, 10, 10]} />
              <meshBasicMaterial color={isActive ? '#d4a36a' : '#c8ced8'} />
            </mesh>
          );
        })}
    </group>
  );
}
