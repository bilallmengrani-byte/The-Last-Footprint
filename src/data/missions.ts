export type DestinationId = 'moon' | 'mars' | 'deep-space';

export type MissionId =
  | 'apollo-11-descent'
  | 'lunar-roving-vehicle'
  | 'sojourner'
  | 'opportunity'
  | 'ingenuity'
  | 'pioneer-10';

export interface TelemetryMetric {
  label: string;
  value: string;
  verified: boolean;
  sourceNote: string;
}

export interface DirectorChoiceOption {
  id: string;
  label: string;
  outcomeText: string;
  isHistoricalAction: boolean;
}

export interface DirectorDecisionPrompt {
  id: string;
  contextLabel: string;
  prompt: string;
  historicalNote: string;
  options: DirectorChoiceOption[];
}

export type EngineeringSimType =
  | 'eagle-descent'
  | 'lrv-vip-aim'
  | 'sojourner-apxs'
  | 'opportunity-dust'
  | 'ingenuity-flight'
  | 'pioneer-rtg';

export interface EngineeringSimSpec {
  type: EngineeringSimType;
  title: string;
  cameraFeedLabel: string;
  objective: string;
  educationalNote: string;
  chapterHintIndex: number;
}

export interface MissionChapter {
  index: string;
  heading: string;
  subheading: string;
  body: string;
  simTriggerLabel?: string;
  decisionPrompt?: DirectorDecisionPrompt;
}

export interface MissionMilestone {
  date: string;
  title: string;
  detail: string;
}

export interface SpacecraftHotspot {
  id: string;
  label: string;
  position: [number, number, number];
  cameraOffset: [number, number, number];
  summary: string;
  factBasis: 'ARCHIVE RECORD' | 'TO BE VERIFIED';
}

export interface MissionSource {
  title: string;
  organization: string;
  url: string;
}

export interface MissionRecord {
  id: MissionId;
  indexCode: string;
  name: string;
  hardwareType: string;
  cosparId: string;
  agency: string;
  destinationId: DestinationId;
  destinationLabel: string;
  siteName: string;
  coordinatesLabel: string;
  launchDate: string;
  arrivalOrLandingDate: string;
  endOfOperationsDate: string;
  statusLabel: string;
  finalStateSummary: string;
  signalTargetNormalized: number;
  signalBandLabel: string;
  signalBandVerified: boolean;
  telemetry: TelemetryMetric[];
  chapters: MissionChapter[];
  timeline: MissionMilestone[];
  hotspots: SpacecraftHotspot[];
  engineeringSim: EngineeringSimSpec;
  authenticVisualNote: {
    caption: string;
    credit: string;
    archiveId: string;
    sourceUrl: string;
  };
  reflectionStatement: string;
  sources: MissionSource[];
}

export interface DestinationConfig {
  id: DestinationId;
  code: string;
  name: string;
  contextLabel: string;
  description: string;
  hubPosition: [number, number, number];
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
  entryProfile: 'lunar-descent' | 'martian-entry' | 'interstellar-drift';
  missionIds: MissionId[];
}

export const TO_BE_VERIFIED = 'TO BE VERIFIED';

export const DESTINATIONS: Record<DestinationId, DestinationConfig> = {
  moon: {
    id: 'moon',
    code: 'DEST-01',
    name: 'The Moon',
    contextLabel: 'Mare Tranquillitatis & Hadley-Apennine',
    description:
      'Where crewed lunar exploration left landing platforms, electric rovers, and bootprints preserved in airless regolith.',
    hubPosition: [-2.35, 1.85, -4.4],
    cameraTarget: [-2.35, 1.85, -4.4],
    cameraPosition: [-1.45, 2.15, -2.55],
    entryProfile: 'lunar-descent',
    missionIds: ['apollo-11-descent', 'lunar-roving-vehicle'],
  },
  mars: {
    id: 'mars',
    code: 'DEST-02',
    name: 'Mars',
    contextLabel: 'Ares Vallis, Meridiani Planum & Jezero Crater',
    description:
      'A cold desert world holding the first planetary microrover, long-lived solar explorers, and the first powered rotorcraft beyond Earth.',
    hubPosition: [3.2, -1.55, 0.25],
    cameraTarget: [3.2, -1.55, 0.25],
    cameraPosition: [1.15, -0.55, 4.4],
    entryProfile: 'martian-entry',
    missionIds: ['sojourner', 'opportunity', 'ingenuity'],
  },
  'deep-space': {
    id: 'deep-space',
    code: 'DEST-03',
    name: 'Deep Space',
    contextLabel: 'Outer Solar System · Toward Taurus',
    description:
      'Beyond planetary orbits, early outer-planet emissaries coast silently on escape trajectories into interstellar space.',
    hubPosition: [-5.8, -1.8, -8.5],
    cameraTarget: [-5.8, -1.8, -8.5],
    cameraPosition: [-3.9, -1.2, -5.1],
    entryProfile: 'interstellar-drift',
    missionIds: ['pioneer-10'],
  },
};

