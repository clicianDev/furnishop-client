import React, { Suspense, useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
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

function ARScene({ modelPath, selectedTexture, isSessionActive }) {
  const reticleRef = useRef();
  const { gl } = useThree();
  const [models, setModels] = useState([]);
  const [reticleVisible, setReticleVisible] = useState(false);
  const hitTestSourceRef = useRef(null);
  const visibilityRef = useRef(false);
  const placementPositionRef = useRef(new THREE.Vector3());
  const placementEulerRef = useRef(new THREE.Euler());
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempEuler = useMemo(() => new THREE.Euler(), []);

  useEffect(() => {
    if (!isSessionActive) {
      hitTestSourceRef.current?.cancel?.();
      hitTestSourceRef.current = null;
      visibilityRef.current = false;
      setReticleVisible(false);
      return;
    }

    const session = gl.xr.getSession();
    if (!session) {
      return;
    }

    let cancelled = false;

    session
      .requestReferenceSpace('viewer')
      .then((viewerSpace) => {
        if (cancelled || !viewerSpace) {
          return undefined;
        }
        return session.requestHitTestSource({ space: viewerSpace });
      })
      .then((hitTestSource) => {
        if (cancelled || !hitTestSource) {
          hitTestSource?.cancel?.();
          return;
        }
        hitTestSourceRef.current = hitTestSource;
      })
      .catch((error) => {
        console.error('Failed to initialize AR hit testing:', error);
      });

    const handleSessionEnd = () => {
      hitTestSourceRef.current?.cancel?.();
      hitTestSourceRef.current = null;
      visibilityRef.current = false;
      setReticleVisible(false);
    };

    session.addEventListener('end', handleSessionEnd);

    return () => {
      cancelled = true;
      session.removeEventListener('end', handleSessionEnd);
      hitTestSourceRef.current?.cancel?.();
      hitTestSourceRef.current = null;
    };
  }, [gl, isSessionActive]);

  useFrame((state, _delta, frame) => {
    const reticle = reticleRef.current;
    if (!reticle) {
      return;
    }

    if (!isSessionActive || !frame) {
      if (visibilityRef.current) {
        visibilityRef.current = false;
        setReticleVisible(false);
      }
      return;
    }

    const hitTestSource = hitTestSourceRef.current;
    const referenceSpace = state.gl.xr.getReferenceSpace();

    if (!hitTestSource || !referenceSpace) {
      if (visibilityRef.current) {
        visibilityRef.current = false;
        setReticleVisible(false);
      }
      return;
    }

    const hits = frame.getHitTestResults(hitTestSource);
    if (!hits || hits.length === 0) {
      if (visibilityRef.current) {
        visibilityRef.current = false;
        setReticleVisible(false);
      }
      return;
    }

    const hit = hits[0];
    const pose = hit.getPose(referenceSpace);
    if (!pose) {
      if (visibilityRef.current) {
        visibilityRef.current = false;
        setReticleVisible(false);
      }
      return;
    }

    const { position, orientation } = pose.transform;

    reticle.position.set(position.x, position.y, position.z);
    tempQuaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
    tempEuler.setFromQuaternion(tempQuaternion, 'YXZ');

    placementEulerRef.current.set(0, tempEuler.y, 0);
    reticle.rotation.set(-Math.PI / 2, tempEuler.y, 0);

    placementPositionRef.current.set(position.x, position.y, position.z);

    if (!visibilityRef.current) {
      visibilityRef.current = true;
      setReticleVisible(true);
    }
  });

  const placeModel = useCallback(() => {
    if (!isSessionActive || !visibilityRef.current) {
      return;
    }

    const position = placementPositionRef.current;
    const rotation = placementEulerRef.current;

    setModels((prevModels) => ([
      ...prevModels,
      {
        id: Date.now(),
        position: [position.x, position.y, position.z],
        rotation: [rotation.x, rotation.y, rotation.z],
        scale: [0.5, 0.5, 0.5],
      },
    ]));
  }, [isSessionActive]);

  useEffect(() => {
    if (!isSessionActive) {
      return;
    }

    const session = gl.xr.getSession();
    if (!session) {
      return;
    }

    const handleSelect = () => placeModel();
    session.addEventListener('select', handleSelect);

    return () => session.removeEventListener('select', handleSelect);
  }, [gl, isSessionActive, placeModel]);

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
  const rendererRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (session) {
        session.end().catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    const checkARSupport = async () => {
      try {
        if (!navigator.xr) {
          setIsARSupported(false);
          setErrorMessage('WebXR is not available on this browser');
          return;
        }

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

    if (!rendererRef.current) {
      setStartError('Renderer is not ready yet. Please try again.');
      return;
    }

    if (!navigator.xr) {
      setStartError('WebXR is not available on this browser.');
      return;
    }

    try {
      setStartError('');
      setIsStartingAR(true);

      const existingSession = rendererRef.current.xr.getSession();
      if (existingSession) {
        setArSessionActive(true);
        return;
      }

      const sessionInit = {
        requiredFeatures: ['hit-test', 'local-floor'],
      };

      const session = await navigator.xr.requestSession('immersive-ar', sessionInit);

      const handleSessionEnd = () => {
        session.removeEventListener('end', handleSessionEnd);
        sessionRef.current = null;
        setArSessionActive(false);
      };
      session.addEventListener('end', handleSessionEnd);

      rendererRef.current.xr.setReferenceSpaceType('local-floor');
      await rendererRef.current.xr.setSession(session);

      sessionRef.current = session;
      setArSessionActive(true);
    } catch (error) {
      console.error('Failed to start AR session:', error);
      setStartError(error?.message || 'Failed to start AR session. Please try again.');
    } finally {
      setIsStartingAR(false);
    }
  };

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

  return (
    <div className="ar-container">
      <Canvas
        className="ar-canvas"
        camera={{ position: [0, 1.6, 3], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          gl.xr.setReferenceSpaceType('local-floor');
          rendererRef.current = gl;
        }}
      >
        <Suspense fallback={null}>
          <ARScene
            modelPath={currentModel.modelUrl}
            selectedTexture={selectedTexture}
            isSessionActive={arSessionActive}
          />
        </Suspense>
      </Canvas>

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
