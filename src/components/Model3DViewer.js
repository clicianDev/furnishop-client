import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, PerspectiveCamera } from '@react-three/drei';

function Model({ modelPath }) {
  const { scene } = useGLTF(modelPath);
  return <primitive object={scene} />;
}

function Model3DViewer({ modelPath, className }) {
  return (
    <div className={className} style={{ width: '100%', height: '500px', position: 'relative' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 50], fov: 50 }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Model modelPath={modelPath} />
          </Stage>
        </Suspense>
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          autoRotate={false}
          minDistance={2}
          maxDistance={1000}
        />
      </Canvas>
    </div>
  );
}

export default Model3DViewer;
