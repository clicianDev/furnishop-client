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
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS devices
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    if (iOS) {
      // iOS devices support AR through AR Quick Look
      setIsARSupported(true);
    } else if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setIsARSupported(supported);
      });
    } else {
      setIsARSupported(false);
    }
  }, []);

  const modelsList = typeof models === 'string' ? [{ modelUrl: models, variantName: 'Default' }] : (models || []);
  const currentModel = modelsList[0]; // Use first model for AR

  if (!isARSupported && !isIOS) {
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

  // iOS AR Quick Look Support
  if (isIOS) {
    return (
      <div className="ar-ios-container">
        <div className="ar-ios-content">
          <div className="ar-ios-preview">
            <span className="ar-icon" style={{ fontSize: '80px' }}>🪑</span>
            <h3>iOS AR Support</h3>
            <p>AR viewing on iOS is available</p>
          </div>
          
          {/* Check if model is USDZ format for AR Quick Look */}
          {currentModel.modelUrl && currentModel.modelUrl.endsWith('.usdz') ? (
            <>
              <a
                href={currentModel.modelUrl}
                rel="ar"
                className="ar-quicklook-button"
              >
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEyIDJMMyA3djEwbDkgNSA5LTVWN3ptMCAxOGwtNy0zLjg5VjguMTFMMTIgNGw3IDQuMTF2Ny45OXoiIGZpbGw9IndoaXRlIi8+PC9zdmc+"
                  alt="AR"
                />
                View in AR (AR Quick Look)
              </a>
              <small className="ar-ios-note">
                Requires iOS 12+ with ARKit support
              </small>
            </>
          ) : (
            <>
              <div className="ar-ios-info">
                <p style={{ marginBottom: '15px' }}>
                  For full AR experience on iOS, please use:
                </p>
                <ul style={{ textAlign: 'left', padding: '0 20px', fontSize: '14px', lineHeight: '1.8' }}>
                  <li>Safari browser with WebXR Viewer extension</li>
                  <li>Or convert model to USDZ format for AR Quick Look</li>
                </ul>
              </div>
              <small className="ar-ios-note">
                Currently viewing GLB model. Switch to 3D view for interactive preview.
              </small>
            </>
          )}
        </div>
      </div>
    );
  }

  // Android WebXR Support
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* AR Instructions Overlay - Render before Canvas for proper z-index stacking */}
      {/* {!arStarted && (
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
      )} */}
      
      <Canvas style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
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
    </div>
  );
}

export default ARViewer;
