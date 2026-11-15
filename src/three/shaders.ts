import * as THREE from 'three';

/**
 * Creates a physically-motivated BackSide atmospheric limb ShaderMaterial using additive blending.
 * Uses analytic ray-to-planet-center closest-approach altitude so atmospheric density decays
 * exponentially from the solid horizon into vacuum—view-distance independent, zero thick outlines.
 */
export function createAtmosphereMaterial(
  colorHex: string,
  sunDirection: THREE.Vector3,
  planetRadius: number,
  atmoRadius: number,
  intensity = 0.54,
  falloff = 5.4,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uSunDir: { value: sunDirection.clone().normalize() },
      uPlanetRadius: { value: planetRadius },
      uAtmoRadius: { value: atmoRadius },
      uIntensity: { value: intensity },
      uFalloff: { value: falloff },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vCenterWorld;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vCenterWorld = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uSunDir;
      uniform float uPlanetRadius;
      uniform float uAtmoRadius;
      uniform float uIntensity;
      uniform float uFalloff;
      varying vec3 vWorldPos;
      varying vec3 vCenterWorld;

      void main() {
        vec3 rayDir = normalize(vWorldPos - cameraPosition);
        vec3 toCenter = vCenterWorld - cameraPosition;
        float proj = dot(toCenter, rayDir);
        vec3 closestPoint = cameraPosition + rayDir * proj;
        vec3 radial = closestPoint - vCenterWorld;
        float distToCenter = length(radial);

        // Normalized altitude above solid planet limb (0 at surface horizon, 1 at outer shell)
        float shellThickness = max(0.001, uAtmoRadius - uPlanetRadius);
        float h = clamp((distToCenter - uPlanetRadius) / shellThickness, 0.0, 1.0);

        // Exponential atmospheric scale-height falloff with smooth zero feather at outer edge
        float innerMask = smoothstep(uPlanetRadius * 0.992, uPlanetRadius * 1.001, distToCenter);
        float density = exp(-h * uFalloff) * (1.0 - smoothstep(0.55, 1.0, h)) * innerMask;

        // Limb normal at closest approach & solar illumination across the curved horizon
        vec3 limbNormal = normalize(radial);
        vec3 sunDir = normalize(uSunDir);
        float sunDot = dot(limbNormal, sunDir);
        float sunFacing = smoothstep(-0.22, 0.36, sunDot);

        // Subtle warm twilight refraction near terminator + subtle Mie forward scatter toward sun
        float terminatorBand = exp(-pow((sunDot + 0.02) * 7.0, 2.0));
        float forwardMie = pow(max(dot(rayDir, sunDir), 0.0), 4.0) * 0.28;
        vec3 scatterCol = mix(uColor, uColor * vec3(1.18, 0.84, 0.65), terminatorBand * 0.42);
        scatterCol += uColor * forwardMie;

        float alpha = density * sunFacing * uIntensity;
        gl_FragColor = vec4(scatterCol * (0.75 + 0.38 * sunFacing), clamp(alpha, 0.0, 0.85));
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });
}

/**
 * Deep space sky dome with understated, realistic Milky Way dust lane—no cartoon glow.
 */
