import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { XR, Interactive, useXRHitTest } from '@react-three/xr';
import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { useLoader } from '@react-three/fiber';
import './ARViewer.css';

function Model({ modelPath, selectedTexture, position, rotation, scale }) {
  const { scene } = useGLTF(modelPath);
  const texturePath = `/textures/${selectedTexture.folder}`;
  
  // Load textures
  const colorMap = useLoader(THREE.TextureLoader, `${texturePath}/basecolor.jpg`);
  const normalMap = useLoader(EXRLoader, `${texturePath}/normal.exr`);
  const roughnessMap = useLoader(EXRLoader, `${texturePath}/roughness.exr`);

  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  React.useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const materialName = child.material.name ? child.material.name.toLowerCase() : '';

        if (materialName === 'base' || materialName === 'part1' || materialName === 'part2' || materialName === 'part3' || materialName === 'part4') {
          if (child.material.isMeshStandardMaterial) {
            child.material.map = colorMap;
            child.material.normalMap = normalMap;
            child.material.roughnessMap = roughnessMap;
            child.material.needsUpdate = true;
          } else {
            const newMaterial = new THREE.MeshStandardMaterial({
              map: colorMap,
              normalMap: normalMap,
              roughnessMap: roughnessMap,
            });
            newMaterial.name = 'base';
            child.material = newMaterial;
          }
        }
      }
    });
  }, [clonedScene, colorMap, normalMap, roughnessMap]);

  return (
    <primitive 
      object={clonedScene} 
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

function ARModel({ modelPath, selectedTexture }) {
  const reticleRef = useRef();
  const [models, setModels] = useState([]);

  useXRHitTest((hitMatrix, hit) => {
    if (reticleRef.current) {
      hitMatrix.decompose(
        reticleRef.current.position,
        reticleRef.current.quaternion,
        reticleRef.current.scale
      );
      reticleRef.current.rotation.set(-Math.PI / 2, 0, 0);
    }
  });

  const placeModel = (e) => {
    if (reticleRef.current) {
      const position = reticleRef.current.position.clone();
      const rotation = [reticleRef.current.rotation.x, reticleRef.current.rotation.y, reticleRef.current.rotation.z];
      
      setModels([...models, {
        id: Date.now(),
        position: [position.x, position.y, position.z],
        rotation: rotation,
        scale: [1, 1, 1]
      }]);
    }
  };

  return (
    <>
      {/* AR Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Reticle (placement indicator) */}
      <Interactive onSelect={placeModel}>
        <mesh ref={reticleRef} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.15, 0.2, 32]} />
          <meshBasicMaterial color="#ffffff" opacity={0.8} transparent side={THREE.DoubleSide} />
        </mesh>
      </Interactive>

      {/* Placed models */}
      {models.map((model) => (
        <Suspense key={model.id} fallback={null}>
          <Model
            modelPath={modelPath}
            selectedTexture={selectedTexture}
            position={model.position}
            rotation={model.rotation}
            scale={model.scale}
          />
        </Suspense>
      ))}
    </>
  );
}

function ARViewer({ models, selectedTexture, onARControlsReady }) {
  const [isARSupported, setIsARSupported] = useState(true);
  const [arStarted, setArStarted] = useState(false);

  useEffect(() => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setIsARSupported(supported);
      });
    } else {
      setIsARSupported(false);
    }
  }, []);

  const modelsList = typeof models === 'string' ? [{ modelUrl: models, variantName: 'Default' }] : (models || []);
  const currentModel = modelsList[0]; // Use first model for AR

  if (!isARSupported) {
    return (
      <div className="ar-not-supported">
        <div className="ar-message">
          <span className="ar-icon">📱</span>
          <h3>AR Not Available</h3>
          <p>WebXR AR is not supported on this device.</p>
          <small>AR requires a compatible mobile device with ARCore (Android) or ARKit (iOS)</small>
        </div>
      </div>
    );
  }

  if (!currentModel) {
    return (
      <div className="ar-not-supported">
        <div className="ar-message">
          <span className="ar-icon">📦</span>
          <h3>No Model Available</h3>
          <p>3D model is required for AR view</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas>
        <XR
          referenceSpace="local-floor"
          onSessionStart={() => setArStarted(true)}
          onSessionEnd={() => setArStarted(false)}
        >
          <Suspense fallback={null}>
            <ARModel 
              modelPath={currentModel.modelUrl} 
              selectedTexture={selectedTexture}
            />
          </Suspense>
        </XR>
      </Canvas>

      {/* AR Instructions Overlay */}
      {!arStarted && (
        <div className="ar-instructions">
          <div className="ar-instruction-content">
            <h3>🎯 AR Mode Ready</h3>
            <p>Tap the "Start AR" button below to begin</p>
            <ul className="ar-steps">
              <li>Point your camera at a flat surface</li>
              <li>Wait for the placement indicator</li>
              <li>Tap the screen to place the furniture</li>
              <li>Rotate and scale with gestures</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ARViewer;
