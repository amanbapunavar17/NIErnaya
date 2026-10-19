/**
 * ================================================================
 * ParticleNetwork.tsx — Cinematic Multi-Layer 3D Data Network
 * ================================================================
 * Effects added:
 * - Dual-layer particle telemetry: Cyan primary nodes + Amber background stars
 * - Deterministic procedural distribution (stable across React re-renders)
 * - Proximity-linked analytical line segment network with smooth wave breathing
 * - Realtime mouse cursor attraction and depth parallax
 * - Additive blending with GPU attenuation for maximum visual immersion
 * ================================================================
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type NetworkData = {
  positions: Float32Array;
  originals: Float32Array;
  linePositions: Float32Array;
};

export const ParticleNetwork: React.FC = () => {
  const particleCount = 180;
  const dustCount = 80;
  const connectionDistance = 2.4;

  const particlesRef = useRef<THREE.Points>(null!);
  const dustRef = useRef<THREE.Points>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);

  /* Primary network geometry */
  const network = useMemo<NetworkData>(() => {
    const positions = new Float32Array(particleCount * 3);
    const originals = new Float32Array(particleCount * 3);

    let seed = 7919;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const x = (random() - 0.5) * 16;
      const y = (random() - 0.5) * 12;
      const z = (random() - 0.5) * 9;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      originals[i3] = x;
      originals[i3 + 1] = y;
      originals[i3 + 2] = z;
    }

    const lineArray: number[] = [];
    for (let i = 0; i < particleCount; i++) {
      const ix = originals[i * 3];
      const iy = originals[i * 3 + 1];
      const iz = originals[i * 3 + 2];

      for (let j = i + 1; j < particleCount; j++) {
        const jx = originals[j * 3];
        const jy = originals[j * 3 + 1];
        const jz = originals[j * 3 + 2];

        const dx = ix - jx;
        const dy = iy - jy;
        const dz = iz - jz;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < connectionDistance) {
          lineArray.push(ix, iy, iz, jx, jy, jz);
        }
      }
    }

    return {
      positions,
      originals,
      linePositions: new Float32Array(lineArray),
    };
  }, []);

  /* Ambient deep analytical dust (orange / amber starfield) */
  const dustPositions = useMemo(() => {
    const arr = new Float32Array(dustCount * 3);
    let seed = 4217;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < dustCount; i++) {
      arr[i * 3] = (random() - 0.5) * 20;
      arr[i * 3 + 1] = (random() - 0.5) * 15;
      arr[i * 3 + 2] = (random() - 0.5) * 12 - 3; // deeper in z
    }
    return arr;
  }, []);

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();

    if (particlesRef.current) {
      const particlePosition = particlesRef.current.geometry.attributes.position
        .array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const ox = network.originals[i3];
        const oy = network.originals[i3 + 1];
        const oz = network.originals[i3 + 2];

        particlePosition[i3] =
          ox + Math.sin(t * 0.18 + oy * 0.7) * 0.18 + mouse.x * 0.16;
        particlePosition[i3 + 1] =
          oy + Math.cos(t * 0.16 + ox * 0.5) * 0.16 + mouse.y * 0.1;
        particlePosition[i3 + 2] =
          oz + Math.sin(t * 0.13 + ox * 0.25) * 0.12;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (linesRef.current) {
      const linePosition = linesRef.current.geometry.attributes.position
        .array as Float32Array;

      for (let i = 0; i < linePosition.length; i += 6) {
        const ax = linePosition[i];
        const ay = linePosition[i + 1];
        const az = linePosition[i + 2];
        const bx = linePosition[i + 3];
        const by = linePosition[i + 4];
        const bz = linePosition[i + 5];

        const waveA = Math.sin(t * 0.12 + ax * 0.35) * 0.035;
        const waveB = Math.cos(t * 0.11 + bx * 0.35) * 0.035;

        linePosition[i] = ax + waveA;
        linePosition[i + 1] = ay + waveA * 0.5;
        linePosition[i + 2] = az;
        linePosition[i + 3] = bx + waveB;
        linePosition[i + 4] = by + waveB * 0.5;
        linePosition[i + 5] = bz;
      }
      linesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    /* Ambient slow drift for dust */
    if (dustRef.current) {
      dustRef.current.rotation.y = t * 0.015;
      dustRef.current.rotation.x = Math.sin(t * 0.02) * 0.05;
    }
  });

  return (
    <group>
      {/* Primary Data Nodes (Cyan) */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={network.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#36D9FF"
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Deep Analytical Dust (Orange/Amber) */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={dustCount}
            array={dustPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#FF7A30"
          transparent
          opacity={0.45}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Data Connection Line Network */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={network.linePositions.length / 3}
            array={network.linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#36D9FF"
          transparent
          opacity={0.11}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
};
export default ParticleNetwork;