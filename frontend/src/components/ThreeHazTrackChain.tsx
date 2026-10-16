import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FlaskConical, Package, Truck, Factory, Recycle, RotateCcw, Play, Pause } from 'lucide-react';

interface StageData {
  id: number;
  num: string;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  angle: number;
  metric: string;
}

const STAGES: StageData[] = [
  { id: 0, num: '01', label: 'LAB / INDUSTRY', sub: 'Generation Point', icon: FlaskConical, angle: -90, metric: 'Manifest ID: HW-9041 · Sealed' },
  { id: 1, num: '02', label: 'COLLECTION', sub: 'Container Intake', icon: Package, angle: -18, metric: 'Tare Weight: 420 kg · Verified' },
  { id: 2, num: '03', label: 'TRANSPORT', sub: 'Secured GPS Route', icon: Truck, angle: 54, metric: 'Route: Safe Corridor #4 · 32 km/h' },
  { id: 3, num: '04', label: 'TREATMENT', sub: 'Neutralization Plant', icon: Factory, angle: 126, metric: 'Temp: 980°C · Scrubber Normal' },
  { id: 4, num: '05', label: 'DISPOSAL', sub: 'Final CPCB Record', icon: Recycle, angle: 198, metric: 'Certificate: CPCB-CERT-8810A' },
];

