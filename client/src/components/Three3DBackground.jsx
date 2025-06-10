import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Animated floating particles component
function AnimatedStars({ count = 100, ...props }) {
    const ref = useRef();

    // Generate random positions for stars
    const positions = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return positions;
    }, [count]);

    // Animate the stars
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10;
            ref.current.rotation.y -= delta / 15;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#6366f1"
                    size={0.05}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.6}
                />
            </Points>
        </group>
    );
}

// Floating geometric shapes
function FloatingShapes() {
    const groupRef = useRef();

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Floating cubes */}
            <mesh position={[2, 1, -2]}>
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
            </mesh>

            <mesh position={[-2, -1, -1]}>
                <octahedronGeometry args={[0.4]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} />
            </mesh>

            <mesh position={[1, -2, 1]}>
                <tetrahedronGeometry args={[0.5]} />
                <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
            </mesh>

            <mesh position={[-1, 2, 0]}>
                <icosahedronGeometry args={[0.3]} />
                <meshBasicMaterial color="#f59e0b" transparent opacity={0.4} />
            </mesh>
        </group>
    );
}

// Main 3D background component
const Three3DBackground = ({ className = "" }) => {
    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`} style={{ zIndex: -1 }}>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 60 }}
                style={{ background: 'transparent' }}
            >
                <AnimatedStars count={150} />
                <FloatingShapes />
                <ambientLight intensity={0.5} />
            </Canvas>
        </div>
    );
};

export default Three3DBackground; 