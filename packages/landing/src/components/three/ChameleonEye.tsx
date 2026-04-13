'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { vertexShader, fragmentShader, particleVertexShader, particleFragmentShader } from './shaders'

interface ChameleonEyeProps {
  className?: string
  particleCount?: number
  onReady?: (uniforms: { uOpenProgress: { value: number }; uHue: { value: number } }) => void
}

export default function ChameleonEye({ className = '', particleCount = 200, onReady }: ChameleonEyeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    uniforms: { uTime: { value: number }; uHue: { value: number }; uOpenProgress: { value: number } }
  } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setClearColor(0x000000, 0)

    // Eye sphere
    const uniforms = {
      uTime: { value: 0 },
      uHue: { value: 150 },
      uOpenProgress: { value: 0 },
    }

    const geometry = new THREE.SphereGeometry(2, 128, 128)
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      side: THREE.FrontSide,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Particles
    const count = particleCount
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = 2.8 + Math.random() * 1.5
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      sizes[i] = Math.random() * 3 + 1
      phases[i] = Math.random() * Math.PI * 2
    }

    const particleUniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
    }

    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    pGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    pGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

    const pMat = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: particleUniforms,
      transparent: true,
      depthWrite: false,
    })
    const particles = new THREE.Points(pGeo, pMat)
    scene.add(particles)

    // Share uniforms for GSAP control
    // @ts-expect-error - attaching for external access
    canvas._eyeUniforms = uniforms
    // @ts-expect-error
    canvas._particleUniforms = particleUniforms

    onReady?.(uniforms)
    sceneRef.current = { renderer, uniforms }

    // Mouse tracking
    const mouse = { x: 0, y: 0 }
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 0.3
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 0.3
    }
    window.addEventListener('mousemove', onMouseMove)

    // Resize handler
    const onResize = () => {
      if (!canvas.parentElement) return
      const w = canvas.parentElement.clientWidth
      const h = canvas.parentElement.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // Animation loop
    let time = 0
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      time += 0.016
      uniforms.uTime.value = time
      particleUniforms.uTime.value = time
      particleUniforms.uProgress.value = uniforms.uOpenProgress.value

      // Smooth camera drift toward mouse
      camera.position.x += (mouse.x - camera.position.x) * 0.05
      camera.position.y += (mouse.y - camera.position.y) * 0.05
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      pGeo.dispose()
      pMat.dispose()
    }
  }, [particleCount, onReady])

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full ${className}`}
      style={{ background: 'transparent' }}
    />
  )
}
