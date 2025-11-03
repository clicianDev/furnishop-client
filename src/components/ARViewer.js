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

function ARScene({ modelPath, selectedTexture }) {
  const reticleRef = useRef();
  const [models, setModels] = useState([]);
  const [reticleVisible, setReticleVisible] = useState(true);

  // Hit testing for surface detection
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
        scale: [0.5, 0.5, 0.5] // Adjusted scale for better AR experience
      }]);
    }
  };

  return (
    <>
      {/* AR Lighting */}
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
      <hemisphereLight intensity={0.5} groundColor="#444" />

      {/* Reticle (placement indicator) */}
      {reticleVisible && (
        <Interactive onSelect={placeModel}>
          <mesh ref={reticleRef} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.15, 0.2, 32]} />
            <meshBasicMaterial color="#E17100" opacity={0.9} transparent side={THREE.DoubleSide} />
          </mesh>
        </Interactive>
      )}

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

function ARViewer({ models, selectedTexture }) {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isCheckingSupport, setIsCheckingSupport] = useState(true);
  const [arSessionActive, setArSessionActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const checkARSupport = async () => {
      try {
        // Check if navigator.xr exists
        if (!navigator.xr) {
          setIsARSupported(false);
          setErrorMessage('WebXR is not available on this browser');
          setIsCheckingSupport(false);
          return;
        }

        // Check for immersive-ar support
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        setIsARSupported(supported);
        
        if (!supported) {
          setErrorMessage('AR mode is not supported on this device');
        }
      } catch (error) {
        console.error('Error checking AR support:', error);
        setIsARSupported(false);
        setErrorMessage('Unable to check AR support');
      } finally {
        setIsCheckingSupport(false);
      }
    };

    checkARSupport();
  }, []);

  const modelsList = typeof models === 'string' ? [{ modelUrl: models, variantName: 'Default' }] : (models || []);
  const currentModel = modelsList[0];

  // Show loading state while checking support
  if (isCheckingSupport) {
    return (
      <div className="ar-container">
        <div className="ar-message-wrapper">
          <div className="ar-spinner"></div>
          <p className="ar-message-text">Checking AR support...</p>
        </div>
      </div>
    );
  }

  // Check if model exists
  if (!currentModel || !currentModel.modelUrl) {
    return (
      <div className="ar-container">
        <div className="ar-message-wrapper">
          <span className="ar-icon">📦</span>
          <h3 className="ar-message-title">No Model Available</h3>
          <p className="ar-message-text">3D model is required for AR experience</p>
        </div>
      </div>
    );
  }

  // AR not supported
  if (!isARSupported) {
    return (
      <div className="ar-container">
        <div className="ar-message-wrapper">
          <span className="ar-icon">📱</span>
          <h3 className="ar-message-title">AR Not Available</h3>
          <p className="ar-message-text">{errorMessage}</p>
          <div className="ar-requirements">
            <p className="ar-requirements-title">Requirements:</p>
            <ul className="ar-requirements-list">
              <li>Android device with ARCore support</li>
              <li>Chrome browser (version 79+)</li>
              <li>Or iOS device with WebXR Viewer app</li>
            </ul>
          </div>
          <a 
            href="https://developers.google.com/ar/devices" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ar-help-link"
          >
            Check device compatibility →
          </a>
        </div>
      </div>
    );
  }

  // AR is supported - show AR viewer with Enter AR button
  return (
    <div className="ar-container">
      <Canvas
        className="ar-canvas"
        gl={{ 
          xr: { 
            enabled: true,
            referenceSpaceType: 'local-floor'
          }
        }}
        onCreated={({ gl }) => {
          // Enable XR on the renderer
          gl.xr.enabled = true;
        }}
      >
        <XR
          referenceSpace="local-floor"
          onSessionStart={() => {
            console.log('AR Session Started');
            setArSessionActive(true);
          }}
          onSessionEnd={() => {
            console.log('AR Session Ended');
            setArSessionActive(false);
          }}
        >
          <Suspense fallback={null}>
            <ARScene 
              modelPath={currentModel.modelUrl} 
              selectedTexture={selectedTexture}
            />
          </Suspense>
        </XR>
      </Canvas>

      {/* AR Instructions Overlay - Show when not in AR session */}
      {!arSessionActive && (
        <div className="ar-instructions-overlay">
          <div className="ar-instructions-content">
            <span className="ar-icon-large">🎯</span>
            <h3 className="ar-instructions-title">Ready for AR</h3>
            <p className="ar-instructions-subtitle">Tap "Enter AR" below to start</p>
            <div className="ar-steps">
              <div className="ar-step">
                <span className="ar-step-number">1</span>
                <span className="ar-step-text">Point camera at flat surface</span>
              </div>
              <div className="ar-step">
                <span className="ar-step-number">2</span>
                <span className="ar-step-text">Wait for orange ring indicator</span>
              </div>
              <div className="ar-step">
                <span className="ar-step-number">3</span>
                <span className="ar-step-text">Tap screen to place furniture</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ARViewer;
