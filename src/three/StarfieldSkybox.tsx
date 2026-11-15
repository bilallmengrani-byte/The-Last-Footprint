import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  BRIGHT_STARS,
  CONSTELLATION_SEGMENTS,
  createSeededRandom,
  equatorialToVector3,
} from './celestialData';
import { createSkyDomeMaterial } from './shaders';

interface StarfieldSkyboxProps {
  showConstellations?: boolean;
  highlightAldebaran?: boolean;
  driftSpeed?: number;
}

export function StarfieldSkybox({
  showConstellations = false,
  highlightAldebaran = false,
  driftSpeed = 0,
}: StarfieldSkyboxProps) {
  const groupRef = useRef<THREE.Group>(null);
  const skyRadius = 92;

  const skyDomeMat = useMemo(() => createSkyDomeMaterial(), []);

  // Build accurate bright stars + pinpoint galactic-plane background field
  const { starGeometry, starMaterial, constellationGeometry, aldebaranPos } = useMemo(() => {
    const rand = createSeededRandom(19720303);
    const backgroundCount = 2400;
    const totalCount = BRIGHT_STARS.length + backgroundCount;

    const positions = new Float32Array(totalCount * 3);
    const colors = new Float32Array(totalCount * 3);
    const sizes = new Float32Array(totalCount);

    const starMap = new Map<string, THREE.Vector3>();
    let idx = 0;

    // 1. Accurate J2000 catalog stars (crisp photographic dynamic range)
    for (const star of BRIGHT_STARS) {
      const vec = equatorialToVector3(star.raHours, star.decDeg, skyRadius);
      starMap.set(star.name, vec);

      positions[idx * 3] = vec.x;
      positions[idx * 3 + 1] = vec.y;
      positions[idx * 3 + 2] = vec.z;

      const c = new THREE.Color(star.colorHex);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;

      sizes[idx] = Math.max(1.3, Math.min(3.1, (3.2 - star.mag) * 0.72));
      idx++;
    }

    // 2. Background Milky Way field with galactic plane concentration
    const galNormal = new THREE.Vector3(0.45, 0.78, -0.43).normalize();
    const tmpVec = new THREE.Vector3();

    for (let i = 0; i < backgroundCount; i++) {
      const u = rand();
      const v = rand();
      const theta = u * Math.PI * 2;
      if (rand() < 0.58) {
        const spread = (rand() - 0.5) * 0.42;
        tmpVec.set(Math.cos(theta), spread, Math.sin(theta)).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          galNormal,
        );
        tmpVec.applyQuaternion(q);
      } else {
        const phi = Math.acos(2 * v - 1);
        tmpVec.set(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta),
        );
      }

      tmpVec.multiplyScalar(skyRadius);
      positions[idx * 3] = tmpVec.x;
      positions[idx * 3 + 1] = tmpVec.y;
      positions[idx * 3 + 2] = tmpVec.z;

      const tempRoll = rand();
      const col = new THREE.Color();
      if (tempRoll < 0.18) col.set('#ffdcb8');
      else if (tempRoll < 0.72) col.set('#e6ecf4');
      else col.set('#bdd4fa');

      const dim = 0.22 + Math.pow(rand(), 1.8) * 0.68;
      colors[idx * 3] = col.r * dim;
      colors[idx * 3 + 1] = col.g * dim;
      colors[idx * 3 + 2] = col.b * dim;

      // Astronomical pinpoint sizing (never oversized bokeh circles)
      sizes[idx] = 0.55 + Math.pow(rand(), 4) * 1.15;
      idx++;
    }

    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    sGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    sGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const sMat = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) },
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (92.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 0.9, 3.2);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          if (d > 0.5) discard;
          // Sharp astronomical point-spread function (crisp optical core)
          float core = smoothstep(0.48, 0.02, d);
          float alpha = pow(core, 3.0);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const linePoints: number[] = [];
    for (const [aName, bName] of CONSTELLATION_SEGMENTS) {
      const a = starMap.get(aName);
      const b = starMap.get(bName);
      if (a && b) {
        linePoints.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const cGeo = new THREE.BufferGeometry();
    cGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));

    const ald = starMap.get('Aldebaran') ?? equatorialToVector3(4.5987, 16.509, skyRadius);

    return {
      starGeometry: sGeo,
      starMaterial: sMat,
      constellationGeometry: cGeo,
      aldebaranPos: ald,
    };
  }, []);

  useEffect(() => {
    return () => {
      skyDomeMat.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      constellationGeometry.dispose();
    };
  }, [skyDomeMat, starGeometry, starMaterial, constellationGeometry]);

  useFrame((_, delta) => {
    if (groupRef.current && driftSpeed > 0) {
      groupRef.current.rotation.y += delta * driftSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh material={skyDomeMat} renderOrder={-10}>
        <sphereGeometry args={[96, 32, 24]} />
      </mesh>

      <points geometry={starGeometry} material={starMaterial} frustumCulled={false} />

      {showConstellations && (
        <lineSegments geometry={constellationGeometry}>
          <lineBasicMaterial color="#708096" transparent opacity={0.11} depthWrite={false} />
        </lineSegments>
      )}

      {highlightAldebaran && (
        <mesh position={aldebaranPos}>
          <ringGeometry args={[0.7, 0.82, 24]} />
          <meshBasicMaterial color="#d4a36a" transparent opacity={0.48} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
