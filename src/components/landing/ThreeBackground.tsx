'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06241b, 0.012);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 12, 40);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    currentMount.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(200, 200, 70, 70);
    geometry.rotateX(-Math.PI / 2);

    const vertices = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      if (x !== undefined && z !== undefined) {
          vertices[i + 1] = Math.sin(x / 12) * 4 + Math.cos(z / 10) * 3 + Math.sin((x + z) / 25) * 6;
      }
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshBasicMaterial({ 
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      const positions = plane.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        if (x !== undefined && z !== undefined) {
            positions[i + 1] = Math.sin((x + elapsedTime * 2.5) / 12) * 4 + 
                               Math.cos((z + elapsedTime * 2.5) / 10) * 3 + 
                               Math.sin((x + z - elapsedTime * 5) / 25) * 6;
        }
      }
      plane.geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
          currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none opacity-80 mix-blend-screen" />;
}