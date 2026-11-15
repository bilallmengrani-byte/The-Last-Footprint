import * as THREE from 'three';
import { createSeededRandom } from './celestialData';

export interface EarthTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  cloudsMap: THREE.CanvasTexture;
  nightMap: THREE.CanvasTexture;
  dispose: () => void;
}

export interface PlanetaryTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function hash2(ix: number, iy: number, seed: number): number {
  const n = Math.sin(ix * 127.1 + iy * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function noise2(px: number, py: number, seed: number): number {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const fx = px - ix;
  const fy = py - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, seed: number, octaves = 5): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise2(x * freq, y * freq, seed + i * 17);
    freq *= 2.03;
    amp *= 0.5;
  }
  return val;
}

function ridgedFbm(x: number, y: number, seed: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    const n = noise2(x * freq, y * freq, seed + i * 23);
    val += amp * (1.0 - Math.abs(n * 2.0 - 1.0));
    freq *= 2.1;
    amp *= 0.5;
  }
  return val;
}

/**
 * Elliptical landmass mask helper in lon/lat degrees to approximate recognizable Earth continents
 * modulated by fractal coastlines.
 */
function continentField(lonDeg: number, latDeg: number, warpX: number, warpY: number): number {
  const lon = lonDeg + warpX * 14;
  const lat = latDeg + warpY * 10;

  const lobe = (cx: number, cy: number, rx: number, ry: number, rot = 0) => {
    const dx = lon - cx;
    const dy = lat - cy;
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const u = (dx * c + dy * s) / rx;
    const v = (-dx * s + dy * c) / ry;
    return Math.max(0, 1 - (u * u + v * v));
  };

  let land = 0;
  // North America
  land = Math.max(land, lobe(-102, 46, 26, 18, -0.3));
  land = Math.max(land, lobe(-92, 23, 10, 9, -0.4));
  // Greenland
  land = Math.max(land, lobe(-42, 72, 12, 8, 0.2));
  // South America
  land = Math.max(land, lobe(-60, -14, 16, 22, 0.22));
  // Africa
  land = Math.max(land, lobe(18, 12, 24, 18, -0.1));
  land = Math.max(land, lobe(24, -14, 14, 18, 0.05));
  // Europe
  land = Math.max(land, lobe(15, 50, 20, 11, 0.1));
  // Eurasia / Asia
  land = Math.max(land, lobe(72, 54, 42, 17, 0.05));
  land = Math.max(land, lobe(98, 34, 28, 16, -0.15));
  land = Math.max(land, lobe(78, 20, 10, 10, 0));
  // Australia
  land = Math.max(land, lobe(134, -25, 16, 11, -0.1));
  // Antarctica
  if (lat < -68) {
    land = Math.max(land, Math.min(1, (-68 - lat) / 14));
  }
  return land;
}

/**
 * Generates NASA Blue Marble-inspired 2048x1024 Earth albedo, roughness (ocean sunglint),
 * bump, cloud deck, and night-side city-lights maps.
 */
