# 3D Upgrade Plan — Camaleon Dashboard

## Stack disponível

- `three@0.183`
- `@react-three/fiber@9`
- `@react-three/drei@10`

## Estado atual

| Componente | Status |
|---|---|
| `ParticleField.tsx` | Usado no BootPage ✓ |
| `NetworkGraph3D.tsx` | Existe mas **NÃO ligado** ao SectionGraph |
| `MetricCard.tsx` | Existe (3D tilt), uso a confirmar |
| `HeatMap.tsx` | Existe com toggle 2D/3D |
| `SectionGraph` | Usa Canvas 2D — oportunidade de upgrade |

---

## Plano por Section

### 1. Section 11 — Graph (Prioridade 1 — 30min)

**Situação:** SectionGraph usa Canvas 2D puro. `NetworkGraph3D.tsx` já existe e não está ligado.

**Upgrade:** Substituir o Canvas 2D pelo componente R3F existente.

```tsx
// SectionGraph.tsx
import { NetworkGraph3D } from '@/components/3d/NetworkGraph3D'

<div className="w-full h-full">
  <NetworkGraph3D
    nodes={graphNodes}
    edges={graphEdges}
    onNodeClick={handleNodeSelect}
  />
</div>
```

**Resultado:** Grafo 3D interativo com OrbitControls, física de nós, tooltips — já implementado.

---

### 2. Section 2 — Search → SemanticSpace3D (Prioridade 2 — 2h)

**Ideia:** Resultados de busca posicionados em espaço 3D onde Z = similarity score. Toggle LIST / SPACE na UI.

**Criar:** `/components/3d/SemanticSpace3D.tsx`

```tsx
'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Billboard } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

interface SemanticPoint {
  id: string
  title: string
  type: string
  similarity: number
  x: number
  y: number
}

function ResultNode({ point, selected, onClick }: {
  point: SemanticPoint
  selected: boolean
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
    const scale = selected ? 1.4 : 1
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, scale, 0.1)
    )
  })

  const color = {
    task: '#f59e0b', note: '#3b82f6', decision: '#8b5cf6',
    idea: '#10b981', log: '#6b7280'
  }[point.type] ?? '#ffffff'

  return (
    <group position={[point.x * 4, point.y * 4, point.similarity * 8]}>
      <mesh ref={meshRef} onClick={onClick}>
        <octahedronGeometry args={[0.15 + point.similarity * 0.2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 1.5 : 0.4}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      {selected && (
        <Billboard>
          <Html center distanceFactor={8}>
            <div className="bg-black/80 text-white text-xs px-2 py-1 rounded border border-white/20 whitespace-nowrap">
              {point.title}
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  )
}

export function SemanticSpace3D({ results, selectedId, onSelect }: {
  results: SemanticPoint[]
  selectedId?: string
  onSelect: (id: string) => void
}) {
  return (
    <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      <fog attach="fog" args={['#000', 15, 30]} />
      {results.map(p => (
        <ResultNode
          key={p.id}
          point={p}
          selected={selectedId === p.id}
          onClick={() => onSelect(p.id)}
        />
      ))}
      <OrbitControls enableZoom autoRotate autoRotateSpeed={0.3} />
    </Canvas>
  )
}
```

**Integração no SectionSearch:** Adicionar toggle "LIST / SPACE" e renderizar `SemanticSpace3D` com os resultados.

---

### 3. Section 13 — Timeline → Helix 3D (Prioridade 3 — 1h)

**Ideia:** Entries dispostas numa hélice 3D. Recentes à frente, antigos atrás. Camera com auto-rotate.

**Criar:** `/components/3d/HelixTimeline.tsx`

