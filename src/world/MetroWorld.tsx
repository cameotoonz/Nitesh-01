import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type WorldPhase = 'arriving' | 'docked' | 'travel' | 'void';

interface MetroWorldProps {
  journeyStarted: boolean;
  activeStation: number;
  travelPulse: number;
  onDocked: () => void;
}

/**
 * Persistent cinematic metro-station environment.
 * Stay mounted behind all content; phases:
 *  - arriving: train rushes in from the right tunnel
 *  - docked: train stopped, doors open, breathing station ambience
 *  - travel: camera pulls into tunnel / speed streaks between stations
 */
export default function MetroWorld({ journeyStarted, activeStation, travelPulse, onDocked }: MetroWorldProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ journeyStarted, activeStation, travelPulse });
  stateRef.current = { journeyStarted, activeStation, travelPulse };
  const dockedRef = useRef(onDocked);
  dockedRef.current = onDocked;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobileSize = window.innerWidth < 768;

    // ---------------- renderer / scene / camera ----------------
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobileSize, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileSize ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060d);
    scene.fog = new THREE.FogExp2(0x05070f, 0.016);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.set(-5.6, 3.0, 15.5);
    camera.lookAt(0.5, 2.4, -10);

    // ---------------- lights ----------------
    scene.add(new THREE.AmbientLight(0x2a3a5f, 0.9));
    const hemi = new THREE.HemisphereLight(0x8fb4ff, 0x0a0d18, 0.55);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 1.5);
    keyLight.position.set(-6, 10, 8);
    scene.add(keyLight);

    const platformGlowA = new THREE.PointLight(0x5aa2ff, 60, 40, 1.8);
    platformGlowA.position.set(-6, 5.5, 4);
    scene.add(platformGlowA);
    const platformGlowB = new THREE.PointLight(0xffb020, 55, 40, 1.8);
    platformGlowB.position.set(5.5, 5, 0);
    scene.add(platformGlowB);
    const magentaWash = new THREE.PointLight(0x8b5cf6, 40, 60, 2);
    magentaWash.position.set(0, 7, -18);
    scene.add(magentaWash);
    const trainHead = new THREE.SpotLight(0xfff6e0, 180, 60, 0.5, 0.5, 1.6);
    trainHead.position.set(0, 3.4, 20);
    trainHead.target.position.set(0, 2, -6);
    scene.add(trainHead, trainHead.target);

    // ---------------- helpers ----------------
    const mat = {
      darkMetal: new THREE.MeshStandardMaterial({ color: 0x131a2c, metalness: 0.85, roughness: 0.42 }),
      steel: new THREE.MeshStandardMaterial({ color: 0x3b4a6b, metalness: 0.9, roughness: 0.32 }),
      silver: new THREE.MeshStandardMaterial({ color: 0x9fb2d8, metalness: 0.95, roughness: 0.25 }),
      floor: new THREE.MeshStandardMaterial({ color: 0x0d1424, metalness: 0.55, roughness: 0.4 }),
      platform: new THREE.MeshStandardMaterial({ color: 0x182036, metalness: 0.4, roughness: 0.55 }),
      yellow: new THREE.MeshStandardMaterial({ color: 0xd99a22, metalness: 0.2, roughness: 0.6, emissive: 0x6b4a08 }),
      trainBody: new THREE.MeshStandardMaterial({ color: 0xb9c6e4, metalness: 0.9, roughness: 0.28 }),
      trainDark: new THREE.MeshStandardMaterial({ color: 0x1a2340, metalness: 0.7, roughness: 0.45 }),
      trainGlass: new THREE.MeshPhysicalMaterial({ color: 0x27436e, metalness: 0.1, roughness: 0.08, transmission: 0.35, transparent: true, opacity: 0.92, emissive: 0x16294d, emissiveIntensity: 0.7 }),
      trainStripe: new THREE.MeshStandardMaterial({ color: 0x101728, metalness: 0.6, roughness: 0.4, emissive: 0x2c5cff, emissiveIntensity: 0.55 }),
      tunnel: new THREE.MeshStandardMaterial({ color: 0x0a0f1f, metalness: 0.3, roughness: 0.8, side: THREE.BackSide }),
      pillarGlass: new THREE.MeshPhysicalMaterial({ color: 0x6fa8ff, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.16 }),
    };

    const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z);
      return mesh;
    };

    // ---------------- station architecture ----------------
    const station = new THREE.Group();
    scene.add(station);

    // floor + platform edges
    const floor = box(60, 0.5, 120, mat.floor, 0, -0.25, -20);
    station.add(floor);
    const platformL = box(7, 1.1, 120, mat.platform, -6.6, 0.55, -20);
    const platformR = box(7, 1.1, 120, mat.platform, 6.6, 0.55, -20);
    station.add(platformL, platformR);
    // glowing platform edge strips
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffc35c });
    for (const x of [-3.35, 3.35]) {
      const strip = box(0.16, 0.06, 120, edgeMat, x, 1.13, -20);
      station.add(strip);
    }
    // tactile paving hint
    const tactileMat = new THREE.MeshBasicMaterial({ color: 0x8a6a1e });
    for (const x of [-4.2, 4.2]) {
      station.add(box(0.9, 0.05, 120, tactileMat, x, 1.12, -20));
    }

    // tracks
    const railMat = new THREE.MeshStandardMaterial({ color: 0x8b98b8, metalness: 1, roughness: 0.22 });
    for (const x of [-1.3, 1.3]) {
      station.add(box(0.12, 0.12, 120, railMat, x, 0.06, -20));
    }
    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x1c2438, roughness: 0.9 });
    for (let z = 38; z > -80; z -= 2.2) {
      station.add(box(3.4, 0.08, 0.5, sleeperMat, 0, -0.02, z));
    }

    // arched ceiling ribs
    const ribMat = mat.darkMetal;
    for (let z = 30; z > -70; z -= 8) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(13, 0.35, 10, 40, Math.PI), ribMat);
      rib.position.set(0, 0.8, z);
      rib.rotation.y = 0;
      station.add(rib);
      // ceiling light bar under each rib
      const barMat = new THREE.MeshBasicMaterial({ color: z % 16 === 0 ? 0xffd9a0 : 0xbcd4ff });
      station.add(box(10, 0.12, 0.3, barMat, 0, 11.6, z));
    }
    // ceiling shell
    const ceiling = new THREE.Mesh(new THREE.CylinderGeometry(13.4, 13.4, 110, 24, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x0b1020, metalness: 0.5, roughness: 0.6, side: THREE.BackSide }));
    ceiling.rotation.z = Math.PI / 2;
    ceiling.rotation.y = Math.PI / 2;
    ceiling.position.set(0, 0.8, -18);
    station.add(ceiling);

    // pillars + glass screens
    for (let z = 24; z > -64; z -= 11) {
      for (const x of [-5.4, 5.4]) {
        station.add(box(0.7, 8.5, 0.7, mat.steel, x, 5, z));
        const screen = box(0.12, 3.2, 2.4, mat.pillarGlass, x * 0.92, 4.4, z - 3.4);
        station.add(screen);
        const screenFrame = box(0.16, 0.14, 2.5, mat.silver, x * 0.92, 6.1, z - 3.4);
        station.add(screenFrame);
      }
    }

    // hanging station sign boards
    const signBoards: THREE.Mesh[] = [];
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024; signCanvas.height = 128;
    const sctx = signCanvas.getContext('2d')!;
    sctx.fillStyle = '#05080f';
    sctx.fillRect(0, 0, 1024, 128);
    sctx.fillStyle = '#ffb020';
    sctx.font = 'bold 64px monospace';
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.fillText('NITESH PORTFOLIO  •  PLATFORM 01', 512, 66);
    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
    for (const z of [6, -14, -34]) {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.1), signMat);
      sign.position.set(0, 6.4, z);
      station.add(sign);
      signBoards.push(sign);
      station.add(box(0.08, 2.2, 0.08, mat.steel, -3.4, 7.6, z));
      station.add(box(0.08, 2.2, 0.08, mat.steel, 3.4, 7.6, z));
    }

    // bench rows
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x27406e, metalness: 0.6, roughness: 0.4 });
    for (const z of [10, -6, -22, -38]) {
      for (const x of [-6.4, 6.4]) {
        station.add(box(0.6, 0.12, 2.4, benchMat, x, 1.75, z));
        station.add(box(0.5, 0.7, 0.12, benchMat, x, 1.45, z - 1.2));
        station.add(box(0.5, 0.7, 0.12, benchMat, x, 1.45, z + 1.2));
      }
    }

    // tunnel mouths (left + right depth)
    const tunnelGeo = new THREE.CylinderGeometry(6.5, 6.5, 30, 20, 1, true);
    const tunnelL = new THREE.Mesh(tunnelGeo, mat.tunnel);
    tunnelL.rotation.x = Math.PI / 2;
    tunnelL.position.set(0, 3, -78);
    station.add(tunnelL);
    // tunnel ring lights
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3d6bd6, side: THREE.DoubleSide });
    for (let z = -66; z > -92; z -= 4) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.09, 8, 40), ringMat);
      ring.position.set(0, 3, z);
      station.add(ring);
    }

    // dust / atmosphere particles
    const particleCount = isMobileSize ? 350 : 900;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 26;
      pPos[i * 3 + 1] = Math.random() * 11 + 0.5;
      pPos[i * 3 + 2] = 30 - Math.random() * 110;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x9dc0ff, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false }));
    scene.add(particles);

    // ---------------- THE TRAIN ----------------
    const train = new THREE.Group();
    scene.add(train);

    const TRAIN_LEN = 46;
    const carCount = 4;
    const carLen = TRAIN_LEN / carCount;
    const doorPanels: THREE.Mesh[] = [];

    const body = new THREE.Mesh(new THREE.BoxGeometry(3.1, 3.1, TRAIN_LEN), mat.trainBody);
    body.position.y = 2.35;
    train.add(body);
    // dark window band
    const band = new THREE.Mesh(new THREE.BoxGeometry(3.16, 1.05, TRAIN_LEN - 0.6), mat.trainDark);
    band.position.y = 2.95;
    train.add(band);
    // glowing windows
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffe3ae });
    const winGeo = new THREE.PlaneGeometry(1.5, 0.78);
    for (let c = 0; c < carCount; c++) {
      const zc = -TRAIN_LEN / 2 + carLen / 2 + c * carLen;
      for (const off of [-2.9, -1.05, 1.05, 2.9]) {
        for (const side of [-1, 1]) {
          const w = new THREE.Mesh(winGeo, windowMat);
          w.position.set(side * 1.585, 2.95, zc + off);
          w.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
          train.add(w);
        }
      }
    }
    // stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.18, 0.16, TRAIN_LEN - 0.4), mat.trainStripe);
    stripe.position.y = 1.62;
    train.add(stripe);
    // roof + undercarriage
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.25, TRAIN_LEN), mat.trainDark);
    roof.position.y = 4.02;
    train.add(roof);
    const under = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, TRAIN_LEN), mat.darkMetal);
    under.position.y = 0.55;
    train.add(under);
    // wheels/bogies hint
    for (let c = 0; c < carCount; c++) {
      const zc = -TRAIN_LEN / 2 + carLen / 2 + c * carLen;
      for (const off of [-3.4, 3.4]) {
        const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 1.6), mat.darkMetal);
        bogie.position.set(0, 0.32, zc + off);
        train.add(bogie);
      }
    }
    // nose (front) — tapered cab at +Z end
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.55, 3.2, 4, 1), mat.trainBody);
    nose.rotation.y = Math.PI / 4;
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 2.3, TRAIN_LEN / 2 + 1.2);
    nose.scale.set(1, 1, 0.75);
    train.add(nose);
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.85), mat.trainGlass);
    windshield.position.set(0, 3.05, TRAIN_LEN / 2 + 2.15);
    windshield.rotation.x = -0.28;
    train.add(windshield);
    // headlights
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfff3d0 });
    for (const x of [-0.7, 0.7]) {
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), headMat);
      hl.position.set(x, 1.7, TRAIN_LEN / 2 + 2.35);
      train.add(hl);
    }
    const destCanvas = document.createElement('canvas');
    destCanvas.width = 512; destCanvas.height = 64;
    const dctx = destCanvas.getContext('2d')!;
    dctx.fillStyle = '#0a0500';
    dctx.fillRect(0, 0, 512, 64);
    dctx.fillStyle = '#ffb020';
    dctx.font = 'bold 34px monospace';
    dctx.textAlign = 'center';
    dctx.textBaseline = 'middle';
    dctx.fillText('NITESH EXPRESS  •  CREATIVE LINE', 256, 34);
    const destTex = new THREE.CanvasTexture(destCanvas);
    destTex.colorSpace = THREE.SRGBColorSpace;
    const dest = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.28), new THREE.MeshBasicMaterial({ map: destTex }));
    dest.position.set(0, 3.62, TRAIN_LEN / 2 + 2.28);
    dest.rotation.x = -0.28;
    train.add(dest);

    // doors (two sliding panels per doorway, both sides)
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xaebcd9, metalness: 0.85, roughness: 0.3 });
    const doorGlassMat = new THREE.MeshStandardMaterial({ color: 0x1b2c4d, metalness: 0.2, roughness: 0.15, emissive: 0x3d5a94, emissiveIntensity: 0.6 });
    interface Door { left: THREE.Mesh; right: THREE.Mesh; baseZ: number }
    const doors: Door[] = [];
    for (let c = 0; c < carCount; c++) {
      const zc = -TRAIN_LEN / 2 + carLen / 2 + c * carLen;
      for (const side of [-1, 1]) {
        const mkPanel = (zOff: number) => {
          const g = new THREE.Group();
          const panel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.75), doorMat);
          const glass = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.9, 0.55), doorGlassMat);
          glass.position.y = 0.4;
          g.add(panel, glass);
          g.position.set(side * 1.56, 2.25, zc + zOff);
          train.add(g);
          return g;
        };
        const left = mkPanel(-0.38);
        const right = mkPanel(0.38);
        doorPanels.push(left.children[0] as THREE.Mesh, right.children[0] as THREE.Mesh);
        doors.push({ left: left as unknown as THREE.Mesh, right: right as unknown as THREE.Mesh, baseZ: zc });
      }
    }
    // interior glow planes behind doors (visible when open)
    const interiorMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, side: THREE.DoubleSide });
    for (let c = 0; c < carCount; c++) {
      const zc = -TRAIN_LEN / 2 + carLen / 2 + c * carLen;
      for (const side of [-1, 1]) {
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.1), interiorMat);
        glow.position.set(side * 1.2, 2.25, zc);
        glow.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
        train.add(glow);
      }
    }

    // train starts far right (in tunnel / off-frame), arrives at x=0
    const ARRIVE_FROM_X = 34;
    train.position.x = ARRIVE_FROM_X;
    train.position.z = -2;

    // ---------------- speed-streak lines for travel ----------------
    const streakCount = isMobileSize ? 120 : 260;
    const streakGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(streakCount * 6);
    const sSeed = new Float32Array(streakCount * 3);
    for (let i = 0; i < streakCount; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = Math.random() * 11 + 0.3;
      const z = 30 - Math.random() * 120;
      sSeed[i * 3] = x; sSeed[i * 3 + 1] = y; sSeed[i * 3 + 2] = z;
      sPos[i * 6] = x; sPos[i * 6 + 1] = y; sPos[i * 6 + 2] = z;
      sPos[i * 6 + 3] = x; sPos[i * 6 + 4] = y; sPos[i * 6 + 5] = z - 3;
    }
    streakGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    const streaks = new THREE.LineSegments(streakGeo, new THREE.LineBasicMaterial({ color: 0x9dc4ff, transparent: true, opacity: 0 }));
    scene.add(streaks);

    // ---------------- animation state ----------------
    let phase: WorldPhase = 'arriving';
    let arriveT = 0;             // 0..1 arrival progress
    let doorT = 0;               // 0 closed .. 1 open
    let travelAmount = 0;        // 0..1 current travel intensity
    let travelTarget = 0;
    let lastPulse = stateRef.current.travelPulse;
    let shake = 0;
    let dockedFired = reduceMotion;
    if (reduceMotion) {
      train.position.x = 0;
      doorT = 1;
      phase = 'docked';
    }

    const clock = new THREE.Clock();
    let raf = 0;
    let disposed = false;

    const camBase = new THREE.Vector3(-5.6, 3.0, 15.5);
    const camLook = new THREE.Vector3(0.5, 2.4, -10);
    const tmpV = new THREE.Vector3();

    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    function setDoors(t: number) {
      const open = easeOut(Math.max(0, Math.min(1, t))) * 0.72;
      for (const d of doors) {
        d.left.position.z = d.baseZ - 0.38 - open;
        d.right.position.z = d.baseZ + 0.38 + open;
      }
    }
    setDoors(0);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    function animate() {
      if (disposed) return;
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const st = stateRef.current;

      // --- phase logic ---
      if (phase === 'arriving') {
        arriveT += dt / 4.2;
        const e = easeInOut(Math.min(arriveT, 1));
        train.position.x = ARRIVE_FROM_X * (1 - e);
        // rumble shake while arriving
        shake = (1 - e) * 0.06;
        // headlight flare
        trainHead.intensity = 180 + Math.sin(t * 30) * 30;
        if (arriveT >= 1) {
          phase = 'docked';
          train.position.x = 0;
          if (!dockedFired) { dockedFired = true; dockedRef.current(); }
        }
      } else if (phase === 'docked') {
        // doors open shortly after docking
        doorT = Math.min(1, doorT + dt / 1.6);
        setDoors(doorT);
        shake = Math.max(0, shake - dt * 0.05);
        trainHead.intensity = 60;
      }

      // --- travel pulse (station change) ---
      if (st.travelPulse !== lastPulse) {
        lastPulse = st.travelPulse;
        travelTarget = 1;
        window.setTimeout(() => { travelTarget = 0; }, 900);
      }
      travelAmount += (travelTarget - travelAmount) * Math.min(1, dt * 3.2);

      // --- camera: journey mode pulls inside; travel shakes forward ---
      const stationShift = st.activeStation;
      const journeyPull = st.journeyStarted ? 1 : 0;
      const camX = Math.sin(t * 0.3) * 0.15 + (travelAmount * 0.4);
      const camY = camBase.y - journeyPull * 0.35 + Math.sin(t * 0.5) * 0.06;
      const camZ = camBase.z - journeyPull * 3.6 - travelAmount * 2.4 - Math.min(stationShift * 0.35, 2.4);
      camera.position.set(
        camX + (Math.random() - 0.5) * (shake + travelAmount * 0.09),
        camY + (Math.random() - 0.5) * (shake + travelAmount * 0.07),
        camZ
      );
      tmpV.copy(camLook);
      tmpV.z -= travelAmount * 14 + journeyPull * 6 + Math.min(stationShift * 1.2, 8);
      tmpV.y += travelAmount * 0.4;
      camera.lookAt(tmpV);

      // --- streaks ---
      const sm = streaks.material as THREE.LineBasicMaterial;
      sm.opacity = travelAmount * 0.85;
      if (travelAmount > 0.01) {
        const pos = streakGeo.attributes.position as THREE.BufferAttribute;
        const arr = pos.array as Float32Array;
        for (let i = 0; i < streakCount; i++) {
          let z = sSeed[i * 3 + 2] + (t * 60 * travelAmount + i * 7.3) % 130;
          if (z > 32) z -= 130;
          arr[i * 6 + 2] = z;
          arr[i * 6 + 5] = z - 2 - travelAmount * 5;
        }
        pos.needsUpdate = true;
      }

      // --- ambience ---
      particles.rotation.y = Math.sin(t * 0.05) * 0.02;
      platformGlowB.intensity = 55 + Math.sin(t * 2.1) * 6;
      platformGlowA.intensity = 60 + Math.cos(t * 1.7) * 6;
      magentaWash.intensity = 40 + Math.sin(t * 0.9) * 8;
      // window flicker subtle
      (windowMat as THREE.MeshBasicMaterial).color.setHSL(0.1, 0.55, 0.72 + Math.sin(t * 7.3) * 0.012);

      // train idle breathing when docked
      if (phase === 'docked') {
        train.position.y = Math.sin(t * 1.4) * 0.015;
      }

      // fog deepens during travel (tunnel feel)
      (scene.fog as THREE.FogExp2).density = 0.016 + travelAmount * 0.02;

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else if (m) m.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    />
  );
}
