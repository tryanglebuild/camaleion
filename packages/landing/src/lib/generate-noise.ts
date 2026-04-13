export function generateNoiseDataURL(size = 200, alpha = 0.025): string {
  if (typeof window === 'undefined') return ''
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(size, size)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.random() * 255
    imageData.data[i] = v
    imageData.data[i + 1] = v
    imageData.data[i + 2] = v
    imageData.data[i + 3] = Math.floor(alpha * 255)
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}