```tsx
'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Line } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

export function HelixTimeline({ entries }: { entries: any[] }) {
  const helixPoints = useMemo(() => {
    return entries.map((_, i) => {
      const t = (i / Math.max(entries.length - 1, 1)) * Math.PI * 4
      const radius = 3
      return new THREE.Vector3(
        Math.cos(t) * radius,
        i * 0.4 - entries.length * 0.2,
        Math.sin(t) * radius
      )
    })
  }, [entries])

  const linePoints = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * Math.PI * 4
      pts.push(new THREE.Vector3(
        Math.cos(t) * 3,
        i * entries.length * 0.002,
        Math.sin(t) * 3
      ))
    }
    return pts
  }, [entries.length])

  return (
    <Canvas camera={{ position: [8, 0, 8], fov: 50 }}>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 10, 0]} intensity={2} color="#8b5cf6" />
      <fog attach="fog" args={['#000', 20, 40]} />

      <Line points={linePoints} color="#ffffff" lineWidth={0.5} opacity={0.15} transparent />

      {helixPoints.map((pos, i) => (
        <group key={entries[i].id} position={pos}>
          <mesh>
            <sphereGeometry args={[0.12]} />
            <meshStandardMaterial
              color="#8b5cf6"
              emissive="#8b5cf6"
              emissiveIntensity={0.8}
            />
          </mesh>
          <Html distanceFactor={12} center>
            <div className="text-white/60 text-xs whitespace-nowrap">
              {entries[i].title?.slice(0, 30)}
            </div>
          </Html>
        </group>
      ))}

      <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom />
    </Canvas>
  )
}
```

---

### 4. Section 0 — Dashboard → Metric Orbs + Activity Globe (Prioridade 4 — 1h)

**Ideia:** Substituir stat cards estáticos por `MetricCard.tsx` (já tem 3D tilt). Adicionar um mini-globo de atividade.

```tsx
import { Canvas } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, OrbitControls } from '@react-three/drei'

function ActivityGlobe({ activityScore }: { activityScore: number }) {
  return (
    <div className="h-48 w-48">
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#8b5cf6" />
        <Sphere args={[1, 64, 64]}>
          <MeshDistortMaterial
            color="#8b5cf6"
            speed={2}
            distort={0.2 + activityScore * 0.3}
            roughness={0.1}
            metalness={0.8}
          />
        </Sphere>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
      </Canvas>
    </div>
  )
}
```

---

### 5. Section 3 — Projects → Sistema Planetário (Prioridade 5 — 2h)

**Ideia:** Cada projeto = planeta a orbitar um sol central. Tamanho = nº de tasks. Cor = saúde (verde/amarelo/vermelho).

**Criar:** `/components/3d/PlanetSystem.tsx`

```tsx
'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Html } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function Planet({ project, index, total }: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  const angle = (index / total) * Math.PI * 2
  const radius = 3 + index * 1.5

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime * (0.2 / (index + 1))
    meshRef.current.position.x = Math.cos(t + angle) * radius
    meshRef.current.position.z = Math.sin(t + angle) * radius
    meshRef.current.rotation.y = state.clock.elapsedTime
  })

  const size = Math.max(0.2, Math.min(0.8, 0.2 + (project.taskCount ?? 1) * 0.05))
  const health = project.healthScore ?? 0.5
  const color = health > 0.7 ? '#10b981' : health > 0.4 ? '#f59e0b' : '#ef4444'

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}

function Sun() {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.2
  })
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.8, 64, 64]} />
      <meshStandardMaterial
        color="#f59e0b"
        emissive="#f59e0b"
        emissiveIntensity={2}
      />
    </mesh>
  )
}

export function PlanetSystem({ projects }: { projects: any[] }) {
  return (
    <Canvas camera={{ position: [0, 8, 14], fov: 60 }}>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 0]} intensity={3} color="#f59e0b" />
      <Stars radius={50} depth={10} count={2000} factor={3} />
      <Sun />
      {projects.map((p, i) => (
        <Planet key={p.id} project={p} index={i} total={projects.length} />
      ))}
      <OrbitControls enableZoom autoRotate autoRotateSpeed={0.2} />
    </Canvas>
  )
}
```

---

### 6. Section 5 — People → Influence Orbs (Prioridade 6 — 1h)

**Ideia:** Cada pessoa = orb flutuante com tamanho proporcional ao nº de projetos/tasks associados.