export function createEarthTextures(): EarthTextureSet {
  const width = 1024;
  const height = 512;

  const albedoCanvas = makeCanvas(width, height);
  const bumpCanvas = makeCanvas(width, height);
  const roughCanvas = makeCanvas(width, height);
  const cloudCanvas = makeCanvas(width, height);
  const nightCanvas = makeCanvas(width, height);

  const aCtx = albedoCanvas.getContext('2d')!;
  const bCtx = bumpCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;
  const cCtx = cloudCanvas.getContext('2d')!;
  const nCtx = nightCanvas.getContext('2d')!;

  const aImg = aCtx.createImageData(width, height);
  const bImg = bCtx.createImageData(width, height);
  const rImg = rCtx.createImageData(width, height);
  const cImg = cCtx.createImageData(width, height);
  const nImg = nCtx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const latDeg = (0.5 - v) * 180;
    const latRad = (latDeg * Math.PI) / 180;
    const cosLat = Math.cos(latRad);
    const absLat = Math.abs(latDeg);

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const lonDeg = u * 360 - 180;
      const lonRad = (lonDeg * Math.PI) / 180;

      // Seamless 3D sample coords on sphere
      const sx = Math.cos(lonRad) * cosLat * 3.0 + 5.0;
      const sy = Math.sin(lonRad) * cosLat * 3.0 + 5.0;
      const sz = Math.sin(latRad) * 3.0 + 5.0;

      const warpX = fbm(sx * 1.4, sy * 1.4 + sz, 19, 4) - 0.5;
      const warpY = fbm(sx * 1.4 + 3.2, sy * 1.4 - sz, 37, 4) - 0.5;
      const micro = fbm(sx * 6.5, sy * 6.5 + sz * 3.1, 71, 4);
      const ridge = ridgedFbm(sx * 4.2, sy * 4.2 - sz * 2.1, 103, 4);

      const contMask = continentField(lonDeg, latDeg, warpX, warpY);
      const coastThreshold = 0.22 + (micro - 0.5) * 0.22;
      const isLand = contMask > coastThreshold;
      const polarIce = absLat > 74 - micro * 8;

      const idx = (y * width + x) * 4;
      let r = 4;
      let g = 14;
      let b = 32;
      let bump = 20;
      let rough = 48; // glossy ocean for orbital sunglint
      let city = 0;

      if (polarIce) {
        r = 212 + micro * 22;
        g = 220 + micro * 20;
        b = 228 + micro * 16;
        bump = 165;
        rough = 210;
      } else if (isLand) {
        const elev = Math.min(1, (contMask - coastThreshold) * 1.6 + ridge * 0.48);
        // Subtropical desert belt (Sahara, Arabia, Outback, SW US)
        const desertBelt = Math.exp(-Math.pow((absLat - 24) / 13, 2));
        const aridity = desertBelt * (0.55 + micro * 0.45);
        const snowPeak = elev > 0.78 || (absLat > 58 && elev > 0.55);

        if (snowPeak) {
          r = 205;
          g = 210;
          b = 216;
        } else if (aridity > 0.44) {
          r = 128 + micro * 40;
          g = 104 + micro * 28;
          b = 76 + micro * 16;
        } else {
          // Deep orbital forest olive / temperate slate-green
          r = 28 + micro * 26 + elev * 22;
          g = 52 + micro * 28 + elev * 14;
          b = 28 + micro * 14 + elev * 10;
        }
        bump = 115 + elev * 135;
        rough = 228; // matte land

        // Subtle urban light clusters near coastlines & mid-latitudes
        if (absLat < 58 && elev < 0.48) {
          const urbanNoise = fbm(sx * 11.5, sy * 11.5 + sz * 5.2, 409, 3);
          const coastProximity = Math.max(0, 1 - (contMask - coastThreshold) * 5.0);
          if (urbanNoise > 0.64 && (coastProximity > 0.25 || urbanNoise > 0.72)) {
            city = Math.min(255, (urbanNoise - 0.62) * 680);
          }
        }
      } else {
        // Real space photo oceans: ultra-deep navy with delicate turquoise coastal shelves
        const shelf = Math.max(0, 1 - (coastThreshold - contMask) * 9.0);
        r = 3 + shelf * 14;
        g = 12 + shelf * 38;
        b = 30 + shelf * 46;
        bump = 18;
        rough = 42;
      }

      aImg.data[idx] = Math.min(255, r);
      aImg.data[idx + 1] = Math.min(255, g);
      aImg.data[idx + 2] = Math.min(255, b);
      aImg.data[idx + 3] = 255;

      bImg.data[idx] = bump;
      bImg.data[idx + 1] = bump;
      bImg.data[idx + 2] = bump;
      bImg.data[idx + 3] = 255;

      rImg.data[idx] = rough;
      rImg.data[idx + 1] = rough;
      rImg.data[idx + 2] = rough;
      rImg.data[idx + 3] = 255;

      nImg.data[idx] = city;
      nImg.data[idx + 1] = city * 0.76;
      nImg.data[idx + 2] = city * 0.42;
      nImg.data[idx + 3] = 255;

      // Cloud system with trade-wind zonal shear & cyclonic wisps
      const shearU = sx + Math.sin(latRad * 4.5) * 0.7;
      const c1 = fbm(shearU * 2.2, sy * 2.2 + sz * 1.4, 301, 5);
      const c2 = ridgedFbm(shearU * 4.8 + 4.1, sy * 4.8 - sz * 2.3, 317, 4);
      const cloudDensity = c1 * 0.72 + c2 * 0.28;
      const cloudAlpha = Math.max(0, Math.min(255, (cloudDensity - 0.52) * 580));

      cImg.data[idx] = 236;
      cImg.data[idx + 1] = 240;
      cImg.data[idx + 2] = 245;
      cImg.data[idx + 3] = cloudAlpha;
    }
  }

  aCtx.putImageData(aImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);
  cCtx.putImageData(cImg, 0, 0);
  nCtx.putImageData(nImg, 0, 0);

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = THREE.RepeatWrapping;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;

  const cloudsMap = new THREE.CanvasTexture(cloudCanvas);
  cloudsMap.colorSpace = THREE.SRGBColorSpace;
  cloudsMap.wrapS = THREE.RepeatWrapping;

  const nightMap = new THREE.CanvasTexture(nightCanvas);
  nightMap.colorSpace = THREE.SRGBColorSpace;
  nightMap.wrapS = THREE.RepeatWrapping;

  return {
    map,
    bumpMap,
    roughnessMap,
    cloudsMap,
    nightMap,
    dispose: () => {
      map.dispose();
      bumpMap.dispose();
      roughnessMap.dispose();
      cloudsMap.dispose();
      nightMap.dispose();
    },
  };
}

