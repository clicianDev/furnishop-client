import React, { Suspense, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import './Model3DViewer.css';

const TEXTURES = [
  { 
    name: 'Plywood', 
    folder: 'plywood', 
    baseColor: '/textures/plywood/basecolor.jpg',
    woodType: 'Plywood',
    finish: 'Clear Gloss Varnish'
  },
  { 
    name: 'Dark Wood', 
    folder: 'dark_wood', 
    baseColor: '/textures/dark_wood/basecolor.jpg',
    woodType: 'Dark Wood',
    finish: 'Natural Varnish'
  },
  { 
    name: 'Oak Veneer', 
    folder: 'oak_veener', 
    baseColor: '/textures/oak_veener/basecolor.jpg',
    woodType: 'Oak Veneer',
    finish: 'Plain'
  },
  { 
    name: 'Plywood Varnish', 
    folder: 'plywood_varnished', 
    baseColor: '/textures/plywood_varnished/basecolor.jpg',
    woodType: 'Plywood',
    finish: 'Natural Varnish'
  },
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
      if (child.isMesh && child.material) {
        // Check if the material name is "base" (case-insensitive)
        const materialName = child.material.name ? child.material.name.toLowerCase() : '';

        if (materialName === 'base' || materialName === 'part1' || materialName === 'part2' || materialName === 'part3' || materialName === 'part4') {
          // Update existing material or create new one
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
  }, [scene, colorMap, normalMap, roughnessMap]);

  return <primitive object={scene} />;
}

function Model3DViewer({ models, className, onModelChange, onTextureChange, selectedModelIndex = 0 }) {
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

  const handleTextureChange = (texture) => {
    setSelectedTexture(texture);
    if (onTextureChange) {
      onTextureChange(texture);
    }
  };

  if (!currentModel) {
    return (
      <div className={className} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
        <p>No 3D model available</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {modelsList.length > 1 && (
        <div className="model-selector" style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.85)',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block', fontSize: '14px', color: 'white' }}>
            Select Model Variant:
          </label>
          <select
            value={currentModelIndex}
            onChange={(e) => handleModelChange(parseInt(e.target.value))}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '14px',
              cursor: 'pointer',
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'white'
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
                onClick={() => handleTextureChange(texture)}
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
