"use client";

import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, Grid, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { PieceType } from "@/types/pieces";

interface Piece3DProps {
  type: PieceType;
  diameterBig: number;
  diameterSmall: number;
  height: number;
}

function PieceMesh({ type, diameterBig, diameterSmall, height }: Piece3DProps) {
  const geometry = useMemo(() => {
    const R = diameterBig / 2;
    const r = diameterSmall / 2;
    const h = height;
    const segments = 64;
    const offset = type === "cone-excentrico" ? R - r : 0;

    const vertices: number[] = [];
    const indices: number[] = [];

    // Gerar pontos da base e do topo
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Ponto da base (z=0)
      vertices.push(R * cos, 0, R * sin);
      // Ponto do topo (z=h)
      vertices.push(offset + r * cos, h, r * sin);
    }

    // Gerar faces (triângulos)
    for (let i = 0; i < segments; i++) {
      const b1 = i * 2;
      const t1 = i * 2 + 1;
      const b2 = (i + 1) * 2;
      const t2 = (i + 1) * 2 + 1;

      // Face lateral 1
      indices.push(b1, t1, b2);
      // Face lateral 2
      indices.push(t1, t2, b2);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, [type, diameterBig, diameterSmall, height]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}> {/* Deitar a peça na grade */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#1f6feb"
          side={THREE.DoubleSide}
          roughness={0.3}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Wireframe para ver a estrutura */}
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#58a6ff" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export default function Piece3D(props: Piece3DProps) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "400px", background: "#050810", borderRadius: "8px" }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[800, 800, 800]} />
        <OrbitControls makeDefault minDistance={100} maxDistance={3000} />
        
        <Stage adjustCamera={1.5} intensity={0.5} environment="city">
            <PieceMesh {...props} />
        </Stage>

        <Grid
          infiniteGrid
          cellSize={100}
          sectionSize={500}
          fadeDistance={2000}
          fadeStrength={5}
          sectionColor="#1f6feb"
          cellColor="#30363d"
        />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[1000, 1000, 1000]} intensity={1} castShadow />
      </Canvas>
    </div>
  );
}