export function createSkyDomeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAtmosphereMix: { value: 0.0 },
      uSkyColor: { value: new THREE.Color('#2c1912') },
      uHorizonColor: { value: new THREE.Color('#4c2b1e') },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uAtmosphereMix;
      uniform vec3 uSkyColor;
      uniform vec3 uHorizonColor;
      varying vec3 vDir;

      float hash3(vec3 p) {
        p = fract(p * vec3(443.897, 441.423, 437.195));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
      }

      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float n000 = hash3(i);
        float n100 = hash3(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash3(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash3(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash3(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash3(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash3(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash3(i + vec3(1.0, 1.0, 1.0));
        float nx00 = mix(n000, n100, f.x);
        float nx10 = mix(n010, n110, f.x);
        float nx01 = mix(n001, n101, f.x);
        float nx11 = mix(n011, n111, f.x);
        float nxy0 = mix(nx00, nx10, f.y);
        float nxy1 = mix(nx01, nx11, f.y);
        return mix(nxy0, nxy1, f.z);
      }

      void main() {
        vec3 galNormal = normalize(vec3(0.45, 0.78, -0.43));
        float galLat = abs(dot(vDir, galNormal));
        float band = exp(-galLat * 8.5);

        float dust = noise3(vDir * 6.5) * 0.6 + noise3(vDir * 15.0) * 0.4;
        float rift = smoothstep(0.36, 0.68, dust);

        // True deep photographic space black
        vec3 voidCol = vec3(0.004, 0.006, 0.010);
        vec3 milkyCol = vec3(0.022, 0.027, 0.039) * band * (0.4 + 0.6 * dust);
        vec3 warmCore = vec3(0.025, 0.019, 0.017) * band * smoothstep(0.25, 0.9, vDir.x * 0.5 + 0.5) * 0.45;

        float darkLane = exp(-galLat * 20.0) * rift * 0.55;
        vec3 spaceCol = voidCol + (milkyCol + warmCore) * (1.0 - darkLane);

        // Planetary dusty atmospheric sky dome (horizon band -> darker zenith)
        float elev = clamp(vDir.y, -0.05, 1.0);
        float horizonBlend = pow(1.0 - smoothstep(-0.02, 0.62, elev), 1.6);
        float skyDustWisp = 0.92 + 0.08 * noise3(vDir * 4.2);
        vec3 atmoCol = mix(uSkyColor, uHorizonColor, horizonBlend) * skyDustWisp;

        vec3 finalCol = mix(spaceCol, atmoCol, clamp(uAtmosphereMix, 0.0, 1.0));
        gl_FragColor = vec4(finalCol, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

/**
 * Combined subtle 65mm documentary film grain, optical lens vignette, and atmospheric entry warmth.
 */
export const FilmGrainVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.02 },
    uVignette: { value: 0.42 },
    uEntryIntensity: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uEntryIntensity;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233)) + uTime) * 43758.5453);
    }

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      vec2 centered = vUv - 0.5;
      float dist = length(centered);

      float vig = smoothstep(0.38, 0.90, dist);
      vec3 col = base.rgb * (1.0 - vig * uVignette);

      if (uEntryIntensity > 0.001) {
        vec3 entryTint = vec3(0.76, 0.39, 0.31);
        col += entryTint * smoothstep(0.32, 0.82, dist) * uEntryIntensity * 0.24;
      }

      float n = (rand(vUv * 512.0) - 0.5) * uGrain;
      col += n;

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), base.a);
    }
  `,
};

/**
 * Extends a planetary MeshStandardMaterial with:
 * - Physical ocean vs. continent roughness separation (using NASA water specular mask)
 * - Grazing-angle on-disk atmospheric aerial perspective so the solid horizon merges seamlessly
 *   into the outer additive atmosphere shell
 * - Subtle Rayleigh twilight transition at the terminator
 * - Night-side city lights emerging strictly on the unlit hemisphere (Earth)
 */
export function applyPlanetaryPbrExtension(
  material: THREE.MeshStandardMaterial,
  sunDirection: THREE.Vector3,
  tintHex: string,
  strength = 0.08,
  hazeStrength = 0.24,
  nightMap?: THREE.Texture,
  oceanSpecMap?: THREE.Texture,
): void {
  const tint = new THREE.Color(tintHex);
  const sunDir = sunDirection.clone().normalize();

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTermSunDir = { value: sunDir };
    shader.uniforms.uTermTint = { value: tint };
    shader.uniforms.uTermStrength = { value: strength };
    shader.uniforms.uHazeStrength = { value: hazeStrength };
    shader.uniforms.uHasNight = { value: nightMap ? 1.0 : 0.0 };
    shader.uniforms.uNightMap = { value: nightMap ?? null };
    shader.uniforms.uHasOceanSpec = { value: oceanSpecMap ? 1.0 : 0.0 };
    shader.uniforms.uOceanSpecMap = { value: oceanSpecMap ?? null };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vTermWorldNormal;
         varying vec3 vTermWorldPos;
         varying vec2 vTermUv;`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
         vTermWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
         vTermWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
         vTermUv = uv;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uTermSunDir;
         uniform vec3 uTermTint;
         uniform float uTermStrength;
         uniform float uHazeStrength;
         uniform float uHasNight;
         uniform sampler2D uNightMap;
         uniform float uHasOceanSpec;
         uniform sampler2D uOceanSpecMap;
         varying vec3 vTermWorldNormal;
         varying vec3 vTermWorldPos;
         varying vec2 vTermUv;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         if (uHasOceanSpec > 0.5) {
           float waterMask = texture2D(uOceanSpecMap, vTermUv).g;
           roughnessFactor = mix(0.95, 0.28, smoothstep(0.2, 0.85, waterMask));
         }`,
      )
      .replace(
        '#include <dithering_fragment>',
        `vec3 nW = normalize(vTermWorldNormal);
         vec3 vDir = normalize(cameraPosition - vTermWorldPos);
         float termDot = dot(nW, normalize(uTermSunDir));
         float twilight = exp(-pow((termDot + 0.015) * 8.0, 2.0)) * uTermStrength;
         gl_FragColor.rgb += uTermTint * twilight;

         // Grazing-angle aerial perspective haze on sunlit disk edge (bridges planet to outer limb)
         if (uHazeStrength > 0.001) {
           float ndotv = clamp(dot(vDir, nW), 0.0, 1.0);
           float horizonFresnel = pow(1.0 - ndotv, 4.2);
           float sunLit = smoothstep(-0.18, 0.42, termDot);
           gl_FragColor.rgb += uTermTint * horizonFresnel * sunLit * uHazeStrength;
         }

         if (uHasNight > 0.5) {
           float nightMask = smoothstep(-0.02, -0.24, termDot);
           vec3 cityGlow = texture2D(uNightMap, vTermUv).rgb * nightMask * 0.56;
           gl_FragColor.rgb += cityGlow;
         }
         #include <dithering_fragment>`,
      );
  };
  material.needsUpdate = true;
}
