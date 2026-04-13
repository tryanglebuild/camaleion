export const vertexShader = /* glsl */`
uniform float uTime;
uniform float uOpenProgress;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;

  // Breathing displacement
  float displacement = sin(position.x * 3.0 + uTime * 0.8) * 0.04
                     + sin(position.y * 4.0 + uTime * 1.1) * 0.03
                     + sin(position.z * 2.5 + uTime * 0.6) * 0.04;
  displacement *= uOpenProgress;

  vec3 newPos = position + normal * displacement;
  vPosition = newPos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
}
`

export const fragmentShader = /* glsl */`
uniform float uTime;
uniform float uHue;
uniform float uOpenProgress;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

vec3 hsl2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

void main() {
  vec3 viewDir = normalize(cameraPosition - vPosition);

  // Fresnel
  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);

  // Iridescence — hue shifts based on viewing angle + time + scroll hue
  float hueShift = uHue / 360.0 + fresnel * 0.3 + uTime * 0.03;
  vec3 iridescent = hsl2rgb(vec3(fract(hueShift), 0.8, 0.55 + fresnel * 0.25));

  // Base dark emerald with iridescent overlay
  vec3 baseColor = vec3(0.0, 0.08, 0.05);
  vec3 finalColor = mix(baseColor, iridescent, fresnel * 0.9 + 0.1);

  // Pupil: dark vertical ellipse
  float pupil = smoothstep(0.08, 0.06, length(vec2(vUv.x - 0.5, (vUv.y - 0.5) * 2.2)));
  finalColor = mix(finalColor, vec3(0.01, 0.01, 0.02), pupil * uOpenProgress);

  // Iris ring glow
  float irisRing = smoothstep(0.42, 0.44, length(vUv - 0.5)) - smoothstep(0.44, 0.46, length(vUv - 0.5));
  finalColor += irisRing * iridescent * 0.6 * uOpenProgress;

  float alpha = uOpenProgress * (0.85 + fresnel * 0.15);

  gl_FragColor = vec4(finalColor, alpha);
}
`

export const particleVertexShader = /* glsl */`
attribute float aSize;
attribute float aPhase;

uniform float uTime;
uniform float uProgress;

varying float vAlpha;

void main() {
  // Orbit drift
  float angle = aPhase + uTime * 0.15;
  vec3 pos = position;
  pos.x += cos(angle) * 0.1 * uProgress;
  pos.y += sin(angle * 1.3) * 0.08 * uProgress;
  pos.z += sin(angle * 0.7) * 0.06 * uProgress;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSize * (300.0 / -mvPosition.z) * uProgress;
  gl_Position = projectionMatrix * mvPosition;

  vAlpha = uProgress * 0.6;
}
`

export const particleFragmentShader = /* glsl */`
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float circle = 1.0 - smoothstep(0.5, 1.0, d);
  gl_FragColor = vec4(0.0, 1.0, 0.53, circle * vAlpha);
}
`
