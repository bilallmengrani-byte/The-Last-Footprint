import * as THREE from 'three';

export interface CelestialStar {
  name: string;
  constellation: string;
  raHours: number; // Right Ascension in decimal hours (0..24)
  decDeg: number; // Declination in degrees (-90..+90)
  mag: number; // Apparent visual magnitude
  colorHex: string; // Spectral blackbody approximation
}

// Accurate J2000 equatorial coordinates for prominent real stars
export const BRIGHT_STARS: CelestialStar[] = [
  // Taurus (Pioneer 10 general heading toward Aldebaran)
  { name: 'Aldebaran', constellation: 'Taurus', raHours: 4.5987, decDeg: 16.509, mag: 0.86, colorHex: '#ffbe82' },
  { name: 'Elnath', constellation: 'Taurus', raHours: 5.4382, decDeg: 28.607, mag: 1.65, colorHex: '#cfe0ff' },
  { name: 'Alcyone (Pleiades)', constellation: 'Taurus', raHours: 3.7914, decDeg: 24.105, mag: 2.87, colorHex: '#b8d3ff' },
  { name: 'Zeta Tauri', constellation: 'Taurus', raHours: 5.6274, decDeg: 21.142, mag: 3.0, colorHex: '#bdd6ff' },
  { name: 'Theta2 Tauri', constellation: 'Taurus', raHours: 4.4777, decDeg: 15.871, mag: 3.4, colorHex: '#eef3ff' },
  { name: 'Gamma Tauri', constellation: 'Taurus', raHours: 4.3299, decDeg: 15.627, mag: 3.65, colorHex: '#ffdca8' },

  // Orion
  { name: 'Rigel', constellation: 'Orion', raHours: 5.2423, decDeg: -8.202, mag: 0.13, colorHex: '#bfd9ff' },
  { name: 'Betelgeuse', constellation: 'Orion', raHours: 5.9195, decDeg: 7.407, mag: 0.5, colorHex: '#ffb076' },
  { name: 'Bellatrix', constellation: 'Orion', raHours: 5.4189, decDeg: 6.35, mag: 1.64, colorHex: '#c6deff' },
  { name: 'Alnilam', constellation: 'Orion', raHours: 5.6036, decDeg: -1.202, mag: 1.69, colorHex: '#c2dcff' },
  { name: 'Alnitak', constellation: 'Orion', raHours: 5.6793, decDeg: -1.943, mag: 1.77, colorHex: '#c0daff' },
  { name: 'Mintaka', constellation: 'Orion', raHours: 5.5334, decDeg: -0.299, mag: 2.23, colorHex: '#c2dcff' },
  { name: 'Saiph', constellation: 'Orion', raHours: 5.7959, decDeg: -9.67, mag: 2.09, colorHex: '#c4dcff' },

  // Canis Major & Minor / Auriga / Gemini
  { name: 'Sirius', constellation: 'Canis Major', raHours: 6.7525, decDeg: -16.716, mag: -1.46, colorHex: '#dceaff' },
  { name: 'Adhara', constellation: 'Canis Major', raHours: 6.9771, decDeg: -28.972, mag: 1.5, colorHex: '#c2dbff' },
  { name: 'Procyon', constellation: 'Canis Minor', raHours: 7.655, decDeg: 5.225, mag: 0.34, colorHex: '#fff5e4' },
  { name: 'Capella', constellation: 'Auriga', raHours: 5.2782, decDeg: 45.998, mag: 0.08, colorHex: '#ffe8b8' },
  { name: 'Pollux', constellation: 'Gemini', raHours: 7.7553, decDeg: 28.026, mag: 1.14, colorHex: '#ffd2a1' },
  { name: 'Castor', constellation: 'Gemini', raHours: 7.5767, decDeg: 31.888, mag: 1.58, colorHex: '#eef4ff' },

  // Northern Hemisphere / Summer Triangle / Polaris
  { name: 'Polaris', constellation: 'Ursa Minor', raHours: 2.5303, decDeg: 89.264, mag: 1.98, colorHex: '#fff3d6' },
  { name: 'Vega', constellation: 'Lyra', raHours: 18.6156, decDeg: 38.784, mag: 0.03, colorHex: '#d8e7ff' },
  { name: 'Deneb', constellation: 'Cygnus', raHours: 20.6905, decDeg: 45.28, mag: 1.25, colorHex: '#e2ecff' },
  { name: 'Altair', constellation: 'Aquila', raHours: 19.8464, decDeg: 8.868, mag: 0.76, colorHex: '#edf2ff' },
  { name: 'Arcturus', constellation: 'Bootes', raHours: 14.261, decDeg: 19.182, mag: -0.05, colorHex: '#ffc88e' },
  { name: 'Spica', constellation: 'Virgo', raHours: 13.4199, decDeg: -11.161, mag: 0.97, colorHex: '#c3dcff' },
  { name: 'Regulus', constellation: 'Leo', raHours: 10.1395, decDeg: 11.967, mag: 1.35, colorHex: '#d2e4ff' },

  // Ursa Major
  { name: 'Dubhe', constellation: 'Ursa Major', raHours: 11.0621, decDeg: 61.751, mag: 1.79, colorHex: '#ffdba8' },
  { name: 'Merak', constellation: 'Ursa Major', raHours: 11.0307, decDeg: 56.382, mag: 2.37, colorHex: '#e8f0ff' },
  { name: 'Alioth', constellation: 'Ursa Major', raHours: 12.9005, decDeg: 55.96, mag: 1.77, colorHex: '#e8f0ff' },
  { name: 'Alkaid', constellation: 'Ursa Major', raHours: 13.7923, decDeg: 49.313, mag: 1.86, colorHex: '#c6dfff' },

  // Cassiopeia
  { name: 'Schedar', constellation: 'Cassiopeia', raHours: 0.6751, decDeg: 56.537, mag: 2.24, colorHex: '#ffd4a0' },
  { name: 'Caph', constellation: 'Cassiopeia', raHours: 0.1529, decDeg: 59.15, mag: 2.28, colorHex: '#fff3dd' },
  { name: 'Gamma Cas', constellation: 'Cassiopeia', raHours: 0.9451, decDeg: 60.717, mag: 2.47, colorHex: '#c4ddff' },

  // Southern Sky
  { name: 'Canopus', constellation: 'Carina', raHours: 6.3992, decDeg: -52.696, mag: -0.74, colorHex: '#fff8ec' },
  { name: 'Alpha Centauri', constellation: 'Centaurus', raHours: 14.6601, decDeg: -60.834, mag: -0.27, colorHex: '#fff0cc' },
  { name: 'Achernar', constellation: 'Eridanus', raHours: 1.6286, decDeg: -57.237, mag: 0.46, colorHex: '#c4dcff' },
  { name: 'Fomalhaut', constellation: 'Piscis Austrinus', raHours: 22.9608, decDeg: -29.622, mag: 1.16, colorHex: '#e6efff' },
  { name: 'Antares', constellation: 'Scorpius', raHours: 16.4901, decDeg: -26.432, mag: 0.96, colorHex: '#ffa870' },
  { name: 'Shaula', constellation: 'Scorpius', raHours: 17.5601, decDeg: -37.104, mag: 1.62, colorHex: '#c2daff' },
];