/**
 * Generates LRO-inspired 2048x1024 Moon surface albedo & sharp terraced crater bump map.
 */
export function createMoonTextures(): PlanetaryTextureSet {
  const width = 1024;
  const height = 512;
  const albedoCanvas = makeCanvas(width, height);
  const bumpCanvas = makeCanvas(width, height);
  const aCtx = albedoCanvas.getContext('2d')!;
  const bCtx = bumpCanvas.getContext('2d')!;

  const aImg = aCtx.createImageData(width, height);
  const bImg = bCtx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const lat = (v - 0.5) * Math.PI;
    const cosLat = Math.cos(lat);
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const lon = u * Math.PI * 2;
      const sx = Math.cos(lon) * cosLat * 2.6 + 2.0;
      const sy = Math.sin(lon) * cosLat * 2.6 + 2.0;
      const sz = Math.sin(lat) * 2.6 + 2.0;

      const mariaMacro = fbm(sx * 0.9, sy * 0.9 + sz * 0.6, 42, 4);
      const regolithMicro = fbm(sx * 7.5, sy * 7.5 + sz * 3.4, 91, 5);
      const grit = ridgedFbm(sx * 14.0, sy * 14.0 - sz * 5.0, 143, 3);

      // Stark LRO-style contrast between dark basaltic maria & bright cratered highlands
      const isMaria = mariaMacro < 0.47;
      const baseAlbedo = isMaria
        ? 56 + regolithMicro * 24 + grit * 8
        : 118 + regolithMicro * 46 + grit * 14;

      const idx = (y * width + x) * 4;
      aImg.data[idx] = baseAlbedo;
      aImg.data[idx + 1] = baseAlbedo * 0.99;
      aImg.data[idx + 2] = baseAlbedo * 0.96;
      aImg.data[idx + 3] = 255;

      const hVal = Math.min(
        255,
        Math.max(0, (isMaria ? 85 : 138) + regolithMicro * 60 + grit * 36),
      );
      bImg.data[idx] = hVal;
      bImg.data[idx + 1] = hVal;
      bImg.data[idx + 2] = hVal;
      bImg.data[idx + 3] = 255;
    }
  }

  aCtx.putImageData(aImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  // Stamp multi-scale craters + Tycho/Copernicus ejecta ray bursts
  const rand = createSeededRandom(19690720);
  for (let i = 0; i < 420; i++) {
    const cx = rand() * width;
    const cy = 28 + rand() * (height - 56);
    const radius = i < 14 ? 22 + rand() * 32 : 2 + rand() * 14;

    // Bright ejecta rays on select major craters
    if (i < 6) {
      aCtx.save();
      aCtx.translate(cx, cy);
      for (let r = 0; r < 14; r++) {
        aCtx.rotate((Math.PI * 2) / 14 + (rand() - 0.5) * 0.25);
        const rayLen = radius * (2.6 + rand() * 2.5);
        const rayGrad = aCtx.createLinearGradient(0, 0, rayLen, 0);
        rayGrad.addColorStop(0, 'rgba(210, 210, 212, 0.32)');
        rayGrad.addColorStop(1, 'rgba(210, 210, 212, 0)');
        aCtx.strokeStyle = rayGrad;
        aCtx.lineWidth = 1.2 + rand() * 2.0;
        aCtx.beginPath();
        aCtx.moveTo(radius * 0.7, 0);
        aCtx.lineTo(rayLen, 0);
        aCtx.stroke();
      }
      aCtx.restore();
    }

    const gradA = aCtx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius);
    gradA.addColorStop(0, 'rgba(42, 43, 46, 0.34)');
    gradA.addColorStop(0.75, 'rgba(85, 86, 90, 0.14)');
    gradA.addColorStop(0.91, 'rgba(205, 205, 206, 0.32)');
    gradA.addColorStop(1, 'rgba(128, 128, 128, 0)');
    aCtx.fillStyle = gradA;
    aCtx.beginPath();
    aCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    aCtx.fill();

    const gradB = bCtx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius);
    gradB.addColorStop(0, 'rgba(12, 12, 12, 0.68)');
    gradB.addColorStop(0.84, 'rgba(248, 248, 248, 0.58)');
    gradB.addColorStop(1, 'rgba(128, 128, 128, 0)');
    bCtx.fillStyle = gradB;
    bCtx.beginPath();
    bCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    bCtx.fill();
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = THREE.RepeatWrapping;

  return {
    map,
    bumpMap,
    dispose: () => {
      map.dispose();
      bumpMap.dispose();
    },
  };
}

