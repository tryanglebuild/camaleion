import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'esm',
  platform: 'node',
  target: 'node18',
  // Bundle everything EXCEPT true native node modules
  external: ['node:*'],
  sourcemap: true,
  minify: false,
})

console.log('Build complete → dist/index.js')
