'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 800

function Particles({ phase }: { phase: 'loading' | 'success' | 'error' }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 10,
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.004,
        (Math.random() - 0.5) * 0.004,
        (Math.random() - 0.5) * 0.002,
      ),
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.7,
    }))
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    particles.forEach((p, i) => {
      if (phase === 'loading') {
        // Slow orbital drift
        p.pos.x += Math.sin(t * 0.3 + p.phase) * 0.003 * p.speed
        p.pos.y += Math.cos(t * 0.2 + p.phase) * 0.002 * p.speed
        p.pos.z += Math.sin(t * 0.15 + p.phase) * 0.001
      } else if (phase === 'success') {
        // Converge then explode
        const dist = p.pos.length()
        if (dist > 0.5) {
          p.pos.multiplyScalar(0.94)
        } else {
          p.pos.x += (Math.random() - 0.5) * 0.8
          p.pos.y += (Math.random() - 0.5) * 0.8
          p.pos.z += (Math.random() - 0.5) * 0.4
        }
      } else {
        // Error — slow drift, no excitement
        p.pos.addScaledVector(p.vel, 0.3)
      }

      // Wrap bounds
      if (Math.abs(p.pos.x) > 11) p.pos.x *= -0.9
      if (Math.abs(p.pos.y) > 7)  p.pos.y *= -0.9
      if (Math.abs(p.pos.z) > 6)  p.pos.z *= -0.9

      dummy.position.copy(p.pos)
      dummy.scale.setScalar(0.015 + Math.sin(t * p.speed + p.phase) * 0.005)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  const color = phase === 'error' ? '#EF4444' : '#86EFAC'

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color={color} transparent opacity={phase === 'error' ? 0.35 : 0.55} />
    </instancedMesh>
  )
}

interface ParticleFieldProps {
  phase: 'loading' | 'success' | 'error'
}

export function ParticleField({ phase }: ParticleFieldProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 70 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Particles phase={phase} />
      </Canvas>
    </div>
  )
}
