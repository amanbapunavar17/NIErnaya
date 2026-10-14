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

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();

    const isMobile = viewport.width < 6.5;

    /*
     * Keep the main object in the right side of the composition.
     * On mobile it moves closer to the center so it doesn't
     * overwhelm the text.
     */
    const targetX = isMobile ? 1.8 : 2.7;
    const targetY = isMobile ? -0.15 : 0.05;

    rootRef.current.position.x = THREE.MathUtils.lerp(
      rootRef.current.position.x,
      targetX,
      0.025,
    );

    rootRef.current.position.y = THREE.MathUtils.lerp(
      rootRef.current.position.y,
      targetY,
      0.025,
    );

    /*
     * Subtle mouse parallax.
     *
     * It is deliberately restrained because this is a
     * background environment, not an interactive object.
     */
    rootRef.current.rotation.y = THREE.MathUtils.lerp(
      rootRef.current.rotation.y,
      mouse.x * 0.12,
      0.035,
    );

    rootRef.current.rotation.x = THREE.MathUtils.lerp(
      rootRef.current.rotation.x,
      mouse.y * -0.08,
      0.035,
    );

    /* Main analytical sphere */
    if (outerSphereRef.current) {
      outerSphereRef.current.rotation.y = t * 0.13;
      outerSphereRef.current.rotation.x = t * 0.055;

      const pulse = 1 + Math.sin(t * 0.8) * 0.018;

      outerSphereRef.current.scale.setScalar(pulse);
    }

    /* Orange analytical core */
    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.y = -t * 0.25;
      innerCoreRef.current.rotation.x = t * 0.12;
      innerCoreRef.current.rotation.z = t * 0.16;
    }

    /* Primary orbital ring */
    if (ringRef1.current) {
      ringRef1.current.rotation.x =
        Math.PI / 3 + Math.sin(t * 0.45) * 0.16;

      ringRef1.current.rotation.y = t * 0.22;
      ringRef1.current.rotation.z = Math.sin(t * 0.3) * 0.08;
    }

    /* Secondary orbital ring */
    if (ringRef2.current) {
      ringRef2.current.rotation.x =
        -Math.PI / 4 + Math.cos(t * 0.35) * 0.16;

      ringRef2.current.rotation.y = -t * 0.18;
      ringRef2.current.rotation.z = t * 0.08;
    }

    /* Very large outer orbit */
    if (ringRef3.current) {
      ringRef3.current.rotation.x =
        Math.PI / 2.5 + Math.sin(t * 0.22) * 0.1;

      ringRef3.current.rotation.y = t * 0.09;
      ringRef3.current.rotation.z = -t * 0.06;
    }
  });

  return (
    <group ref={rootRef}>
      {/* =====================================================
          OUTER DATA SPHERE
          ===================================================== */}

      <mesh ref={outerSphereRef}>
        <sphereGeometry args={[2.25, 32, 24]} />

        <meshBasicMaterial
          color="#36D9FF"
          wireframe
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* =====================================================
          SECONDARY INNER DATA SHELL
          ===================================================== */}

      <mesh rotation={[0.35, 0.2, 0]}>
        <icosahedronGeometry args={[1.72, 2]} />

        <meshBasicMaterial
          color="#36D9FF"
          wireframe
          transparent
          opacity={0.075}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* =====================================================
          ORANGE ANALYTICAL CORE
          ===================================================== */}

      <mesh ref={innerCoreRef}>
        <icosahedronGeometry args={[1.05, 2]} />

        <meshBasicMaterial
          color="#FF7A30"
          wireframe
          transparent
          opacity={0.72}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Core glow */}
      <mesh scale={0.72}>
        <sphereGeometry args={[1.05, 24, 24]} />

        <meshBasicMaterial
          color="#FF7A30"
          transparent
          opacity={0.045}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* =====================================================
          ORBIT 01
          ===================================================== */}

      <mesh ref={ringRef1}>
        <torusGeometry args={[2.9, 0.018, 12, 160]} />

        <meshBasicMaterial
          color="#8B5CF6"
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* =====================================================
          ORBIT 02
          ===================================================== */}

      <mesh ref={ringRef2}>
        <torusGeometry args={[3.3, 0.022, 12, 160]} />

        <meshBasicMaterial
          color="#36D9FF"
          transparent
          opacity={0.48}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* =====================================================
          LARGE OUTER ORBIT
          ===================================================== */}

      <mesh ref={ringRef3}>
        <torusGeometry args={[3.75, 0.012, 10, 180]} />

        <meshBasicMaterial
          color="#FF7A30"
          transparent
          opacity={0.24}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* =====================================================
          CENTRAL DATA NODE
          ===================================================== */}

      <mesh scale={0.12}>
        <sphereGeometry args={[1, 16, 16]} />

        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};