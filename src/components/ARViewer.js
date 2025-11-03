import React, { Suspense, useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { XR, useXRHitTest, createXRStore, useXR } from '@react-three/xr';
import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { useLoader } from '@react-three/fiber';
import './ARViewer.css';

const patchWebXRHitTestSource = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const XRSessionConstructor = window.XRSession;
  if (!XRSessionConstructor) {
    return;
  }

  const proto = XRSessionConstructor.prototype;
  if (!proto || proto.__furnishopPatchedRequestHitTestSource) {
    return;
  }

  const originalRequestHitTestSource = proto.requestHitTestSource;
  if (typeof originalRequestHitTestSource !== 'function') {
    return;
  }

  proto.requestHitTestSource = function patchedRequestHitTestSource(options) {
    if (options && typeof options === 'object' && 'entityTypes' in options) {
      const { entityTypes, ...rest } = options;
      return originalRequestHitTestSource.call(this, rest);
    }
    return originalRequestHitTestSource.call(this, options);
  };

  proto.__furnishopPatchedRequestHitTestSource = true;
};

patchWebXRHitTestSource();

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
  const [reticleVisible, setReticleVisible] = useState(false);
  const hitMatrix = useMemo(() => new THREE.Matrix4(), []);
  const reticlePosition = useMemo(() => new THREE.Vector3(), []);
  const reticleQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const reticleScale = useMemo(() => new THREE.Vector3(), []);
  const reticleEuler = useMemo(() => new THREE.Euler(), []);
  const visibilityRef = useRef(false);
  const session = useXR((state) => state.session);

  // Hit testing for surface detection
  useXRHitTest((results, getWorldMatrix) => {
    const reticle = reticleRef.current;
    if (!reticle) {
      return;
    }

    const hasHit = Array.isArray(results) && results.length > 0;

    if (visibilityRef.current !== hasHit) {
      visibilityRef.current = hasHit;
      setReticleVisible(hasHit);
    }

    if (!hasHit) {
      return;
    }

    getWorldMatrix(hitMatrix, results[0]);
    hitMatrix.decompose(reticlePosition, reticleQuaternion, reticleScale);

    reticle.position.copy(reticlePosition);
    reticle.quaternion.copy(reticleQuaternion);
    reticle.scale.setScalar(1);
  }, 'viewer');

  const placeModel = useCallback(() => {
    if (!visibilityRef.current) {
      return;
    }

    const rotation = reticleEuler.setFromQuaternion(reticleQuaternion, 'YXZ');

    setModels((prevModels) => ([
      ...prevModels,
      {
        id: Date.now(),
        position: [reticlePosition.x, reticlePosition.y, reticlePosition.z],
        rotation: [rotation.x, rotation.y, rotation.z],
        scale: [0.5, 0.5, 0.5],
      },
    ]));
  }, [reticleEuler, reticlePosition, reticleQuaternion]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const handleSelect = () => placeModel();
    session.addEventListener('select', handleSelect);

    return () => session.removeEventListener('select', handleSelect);
  }, [session, placeModel]);


  return (
    <>
      {/* AR Lighting */}
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
      <hemisphereLight intensity={0.5} groundColor="#444" />

      {/* Reticle (placement indicator) */}
      <mesh ref={reticleRef} visible={reticleVisible} onClick={placeModel} onPointerDown={placeModel}>
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshBasicMaterial color="#E17100" opacity={0.9} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

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
  const [isStartingAR, setIsStartingAR] = useState(false);
  const [startError, setStartError] = useState('');
  const xrStore = useMemo(() => createXRStore({
    hitTest: true,
    domOverlay: true,
    emulate: false,
    offerSession: false,
  }), []);

  useEffect(() => () => xrStore.destroy(), [xrStore]);

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

  const handleEnterAR = async () => {
    if (isStartingAR) {
      return;
    }

    try {
      setStartError('');
      setIsStartingAR(true);
      await xrStore.enterAR();
    } catch (error) {
      console.error('Failed to start AR session:', error);
      setStartError('Failed to start AR session. Please try again.');
    } finally {
      setIsStartingAR(false);
    }
  };

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
        camera={{ position: [0, 1.6, 3], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
        }}
      >
        <XR
          store={xrStore}
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
            <button
              type="button"
              className="ar-enter-button"
              onClick={handleEnterAR}
              disabled={isStartingAR}
            >
              {isStartingAR ? 'Starting AR...' : 'Enter AR'}
            </button>
            {startError && <p className="ar-error-text">{startError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default ARViewer;
