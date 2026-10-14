import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { ParticleNetwork } from '../objects/ParticleNetwork';
import { DataSphere } from '../objects/DataSphere';

/**
 * Controls the entire 3D world.
 *
 * The world stays alive for the complete landing page.
 * Scrolling does NOT replace the scene.
 *
 * Instead, the camera/world responds subtly to scroll
 * so the user feels that they are travelling through one
 * continuous data environment.
 */
const SceneController: React.FC = () => {
  const { camera, viewport } = useThree();

  const scrollState = useRef({
    current: 0,
    target: 0,
  });

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();

    const documentHeight =
      document.documentElement.scrollHeight;

    const viewportHeight = window.innerHeight;

    const maxScroll = Math.max(
      documentHeight - viewportHeight,
      1,
    );

    const scrollProgress =
      window.scrollY / maxScroll;

    scrollState.current.target = scrollProgress;

    scrollState.current.current = THREE.MathUtils.lerp(
      scrollState.current.current,
      scrollState.current.target,
      0.035,
    );

    const progress = scrollState.current.current;

    /*
     * The camera never leaves the 3D environment.
     *
     * It only changes subtly as the page scrolls.
     */
    const targetCameraX =
      mouse.x * 0.16;

    const targetCameraY =
      mouse.y * -0.1 +
      Math.sin(progress * Math.PI * 2) * 0.06;

    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      targetCameraX,
      0.025,
    );

    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      targetCameraY,
      0.025,
    );

    /*
     * Very subtle camera depth movement.
     *
     * This is intentionally small so the content remains
     * readable and the 3D doesn't feel like a moving page.
     */
    const depth =
      7 +
      Math.sin(progress * Math.PI) * 0.28;

    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z,
      depth,
      0.02,
    );

    /*
     * Gentle continuous cinematic breathing.
     */
    camera.rotation.z =
      Math.sin(t * 0.08) * 0.0025;

    /*
     * Responsive field of view.
     */
    const targetFov =
      viewport.width < 6.5 ? 56 : 50;

    if (
      camera instanceof THREE.PerspectiveCamera
    ) {
      camera.fov = THREE.MathUtils.lerp(
        camera.fov,
        targetFov,
        0.03,
      );

      camera.updateProjectionMatrix();
    }
  });

  return null;
};

const SceneContent: React.FC = () => {
  return (
    <>
      <color
        attach="background"
        args={['#000000']}
      />

      <ambientLight intensity={0.32} />

      <directionalLight
        position={[8, 10, 6]}
        intensity={0.65}
        color="#36D9FF"
      />

      <pointLight
        position={[-7, -4, -4]}
        intensity={1.15}
        color="#FF7A30"
        distance={15}
      />

      <pointLight
        position={[6, 5, 3]}
        intensity={0.8}
        color="#8B5CF6"
        distance={14}
      />

      <pointLight
        position={[0, 0, 5]}
        intensity={0.35}
        color="#36D9FF"
        distance={10}
      />

      <Suspense fallback={null}>
        <ParticleNetwork />
        <DataSphere />
      </Suspense>

      <SceneController />
    </>
  );
};

export const HeroCanvas: React.FC = () => {
  return (
    <div
      className="absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden="true"
    >
      <Canvas
        camera={{
          position: [0, 0, 7],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }}
        dpr={[1, 1.5]}
        frameloop="always"
        resize={{
          scroll: false,
          debounce: {
            scroll: 0,
            resize: 100,
          },
        }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
};