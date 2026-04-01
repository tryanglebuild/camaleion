'use client'
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  
  // Scanlines
  float lineY = mod(uv.y * uResolution.y * 0.5 + uTime * 15.0, 2.0);
  float scanline = smoothstep(0.0, 0.3, lineY) * (1.0 - smoothstep(1.7, 2.0, lineY));
  float scanIntensity = 0.03 * scanline;
  
  // Vignette
  vec2 center = uv - 0.5;
  float vignette = 1.0 - dot(center, center) * 1.8;
  vignette = clamp(vignette, 0.0, 1.0);
  
  float intensity = scanIntensity * vignette;
  gl_FragColor = vec4(vec3(intensity), intensity * 0.8);
}
`

function ScanMesh() {
  const matRef = useRef<THREE.ShaderMaterial>(null!)

  useFrame(({ clock, size }) => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value = clock.getElapsedTime()
    matRef.current.uniforms.uResolution.value.set(size.width, size.height)
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(1920, 1080) },
        }}
      />
    </mesh>
  )
}

export function ScanlineShader() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        dpr={[1, 1]}
        style={{ background: 'transparent' }}
        frameloop="always"
      >
        <ScanMesh />
      </Canvas>
    </div>
  )
}