/**
 * Generates Viking / MRO-inspired 2048x1024 Mars albedo & canyon/crater elevation bump map.
 */
export function createMarsTextures(): PlanetaryTextureSet {
  const width = 1024;
  const height = 512;
  const albedoCanvas = makeCanvas(width, height);
  const bumpCanvas = makeCanvas(width, height);
  const aCtx = albedoCanvas.getContext('2d')!;
  const bCtx = bumpCanvas.getContext('2d')!;

  const aImg = aCtx.createImageData(width, height);
  const bImg = bCtx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const lat = (v - 0.5) * Math.PI;
    const cosLat = Math.cos(lat);
    const absV = Math.abs(v - 0.5) * 2;

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const lon = u * Math.PI * 2;
      const sx = Math.cos(lon) * cosLat * 2.8 + 3.0;
      const sy = Math.sin(lon) * cosLat * 2.8 + 3.0;
      const sz = Math.sin(lat) * 2.8 + 3.0;

      const albedoProvince = fbm(sx * 1.1, sy * 1.1 + sz * 0.5, 2004, 5);
      const ridge = ridgedFbm(sx * 5.2, sy * 5.2 + sz * 2.4, 2018, 4);
      const fineDust = fbm(sx * 12.0, sy * 12.0 - sz * 4.0, 2021, 3);

      // Valles Marineris tectonic canyon gash
      const canyonWarp = Math.sin(u * 28.0) * 0.015;
      const canyonMask =
        Math.exp(-Math.pow((v - (0.53 + canyonWarp)) * 32, 2)) *
        Math.exp(-Math.pow((u - 0.47) * 7.5, 2));

      // Dark basaltic Syrtis-style albedo patches vs dusty iron-oxide highlands
      const darkBasalt = albedoProvince < 0.45 ? (0.45 - albedoProvince) * 2.6 : 0;

      // Polar CO2/water ice caps with spiral wind-etched troughs
      const spiral = Math.sin(lon * 4.0 + absV * 24.0) * 0.025;
      const polarCap = absV > 0.905 - fineDust * 0.045 + spiral;

      let r = 134 + albedoProvince * 42 + ridge * 18 - darkBasalt * 52 - canyonMask * 44;
      let g = 74 + albedoProvince * 26 + ridge * 12 - darkBasalt * 28 - canyonMask * 25;
      let b = 50 + albedoProvince * 16 + ridge * 8 - darkBasalt * 14 - canyonMask * 14;
      let hVal = 118 + albedoProvince * 52 + ridge * 55 - canyonMask * 105;

      if (polarCap) {
        r = 218;
        g = 212;
        b = 208;
        hVal = 205;
      }

      const idx = (y * width + x) * 4;
      aImg.data[idx] = Math.min(255, Math.max(0, r));
      aImg.data[idx + 1] = Math.min(255, Math.max(0, g));
      aImg.data[idx + 2] = Math.min(255, Math.max(0, b));
      aImg.data[idx + 3] = 255;

      bImg.data[idx] = Math.min(255, Math.max(0, hVal));
      bImg.data[idx + 1] = Math.min(255, Math.max(0, hVal));
      bImg.data[idx + 2] = Math.min(255, Math.max(0, hVal));
      bImg.data[idx + 3] = 255;
    }
  }

  aCtx.putImageData(aImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  // Stamp realistic Martian craters & Hellas/Gale-style impact rims
  const rand = createSeededRandom(202401);
  for (let i = 0; i < 240; i++) {
    const px = i === 0 ? width * 0.54 : rand() * width;
    const py = i === 0 ? height * 0.44 : 40 + rand() * (height - 80);
    const radius = i === 0 ? 74 : i < 12 ? 18 + rand() * 28 : 3 + rand() * 14;

    const gradA = aCtx.createRadialGradient(px, py, radius * 0.15, px, py, radius);
    gradA.addColorStop(0, 'rgba(62, 34, 26, 0.34)');
    gradA.addColorStop(0.76, 'rgba(110, 62, 46, 0.1)');
    gradA.addColorStop(0.9, 'rgba(176, 108, 82, 0.25)');
    gradA.addColorStop(1, 'rgba(130, 70, 45, 0)');
    aCtx.fillStyle = gradA;
    aCtx.beginPath();
    aCtx.arc(px, py, radius, 0, Math.PI * 2);
    aCtx.fill();

    const gradB = bCtx.createRadialGradient(px, py, radius * 0.15, px, py, radius);
    gradB.addColorStop(0, 'rgba(16, 16, 16, 0.62)');
    gradB.addColorStop(0.87, 'rgba(240, 240, 240, 0.52)');
    gradB.addColorStop(1, 'rgba(128, 128, 128, 0)');
    bCtx.fillStyle = gradB;
    bCtx.beginPath();
    bCtx.arc(px, py, radius, 0, Math.PI * 2);
    bCtx.fill();
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = THREE.RepeatWrapping;

  return {
    map,
    bumpMap,
    dispose: () => {
      map.dispose();
      bumpMap.dispose();
    },
  };
}

/**
 * Generates high-frequency local regolith surface textures for Apollo 11, Opportunity, and Ingenuity terrain.
 */
export function createRegolithTextures(mode: 'moon' | 'mars'): PlanetaryTextureSet {
  const size = 512;
  const albedo = makeCanvas(size, size);
  const bump = makeCanvas(size, size);
  const aCtx = albedo.getContext('2d')!;
  const bCtx = bump.getContext('2d')!;
  const aImg = aCtx.createImageData(size, size);
  const bImg = bCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * 8;
      const v = (y / size) * 8;
      const n = fbm(u, v, mode === 'moon' ? 69 : 2004, 4);
      const fine = noise2(u * 12, v * 12, mode === 'moon' ? 71 : 2018);

      const idx = (y * size + x) * 4;
      if (mode === 'moon') {
        const g = 52 + n * 48 + fine * 18;
        aImg.data[idx] = g;
        aImg.data[idx + 1] = g;
        aImg.data[idx + 2] = g * 0.98;
      } else {
        aImg.data[idx] = 104 + n * 54 + fine * 18;
        aImg.data[idx + 1] = 56 + n * 28 + fine * 10;
        aImg.data[idx + 2] = 38 + n * 18 + fine * 8;
      }
      aImg.data[idx + 3] = 255;

      const h = Math.min(255, Math.max(0, 75 + n * 120 + fine * 45));
      bImg.data[idx] = h;
      bImg.data[idx + 1] = h;
      bImg.data[idx + 2] = h;
      bImg.data[idx + 3] = 255;
    }
  }

  aCtx.putImageData(aImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(4, 4);

  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(4, 4);

  return {
    map,
    bumpMap,
    dispose: () => {
      map.dispose();
      bumpMap.dispose();
    },
  };
}

