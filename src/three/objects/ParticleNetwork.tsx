import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type NetworkData = {
  positions: Float32Array;
  originals: Float32Array;
  linePositions: Float32Array;
};

export const ParticleNetwork: React.FC = () => {
  const particleCount = 150;
  const connectionDistance = 2.35;

  const particlesRef = useRef<THREE.Points>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);

  const network = useMemo<NetworkData>(() => {
    const positions = new Float32Array(particleCount * 3);
    const originals = new Float32Array(particleCount * 3);

    /*
     * Deterministic pseudo-random generator.
     *
     * This prevents the background from changing randomly every
     * React render and makes the visual environment stable.
     */
    let seed = 7919;

    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      const x = (random() - 0.5) * 15;
      const y = (random() - 0.5) * 11;
      const z = (random() - 0.5) * 9;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      originals[i3] = x;
      originals[i3 + 1] = y;
      originals[i3 + 2] = z;
    }

    /*
     * Build a lightweight proximity network.
     *
     * Only nearby points are connected, avoiding a huge number
     * of lines and keeping the scene performant.
     */
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

        const distance = Math.sqrt(
          dx * dx + dy * dy + dz * dz,
        );

        if (distance < connectionDistance) {
          lineArray.push(
            ix,
            iy,
            iz,
            jx,
            jy,
            jz,
          );
        }
      }
    }

    return {
      positions,
      originals,
      linePositions: new Float32Array(lineArray),
    };
  }, []);

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();

    const particlePosition =
      particlesRef.current.geometry.attributes.position
        .array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      const originalX = network.originals[i3];
      const originalY = network.originals[i3 + 1];
      const originalZ = network.originals[i3 + 2];

      /*
       * Slow organic movement.
       */
      particlePosition[i3] =
        originalX +
        Math.sin(t * 0.18 + originalY * 0.7) * 0.18 +
        mouse.x * 0.16;

      particlePosition[i3 + 1] =
        originalY +
        Math.cos(t * 0.16 + originalX * 0.5) * 0.16 +
        mouse.y * 0.1;

      particlePosition[i3 + 2] =
        originalZ +
        Math.sin(t * 0.13 + originalX * 0.25) * 0.12;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate =
      true;

    /*
     * The connection network follows the same subtle movement.
     *
     * Since the lines are intentionally very faint, the effect
     * feels like a distant digital data field.
     */
    const linePosition =
      linesRef.current.geometry.attributes.position
        .array as Float32Array;

    for (let i = 0; i < linePosition.length; i += 6) {
      const ax = linePosition[i];
      const ay = linePosition[i + 1];
      const az = linePosition[i + 2];

      const bx = linePosition[i + 3];
      const by = linePosition[i + 4];
      const bz = linePosition[i + 5];

      /*
       * Keep the original network geometry stable while giving
       * the entire network a slow breathing motion.
       */
      const waveA = Math.sin(t * 0.12 + ax * 0.35) * 0.035;
      const waveB = Math.cos(t * 0.11 + bx * 0.35) * 0.035;

      linePosition[i] = ax + waveA;
      linePosition[i + 1] = ay + waveA * 0.5;
      linePosition[i + 2] = az;

      linePosition[i + 3] = bx + waveB;
      linePosition[i + 4] = by + waveB * 0.5;
      linePosition[i + 5] = bz;
    }

    linesRef.current.geometry.attributes.position.needsUpdate =
      true;
  });

  return (
    <group>
      {/* =====================================================
          PARTICLE FIELD
          ===================================================== */}

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
          size={0.075}
          color="#36D9FF"
          transparent
          opacity={0.72}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* =====================================================
          DATA CONNECTION NETWORK
          ===================================================== */}

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
          opacity={0.09}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
};