export const MISSIONS: Record<MissionId, MissionRecord> = {
  'apollo-11-descent': {
    id: 'apollo-11-descent',
    indexCode: '01',
    name: 'Apollo 11 Lunar Module Eagle — Descent Stage',
    hardwareType: 'Crewed Lunar Lander Descent Stage',
    cosparId: '1969-059C',
    agency: 'NASA',
    destinationId: 'moon',
    destinationLabel: 'The Moon',
    siteName: 'Tranquility Base (Mare Tranquillitatis)',
    coordinatesLabel: '0.67408° N, 23.47297° E',
    launchDate: 'July 16, 1969 · 13:32:00 UTC',
    arrivalOrLandingDate: 'July 20, 1969 · 20:17:40 UTC',
    endOfOperationsDate: 'July 21, 1969 · 17:54:00 UTC (Ascent Stage Liftoff)',
    statusLabel: 'STATIONARY SURFACE ARTIFACT',
    finalStateSummary:
      'Only the octagonal descent stage of Eagle remains upright on Mare Tranquillitatis. The ascent stage carried Neil Armstrong and Buzz Aldrin back to lunar orbit to dock with Command Module Columbia.',
    signalTargetNormalized: 0.20,
    signalBandLabel: '2282.5 MHz · Unified S-Band (Historical)',
    signalBandVerified: false,
    telemetry: [
      {
        label: 'NSSDCA ID',
        value: '1969-059C',
        verified: true,
        sourceNote: 'NSSDCA Master Catalog',
      },
      {
        label: 'Surface Stay',
        value: '21h 36m 20s',
        verified: true,
        sourceNote: 'NASA Apollo 11 Mission Log',
      },
      {
        label: 'Descent Dry Mass',
        value: TO_BE_VERIFIED,
        verified: false,
        sourceNote: 'Pending exact NSSDCA mass sheet check',
      },
      {
        label: 'Current State',
        value: 'Intact Descent Platform',
        verified: true,
        sourceNote: 'NASA LRO Orbital Imagery',
      },
    ],
    chapters: [
      {
        index: 'I',
        heading: 'The Call',
        subheading: 'Humanity’s first landing attempt on another world',
        body: 'In July 1969, Apollo 11 set out to land two astronauts on the lunar surface and return them safely to Earth. Rather than landing a single unified rocket, NASA split the Lunar Module into two halves: an upper ascent cabin and a lower descent platform engineered to stay behind forever.',
      },
      {
        index: 'II',
        heading: 'The Journey',
        subheading: 'Descent over boulder-strewn Mare Tranquillitatis',
        body: 'Separating from Command Module Columbia in lunar orbit, Neil Armstrong and Buzz Aldrin fired the descent engine toward the Sea of Tranquility. Passing computer overload alarms and a rocky crater field, Armstrong piloted Eagle manually to a level patch of mare basalt with seconds of hover propellant remaining.',
        simTriggerLabel: 'Open LM Cockpit · Pilot Final Descent Over West Crater',
        decisionPrompt: {
          id: 'eagle-1202-alarm',
          contextLabel: 'Powered Descent · 1202 Program Alarm',
          prompt:
            'During powered descent, the Apollo Guidance Computer flashes a 1202 Executive Overflow alarm caused by an unscheduled rendezvous radar cycle. What do you advise Mission Control?',
          historicalNote:
            'Flight Controller Steve Bales and Margaret Hamilton’s priority-scheduling architecture gave a "GO": non-essential radar tasks were dropped automatically so landing guidance never stopped.',
          options: [
            {
              id: 'abort',
              label: 'Order immediate abort and fire ascent stage',
              outcomeText:
                'An abort would have saved the crew but ended the first landing attempt. Because the 1202 executive scheduler restarted priority tasks safely, Mission Control actually called "GO" to continue.',
              isHistoricalAction: false,
            },
            {
              id: 'continue-go',
              label: 'Call "GO" and trust priority scheduling unless continuous',
              outcomeText:
                'Matched NASA Mission Control. Guidance computer software shed low-priority radar interrupts and kept flying Eagle toward Mare Tranquillitatis.',
              isHistoricalAction: true,
            },
            {
              id: 'cutoff-radar',
              label: 'Shut down all landing radar telemetry immediately',
              outcomeText:
                'Turning off the landing radar would blind the computer to altitude and sink rate. Instead, NASA trusted priority scheduling while leaving landing radar active.',
              isHistoricalAction: false,
            },
          ],
        },
      },
      {
        index: 'III',
        heading: 'The Machine',
        subheading: 'An octagonal launchpad wrapped in gold Kapton',
        body: 'Built around an aluminum-alloy octagonal frame, the descent stage housed four propellant tanks, a throttleable descent engine, landing radar, four folding landing legs with wide footpads, and a ladder mounted down the forward strut. Layers of amber Kapton thermal foil shielded the structure from extreme lunar sunlight.',
      },
      {
        index: 'IV',
        heading: 'The Discoveries',
        subheading: 'First surface samples and laser-ranging precision',
        body: 'During their extravehicular excursion near Eagle, Armstrong and Aldrin collected lunar basalt samples and deployed the Early Apollo Scientific Experiments Package, including a passive seismometer and a laser retroreflector array that still enables millimeter-scale Earth–Moon distance measurements.',
      },
      {
        index: 'V',
        heading: 'The Silence',
        subheading: 'Left behind as a firing platform in vacuum',
        body: 'On July 21, 1969 at 17:54:00 UTC, explosive bolts severed the structural connections and the ascent engine ignited directly atop the descent stage’s blast deflector. The upper cabin climbed back to Columbia, leaving the lower stage silent—its U.S. flag and plaque commemorating humanity’s arrival.',
      },
      {
        index: 'VI',
        heading: 'The Legacy',
        subheading: 'A preserved benchmark for all future landings',
        body: 'Decades later, NASA’s Lunar Reconnaissance Orbiter photographed the Eagle descent stage still casting a sharp shadow across Tranquility Base. It stands not as discarded wreckage, but as the permanent foundation of humanity’s first step onto another celestial body.',
      },
    ],
    timeline: [
      {
        date: '1969-07-16',
        title: 'Saturn V Launch',
        detail: 'Launched from Kennedy Space Center Launch Complex 39A.',
      },
      {
        date: '1969-07-20',
        title: 'Tranquility Base Touchdown',
        detail: 'Eagle descent stage settles onto Mare Tranquillitatis at 20:17:40 UTC.',
      },
      {
        date: '1969-07-21',
        title: 'Ascent Stage Separation',
        detail: 'Upper cabin lifts off at 17:54:00 UTC; descent stage remains on the Moon.',
      },
      {
        date: '2009–2012',
        title: 'LRO Orbital Verification',
        detail: 'Lunar Reconnaissance Orbiter resolves the descent stage and astronaut foot-tracks.',
      },
    ],
    hotspots: [
      {
        id: 'kapton-thermal-blanket',
        label: 'Octagonal Kapton Hull',
        position: [0.95, 0.55, 0.95],
        cameraOffset: [2.4, 1.3, 2.4],
        summary:
          'Multi-layer aluminized Kapton insulation wrapped the descent bays to regulate propellant temperatures between harsh lunar day and shadow.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'descent-engine-bell',
        label: 'Throttleable Descent Nozzle',
        position: [0, -0.35, 0],
        cameraOffset: [1.8, -0.3, 2.2],
        summary:
          'The Lunar Module Descent Engine could throttle smoothly to hover and select a safe touchdown site above Mare Tranquillitatis.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'landing-gear-ladder',
        label: 'Forward Footpad & Ladder',
        position: [0, -0.1, 1.45],
        cameraOffset: [1.5, 0.4, 3.1],
        summary:
          'Honeycomb crushable struts absorbed touchdown energy. The forward strut carried the nine-rung ladder used for the first human steps on the Moon.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'interstage-deck',
        label: 'Upper Blast Deflector Deck',
        position: [0, 0.92, 0],
        cameraOffset: [1.9, 1.9, 1.9],
        summary:
          'Served as the launch pad for the Eagle ascent stage on July 21, 1969, bearing thermal scorching from the ascent engine plume.',
        factBasis: 'ARCHIVE RECORD',
      },
    ],
    engineeringSim: {
      type: 'eagle-descent',
      title: 'LM-5 Lunar Descent & 1202 Alarm Console',
      cameraFeedLabel: 'LM FORWARD WINDOW LPD · MARE TRANQUILLITATIS',
      objective:
        'Acknowledge the 1202 Executive Overflow alarm, pitch past the West Crater boulder field, and settle Eagle below 1.2 m/s sink rate before hover fuel runs out.',
      educationalNote:
        'Teaches why Apollo split landing and ascent stages and how priority-scheduled guidance software plus manual hover left the octagonal descent base on the Moon.',
      chapterHintIndex: 1,
    },
    authenticVisualNote: {
      caption:
        'Apollo 11 Lunar Module Eagle descent stage and surface equipment photographed on Mare Tranquillitatis (July 1969); orbital confirmation captured decades later by LRO.',
      credit: 'NASA / Apollo 11 & Lunar Reconnaissance Orbiter Archive',
      archiveId: 'AS11-40-5903 / NSSDCA 1969-059C',
      sourceUrl: 'https://science.nasa.gov/mission/apollo-11/',
    },
    reflectionStatement:
      'Only half of Eagle returned. The platform that stayed behind still marks the exact threshold where humanity ceased to be bound to a single world.',
    sources: [
      {
        title: 'NSSDCA Record: Apollo 11 Lunar Module / EASEP (1969-059C)',
        organization: 'NASA Space Science Data Coordinated Archive',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C',
      },
      {
        title: 'Apollo 11 Mission Overview & Surface Photography',
        organization: 'NASA Science',
        url: 'https://science.nasa.gov/mission/apollo-11/',
      },
      {
        title: 'Apollo 11 Landing Site — Lunar Reconnaissance Orbiter',
        organization: 'NASA Earth Observatory',
        url: 'https://earthobservatory.nasa.gov/images/40986/apollo-11-landing-site',
      },
    ],
  },

  'lunar-roving-vehicle': {
    id: 'lunar-roving-vehicle',
    indexCode: '02',
    name: 'Apollo 15 Lunar Roving Vehicle (LRV-1)',
    hardwareType: 'Manned Electric Lunar Roving Vehicle',
    cosparId: '1971-063C',
    agency: 'NASA / Boeing / Delco',
    destinationId: 'moon',
    destinationLabel: 'The Moon',
    siteName: 'Hadley-Apennine (Mare Imbrium)',
    coordinatesLabel: '26.132° N, 3.633° E (VIP Parking Site)',
    launchDate: 'July 26, 1971 · 13:34:00 UTC',
    arrivalOrLandingDate: 'July 30, 1971 · 22:16:29 UTC',
    endOfOperationsDate: 'August 2, 1971 · 17:11:22 UTC (Ascent Liftoff Broadcast)',
    statusLabel: 'PERMANENTLY PARKED SURFACE ARTIFACT',
    finalStateSummary:
      'Parked ~100 meters east of Apollo 15 Lunar Module Falcon at the VIP site, LRV-1 was positioned so its ground-controlled color TV camera could track and broadcast Falcon\'s ascent stage liftoff to Earth. It remains permanently parked on the lunar regolith.',
    signalTargetNormalized: 0.34,
    signalBandLabel: '2272.5 MHz · LCRU S-Band Color TV & Telemetry Link',
    signalBandVerified: true,
    telemetry: [
      {
        label: 'NSSDCA ID',
        value: '1971-063C',
        verified: true,
        sourceNote: 'NSSDCA Master Catalog',
      },
      {
        label: 'Total Traverse',
        value: '27.8 km (17.3 mi)',
        verified: true,
        sourceNote: 'NASA LRV Operations Handbook',
      },
      {
        label: 'Vehicle Mass',
        value: '210 kg (Earth) / 35 kg (Moon)',
        verified: true,
        sourceNote: 'Boeing Systems Engineering Spec',
      },
      {
        label: 'Power Storage',
        value: 'Two 36V Silver-Zinc (121 Ah ea.)',
        verified: true,
        sourceNote: 'NASA Apollo 15 Technical Package',
      },
    ],
    chapters: [
      {
        index: 'I',
        heading: 'The Call',
        subheading: 'Extending human exploration across lunar wilderness',
        body: 'On early Apollo landings, astronauts walked no further than a few hundred meters from their lander. To explore Hadley Rille and the towering Apennine mountains, NASA contracted Boeing and Delco to build a collapsible, open-chassis electric rover capable of carrying two astronauts and hundreds of kilograms of lunar samples.',
      },
      {
        index: 'II',
        heading: 'The Journey',
        subheading: 'Folded inside the descent stage quad bay',
        body: 'Engineered with a three-part hinged frame, the Lunar Roving Vehicle was folded like origami into Quadrant 1 of Lunar Module Falcon. On July 31, 1971, astronauts David Scott and James Irwin deployed reels and cloth tapes, allowing the rover to unfold automatically and lock its wheels onto Mare Imbrium regolith.',
      },
      {
        index: 'III',
        heading: 'The Machine',
        subheading: 'Woven wire wheels and four independent motors',
        body: 'The LRV discarded rubber tires for open woven zinc-coated steel mesh with titanium chevrons for traction in powdery soil. Each wheel housed an independent 0.25-horsepower DC motor with an 80:1 harmonic drive. Between the nylon-webbing seats, a single T-shaped hand controller governed drive, steering, and braking without foot pedals.',
        decisionPrompt: {
          id: 'lrv-front-steering',
          contextLabel: 'EVA-1 Deployment · Front Steering Fault',
          prompt:
            'Right after unfolding LRV-1 onto Mare Imbrium, front-wheel steering fails to respond while rear-wheel steering remains operational. What operational fix do you execute?',
          historicalNote:
            'Because the LRV used separate front and rear steering motors, Dave Scott switched off the front steering bus and drove EVA-1 entirely on rear-wheel Ackermann steering—before cycling the circuit breakers restored dual steering for EVA-2.',
          options: [
            {
              id: 'rear-only',
              label: 'Drive EVA-1 on rear-wheel steering alone',
              outcomeText:
                'Matched Apollo 15 crew action. Dual redundant steering buses allowed Scott and Irwin to complete the entire 10.3 km Hadley Rille drive with rear-only steering.',
              isHistoricalAction: true,
            },
            {
              id: 'abandon-rover',
              label: 'Park LRV-1 immediately and revert to walking traverses',
              outcomeText:
                'Abandoning the rover would have cut off Hadley Rille and the Apennine Front. The LRV was engineered with independent steering subsystems precisely for this fault.',
              isHistoricalAction: false,
            },
            {
              id: 'drain-battery',
              label: 'Bypass the 36V battery bus directly to front wheel motors',
              outcomeText:
                'Wheel traction motors were separate from the steering motor; jumping the drive bus would not steer the wheels. Rear steering redundancy solved the anomaly safely.',
              isHistoricalAction: false,
            },
          ],
        },
      },
      {
        index: 'IV',
        heading: 'The Discoveries',
        subheading: 'Hadley Rille, Spur Crater, and the Genesis Rock',
        body: 'Over three EVAs, Scott and Irwin drove 27.8 kilometers, reaching up to 5 kilometers from Falcon and peering into the 300-meter chasm of Hadley Rille. At Spur Crater, they collected Sample 15415—the "Genesis Rock", an anorthosite crust fragment dating back over 4 billion years to the Moon\'s primordial crust.',
      },
      {
        index: 'V',
        heading: 'The Silence',
        subheading: 'Left at the VIP site to film Falcon’s return to orbit',
        body: 'At the conclusion of EVA-3 on August 2, 1971, Dave Scott drove LRV-1 about 100 meters east of the lander to the designated "VIP site". He aligned the high-gain dish with Earth so controller Ed Fendell in Houston could tilt the RCA color television camera upward to capture Falcon\'s ascent stage blasting into the lunar sky.',
        simTriggerLabel: 'Open LRV Console · Park at VIP Site & Aim Ascent TV Camera',
      },
      {
        index: 'VI',
        heading: 'The Legacy',
        subheading: 'Three electric buggies resting under the stars',
        body: 'Apollo 15 was followed by rovers on Apollo 16 and 17. All three vehicles remain undisturbed in the lunar vacuum. With its tracks still sharp in the dust, LRV-1 proved that human mobility could turn a single landing footprint into a planetary expedition.',
      },
    ],
    timeline: [
      {
        date: '1971-07-26',
        title: 'Saturn V Launch',
        detail: 'Apollo 15 launches from Kennedy Space Center Launch Complex 39A with LRV-1 stowed in LM Quad 1.',
      },
      {
        date: '1971-07-30',
        title: 'Touchdown at Hadley',
        detail: 'Lunar Module Falcon lands in Mare Imbrium at the foot of the Apennine Mountains.',
      },
      {
        date: '1971-07-31',
        title: 'Deployment & First Drive',
        detail: 'Astronauts Scott and Irwin deploy LRV-1 and embark on a 10.3 km traverse to Hadley Rille.',
      },
      {
        date: '1971-08-01',
        title: 'Discovery of Genesis Rock',
        detail: '12.5 km traverse along Apennine Front yields primordial 4.1-billion-year-old anorthosite rock.',
      },
      {
        date: '1971-08-02',
        title: 'Ascent Liftoff Broadcast',
        detail: 'Parked 100m east at VIP site; ground-controlled TV camera broadcasts LM ascent liftoff to Earth.',
      },
    ],
    hotspots: [
      {
        id: 'lrv-mesh-wheels',
        label: 'Woven Steel Mesh Wheels',
        position: [0.65, -0.05, 0.55],
        cameraOffset: [1.8, 0.5, 1.8],
        summary:
          '81.8 cm diameter spun-aluminum wheels with zinc-coated steel wire mesh and titanium chevrons for traction in airless powdery lunar regolith.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'lrv-dish-antenna',
        label: 'High-Gain S-Band Dish',
        position: [0.0, 0.72, 0.78],
        cameraOffset: [1.2, 1.2, 2.1],
        summary:
          '0.9-meter umbrella-like mesh parabolic dish manually aimed at Earth to transmit real-time color television, voice, and biometric telemetry.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'lrv-hand-controller',
        label: 'T-Handle Drive Joystick',
        position: [0.0, 0.28, 0.05],
        cameraOffset: [0.9, 0.8, 0.9],
        summary:
          'A single central joystick controlled four independent wheel motors and front/rear steering, operable by astronauts in pressurized space suits.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'lrv-tv-camera',
        label: 'Ground-Controlled TV Unit',
        position: [0.32, 0.42, 0.82],
        cameraOffset: [1.1, 0.8, 1.8],
        summary:
          'RCA color camera remotely operated from Mission Control in Houston; tracked and broadcast the historic Apollo 15 ascent liftoff.',
        factBasis: 'ARCHIVE RECORD',
      },
    ],
    engineeringSim: {
      type: 'lrv-vip-aim',
      title: 'LRV-1 VIP Parking & LCRU Dish Alignment',
      cameraFeedLabel: 'RCA GCTA TELEVISION VIEWFINDER · HADLEY-APENNINE',
      objective:
        'Steer LRV-1 via T-handle to the 100 m safe standoff VIP zone, align the 0.9 m S-Band umbrella dish onto Earth, and frame LM Falcon for ascent liftoff.',
      educationalNote:
        'Demonstrates LRV-1’s T-handle drive, manual S-Band dish aiming, and why all three Apollo lunar rovers remain parked roughly 100 meters from their landers.',
      chapterHintIndex: 4,
    },
    authenticVisualNote: {
      caption:
        'Apollo 15 Lunar Roving Vehicle parked in Hadley-Apennine near the edge of Hadley Rille, photographed by Commander David Scott (August 1971).',
      credit: 'NASA / Apollo 15 Archive / NSSDC',
      archiveId: 'AS15-88-11901 / NSSDCA 1971-063C',
      sourceUrl: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C',
    },
    reflectionStatement:
      'Parked permanently in the silent dust of Hadley-Apennine, LRV-1 stands as testament that human curiosity once drove open electric vehicles beneath the black sky of another world.',
    sources: [
      {
        title: 'NSSDCA Record: Apollo 15 Lunar Module / ALSEP / LRV (1971-063C)',
        organization: 'NASA Space Science Data Coordinated Archive',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C',
      },
      {
        title: 'The Apollo Lunar Roving Vehicle Documentation',
        organization: 'NASA Goddard Space Flight Center',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html',
      },
      {
        title: 'Apollo 15 Mission Overview & Lunar Surface Journal',
        organization: 'NASA History Division',
        url: 'https://history.nasa.gov/alsj/a15/a15.html',
      },
    ],
  },

  sojourner: {
    id: 'sojourner',
    indexCode: '03',
    name: 'Sojourner Rover (Mars Pathfinder)',
    hardwareType: 'First Planetary Robotic Microrover',
    cosparId: '1996-068A',
    agency: 'NASA / JPL',
    destinationId: 'mars',
    destinationLabel: 'Mars',
    siteName: 'Carl Sagan Memorial Station (Ares Vallis)',
    coordinatesLabel: '19.33° N, 33.55° W',
    launchDate: 'December 4, 1996 · 06:58:00 UTC',
    arrivalOrLandingDate: 'July 4, 1997 · 16:56:55 UTC (Airbag Touchdown; Rolled to surface July 6)',
    endOfOperationsDate: 'September 27, 1997 · 10:23 UTC (Last Transmission Received)',
    statusLabel: 'PERMANENTLY PARKED SURFACE ARTIFACT',
    finalStateSummary:
      'Delivered to Mars inside the airbag-cushioned Mars Pathfinder lander (named Carl Sagan Memorial Station), Sojourner became the first wheeled vehicle to drive on another planet. Designed for 7 sols, it operated for 83 sols before lander communications ceased on September 27, 1997. It rests permanently in Ares Vallis.',
    signalTargetNormalized: 0.48,
    signalBandLabel: '459.7 MHz · Rover-to-Lander UHF Radio Modem Link',
    signalBandVerified: true,
    telemetry: [
      {
        label: 'NSSDCA ID',
        value: '1996-068A / MESURPR',
        verified: true,
        sourceNote: 'NSSDCA Master Catalog',
      },
      {
        label: 'Surface Lifespan',
        value: '83 Sols (Designed for 7 Sols)',
        verified: true,
        sourceNote: 'NASA JPL Flight Report',
      },
      {
        label: 'Total Distance',
        value: '~100 meters',
        verified: true,
        sourceNote: 'NASA Science Pathfinder Summary',
      },
      {
        label: 'Rover Mass',
        value: '10.6 kg (23.4 lbs)',
        verified: true,
        sourceNote: 'NSSDCA Engineering Spec',
      },
    ],
    chapters: [
      {
        index: 'I',
        heading: 'The Call',
        subheading: 'Proving mobile planetary robotics for twenty-five million dollars',
        body: 'In the mid-1990s, NASA\'s "faster, better, cheaper" Discovery initiative sought to prove that robotic surface exploration could be accomplished at a fraction of Viking-era budgets. The centerpiece of Mars Pathfinder was a 10.6-kilogram microrover named Sojourner, named in honor of abolitionist and activist Sojourner Truth.',
      },
      {
        index: 'II',
        heading: 'The Journey',
        subheading: 'Direct atmospheric hyperbola and bouncing airbags',
        body: 'Launched aboard a Delta II rocket on December 4, 1996, Pathfinder skipped Mars orbital insertion entirely, plunging directly into the Martian atmosphere at 7.3 km/s on July 4, 1997. Encased in a 5.2-meter cluster of 24 airbags, it slammed into Ares Vallis at 18 m/s, bounced at least 15 times over 12-meter arcs, and came to rest on an ancient catastrophic outflow channel.',
      },
      {
        index: 'III',
        heading: 'The Machine',
        subheading: 'Rocker-Bogie mobility and an eight-bit Intel brain',
        body: 'Just 65 cm long and 28 cm tall, Sojourner introduced the Rocker-Bogie suspension: six independently driven cleated aluminum wheels on a differential pivot, allowing it to climb over obstacles larger than its wheels without tipping. Powered by 0.2 square meters of gallium arsenide solar cells generating 16 watts, its brain was an 8-bit Intel 80C85 processor executing 100,000 instructions per second.',
      },
      {
        index: 'IV',
        heading: 'The Discoveries',
        subheading: 'Sniffing rocks named Barnacle Bill, Yogi, and Casper',
        body: 'On July 6, 1997, Sojourner rolled down deployment ramps onto the Martian gravel. Guided by laser hazard stripers and ground commands, it drove to rocks nicknamed Barnacle Bill and Yogi, deploying its Alpha Proton X-Ray Spectrometer (APXS) directly against their weathered crusts. It discovered silica-rich andesitic rocks, proving Ares Vallis had experienced complex geological crustal evolution.',
        simTriggerLabel: 'Open Surface Cam · Navigate Ares Vallis & Deploy APXS Arm',
        decisionPrompt: {
          id: 'sojourner-apxs-approach',
          contextLabel: 'Sol 4 · Rear-Mounted APXS Placement',
          prompt:
            'Sojourner must place its rear-mounted APXS spectrometer flush against the jagged rock "Barnacle Bill" with an 8-bit computer and several-minute Earth light delay. How do you command the approach?',
          historicalNote:
            'Because the APXS sat on Sojourner’s tail and light-time prevented live joysticking, JPL engineers turned the rover 180°, backed slowly until a rear wheel climbed slightly or contact switches triggered, and took multi-hour spectrometer readings.',
          options: [
            {
              id: 'reverse-contact',
              label: 'Rotate 180° and back slowly using onboard laser & contact sensors',
              outcomeText:
                'Matched JPL rover operations. Turning tail-first let Sojourner’s autonomous hazard sensors press the APXS collimator cleanly against Barnacle Bill.',
              isHistoricalAction: true,
            },
            {
              id: 'live-joystick',
              label: 'Drive forward and joystick the arm in real time from Pasadena',
              outcomeText:
                'Round-trip radio light time to Mars took 20+ minutes and the APXS was rear-mounted. Live joysticking would risk colliding with boulders before telemetry arrived.',
              isHistoricalAction: false,
            },
            {
              id: 'skip-contact',
              label: 'Analyze rock composition remotely from 2 meters away',
              outcomeText:
                'Alpha-particle and X-ray spectroscopy required direct millimeter-scale contact against the rock surface—making physical navigation essential.',
              isHistoricalAction: false,
            },
          ],
        },
      },
      {
        index: 'V',
        heading: 'The Silence',
        subheading: 'Eighty-three sols until the Sagan Station grew cold',
        body: 'Built for a nominal primary mission of just seven sols, Sojourner operated twelve times longer than planned. On September 27, 1997, after 83 sols and over 100 meters traversed, Pathfinder transmitted its final data packet. When the lander\'s depleted battery failed through frigid Martian nights, Sojourner followed its autonomous programmed fallback—circling the lander in quiet standby.',
      },
      {
        index: 'VI',
        heading: 'The Legacy',
        subheading: 'The ancestor of every rover on Mars',
        body: 'Sojourner transformed planetary exploration from stationary landings to mobile field science. The Rocker-Bogie chassis, hazard navigation, and solar operations pioneered by this microwave-sized rover directly became the engineering template for Spirit, Opportunity, Curiosity, and Perseverance.',
      },
    ],
    timeline: [
      {
        date: '1996-12-04',
        title: 'Delta II Launch',
        detail: 'Mars Pathfinder launches from Cape Canaveral Air Station carrying Sojourner in stowed configuration.',
      },
      {
        date: '1997-07-04',
        title: 'Airbag Touchdown',
        detail: 'Direct atmospheric entry and airbag bounces across Ares Vallis at 16:56:55 UTC.',
      },
      {
        date: '1997-07-06',
        title: 'Deployment onto Mars',
        detail: 'Sojourner rolls down the deployment ramp onto Martian soil at 05:40 UTC.',
      },
      {
        date: '1997-07-10',
        title: 'Barnacle Bill Analysis',
        detail: 'First APXS chemical analysis of a Martian rock confirms volcanic andesitic composition.',
      },
      {
        date: '1997-09-27',
        title: 'Final Data Transmission',
        detail: 'Last successful communication received via Carl Sagan Memorial Station on Sol 83.',
      },
    ],
    hotspots: [
      {
        id: 'sojourner-rocker-bogie',
        label: 'Rocker-Bogie 6-Wheel Chassis',
        position: [0.38, 0.02, 0.22],
        cameraOffset: [1.4, 0.6, 1.4],
        summary:
          'Six cleated aluminum wheels on a differential pivot suspension; the mechanical architecture that set the standard for every subsequent Mars rover.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'sojourner-solar-deck',
        label: 'Gallium Arsenide Solar Deck',
        position: [0.0, 0.26, 0.0],
        cameraOffset: [0.8, 1.0, 1.2],
        summary:
          '0.2 m² solar array generating ~16W of midday power, backed by non-rechargeable lithium thionyl chloride D-cells.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'sojourner-apxs',
        label: 'Alpha Proton X-Ray Spectrometer',
        position: [0.0, 0.08, -0.42],
        cameraOffset: [0.9, 0.6, -1.3],
        summary:
          'Curium-244 alpha-particle sensor on a rear robotic arm; determined the chemical composition of Martian rocks Barnacle Bill and Yogi.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'sojourner-uhf-antenna',
        label: 'UHF Whip Antenna & 8-Bit CPU',
        position: [0.22, 0.48, -0.22],
        cameraOffset: [1.1, 0.9, 0.8],
        summary:
          'Silver whip antenna communicating at 459.7 MHz with the Sagan Memorial Station lander, managed by an 8-bit Intel 80C85 processor.',
        factBasis: 'ARCHIVE RECORD',
      },
    ],
    engineeringSim: {
      type: 'sojourner-apxs',
      title: 'IMP Surface Camera & APXS Rock Approach',
      cameraFeedLabel: 'IMAGER FOR MARS PATHFINDER · ARES VALLIS LASER GRID',
      objective:
        'Steer the 6-wheel Rocker-Bogie chassis around Ares Vallis boulders using laser hazard lines, align rear-first at Barnacle Bill, and deploy the APXS sensor.',
      educationalNote:
        'Explains Sojourner’s Rocker-Bogie suspension, 16 W solar deck, laser-stripe obstacle detection, and rear-mounted APXS chemistry readings.',
      chapterHintIndex: 3,
    },
    authenticVisualNote: {
      caption:
        'Sojourner rover investigating the volcanic rock Yogi in Ares Vallis, photographed by the Imager for Mars Pathfinder (IMP) on Sagan Memorial Station (July 1997).',
      credit: 'NASA / JPL-Caltech / Mars Pathfinder Team',
      archiveId: 'PIA01122 / NSSDCA MESURPR',
      sourceUrl: 'https://science.nasa.gov/mission/mars-pathfinder/',
    },
    reflectionStatement:
      'The size of a toy, Sojourner was the vanguard of an entire robotic species. It sleeps in the reddish dust of Ares Vallis where human mobility on Mars began.',
    sources: [
      {
        title: 'NASA Science: Mars Pathfinder Mission',
        organization: 'NASA Science Mission Directorate',
        url: 'https://science.nasa.gov/mission/mars-pathfinder/',
      },
      {
        title: 'NSSDCA Record: Mars Pathfinder Rover (MESURPR)',
        organization: 'NASA Space Science Data Coordinated Archive',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=MESURPR',
      },
      {
        title: 'JPL Mars Pathfinder Flight Status & Rover Traverse Maps',
        organization: 'NASA Jet Propulsion Laboratory',
        url: 'https://mars.nasa.gov/MPF/',
      },
    ],
  },

  opportunity: {
    id: 'opportunity',
    indexCode: '04',
    name: 'Opportunity (MER-B)',
    hardwareType: 'Solar-Powered Mars Exploration Rover',
    cosparId: '2003-032A',
    agency: 'NASA / JPL',
    destinationId: 'mars',
    destinationLabel: 'Mars',
    siteName: 'Perseverance Valley, Endeavour Crater Rim (Meridiani Planum)',
    coordinatesLabel: '1.9462° S, 354.4734° E (Landing Site)',
    launchDate: 'July 7, 2003 · 03:18:15 UTC',
    arrivalOrLandingDate: 'January 25, 2004 · 05:05 UTC',
    endOfOperationsDate: 'Final signal: June 10, 2018 (Sol 5111) · Declared complete: February 13, 2019',
    statusLabel: 'SILENT ON MARS SURFACE',
    finalStateSummary:
      'Powered down after a planet-encircling dust storm in June 2018 blocked sunlight to its solar arrays. Remains stationary in Perseverance Valley on the western rim of Endeavour Crater.',
    signalTargetNormalized: 0.51,
    signalBandLabel: 'X-Band High-Gain & UHF Relay',
    signalBandVerified: true,
    telemetry: [
      {
        label: 'NSSDCA ID',
        value: '2003-032A',
        verified: true,
        sourceNote: 'NSSDCA Master Catalog',
      },
      {
        label: 'Design vs. Actual',
        value: '90 Sols -> 5,111 Sols',
        verified: true,
        sourceNote: 'NASA/JPL MER-B Final Report',
      },
      {
        label: 'Odometer Distance',
        value: '45.16 km',
        verified: true,
        sourceNote: 'NASA Mars Exploration Program',
      },
      {
        label: 'Final Contact',
        value: 'June 10, 2018',
        verified: true,
        sourceNote: 'NASA JPL Mission Archive',
      },
    ],
    chapters: [
      {
        index: 'I',
        heading: 'The Call',
        subheading: 'Following the chemical fingerprints of ancient water',
        body: 'In the early 2000s, orbital spectrometers detected gray crystalline hematite across Meridiani Planum—a mineral that typically forms in liquid water. NASA dispatched twin robotic field geologists, Spirit and Opportunity, with a modest 90-sol prime mission to read the rocks of Mars.',
      },
      {
        index: 'II',
        heading: 'The Journey',
        subheading: 'Airbag bounce into Eagle Crater',
        body: 'After a seven-month cruise, Opportunity plunged into the thin Martian atmosphere in January 2004, shedding heat behind an aeroshell before inflating protective airbags and rolling directly into a small impact depression later named Eagle Crater—revealing exposed layered bedrock meters from its landing spot.',
      },
      {
        index: 'III',
        heading: 'The Machine',
        subheading: 'Six-wheeled solar geologist with a panoramic mast',
        body: 'Opportunity carried deployable solar wing arrays, a high-gain dish antenna, a rocker-bogie six-wheel suspension built for rocky slopes, a Pancam stereo mast, and a robotic arm housing spectrometers and a Rock Abrasion Tool to grind beneath weathered dust rinds.',
      },
      {
        index: 'IV',
        heading: 'The Discoveries',
        subheading: 'Blueberries, cross-bedding, and 45 kilometers of proof',
        body: 'Within weeks, Opportunity discovered millimeter-scale hematite spherules ("blueberries") and sedimentary ripples formed by flowing ancient water. Over nearly 15 Earth years and 45.16 kilometers, it traversed Victoria and Endeavour craters, uncovering clay minerals indicating neutral, habitable ancient environments.',
      },
      {
        index: 'V',
        heading: 'The Silence',
        subheading: 'Swallowed by the 2018 global dust storm',
        body: 'In late May 2018, a colossal dust storm grew to encircle the entire planet, darkening skies above Perseverance Valley until sunlight could no longer recharge Opportunity’s batteries. Its final transmission arrived on June 10, 2018 (Sol 5111). After more than 1,000 recovery commands went unanswered, NASA concluded the mission on February 13, 2019.',
        simTriggerLabel: 'Open Pancam Console · Survive Dust Opacity on Sol 5111',
        decisionPrompt: {
          id: 'opp-dust-hibernation',
          contextLabel: 'Sol 5111 · Global Dust Storm Tau > 10',
          prompt:
            'Atmospheric dust opacity over Perseverance Valley climbs past tau 10, cutting solar array output below survival levels. How do you configure Opportunity’s systems?',
          historicalNote:
            'JPL engineers suspended driving and science instruments, placing Opportunity into a low-power fault mode where the mission clock slept until enough sunlight returned to recharge batteries—sending a final status ping on June 10, 2018.',
          options: [
            {
              id: 'deep-fault-sleep',
              label: 'Shed science loads and enter low-power fault hibernation',
              outcomeText:
                'Matched JPL flight protocol. Cutting arm, camera, and wheel heaters conserved remaining watt-hours so Opportunity could survive weeks of darkness if the sky cleared in time.',
              isHistoricalAction: true,
            },
            {
              id: 'drive-ridge',
              label: 'Drive uphill out of Perseverance Valley during the storm',
              outcomeText:
                'Driving in near-total darkness drains batteries immediately without guaranteeing clearer skies—leaving the rover stranded mid-slope without power for survival heaters.',
              isHistoricalAction: false,
            },
            {
              id: 'keep-mast-heaters',
              label: 'Keep full mast camera heaters running continuously',
              outcomeText:
                'Continuous heater load exhausts batteries completely within a single sol, risking irreversible cold damage to main avionics.',
              isHistoricalAction: false,
            },
          ],
        },
      },
      {
        index: 'VI',
        heading: 'The Legacy',
        subheading: 'Proving Mars was once a wet world',
        body: 'Designed for three months, Opportunity worked for nearly 15 years—setting an off-world driving record of 45.16 kilometers and transforming Mars from a static desert mystery into a documented planetary history of ancient water.',
      },
    ],
    timeline: [
      {
        date: '2003-07-07',
        title: 'Delta II Launch',
        detail: 'Departed Cape Canaveral toward Mars.',
      },
      {
        date: '2004-01-25',
        title: 'Hole-in-One at Eagle Crater',
        detail: 'Bounced to a halt inside a small crater exposing layered sedimentary rock.',
      },
      {
        date: '2011-08-09',
        title: 'Arrival at Endeavour Crater',
        detail: 'Reached the 22-km-wide crater rim after a multi-year trek across Meridiani Planum.',
      },
      {
        date: '2018-06-10',
        title: 'Final Transmission (Sol 5111)',
        detail: 'Global dust storm cuts solar power; last telemetry received by Deep Space Network.',
      },
      {
        date: '2019-02-13',
        title: 'Mission Declared Complete',
        detail: 'NASA concludes recovery attempts after 45.16 km driven.',
      },
    ],
    hotspots: [
      {
        id: 'solar-wings',
        label: 'Deployable Solar Array Deck',
        position: [0, 0.42, -0.15],
        cameraOffset: [2.1, 1.7, 1.9],
        summary:
          'Triple-junction solar wings generated electrical power for 5,111 sols, repeatedly cleaned by Martian wind gusts until the 2018 global storm.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'pancam-mast',
        label: 'Pancam Stereo Mast',
        position: [0.22, 1.25, 0.42],
        cameraOffset: [1.6, 1.6, 2.2],
        summary:
          'Elevated 1.5 meters above the surface, the Panoramic Camera captured Opportunity’s final 360-degree panorama of Perseverance Valley.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'rocker-bogie-wheels',
        label: 'Rocker-Bogie Six-Wheel Mobility',
        position: [-0.72, -0.35, 0.35],
        cameraOffset: [-2.2, 0.6, 2.0],
        summary:
          'Articulated suspension kept all six aluminum cleated wheels in contact across 45.16 km of Martian dunes and crater rims.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'instrument-arm',
        label: 'IDD Robotic Instrument Arm',
        position: [0.05, 0.2, 0.98],
        cameraOffset: [1.5, 0.8, 2.5],
        summary:
          'Carried the Microscopic Imager, Mossbauer and Alpha Particle X-Ray spectrometers, and the Rock Abrasion Tool.',
        factBasis: 'ARCHIVE RECORD',
      },
    ],
    engineeringSim: {
      type: 'opportunity-dust',
      title: 'Pancam Horizon & Sol 5111 Power Survival',
      cameraFeedLabel: 'PANCAM STEREO MAST · PERSEVERANCE VALLEY (TAU > 10)',
      objective:
        'Shed non-essential instrument draws, trim array tilt toward scattered zenith light, and transmit Opportunity’s final DSN telemetry frame before battery depletion.',
      educationalNote:
        'Teaches Opportunity’s solar-wing dependence, how Martian wind cleaning enabled 5,111 sols of exploration, and why the 2018 global storm ended operations.',
      chapterHintIndex: 4,
    },
    authenticVisualNote: {
      caption:
        'Opportunity’s final 360-degree panorama from Perseverance Valley, captured May–June 2018 just before the global dust storm ended communications.',
      credit: 'NASA / JPL-Caltech / Cornell / Arizona State Univ. / SVS',
      archiveId: 'NSSDCA 2003-032A · SVS Final Panorama',
      sourceUrl: 'https://svs.gsfc.nasa.gov/13158',
    },
    reflectionStatement:
      'Ninety days became nearly fifteen years. Opportunity rests beneath Martian dust with 45.16 kilometers of human curiosity traced behind its wheels.',
    sources: [
      {
        title: 'NSSDCA Record: Mars Exploration Rover B (Opportunity, 2003-032A)',
        organization: 'NASA Space Science Data Coordinated Archive',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A',
      },
      {
        title: 'Opportunity Rover Final Panorama Visualization',
        organization: 'NASA Scientific Visualization Studio',
        url: 'https://svs.gsfc.nasa.gov/13158',
      },
      {
        title: 'Opportunity Mars Rover Mission Overview',
        organization: 'NASA Science / JPL',
        url: 'https://science.nasa.gov/mission/mer-opportunity/',
      },
    ],
  },

  ingenuity: {
    id: 'ingenuity',
    indexCode: '05',
    name: 'Ingenuity Mars Helicopter',
    hardwareType: 'Autonomous Coaxial Rotorcraft Technology Demonstrator',
    cosparId: '2020-052A (Perseverance Payload)',
    agency: 'NASA / JPL',
    destinationId: 'mars',
    destinationLabel: 'Mars',
    siteName: 'Valinor Hills, Jezero Crater',
    coordinatesLabel: '18.38° N, 77.58° E (Jezero Crater Region)',
    launchDate: 'July 30, 2020 · 11:50:00 UTC (aboard Mars 2020)',
    arrivalOrLandingDate: 'February 18, 2021 · 20:55 UTC (deployed April 3, 2021)',
    endOfOperationsDate: 'Final flight: January 18, 2024 (Flight 72) · Mission ended: January 25, 2024',
    statusLabel: 'STATIONARY SURFACE ARTIFACT (ROTOR DAMAGED)',
    finalStateSummary:
      'Grounded upright in Jezero Crater after experiencing rotor blade damage during landing on Flight 72 on January 18, 2024. No longer capable of flight, while remaining a stationary monument at Airfield Chi / Valinor Hills.',
    signalTargetNormalized: 0.77,
    signalBandLabel: '900 MHz UHF Relay (via Perseverance)',
    signalBandVerified: false,
    telemetry: [
      {
        label: 'Host Mission ID',
        value: '2020-052A',
        verified: true,
        sourceNote: 'NSSDCA Mars 2020 Catalog',
      },
      {
        label: 'Total Flights',
        value: '72 Flights',
        verified: true,
        sourceNote: 'NASA JPL Ingenuity Flight Log',
      },
      {
        label: 'First Powered Flight',
        value: 'April 19, 2021',
        verified: true,
        sourceNote: 'NASA Science / JPL',
      },
      {
        label: 'Rotor Span',
        value: '1.2 m (Coaxial)',
        verified: true,
        sourceNote: 'NASA Ingenuity Fact Sheet',
      },
    ],
    chapters: [
      {
        index: 'I',
        heading: 'The Call',
        subheading: 'Can a machine fly in air 1% as dense as Earth’s?',
        body: 'At Mars’s surface, atmospheric density is roughly one percent that of Earth at sea level—comparable to flying at triple the altitude of Mount Everest. NASA added a 1.8-kilogram experimental rotorcraft to the belly of the Perseverance rover to test a single question: is powered, controlled aerodynamic flight possible on another planet?',
      },
      {
        index: 'II',
        heading: 'The Journey',
        subheading: 'Protected beneath Perseverance to Jezero Crater',
        body: 'Folded neatly beneath Perseverance during the seven-month voyage and Sky Crane descent into Jezero Crater, Ingenuity survived freezing Martian nights after being gently lowered onto the regolith on April 3, 2021, while Perseverance rolled back to a safe observation overlook.',
      },
      {
        index: 'III',
        heading: 'The Machine',
        subheading: 'Ultra-light carbon blades spinning at ~2,500 rpm',
        body: 'Ingenuity combined two counter-rotating 1.2-meter carbon-fiber rotor blades, an upper solar panel charging six lithium-ion batteries, a warm insulated fuselage box holding flight computers and navigation cameras, and four slender carbon-composite landing legs. Every gram was budgeted for Martian lift.',
        simTriggerLabel: 'Open Nav Cam · Test 2,500 RPM Lift & Flight 72 Ripples',
      },
      {
        index: 'IV',
        heading: 'The Discoveries',
        subheading: 'From five test hops to 72 flights as an aerial scout',
        body: 'On April 19, 2021, Ingenuity rose three meters above Wright Brothers Field—humanity’s Wright Flyer moment on another world. Planned for five flights over 30 days, it flew 72 times across nearly three years, scouting sand dunes and canyon paths ahead of Perseverance.',
      },
      {
        index: 'V',
        heading: 'The Silence',
        subheading: 'Featureless sand ripples and Flight 72',
        body: 'On January 18, 2024, during a brief vertical check flight over smooth, featureless sand ripples in Jezero Crater, Ingenuity’s vision-navigation algorithm lacked enough surface texture to track horizontal drift. A hard sloped touchdown damaged its carbon-fiber rotor blades, permanently ending flight operations on January 25, 2024.',
        decisionPrompt: {
          id: 'ingenuity-flight72-nav',
          contextLabel: 'Flight 72 · Vision Navigation Over Sand Ripples',
          prompt:
            'At 12 meters above Valinor Hills sand ripples, Ingenuity’s downward navigation camera reports zero high-contrast surface landmarks to track drift. Why did this pose an acute hazard on touchdown?',
          historicalNote:
            'Unlike Earth helicopters with GPS, Ingenuity tracked pixel-by-pixel ground texture visually to null out lateral velocity before landing. Smooth sand ripples deprived the algorithm of landmarks, resulting in uncommanded sideways speed at touchdown.',
          options: [
            {
              id: 'optical-drift',
              label: 'Without visual ground landmarks, lateral drift goes uncorrected at touchdown',
              outcomeText:
                'Exact engineering cause confirmed by NASA/JPL. Undetected horizontal velocity combined with sloped terrain caused the rotor blades to strike the sand.',
              isHistoricalAction: true,
            },
            {
              id: 'gps-loss',
              label: 'Mars GPS satellites temporarily dropped out over Jezero Crater',
              outcomeText:
                'Mars has no GPS constellation; Ingenuity relied completely on an onboard downward black-and-white navigation camera paired with an inertial measurement unit.',
              isHistoricalAction: false,
            },
            {
              id: 'excess-density',
              label: 'Sudden spike in Martian atmospheric density stalled the carbon rotors',
              outcomeText:
                'Mars atmosphere remained around 1% Earth sea-level density; the grounding stemmed from optical navigation loss over smooth sand ripples, not air thickness.',
              isHistoricalAction: false,
            },
          ],
        },
      },
      {
        index: 'VI',
        heading: 'The Legacy',
        subheading: 'Opening the skies of the Solar System',
        body: 'Though Ingenuity sits stationary on the sands of Valinor Hills, it proved aerial exploration works beyond Earth—directly informing future rotorcraft designs for Mars and Saturn’s moon Titan.',
      },
    ],
    timeline: [
      {
        date: '2021-02-18',
        title: 'Landing in Jezero Crater',
        detail: 'Touched down attached beneath the Perseverance rover.',
      },
      {
        date: '2021-04-19',
        title: 'First Off-World Powered Flight',
        detail: 'Hovered at 3 meters for 39.1 seconds at Wright Brothers Field.',
      },
      {
        date: '2021–2023',
        title: 'Aerial Scouting Operations',
        detail: 'Completed dozens of extended reconnaissance flights across Jezero Crater.',
      },
      {
        date: '2024-01-18',
        title: 'Flight 72 Rotor Impact',
        detail: 'Hard touchdown over featureless sand ripples fractures rotor blades.',
      },
      {
        date: '2024-01-25',
        title: 'End of Flight Operations',
        detail: 'NASA announces permanent grounding after 72 historic flights.',
      },
    ],
    hotspots: [
      {
        id: 'coaxial-rotors',
        label: 'Counter-Rotating Carbon Rotors',
        position: [0, 0.72, 0],
        cameraOffset: [2.1, 1.3, 2.1],
        summary:
          'Two 1.2-meter carbon-fiber composite blades spun in opposite directions to generate lift in Mars’s ultra-thin atmosphere; blade tip damage on Flight 72 grounded the craft.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'top-solar-cap',
        label: 'Mast-Mounted Solar Panel',
        position: [0, 1.02, 0],
        cameraOffset: [1.5, 1.9, 1.7],
        summary:
          'Mounted above the upper rotor hub to recharge batteries between flights and power internal heaters during -90°C Martian nights.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'avionics-box',
        label: 'Insulated Avionics Fuselage',
        position: [0, 0.1, 0],
        cameraOffset: [1.6, 0.4, 2.0],
        summary:
          'Tissue-box-sized thermal enclosure protecting flight processors, inertial sensors, UHF radio, and downward navigation camera.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'landing-legs',
        label: 'Four Carbon Landing Struts',
        position: [0.42, -0.45, 0.42],
        cameraOffset: [1.7, -0.1, 1.9],
        summary:
          'Flexible tubular carbon-composite legs cushioned 71 successful touchdowns before the sloped lateral impact of Flight 72.',
        factBasis: 'ARCHIVE RECORD',
      },
    ],
    engineeringSim: {
      type: 'ingenuity-flight',
      title: 'Coaxial Rotor Lift & Optical-Flow Nav Cam',
      cameraFeedLabel: 'DOWNWARD NAV CAMERA · JEZERO CRATER / VALINOR HILLS',
      objective:
        'Spin coaxial rotors to ~2,500 rpm to lift in 1% Mars air over Wright Brothers Field, then inspect how featureless sand ripples disrupt drift lock on Flight 72.',
      educationalNote:
        'Teaches Martian rotor aerodynamics (high RPM + ultra-light 1.2 m carbon blades) and optical-flow terrain navigation without GPS.',
      chapterHintIndex: 2,
    },
    authenticVisualNote: {
      caption:
        'Ingenuity on the Martian surface photographed by Perseverance’s Mastcam-Z, and post-Flight 72 imagery showing the damaged rotor blade tip shadow.',
      credit: 'NASA / JPL-Caltech / ASU / MSSS',
      archiveId: 'NSSDCA 2020-052A · Mars 2020 Helicopter Archive',
      sourceUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/',
    },
    reflectionStatement:
      'Built for five test flights, Ingenuity flew seventy-two times—turning an impossible engineering question into a new era of planetary flight.',
    sources: [
      {
        title: 'Ingenuity Mars Helicopter Official Mission Page',
        organization: 'NASA Science / JPL',
        url: 'https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/',
      },
      {
        title: 'NSSDCA Record: Mars 2020 / Perseverance & Ingenuity (2020-052A)',
        organization: 'NASA Space Science Data Coordinated Archive',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-052A',
      },
    ],
  },

  'pioneer-10': {
    id: 'pioneer-10',
    indexCode: '06',
    name: 'Pioneer 10',
    hardwareType: 'Spin-Stabilized Deep Space Outer-Planet Probe',
    cosparId: '1972-012A',
    agency: 'NASA / Ames Research Center',
    destinationId: 'deep-space',
    destinationLabel: 'Deep Space',
    siteName: 'Outer Solar System (Heading generally toward Taurus / Aldebaran)',
    coordinatesLabel: 'RA ~05h 04m · Dec +26° (Constellation Taurus Direction)',
    launchDate: 'March 3, 1972 · 01:49:00 UTC',
    arrivalOrLandingDate: 'Jupiter Closest Approach: December 4, 1973',
    endOfOperationsDate: 'Final signal received: January 23, 2003 (Science terminated March 31, 1997)',
    statusLabel: 'SILENT · COASTING IN DEEP SPACE',
    finalStateSummary:
      'No longer communicating. At its final weak carrier detection on January 23, 2003, Pioneer 10 was roughly 82.1 AU (~12.2 billion km) from the Sun. It continues coasting on an escape trajectory generally toward the star Aldebaran—it has NOT reached another star.',
    signalTargetNormalized: 0.91,
    signalBandLabel: '2292.037 MHz · S-Band Carrier (Silent since 2003)',
    signalBandVerified: false,
    telemetry: [
      {
        label: 'NSSDCA ID',
        value: '1972-012A',
        verified: true,
        sourceNote: 'NSSDCA Master Catalog',
      },
      {
        label: 'Jupiter Flyby',
        value: 'Dec 4, 1973',
        verified: true,
        sourceNote: 'NASA Ames / NSSDCA',
      },
      {
        label: 'Last Signal Distance',
        value: '~82.1 AU',
        verified: true,
        sourceNote: 'NASA Deep Space Network (Jan 2003)',
      },
      {
        label: 'Estimated Current Dist.',
        value: TO_BE_VERIFIED,
        verified: false,
        sourceNote: 'Unmonitored post-2003; exact live AU varies by ephemeris',
      },
    ],
    chapters: [
      {
        index: 'I',
        heading: 'The Call',
        subheading: 'Can any spacecraft survive the asteroid belt and Jupiter’s radiation?',
        body: 'Before 1972, no spacecraft had crossed the asteroid belt or survived the intense radiation belts surrounding Jupiter. Pioneer 10 was built as a pathfinder to prove the outer Solar System could be traversed—paving the way for Voyager and every outer-planet mission that followed.',
      },
      {
        index: 'II',
        heading: 'The Journey',
        subheading: 'Fastest departure of its era and gravity-assist escape',
        body: 'Launched atop an Atlas-Centaur rocket on March 3, 1972, Pioneer 10 passed the Moon in 11 hours and crossed the asteroid belt unharmed. On December 4, 1973, Jupiter’s immense gravity accelerated Pioneer 10 onto a permanent Solar System escape trajectory.',
      },
      {
        index: 'III',
        heading: 'The Machine',
        subheading: 'A 2.74-meter dish and plutonium power far from the Sun',
        body: 'Because sunlight at Jupiter is 25 times weaker than at Earth, Pioneer 10 replaced solar panels with four SNAP-19 radioisotope thermoelectric generators (RTGs) mounted on twin long booms. Spin-stabilized around a 2.74-meter parabolic dish antenna, it also carried a gold-anodized aluminum plaque depicting humanity’s cosmic address.',
        simTriggerLabel: 'Open RTG Bus · Manage Power Out to 82.1 AU',
      },
      {
        index: 'IV',
        heading: 'The Discoveries',
        subheading: 'First close-up portraits of Jupiter and its magnetosphere',
        body: 'Pioneer 10 returned the first close-range images of Jupiter’s banded clouds and Great Red Spot, mapped its fierce radiation belts, measured the mass of the Galilean moons, and traced the solar wind far beyond Pluto’s orbital distance.',
      },
      {
        index: 'V',
        heading: 'The Silence',
        subheading: 'A fading whisper at 82.1 Astronomical Units',
        body: 'Routine science operations ended in March 1997, yet NASA’s Deep Space Network continued occasional tracking as RTG electrical output steadily decayed. The final, telemetry-less carrier signal was detected on January 23, 2003, from roughly 82.1 AU away. Later listening attempts in 2003 and 2006 heard only cosmic silence.',
        decisionPrompt: {
          id: 'pioneer-rtg-shedding',
          contextLabel: 'Outer Heliosphere · Declining SNAP-19 Output',
          prompt:
            'Decades beyond Jupiter, plutonium-238 decay drops Pioneer 10’s RTG power bus too low to simultaneously heat instruments, collect data, and transmit telemetry. What priority sustains contact to 82.1 AU?',
          historicalNote:
            'NASA engineers progressively switched off individual science instruments—eventually sending only a bare, unmodulated S-Band carrier tone—so the Deep Space Network could still verify trajectory and heliosphere distance until January 23, 2003.',
          options: [
            {
              id: 'shed-instruments',
              label: 'Power down science instruments to preserve the S-Band carrier transmitter',
              outcomeText:
                'Matched NASA Ames operations. Shedding instrument loads extended Pioneer 10’s detectable beacon to ~82.1 AU before transmitter threshold finally dropped.',
              isHistoricalAction: true,
            },
            {
              id: 'deploy-backup-solar',
              label: 'Deploy reserve solar wings to supplement RTG output',
              outcomeText:
                'Pioneer 10 carried no solar panels; at 80+ AU, sunlight is over 6,000 times weaker than at Earth, making photovoltaics unusable.',
              isHistoricalAction: false,
            },
            {
              id: 'keep-all-science',
              label: 'Keep all imaging and particle sensors powered simultaneously',
              outcomeText:
                'Leaving full loads online collapses bus voltage immediately, silencing both science sensors and Earth communications years earlier.',
              isHistoricalAction: false,
            },
          ],
        },
      },
      {
        index: 'VI',
        heading: 'The Legacy',
        subheading: 'Still drifting silently toward the constellation Taurus',
        body: 'Pioneer 10 is silent, not lost in meaning. Travelling outward into interstellar space generally toward the direction of Aldebaran—a region it would not pass near for roughly two million years—it remains an enduring envoy of human curiosity.',
      },
    ],
    timeline: [
      {
        date: '1972-03-03',
        title: 'Atlas-Centaur Launch',
        detail: 'Departed Earth as the fastest human-made spacecraft launched to date.',
      },
      {
        date: '1972–1973',
        title: 'First Asteroid Belt Transit',
        detail: 'Proved the main asteroid belt could be safely navigated.',
      },
      {
        date: '1973-12-04',
        title: 'First Jupiter Flyby',
        detail: 'Passed ~132,252 km above Jupiter’s cloud tops and achieved solar escape velocity.',
      },
      {
        date: '1997-03-31',
        title: 'End of Routine Science',
        detail: 'Formal science mission concluded due to declining RTG power and budgets.',
      },
      {
        date: '2003-01-23',
        title: 'Final Carrier Signal Received',
        detail: 'DSN captured a faint unmodulated signal at ~82.1 AU; craft now coasting silently.',
      },
    ],
    hotspots: [
      {
        id: 'high-gain-dish',
        label: '2.74m Parabolic Dish Antenna',
        position: [0, 0.38, 0],
        cameraOffset: [2.2, 1.9, 2.3],
        summary:
          'High-gain aluminum dish pointed continuously back toward Earth to transmit faint signals across billions of kilometers.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'rtg-booms',
        label: 'Twin SNAP-19 RTG Booms',
        position: [1.65, -0.1, 0.6],
        cameraOffset: [2.9, 0.9, 2.4],
        summary:
          'Extended three meters from the craft to isolate radiation-sensitive instruments from the plutonium-238 nuclear power generators.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'magnetometer-boom',
        label: '6.5m Magnetometer Boom',
        position: [-1.8, -0.1, -0.4],
        cameraOffset: [-2.8, 0.8, 2.3],
        summary:
          'Long truss boom holding the helium vector magnetometer far from the spacecraft’s own magnetic interference to map Jupiter and the heliosphere.',
        factBasis: 'ARCHIVE RECORD',
      },
      {
        id: 'pioneer-plaque',
        label: 'Gold-Anodized Pioneer Plaque',
        position: [0.35, -0.18, 0.48],
        cameraOffset: [1.6, 0.4, 2.0],
        summary:
          'Engraved aluminum plate mounted on the antenna support struts depicting hydrogen’s hyperfine transition, pulsar coordinates of the Sun, and human figures.',
        factBasis: 'ARCHIVE RECORD',
      },
    ],
    engineeringSim: {
      type: 'pioneer-rtg',
      title: 'SNAP-19 Power Bus & 82.1 AU Carrier Console',
      cameraFeedLabel: 'CANOPUS STAR TRACKER & DSN 70M RECEIVER · OUTER HELIOSPHERE',
      objective:
        'Step Pioneer 10 from Jupiter out to 82.1 AU while shedding science instruments as Pu-238 decays so the 2.74 m dish keeps locking a carrier signal with Earth.',
      educationalNote:
        'Explains why deep-space missions use SNAP-19 RTGs rather than solar panels and how gradual power decay turned Pioneer 10 silent in 2003.',
      chapterHintIndex: 2,
    },
    authenticVisualNote: {
      caption:
        'Pioneer 10 hardware before launch and its historic 1973 Jupiter flyby visualization from NASA Ames / NSSDCA.',
      credit: 'NASA / Ames Research Center',
      archiveId: 'NSSDCA 1972-012A · Pioneer Plaque & Flight Record',
      sourceUrl: 'https://science.nasa.gov/mission/pioneer-10/',
    },
    reflectionStatement:
      'Power faded in 2003, yet momentum carries Pioneer 10 outward for millions of years—silent witness to humanity’s first crossing beyond the planets.',
    sources: [
      {
        title: 'NSSDCA Record: Pioneer 10 (1972-012A)',
        organization: 'NASA Space Science Data Coordinated Archive',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-012A',
      },
      {
        title: 'Pioneer 10 Mission Overview',
        organization: 'NASA Science',
        url: 'https://science.nasa.gov/mission/pioneer-10/',
      },
    ],
  },
};

export const MISSION_LIST: MissionRecord[] = [
  MISSIONS['apollo-11-descent'],
  MISSIONS['lunar-roving-vehicle'],
  MISSIONS['sojourner'],
  MISSIONS['opportunity'],
  MISSIONS['ingenuity'],
  MISSIONS['pioneer-10'],
];