export const ThreeHazTrackChain: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [badgeCoords, setBadgeCoords] = useState<{ x: number; y: number; scale: number; zIndex: number; opacity: number }[]>(
    STAGES.map(() => ({ x: 0, y: 0, scale: 1, zIndex: 20, opacity: 1 }))
  );

  const resetTargetRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 500;
    let height = container.clientHeight || 500;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 10);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x39ffb0, 3, 20);
    pointLight1.position.set(5, 6, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3ce0e8, 2, 20);
    pointLight2.position.set(-5, -4, 4);
    scene.add(pointLight2);

    // Pivot group
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 1. Central Core
    const coreGroup = new THREE.Group();
    worldGroup.add(coreGroup);

    const icoGeo = new THREE.IcosahedronGeometry(0.85, 1);
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0x0fe6a0,
      emissive: 0x0a4d3a,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const coreIco = new THREE.Mesh(icoGeo, icoMat);
    coreGroup.add(coreIco);

    const wireGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x39ffb0,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireCage = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireCage);

    const ringGeo1 = new THREE.RingGeometry(1.4, 1.45, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x3ce0e8, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(1.7, 1.74, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x39ffb0, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 6;
    coreGroup.add(ring2);

    // 2. Nodes in 3D Space
    const ORBIT_RADIUS = 3.4;
    const nodeMeshes: { group: THREE.Group; sphere: THREE.Mesh; halo: THREE.Mesh; pos: THREE.Vector3 }[] = [];
    const node3DPositions: THREE.Vector3[] = [];

    STAGES.forEach((s) => {
      const rad = (s.angle * Math.PI) / 180;
      const x = ORBIT_RADIUS * Math.cos(rad);
      const y = ORBIT_RADIUS * Math.sin(rad) * 0.82;
      const z = ORBIT_RADIUS * Math.sin(rad * 2) * 0.45;
      const pos = new THREE.Vector3(x, y, z);
      node3DPositions.push(pos);

      const nodeGroup = new THREE.Group();
      nodeGroup.position.copy(pos);

      const sphereGeo = new THREE.SphereGeometry(0.26, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x39ffb0,
        emissive: 0x0fe6a0,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.9,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      nodeGroup.add(sphere);

      const haloGeo = new THREE.TorusGeometry(0.42, 0.025, 16, 32);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0x3ce0e8, transparent: true, opacity: 0.7 });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      nodeGroup.add(halo);

      const cylinderGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8);
      const cylinderMat = new THREE.MeshBasicMaterial({ color: 0x39ffb0, transparent: true, opacity: 0.45 });
      const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
      nodeGroup.add(cylinder);

      worldGroup.add(nodeGroup);
      nodeMeshes.push({ group: nodeGroup, sphere, halo, pos });
    });

    // 3. Connectors
    const closedCurve = new THREE.CatmullRomCurve3(node3DPositions, true, 'catmullrom', 0.15);
    const tubeGeo = new THREE.TubeGeometry(closedCurve, 100, 0.035, 8, true);
    const tubeMat = new THREE.MeshBasicMaterial({ color: 0x145a44, transparent: true, opacity: 0.65 });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    worldGroup.add(tubeMesh);

    const curvePoints = closedCurve.getPoints(200);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x39ffb0, transparent: true, opacity: 0.8 });
    const glowLine = new THREE.Line(lineGeo, lineMat);
    worldGroup.add(glowLine);

    // 4. Moving Transit Packets
    const packets = [0, 0.25, 0.5, 0.75].map((prog, i) => {
      const pGeo = new THREE.SphereGeometry(0.09, 16, 16);
      const pMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x39ffb0 : 0x3ce0e8 });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      worldGroup.add(pMesh);
      return { mesh: pMesh, progress: prog, speed: 0.08 };
    });

    // 5. Stardust Field
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 16;
      positions[i3 + 1] = (Math.random() - 0.5) * 14;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;
      const isCyan = Math.random() > 0.6;
      colors[i3] = isCyan ? 0.23 : 0.22;
      colors[i3 + 1] = isCyan ? 0.88 : 1.0;
      colors[i3 + 2] = isCyan ? 0.91 : 0.69;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particleMat = new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.65 });
    const particleField = new THREE.Points(particleGeo, particleMat);
    worldGroup.add(particleField);

    // Interaction vars
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotX = 0.1;
    let targetRotY = 0;

    resetTargetRef.current = () => {
      targetRotX = 0.1;
      targetRotY = 0;
      worldGroup.rotation.set(0, 0, 0);
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotY += deltaX * 0.008;
        targetRotX += deltaY * 0.008;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 500;
      height = container.clientHeight || 500;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    const tempV = new THREE.Vector3();
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (isAutoRotate && !isDragging) {
        targetRotY += 0.005;
      }
      worldGroup.rotation.y += (targetRotY - worldGroup.rotation.y) * 0.08;
      worldGroup.rotation.x += (targetRotX - worldGroup.rotation.x) * 0.08;

      coreIco.rotation.y += 0.012;
      coreIco.rotation.x += 0.008;
      wireCage.rotation.y -= 0.008;
      ring1.rotation.z += 0.015;
      ring2.rotation.z -= 0.012;

      nodeMeshes.forEach((n, idx) => {
        n.group.position.y = n.pos.y + Math.sin(elapsed * 2 + idx) * 0.08;
        n.halo.rotation.z += 0.02;
      });

      packets.forEach((p) => {
        p.progress += p.speed * delta;
        if (p.progress > 1) p.progress -= 1;
        const pointOnCurve = closedCurve.getPointAt(p.progress);
        if (pointOnCurve) p.mesh.position.copy(pointOnCurve);
      });

      particleField.rotation.y = elapsed * 0.015;

      renderer.render(scene, camera);

      // Project badges
      const halfW = width / 2;
      const halfH = height / 2;
      const nextCoords = nodeMeshes.map((n) => {
        n.group.getWorldPosition(tempV);
        tempV.project(camera);
        const x = tempV.x * halfW + halfW;
        const y = -tempV.y * halfH + halfH;
        const scale = THREE.MathUtils.clamp(1 + tempV.z * -0.5, 0.78, 1.15);
        const zIndex = tempV.z < 0 ? 25 : 15;
        const opacity = tempV.z > 0.95 ? 0.3 : 1;
        return { x, y, scale, zIndex, opacity };
      });
      setBadgeCoords(nextCoords);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isAutoRotate]);

  const currentStage = STAGES[activeStage];

  return (
    <div className="relative w-full max-w-[580px] h-[520px] mx-auto flex items-center justify-center">
      {/* Three.js canvas mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing rounded-2xl" />

      {/* Center Shield Badge */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
        <div className="w-14 h-14 rounded-2xl bg-void/80 border border-em/60 flex items-center justify-center text-em shadow-[0_0_25px_rgba(57,255,176,0.4)] mx-auto backdrop-blur-md animate-bounce-short">
          <svg width="28" height="32" viewBox="0 0 100 110">
            <path d="M50 2 L94 20 V52 C94 80 76 98 50 108 C24 98 6 80 6 52 V20 Z" fill="rgba(6,20,16,.9)" stroke="#39ffb0" strokeWidth="3" />
            <circle cx="50" cy="46" r="8" fill="#39ffb0" />
            <path d="M50 60 C40 62 34 70 36 80 C44 82 52 78 54 68 C58 76 68 78 74 72 C72 62 62 58 54 62 Z" fill="#0fe6a0" />
          </svg>
        </div>
        <div className="font-display font-bold text-sm text-white mt-1 drop-shadow-[0_0_10px_rgba(57,255,176,0.5)]">
          Haz<span className="text-em">Track</span>
        </div>
        <div className="font-mono text-[8px] text-mist tracking-widest uppercase">CORE 3D HUB</div>
      </div>

      {/* Projected Dynamic HTML Badges */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        {STAGES.map((s, idx) => {
          const coords = badgeCoords[idx] || { x: 0, y: 0, scale: 1, zIndex: 20, opacity: 1 };
          const Icon = s.icon;
          const isActive = activeStage === idx;
          return (
            <div
              key={s.id}
              onClick={() => setActiveStage(idx)}
              onMouseEnter={() => setActiveStage(idx)}
              style={{
                left: `${coords.x}px`,
                top: `${coords.y}px`,
                transform: `translate(-50%, -50%) scale(${coords.scale * (isActive ? 1.08 : 1)})`,
                zIndex: coords.zIndex,
                opacity: coords.opacity,
              }}
              className="absolute pointer-events-auto cursor-pointer transition-transform duration-150"
            >
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all shadow-lg ${
                  isActive
                    ? 'bg-panel/95 border-em shadow-[0_0_25px_rgba(57,255,176,0.45)]'
                    : 'bg-void/85 border-em/30 hover:border-em/70 shadow-[0_0_15px_rgba(57,255,176,0.15)]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? 'bg-em text-black' : 'bg-em/15 text-em border border-em/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-mono font-bold text-em leading-none">{s.num}. STAGE</span>
                  <span className="text-[11px] font-bold text-white leading-tight whitespace-nowrap">{s.label}</span>
                  <span className="text-[8.5px] text-mist leading-none whitespace-nowrap">{s.sub}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control buttons */}
      <div className="absolute top-3 right-3 flex gap-2 z-30 pointer-events-auto">
        <button
          onClick={() => resetTargetRef.current()}
          className="px-2.5 py-1 rounded-lg bg-void/80 border border-em/30 text-em hover:border-em text-[10px] font-mono flex items-center gap-1 backdrop-blur-md transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset 3D</span>
        </button>
        <button
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className="px-2.5 py-1 rounded-lg bg-void/80 border border-em/30 text-em hover:border-em text-[10px] font-mono flex items-center gap-1 backdrop-blur-md transition-all"
        >
          {isAutoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>{isAutoRotate ? 'Pause' : 'Spin'}</span>
        </button>
      </div>

      {/* HUD Info card */}
      <div className="absolute bottom-3 left-3 right-3 bg-void/90 border border-em/40 rounded-xl p-3 flex items-center justify-between shadow-2xl backdrop-blur-md z-30 pointer-events-auto">
        <div>
          <div className="text-[10px] font-mono text-em">STAGE {currentStage.num} · {currentStage.label}</div>
          <div className="text-xs font-semibold text-white mt-0.5">{currentStage.sub} — {currentStage.metric}</div>
        </div>
        <div className="text-right font-mono text-cyan">
          <div className="text-xs font-bold">LIVE 3D</div>
          <div className="text-[9px] text-mist">60 FPS WEBGL</div>
        </div>
      </div>
    </div>
  );
};