```tsx
'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, MeshDistortMaterial, Html } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function PersonOrb({ person, position }: { person: any; position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.3
  })

  const size = Math.max(0.3, Math.min(0.8, 0.3 + (person.projectCount ?? 0) * 0.1))

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[size, 32, 32]} />
        <MeshDistortMaterial
          color="#3b82f6"
          distort={0.2}
          speed={1.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <Html position={position} distanceFactor={10} center>
        <div className="text-white/70 text-xs text-center whitespace-nowrap">
          {person.name}
        </div>
      </Html>
    </group>
  )
}
```

---

### 7. Section 9 — Plan → Roadmap Tunnel (Prioridade 7 — 3h)

**Ideia:** Tasks como checkpoints num caminho 3D curvo. Camera "voa" pelo túnel à medida que tasks são completadas.

```tsx
import * as THREE from 'three'

// Gerar o path curvo a partir das tasks
const curve = new THREE.CatmullRomCurve3(
  tasks.map((_, i) => new THREE.Vector3(i * 2, Math.sin(i * 0.5) * 1.5, 0))
)

// Tube geometry para o caminho
<mesh>
  <tubeGeometry args={[curve, 64, 0.05, 8, false]} />
  <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
</mesh>

// Checkpoints nas posições do path
{tasks.map((task, i) => {
  const point = curve.getPoint(i / tasks.length)
  return (
    <mesh key={task.id} position={point}>
      <sphereGeometry args={[task.status === 'done' ? 0.15 : 0.1]} />
      <meshStandardMaterial
        color={task.status === 'done' ? '#10b981' : '#6b7280'}
        emissive={task.status === 'done' ? '#10b981' : '#000'}
        emissiveIntensity={0.8}
      />
    </mesh>
  )
})}
```

---

### 8. Section 7 — Rules → Neural Brain (Prioridade 8 — 3h)

**Ideia:** Rules como neurónios em clusters por categoria. Priority = tamanho do nó. Linhas de conexão entre rules da mesma categoria.

```tsx
// Clusters por categoria com force layout 3D
// behavior → cluster esquerdo
// memory → cluster central
// output → cluster direito
// general → topo

const clusterPositions = {
  behavior: new THREE.Vector3(-4, 0, 0),
  memory:   new THREE.Vector3(0, 0, 0),
  output:   new THREE.Vector3(4, 0, 0),
  general:  new THREE.Vector3(0, 4, 0),
}

function RuleNode({ rule, basePosition }: any) {
  const offset = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2
  )
  const pos = clusterPositions[rule.category].clone().add(offset)
  const size = 0.05 + (rule.priority / 100) * 0.3

  return (
    <mesh position={pos}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        color="#8b5cf6"
        emissive="#8b5cf6"
        emissiveIntensity={rule.priority > 50 ? 1 : 0.3}
      />
    </mesh>
  )
}
```

---

## Resumo de Prioridades

| # | Section | Componente | Esforço | Impacto |
|---|---|---|---|---|
| 1 | **Graph** | Ligar `NetworkGraph3D` existente | 🟢 30min | 🔥🔥🔥 |
| 2 | **Search** | `SemanticSpace3D` (scatter similarity) | 🟡 2h | 🔥🔥🔥 |
| 3 | **Timeline** | `HelixTimeline` (hélice 3D) | 🟡 1h | 🔥🔥🔥 |
| 4 | **Dashboard** | Activity Globe + MetricCard | 🟢 1h | 🔥🔥 |
| 5 | **Projects** | `PlanetSystem` (órbitas) | 🟡 2h | 🔥🔥🔥 |
| 6 | **People** | Influence Orbs flutuantes | 🟢 1h | 🔥🔥 |
| 7 | **Plan** | Roadmap Tunnel (CatmullRom) | 🔴 3h | 🔥🔥🔥 |
| 8 | **Rules** | Neural Brain (clusters) | 🔴 3h | 🔥🔥 |

**Total estimado:** ~14h para todas as 8 upgrades.
