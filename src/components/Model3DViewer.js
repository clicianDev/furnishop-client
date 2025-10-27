import React, { Suspense, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import './Model3DViewer.css';

const TEXTURES = [
  { name: 'Plywood', folder: 'plywood', baseColor: '/textures/plywood/basecolor.jpg' },
  { name: 'Dark Wood', folder: 'dark_wood', baseColor: '/textures/dark_wood/basecolor.jpg' },
  { name: 'Oak Veneer', folder: 'oak_veener', baseColor: '/textures/oak_veener/basecolor.jpg' },
  { name: 'Plywood Varnished', folder: 'plywood_varnished', baseColor: '/textures/plywood_varnished/basecolor.jpg' },
];

function Model({ modelPath, selectedTexture }) {
  const { scene } = useGLTF(modelPath);
  const texturePath = `/textures/${selectedTexture.folder}`;
  
  // Load base color with TextureLoader
  const colorMap = useLoader(THREE.TextureLoader, `${texturePath}/basecolor.jpg`);
  
  // Load EXR files with EXRLoader
  const normalMap = useLoader(EXRLoader, `${texturePath}/normal.exr`);
  const roughnessMap = useLoader(EXRLoader, `${texturePath}/roughness.exr`);

  React.useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: colorMap,
          normalMap: normalMap,
          roughnessMap: roughnessMap,
        });
        child.material.needsUpdate = true;
      }
    });
  }, [scene, colorMap, normalMap, roughnessMap]);

  return <primitive object={scene} />;
}

function Model3DViewer({ models, className, onModelChange, selectedModelIndex = 0 }) {
  const [currentModelIndex, setCurrentModelIndex] = useState(selectedModelIndex);
  const [selectedTexture, setSelectedTexture] = useState(TEXTURES[0]); // Default to plywood

  // Handle case when models is a single string (backward compatibility)
  const modelsList = typeof models === 'string' ? [{ modelUrl: models, variantName: 'Default' }] : (models || []);
  const currentModel = modelsList[currentModelIndex] || modelsList[0];

  const handleModelChange = (index) => {
    setCurrentModelIndex(index);
    if (onModelChange) {
      onModelChange(index);
    }
  };

  if (!currentModel) {
    return (
      <div className={className} style={{ width: '100%', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
        <p>No 3D model available</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%', height: '500px', position: 'relative' }}>
      {modelsList.length > 1 && (
        <div className="model-selector" style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block', fontSize: '14px' }}>
            Select Model Variant:
          </label>
          <select
            value={currentModelIndex}
            onChange={(e) => handleModelChange(parseInt(e.target.value))}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {modelsList.map((model, index) => (
              <option key={index} value={index}>
                {model.variantName || `Model ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Texture Selector */}
      <div className="texture-selector">
        <div className="texture-options-wrapper">
          <div className="texture-options">
            {TEXTURES.map((texture, index) => (
              <div
                key={index}
                className={`texture-option ${selectedTexture.folder === texture.folder ? 'selected' : ''}`}
                onClick={() => setSelectedTexture(texture)}
              >
                <div className="texture-image-wrapper">
                  <img
                    src={texture.baseColor}
                    alt={texture.name}
                    className="texture-image"
                  />
                </div>
                <span className="texture-name">{texture.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 50], fov: 50 }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Model modelPath={currentModel.modelUrl} selectedTexture={selectedTexture} />
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
