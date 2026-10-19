/**
 * ================================================================
 * DataSphere.tsx — Multi-Layer Analytical Core & Orbital System
 * ================================================================
 * Effects added:
 * - Multi-layer analytical wireframe meshes (Cyan outer shell, Violet & Orange orbitals)
 * - Dynamic pulse breathing synced to elapsed frame time
 * - Responsive viewport adaptation (auto-repositions for mobile screens)
 * - Orbiting data satellite nodes that circle along the equatorial trajectory
 * - High-performance THREE.AdditiveBlending for maximum cyber radiance
 * ================================================================
 */

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const DataSphere: React.FC = () => {
  const { viewport } = useThree();

  const rootRef = useRef<THREE.Group>(null!);
  const outerSphereRef = useRef<THREE.Mesh>(null!);
  const innerCoreRef = useRef<THREE.Mesh>(null!);
  const ringRef1 = useRef<THREE.Mesh>(null!);
  const ringRef2 = useRef<THREE.Mesh>(null!);
  const ringRef3 = useRef<THREE.Mesh>(null!);
  const satelliteRef = useRef<THREE.Group>(null!);

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();
    const isMobile = viewport.width < 6.5;

    /* Responsive positioning so text remains crisp and readable */
    const targetX = isMobile ? 1.6 : 2.75;
    const targetY = isMobile ? -0.15 : 0.05;

    if (rootRef.current) {
      rootRef.current.position.x = THREE.MathUtils.lerp(
        rootRef.current.position.x,
        targetX,
        0.025
      );
      rootRef.current.position.y = THREE.MathUtils.lerp(
        rootRef.current.position.y,
        targetY,
        0.025
      );

      /* Controlled parallax */
      rootRef.current.rotation.y = THREE.MathUtils.lerp(
        rootRef.current.rotation.y,
        mouse.x * 0.14,
        0.035
      );
      rootRef.current.rotation.x = THREE.MathUtils.lerp(
        rootRef.current.rotation.x,
        mouse.y * -0.09,
        0.035
      );
    }

    /* Outer analytical wireframe sphere */
    if (outerSphereRef.current) {
      outerSphereRef.current.rotation.y = t * 0.12;
      outerSphereRef.current.rotation.x = t * 0.05;
      const pulse = 1 + Math.sin(t * 0.8) * 0.02;
      outerSphereRef.current.scale.setScalar(pulse);
    }

    /* Orange analytical core */
    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.y = -t * 0.24;
      innerCoreRef.current.rotation.x = t * 0.12;
      innerCoreRef.current.rotation.z = t * 0.15;
    }

    /* Orbital rings with counter-rotations */
    if (ringRef1.current) {
      ringRef1.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.45) * 0.15;
      ringRef1.current.rotation.y = t * 0.2;
      ringRef1.current.rotation.z = Math.sin(t * 0.3) * 0.08;
    }

    if (ringRef2.current) {
      ringRef2.current.rotation.x = -Math.PI / 4 + Math.cos(t * 0.35) * 0.15;
      ringRef2.current.rotation.y = -t * 0.17;
      ringRef2.current.rotation.z = t * 0.08;
    }

    if (ringRef3.current) {
      ringRef3.current.rotation.x = Math.PI / 2.5 + Math.sin(t * 0.2) * 0.1;
      ringRef3.current.rotation.y = t * 0.09;
      ringRef3.current.rotation.z = -t * 0.05;
    }

    /* Orbiting satellite group */
    if (satelliteRef.current) {
      satelliteRef.current.rotation.y = t * 0.45;
      satelliteRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
  });

  return (
    <group ref={rootRef}>
      {/* Outer Data Geodesic Sphere */}
      <mesh ref={outerSphereRef}>
        <sphereGeometry args={[2.25, 32, 24]} />
        <meshBasicMaterial
          color="#36D9FF"
          wireframe
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Secondary Inner Data Shell */}
      <mesh rotation={[0.35, 0.2, 0]}>
        <icosahedronGeometry args={[1.72, 2]} />
        <meshBasicMaterial
          color="#36D9FF"
          wireframe
          transparent
          opacity={0.085}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Analytical Core */}
      <mesh ref={innerCoreRef}>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshBasicMaterial
          color="#FF7A30"
          wireframe
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Core Atmospheric Glow */}
      <mesh scale={0.75}>
        <sphereGeometry args={[1.05, 24, 24]} />
        <meshBasicMaterial
          color="#FF7A30"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbital Ring 01 — Analytics Violet */}
      <mesh ref={ringRef1}>
        <torusGeometry args={[2.9, 0.018, 12, 160]} />
        <meshBasicMaterial
          color="#8B5CF6"
          transparent
          opacity={0.58}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbital Ring 02 — Data Cyan */}
      <mesh ref={ringRef2}>
        <torusGeometry args={[3.3, 0.022, 12, 160]} />
        <meshBasicMaterial
          color="#36D9FF"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Large Outer Orbit — Accent Orange */}
      <mesh ref={ringRef3}>
        <torusGeometry args={[3.8, 0.014, 10, 180]} />
        <meshBasicMaterial
          color="#FF7A30"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbiting Satellite Data Nodes */}
      <group ref={satelliteRef}>
        <mesh position={[2.6, 0.4, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial
            color="#36D9FF"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[-2.4, -0.3, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial
            color="#FF7A30"
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 2.7, 0.2]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial
            color="#8B5CF6"
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Central Super-Node */}
      <mesh scale={0.14}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default DataSphere;