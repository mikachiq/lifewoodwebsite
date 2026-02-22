import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface NeuralBackgroundProps {
  theme: 'light' | 'dark';
  intensity?: 'normal' | 'high';
}

const NeuralBackground: React.FC<NeuralBackgroundProps> = ({ theme, intensity = 'normal' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const intensityFactor = intensity === 'high' ? 1.25 : 1;
    const motionFactor = (prefersReducedMotion ? 0.25 : 1) * intensityFactor;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Particle systems
    const particleCount = intensity === 'high' ? 190 : 150;
    const frontParticles = new THREE.BufferGeometry();
    const backParticles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const backPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const twinklePhases = new Float32Array(particleCount);
    const velocities: { x: number; y: number; z: number }[] = [];
    const anchors: { x: number; y: number; z: number }[] = [];

    const nodeColor = new THREE.Color(theme === 'dark' ? 0x00ff88 : 0x046241);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 10;

      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = z;

      backPositions[i] = x * 0.92;
      backPositions[i + 1] = y * 0.92;
      backPositions[i + 2] = z - 2;

      velocities.push({
        x: (Math.random() - 0.5) * 0.02 * motionFactor,
        y: (Math.random() - 0.5) * 0.02 * motionFactor,
        z: (Math.random() - 0.5) * 0.02 * motionFactor
      });

      anchors.push({ x, y, z });
      twinklePhases[i / 3] = Math.random() * Math.PI * 2;
      colors[i] = nodeColor.r;
      colors[i + 1] = nodeColor.g;
      colors[i + 2] = nodeColor.b;
    }

    frontParticles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    frontParticles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    backParticles.setAttribute('position', new THREE.BufferAttribute(backPositions, 3));
    backParticles.setAttribute('color', new THREE.BufferAttribute(colors.slice(), 3));

    // Materials
    const frontParticleMaterial = new THREE.PointsMaterial({
      size: theme === 'dark' ? 0.2 : 0.15,
      transparent: true,
      opacity: theme === 'dark' ? 0.9 : 0.4,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });
    const backParticleMaterial = new THREE.PointsMaterial({
      size: theme === 'dark' ? 0.14 : 0.1,
      transparent: true,
      opacity: theme === 'dark' ? 0.4 : 0.2,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    const frontParticleSystem = new THREE.Points(frontParticles, frontParticleMaterial);
    const backParticleSystem = new THREE.Points(backParticles, backParticleMaterial);
    scene.add(backParticleSystem);
    scene.add(frontParticleSystem);

    // Lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: theme === 'dark' ? 0x00ff88 : 0x046241,
      transparent: true,
      opacity: theme === 'dark' ? 0.4 : 0.1,
      blending: THREE.AdditiveBlending,
    });

    const linesGeometry = new THREE.BufferGeometry();
    const lines = new THREE.LineSegments(linesGeometry, lineMaterial);
    scene.add(lines);

    // Pulse particles moving through active links
    const pulseCount = intensity === 'high' ? 36 : 24;
    const pulseGeometry = new THREE.BufferGeometry();
    const pulsePositions = new Float32Array(pulseCount * 3);
    pulseGeometry.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
    const pulseMaterial = new THREE.PointsMaterial({
      color: theme === 'dark' ? 0xf4b448 : 0x78caa5,
      size: theme === 'dark' ? 0.11 : 0.09,
      transparent: true,
      opacity: prefersReducedMotion ? 0.2 : 0.5,
      blending: THREE.AdditiveBlending
    });
    const pulses = new THREE.Points(pulseGeometry, pulseMaterial);
    scene.add(pulses);

    const pulseState = Array.from({ length: pulseCount }, () => ({
      i: Math.floor(Math.random() * particleCount),
      j: Math.floor(Math.random() * particleCount),
      t: Math.random(),
      speed: (0.004 + Math.random() * 0.01) * motionFactor
    }));

    // Floating gradient glows
    const createGlow = (hex: number, opacity: number) => {
      const mat = new THREE.SpriteMaterial({
        color: hex,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(8, 8, 1);
      return sprite;
    };

    const glowA = createGlow(theme === 'dark' ? 0x046241 : 0x00ff88, theme === 'dark' ? (intensity === 'high' ? 0.09 : 0.07) : 0.035);
    const glowB = createGlow(theme === 'dark' ? 0xf4b448 : 0x046241, theme === 'dark' ? (intensity === 'high' ? 0.065 : 0.05) : 0.03);
    glowA.position.set(-4, 2, -3);
    glowB.position.set(4, -2, -3);
    scene.add(glowA);
    scene.add(glowB);

    // Interaction state
    const pointer = new THREE.Vector2(0, 0);
    const pointerWorld = new THREE.Vector3(0, 0, 0);
    const connectedPairs: Array<[number, number]> = [];

    camera.position.z = 5;

    // Animation
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const handlePointerMove = (event: MouseEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      const frontPos = frontParticleSystem.geometry.attributes.position.array as Float32Array;
      const backPos = backParticleSystem.geometry.attributes.position.array as Float32Array;
      const frontCol = frontParticleSystem.geometry.attributes.color.array as Float32Array;
      const backCol = backParticleSystem.geometry.attributes.color.array as Float32Array;
      connectedPairs.length = 0;
      const linePositions: number[] = [];

      pointerWorld.set(pointer.x * 9, pointer.y * 5, 0);

      // Update particles, twinkle, and build active connections
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Gentle return toward anchors keeps spatial integrity while still drifting.
        velocities[i].x += (anchors[i].x - frontPos[i3]) * 0.00005;
        velocities[i].y += (anchors[i].y - frontPos[i3 + 1]) * 0.00005;
        velocities[i].z += (anchors[i].z - frontPos[i3 + 2]) * 0.00004;

        if (!prefersReducedMotion) {
          const dx = frontPos[i3] - pointerWorld.x;
          const dy = frontPos[i3 + 1] - pointerWorld.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 9) {
            const inv = 1 / Math.max(0.3, Math.sqrt(distSq));
            const force = (1 - distSq / 9) * 0.012;
            velocities[i].x += dx * inv * force;
            velocities[i].y += dy * inv * force;
          }
        }

        frontPos[i3] += velocities[i].x;
        frontPos[i3 + 1] += velocities[i].y;
        frontPos[i3 + 2] += velocities[i].z;

        // Boundary check
        if (Math.abs(frontPos[i3]) > 10) velocities[i].x *= -1;
        if (Math.abs(frontPos[i3 + 1]) > 10) velocities[i].y *= -1;
        if (Math.abs(frontPos[i3 + 2]) > 5) velocities[i].z *= -1;

        backPos[i3] = frontPos[i3] * 0.92;
        backPos[i3 + 1] = frontPos[i3 + 1] * 0.92;
        backPos[i3 + 2] = frontPos[i3 + 2] - 2;

        const twinkle = 0.65 + 0.35 * Math.sin(elapsed * (1.8 * motionFactor) + twinklePhases[i]);
        frontCol[i3] = nodeColor.r * twinkle;
        frontCol[i3 + 1] = nodeColor.g * twinkle;
        frontCol[i3 + 2] = nodeColor.b * twinkle;
        backCol[i3] = nodeColor.r * (0.45 + twinkle * 0.2);
        backCol[i3 + 1] = nodeColor.g * (0.45 + twinkle * 0.2);
        backCol[i3 + 2] = nodeColor.b * (0.45 + twinkle * 0.2);

        // Connections
        for (let j = i + 1; j < particleCount; j++) {
          const j3 = j * 3;
          const dx = frontPos[i3] - frontPos[j3];
          const dy = frontPos[i3 + 1] - frontPos[j3 + 1];
          const dz = frontPos[i3 + 2] - frontPos[j3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 2.5) {
            linePositions.push(
              frontPos[i3], frontPos[i3 + 1], frontPos[i3 + 2],
              frontPos[j3], frontPos[j3 + 1], frontPos[j3 + 2]
            );
            connectedPairs.push([i, j]);
          }
        }
      }

      // Move pulse points along connected lines
      const pulsePos = pulses.geometry.attributes.position.array as Float32Array;
      for (let p = 0; p < pulseCount; p++) {
        const p3 = p * 3;
        if (connectedPairs.length > 0) {
          pulseState[p].t += pulseState[p].speed;
          if (pulseState[p].t >= 1) {
            const pair = connectedPairs[(Math.random() * connectedPairs.length) | 0];
            pulseState[p].i = pair[0];
            pulseState[p].j = pair[1];
            pulseState[p].t = 0;
            pulseState[p].speed = (0.004 + Math.random() * 0.01) * motionFactor;
          }

          const a3 = pulseState[p].i * 3;
          const b3 = pulseState[p].j * 3;
          const t = pulseState[p].t;
          pulsePos[p3] = frontPos[a3] + (frontPos[b3] - frontPos[a3]) * t;
          pulsePos[p3 + 1] = frontPos[a3 + 1] + (frontPos[b3 + 1] - frontPos[a3 + 1]) * t;
          pulsePos[p3 + 2] = frontPos[a3 + 2] + (frontPos[b3 + 2] - frontPos[a3 + 2]) * t;
        } else {
          pulsePos[p3] = 1000;
          pulsePos[p3 + 1] = 1000;
          pulsePos[p3 + 2] = 1000;
        }
      }

      frontParticleSystem.geometry.attributes.position.needsUpdate = true;
      backParticleSystem.geometry.attributes.position.needsUpdate = true;
      frontParticleSystem.geometry.attributes.color.needsUpdate = true;
      backParticleSystem.geometry.attributes.color.needsUpdate = true;
      pulses.geometry.attributes.position.needsUpdate = true;
      lines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

      // Layered drifts and camera parallax
      frontParticleSystem.rotation.y += 0.0007 * motionFactor;
      backParticleSystem.rotation.y -= 0.0003 * motionFactor;
      lines.rotation.y += 0.0006 * motionFactor;
      lines.rotation.x = Math.sin(elapsed * 0.25) * 0.015;

      glowA.position.x = -4 + Math.sin(elapsed * 0.2) * 1.3;
      glowA.position.y = 2 + Math.cos(elapsed * 0.18) * 1.1;
      glowB.position.x = 4 + Math.cos(elapsed * 0.16) * 1.5;
      glowB.position.y = -2 + Math.sin(elapsed * 0.22) * 1.2;
      glowA.material.opacity = (theme === 'dark' ? (intensity === 'high' ? 0.08 : 0.06) : 0.03) + Math.sin(elapsed * 0.8) * 0.01;
      glowB.material.opacity = (theme === 'dark' ? (intensity === 'high' ? 0.06 : 0.045) : 0.025) + Math.cos(elapsed * 0.7) * 0.008;

      camera.position.x += ((pointer.x * 0.25) - camera.position.x) * 0.03 * motionFactor;
      camera.position.y += ((pointer.y * 0.2) - camera.position.y) * 0.03 * motionFactor;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      // Cleanup Three.js resources
      frontParticles.dispose();
      backParticles.dispose();
      pulseGeometry.dispose();
      frontParticleMaterial.dispose();
      backParticleMaterial.dispose();
      pulseMaterial.dispose();
      linesGeometry.dispose();
      lineMaterial.dispose();
      (glowA.material as THREE.SpriteMaterial).dispose();
      (glowB.material as THREE.SpriteMaterial).dispose();
      renderer.dispose();
    };
  }, [theme, intensity]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 pointer-events-none opacity-60 dark:opacity-40"
    />
  );
};

export default NeuralBackground;
