'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface HeatDay { date: string; count: number }

// 2D grid view
function HeatMap2D({ data, max }: { data: HeatDay[]; max: number }) {
  const map = useMemo(() => {
    const m: Record<string, number> = {}
    data.forEach(d => { m[d.date] = d.count })
    return m
  }, [data])

  // Build 52 weeks x 7 days
  const weeks: string[][] = []
  const today = new Date()
  for (let w = 51; w >= 0; w--) {
    const week: string[] = []
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(today)
      dt.setDate(today.getDate() - (w * 7 + d))
      week.push(dt.toISOString().slice(0, 10))
    }
    weeks.push(week)
  }

  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {week.map(date => {
            const c = map[date] ?? 0
            const opacity = max > 0 ? 0.08 + (c / max) * 0.92 : 0.08
            return (
              <div key={date} title={`${date}: ${c}`} style={{
                width: 10, height: 10, borderRadius: 2,
                background: `rgba(59,130,246,${opacity})`,
                cursor: 'default',
              }} />
            )
          })}
        </div>
      ))}
    </div>
  )
}

// 3D bar chart view
function Bars({ data, max }: { data: HeatDay[]; max: number }) {
  const instances = useMemo(() => {
    const today = new Date()
    const result: { x: number; y: number; height: number; date: string; count: number }[] = []
    for (let w = 0; w < 52; w++) {
      for (let d = 0; d < 7; d++) {
        const dt = new Date(today)
        dt.setDate(today.getDate() - ((51 - w) * 7 + (6 - d)))
        const date = dt.toISOString().slice(0, 10)
        const count = data.find(dd => dd.date === date)?.count ?? 0
        const height = max > 0 ? (count / max) * 0.8 + 0.05 : 0.05
        result.push({ x: w * 0.15 - 3.8, y: d * 0.15 - 0.5, height, date, count })
      }
    }
    return result
  }, [data, max])

  return (
    <>
      {instances.map((bar, i) => (
        <mesh key={i} position={[bar.x, bar.y, bar.height / 2]}>
          <boxGeometry args={[0.12, 0.12, bar.height]} />
          <meshStandardMaterial
            color={bar.count > 0 ? '#3B82F6' : '#2A2A2A'}
            opacity={bar.count > 0 ? 0.3 + (bar.count / (max || 1)) * 0.7 : 0.3}
            transparent
          />
          {bar.count > 0 && (
            <Html center distanceFactor={8} style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              <div style={{ background: '#111', border: '1px solid #2A2A2A', padding: '2px 6px', borderRadius: 3,
                fontFamily: 'monospace', fontSize: 9, color: '#F4F4F5', opacity: 0 }} className="bar-tooltip">
                {bar.date}: {bar.count}
              </div>
            </Html>
          )}
        </mesh>
      ))}
    </>
  )
}

interface HeatMapProps {
  data: HeatDay[]
  mode: '2d' | '3d'
}

export function HeatMap({ data, mode }: HeatMapProps) {
  const max = useMemo(() => Math.max(...data.map(d => d.count), 1), [data])

  if (mode === '2d') return <HeatMap2D data={data} max={max} />

  return (
    <div style={{ width: '100%', height: 200, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <Canvas
        camera={{ position: [0, -3, 5], fov: 50 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Bars data={data} max={max} />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={10} />
      </Canvas>
    </div>
  )
}