/**
 * Generates crinkled amber/gold Kapton MLI foil bump & albedo textures for spacecraft hardware.
 */
export function createKaptonFoilTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  dispose: () => void;
} {
  const size = 256;
  const albedo = makeCanvas(size, size);
  const bump = makeCanvas(size, size);
  const aCtx = albedo.getContext('2d')!;
  const bCtx = bump.getContext('2d')!;
  const rand = createSeededRandom(69);

  aCtx.fillStyle = '#ae7922';
  aCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 640; i++) {
    const x1 = rand() * size;
    const y1 = rand() * size;
    const len = 6 + rand() * 24;
    const ang = rand() * Math.PI * 2;
    const x2 = x1 + Math.cos(ang) * len;
    const y2 = y1 + Math.sin(ang) * len;

    aCtx.strokeStyle = rand() > 0.5 ? 'rgba(244, 198, 92, 0.34)' : 'rgba(98, 56, 12, 0.32)';
    aCtx.lineWidth = 0.8 + rand() * 1.4;
    aCtx.beginPath();
    aCtx.moveTo(x1, y1);
    aCtx.lineTo(x2, y2);
    aCtx.stroke();

    bCtx.strokeStyle = rand() > 0.5 ? 'rgba(242, 242, 242, 0.55)' : 'rgba(22, 22, 22, 0.55)';
    bCtx.lineWidth = 0.9 + rand() * 1.8;
    bCtx.beginPath();
    bCtx.moveTo(x1, y1);
    bCtx.lineTo(x2, y2);
    bCtx.stroke();
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;

  return {
    map,
    bumpMap,
    dispose: () => {
      map.dispose();
      bumpMap.dispose();
    },
  };
}

/**
 * Generates realistic photovoltaic solar cell grid texture for Opportunity & Ingenuity.
 */
export function createSolarPanelTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f1826';
  ctx.fillRect(0, 0, size, size);

  const cols = 8;
  const rows = 12;
  const cw = size / cols;
  const ch = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#152338' : '#111c2e';
      ctx.fillRect(c * cw + 1.5, r * ch + 1.5, cw - 3, ch - 3);
      ctx.strokeStyle = 'rgba(148, 174, 206, 0.25)';
      ctx.lineWidth = 0.75;
      ctx.strokeRect(c * cw + 1.5, r * ch + 1.5, cw - 3, ch - 3);
    }
  }

  // Fine Martian dust settling on cells
  const rand = createSeededRandom(2004);
  for (let i = 0; i < 620; i++) {
    ctx.fillStyle = `rgba(176, 114, 82, ${0.08 + rand() * 0.16})`;
    ctx.fillRect(rand() * size, rand() * size, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
