import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { DESTINATIONS, DestinationId } from '../data/missions';
import {
  applyPlanetaryPbrExtension,
  createAtmosphereMaterial,
} from './shaders';
import { createSeededRandom } from './celestialData';

interface PlanetaryHubProps {
  onSelectDestination: (id: DestinationId) => void;
  entryIntensity: number;
  introActive: boolean;
}

const SUN_DIRECTION = new THREE.Vector3(-14.0, 4.2, 6.5).normalize();

function loadPlanetTexture(
  loader: THREE.TextureLoader,
  url: string,
  srgb: boolean,
  anisotropy: number,
): THREE.Texture {
  const tex = loader.load(url);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = anisotropy;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

export function PlanetaryHub({
  onSelectDestination,
  entryIntensity,
  introActive,
}: PlanetaryHubProps) {
  const { gl } = useThree();
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const marsRef = useRef<THREE.Mesh>(null);
  const shuttleRef = useRef<THREE.Group>(null);
  const dustRef = useRef<THREE.Points>(null);

  const planetAssets = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const aniso = Math.min(4, gl.capabilities.getMaxAnisotropy());

    // Authentic NASA-derived 2K equirectangular imagery & elevation maps
    const earthDay = loadPlanetTexture(loader, '/assets/planets/earth_day_2k.jpg', true, aniso);
    const earthNormal = loadPlanetTexture(
      loader,
      '/assets/planets/earth_normal_2k.jpg',
      false,
      aniso,
    );
    const earthSpec = loadPlanetTexture(
      loader,
      '/assets/planets/earth_specular_2k.jpg',
      false,
      aniso,
    );
    const earthClouds = loadPlanetTexture(
      loader,
      '/assets/planets/earth_clouds_2k.jpg',
      false,
      aniso,
    );
    const earthNight = loadPlanetTexture(
      loader,
      '/assets/planets/earth_night_2k.jpg',
      true,
      aniso,
    );

    const moonAlbedo = loadPlanetTexture(loader, '/assets/planets/moon_2k.jpg', true, aniso);
    const moonBump = loadPlanetTexture(loader, '/assets/planets/moon_bump.png', false, aniso);

    const marsAlbedo = loadPlanetTexture(loader, '/assets/planets/mars_2k.jpg', true, aniso);
    const marsBump = loadPlanetTexture(loader, '/assets/planets/mars_bump_2k.jpg', false, aniso);

    const earthMat = new THREE.MeshStandardMaterial({
      color: '#edf2f7',
      map: earthDay,
      normalMap: earthNormal,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughness: 1.0,
      metalness: 0.02,
    });
    earthMat.customProgramCacheKey = () => 'planetary-pbr-v3';
    applyPlanetaryPbrExtension(
      earthMat,
      SUN_DIRECTION,
      '#5b98e0',
      0.08,
      0.24,
      earthNight,
      earthSpec,
    );

    const cloudsMat = new THREE.MeshStandardMaterial({
      color: '#f2f5f9',
      alphaMap: earthClouds,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
      roughness: 0.96,
      metalness: 0.0,
    });

    // Moon: airless matte lunar regolith with NASA LRO LOLA DEM relief
    const moonMat = new THREE.MeshStandardMaterial({
      color: '#dcdad5',
      map: moonAlbedo,
      bumpMap: moonBump,
      bumpScale: 0.032,
      roughness: 0.98,
      metalness: 0.0,
    });

    // Mars: NASA Viking/MGS global geology with restrained terracotta/ochre balance
    const marsMat = new THREE.MeshStandardMaterial({
      color: '#dcd3cb',
      map: marsAlbedo,
      bumpMap: marsBump,
      bumpScale: 0.036,
      roughness: 0.94,
      metalness: 0.0,
    });
    marsMat.customProgramCacheKey = () => 'planetary-pbr-v3';
    applyPlanetaryPbrExtension(marsMat, SUN_DIRECTION, '#b8947a', 0.05, 0.09);

    // Analytic BackSide additive scattering limbs (seamless exponential falloff from solid horizon)
    const earthAtmoMat = createAtmosphereMaterial('#5f9ce6', SUN_DIRECTION, 1.55, 1.55 * 1.036, 0.56, 5.4);
    const marsAtmoMat = createAtmosphereMaterial('#b8967c', SUN_DIRECTION, 3.55, 3.55 * 1.022, 0.24, 6.2);

    const rand = createSeededRandom(2026);
    const count = 140;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 14;
      pos[i * 3 + 1] = (rand() - 0.5) * 8;
      pos[i * 3 + 2] = (rand() - 0.5) * 12;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const textures = [
      earthDay,
      earthNormal,
      earthSpec,
      earthClouds,
      earthNight,
      moonAlbedo,
      moonBump,
      marsAlbedo,
      marsBump,
    ];
    const materials = [earthMat, cloudsMat, moonMat, marsMat, earthAtmoMat, marsAtmoMat];

    return {
      earthMat,
      cloudsMat,
      moonMat,
      marsMat,
      earthAtmoMat,
      marsAtmoMat,
      dustGeo,
      dispose: () => {
        textures.forEach((t) => t.dispose());
        materials.forEach((m) => m.dispose());
        dustGeo.dispose();
      },
    };
  }, [gl]);

  useEffect(() => {
    return () => {
      planetAssets.dispose();
    };
  }, [planetAssets]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    // Imperceptible documentary timelapse rotation
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.0009;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.0012;
    if (moonRef.current) moonRef.current.rotation.y += delta * 0.00035;
    if (marsRef.current) marsRef.current.rotation.y += delta * 0.00065;

    if (shuttleRef.current && introActive) {
      const cycle = Math.min(1, t / 11);
      shuttleRef.current.position.x = THREE.MathUtils.lerp(-4.8, 1.4, cycle);
      shuttleRef.current.position.y = 0.85;
      shuttleRef.current.position.z = -3.2;
      shuttleRef.current.rotation.z = -0.14;
      shuttleRef.current.rotation.y = 0.4 + t * 0.02;
    }

    if (dustRef.current && entryIntensity > 0.02) {
      const arr = planetAssets.dustGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 2] += delta * (4.2 * entryIntensity);
        if (arr[i + 2] > 6) arr[i + 2] = -6;
      }
      planetAssets.dustGeo.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Earth: NASA Blue Marble, specular ocean glint, satellite cloud layer & additive Rayleigh limb */}
      <group position={[-4.9, 2.25, -6.2]} rotation={[0.22, -1.75, -0.14]}>
        <mesh ref={earthRef} material={planetAssets.earthMat}>
          <sphereGeometry args={[1.55, 72, 54]} />
        </mesh>
        <mesh ref={cloudsRef} material={planetAssets.cloudsMat} scale={1.005}>
          <sphereGeometry args={[1.55, 64, 48]} />
        </mesh>
        <mesh material={planetAssets.earthAtmoMat} scale={1.036}>
          <sphereGeometry args={[1.55, 72, 54]} />
        </mesh>
      </group>

      {/* The Moon: NASA LRO mosaic & LOLA laser altimetry crater relief */}
      <group position={DESTINATIONS.moon.hubPosition} rotation={[0.08, -1.42, 0.04]}>
        <mesh
          ref={moonRef}
          material={planetAssets.moonMat}
          onClick={(e) => {
            e.stopPropagation();
            onSelectDestination('moon');
          }}
        >
          <sphereGeometry args={[0.48, 64, 48]} />
        </mesh>
      </group>

      {/* Mars: NASA Viking/MGS global geology & ultra-thin additive dusty atmospheric limb */}
      <group position={DESTINATIONS.mars.hubPosition} rotation={[0.14, -1.35, 0.08]}>
        <mesh
          ref={marsRef}
          material={planetAssets.marsMat}
          onClick={(e) => {
            e.stopPropagation();
            onSelectDestination('mars');
          }}
        >
          <sphereGeometry args={[3.55, 96, 64]} />
        </mesh>
        <mesh material={planetAssets.marsAtmoMat} scale={1.022}>
          <sphereGeometry args={[3.55, 96, 64]} />
        </mesh>
      </group>

      {/* Deep-space probe silhouette pass during cinematic intro only */}
      <group ref={shuttleRef} visible={introActive}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.09, 0.04, 18]} />
          <meshStandardMaterial color="#cfd6e0" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, -0.04]}>
          <cylinderGeometry args={[0.025, 0.025, 0.06, 8]} />
          <meshStandardMaterial color="#c89a48" metalness={0.85} roughness={0.28} />
        </mesh>
        <mesh position={[0.11, 0, -0.04]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.004, 0.004, 0.22, 6]} />
          <meshStandardMaterial color="#96a0ae" metalness={0.7} roughness={0.4} />
        </mesh>
      </group>

      {/* Atmospheric entry dust streaks during destination transition */}
      {entryIntensity > 0.02 && (
        <points ref={dustRef} geometry={planetAssets.dustGeo}>
          <pointsMaterial
            color="#c7a08a"
            size={0.024}
            transparent
            opacity={Math.min(0.4, entryIntensity * 0.4)}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}