export const CONSTELLATION_SEGMENTS: Array<[string, string]> = [
  // Taurus / Hyades V + horns (Aldebaran reference for Pioneer 10)
  ['Aldebaran', 'Theta2 Tauri'],
  ['Theta2 Tauri', 'Gamma Tauri'],
  ['Aldebaran', 'Zeta Tauri'],
  ['Gamma Tauri', 'Elnath'],
  // Orion
  ['Betelgeuse', 'Bellatrix'],
  ['Bellatrix', 'Mintaka'],
  ['Mintaka', 'Alnilam'],
  ['Alnilam', 'Alnitak'],
  ['Alnitak', 'Saiph'],
  ['Saiph', 'Rigel'],
  ['Rigel', 'Mintaka'],
  ['Betelgeuse', 'Alnitak'],
  // Summer Triangle
  ['Vega', 'Deneb'],
  ['Deneb', 'Altair'],
  ['Altair', 'Vega'],
];

/**
 * Converts J2000 Right Ascension (hours) and Declination (degrees) to a 3D unit vector.
 * Rotated so Orion / Taurus sit gracefully in the forward-left celestial hemisphere
 * visible from the Hub camera.
 */
export function equatorialToVector3(
  raHours: number,
  decDeg: number,
  radius = 1,
): THREE.Vector3 {
  const raRad = ((raHours * 15) * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;

  // Standard celestial Cartesian: X=vernal equinox, Z=north celestial pole
  const cx = Math.cos(decRad) * Math.cos(raRad);
  const cy = Math.sin(decRad);
  const cz = -Math.cos(decRad) * Math.sin(raRad);

  // Tilt slightly by Earth's obliquity + framing rotation so Taurus/Orion frame deep space view
  const v = new THREE.Vector3(cx, cy, cz);
  v.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.42);
  v.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.28);
  return v.multiplyScalar(radius);
}

/**
 * Deterministic pseudo-random generator for reproducible starfields across sessions.
 */
export function createSeededRandom(seed = 19690720) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
