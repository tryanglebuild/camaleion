'use client'
import { useRef, useMemo, useState, useCallback, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Line } from '@react-three/drei'
import * as THREE from 'three'

interface Node {
  id: string
  name: string
  type: 'person' | 'project'
  color: string
}

interface Edge {
  from: string
  to: string
  weight: number
}

interface SimNode extends Node {
  pos: THREE.Vector3
  vel: THREE.Vector3
}

const AVATAR_COLORS = ['#3B82F6','#8B5CF6','#EC4899','#10B981','#F59E0B','#06B6D4','#EF4444','#6366F1']

function hashColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return AVATAR_COLORS[h % 8]
}

function NodeMesh({ node, onClick }: { node: SimNode; onClick: (id: string) => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <group position={node.pos}>
      <mesh
        onClick={() => onClick(node.id)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {node.type === 'person'
          ? <sphereGeometry args={[hovered ? 0.2 : 0.16, 12, 12]} />
          : <boxGeometry args={[hovered ? 0.32 : 0.26, hovered ? 0.32 : 0.26, hovered ? 0.32 : 0.26]} />
        }
        <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={hovered ? 0.5 : 0.15} />
      </mesh>
      {hovered && (
        <Html center distanceFactor={6} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: '#111', border: '1px solid #2A2A2A',
            padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap',
            fontFamily: 'monospace', fontSize: 10, color: '#F4F4F5',
          }}>{node.name}</div>
        </Html>
      )}
    </group>
  )
}

function Graph({ nodes, edges, onNodeClick }: { nodes: SimNode[]; edges: Edge[]; onNodeClick: (id: string) => void }) {
  useFrame(() => {
    // Simple force simulation
    nodes.forEach(n => {
      // Repulsion
      nodes.forEach(m => {
        if (m.id === n.id) return
        const diff = n.pos.clone().sub(m.pos)
        const dist = Math.max(diff.length(), 0.5)
        diff.normalize().multiplyScalar(0.012 / (dist * dist))
        n.vel.add(diff)
      })
      // Attraction to center
      n.vel.addScaledVector(n.pos, -0.003)
    })

    // Edge springs
    edges.forEach(e => {
      const a = nodes.find(n => n.id === e.from)
      const b = nodes.find(n => n.id === e.to)
      if (!a || !b) return
      const diff = b.pos.clone().sub(a.pos)
      const dist = diff.length()
      const force = (dist - 2.5) * 0.02 * e.weight
      diff.normalize().multiplyScalar(force)
      a.vel.add(diff)
      b.vel.sub(diff)
    })

    // Apply velocity with damping
    nodes.forEach(n => {
      n.vel.multiplyScalar(0.88)
      n.pos.add(n.vel)
    })
  })

  return (
    <>
      {edges.map((e, i) => {
        const a = nodes.find(n => n.id === e.from)
        const b = nodes.find(n => n.id === e.to)
        if (!a || !b) return null
        return (
          <Line
            key={i}
            points={[a.pos.clone(), b.pos.clone()]}
            color="#2A2A2A"
            lineWidth={1}
            transparent
            opacity={0.3 + e.weight * 0.5}
          />
        )
      })}
      {nodes.map(node => (
        <NodeMesh key={node.id} node={node} onClick={onNodeClick} />
      ))}
    </>
  )
}

interface NetworkGraph3DProps {
  people: { id: string; name: string }[]
  projects: { id: string; name: string }[]
  edges: { personId: string; projectId: string; count: number }[]
  onPersonClick?: (id: string) => void
  onProjectClick?: (id: string) => void
}

export function NetworkGraph3D({ people, projects, edges, onPersonClick, onProjectClick }: NetworkGraph3DProps) {
  const maxCount = Math.max(...edges.map(e => e.count), 1)

  const nodes: SimNode[] = useMemo(() => [
    ...people.map(p => ({
      id: p.id, name: p.name, type: 'person' as const,
      color: hashColor(p.name),
      pos: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2),
      vel: new THREE.Vector3(),
    })),
    ...projects.map(p => ({
      id: p.id, name: p.name, type: 'project' as const,
      color: '#06B6D4',
      pos: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2),
      vel: new THREE.Vector3(),
    })),
  ], [people, projects])

  const simEdges: Edge[] = useMemo(() => edges.map(e => ({
    from: e.personId, to: e.projectId, weight: e.count / maxCount,
  })), [edges, maxCount])

  const handleClick = useCallback((id: string) => {
    if (people.find(p => p.id === id)) onPersonClick?.(id)
    else onProjectClick?.(id)
  }, [people, onPersonClick, onProjectClick])

  return (
    <div style={{ width: '100%', height: 320, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={0.6} />
        <Suspense fallback={null}>
          <Graph nodes={nodes} edges={simEdges} onNodeClick={handleClick} />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={4} maxDistance={20} />
      </Canvas>
    </div>
  )
}
