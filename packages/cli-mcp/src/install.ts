import { homedir } from 'node:os'
import { join } from 'node:path'
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

export const MCP_DIR = join(homedir(), '.camaleon', 'mcp')
export const ENV_FILE = join(homedir(), '.camaleon', '.env')
export const MCP_MANIFEST = join(homedir(), '.camaleon', 'mcp.json')

export interface McpEnv {
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey: string
  braveApiKey?: string
}

export function loadSavedEnv(): Partial<McpEnv> {
  if (!existsSync(ENV_FILE)) return {}
  const lines = readFileSync(ENV_FILE, 'utf-8').split('\n')
  const result: Record<string, string> = {}
  for (const line of lines) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) result[key.trim()] = rest.join('=').trim()
  }
  return {
    supabaseUrl: result['SUPABASE_URL'],
    supabaseAnonKey: result['SUPABASE_ANON_KEY'],
    supabaseServiceKey: result['SUPABASE_SERVICE_KEY'],
    braveApiKey: result['BRAVE_API_KEY'],
  }
}

export function saveEnv(env: McpEnv): void {
  mkdirSync(join(homedir(), '.camaleon'), { recursive: true })
  const lines = [
    `SUPABASE_URL=${env.supabaseUrl}`,
    `SUPABASE_ANON_KEY=${env.supabaseAnonKey}`,
    `SUPABASE_SERVICE_KEY=${env.supabaseServiceKey}`,
  ]
  if (env.braveApiKey) lines.push(`BRAVE_API_KEY=${env.braveApiKey}`)
  writeFileSync(ENV_FILE, lines.join('\n'), { mode: 0o600 })
}

export function installServer(): string {
  mkdirSync(MCP_DIR, { recursive: true })

  // Write a minimal package.json so npm install works
  const pkgPath = join(MCP_DIR, 'package.json')
  if (!existsSync(pkgPath)) {
    writeFileSync(pkgPath, JSON.stringify({ name: 'camaleon-mcp-local', version: '1.0.0' }, null, 2))
  }

  execSync('npm install camaleon-mcp-server@latest', {
    cwd: MCP_DIR,
    stdio: 'pipe',
  })

  const serverPath = join(MCP_DIR, 'node_modules', 'camaleon-mcp-server', 'dist', 'index.js')
  writeFileSync(MCP_MANIFEST, JSON.stringify({ path: serverPath }, null, 2))
  return serverPath
}

export function getInstalledServerPath(): string {
  return join(MCP_DIR, 'node_modules', 'camaleon-mcp-server', 'dist', 'index.js')
}

export function getInstalledVersion(): string | null {
  const pkgPath = join(MCP_DIR, 'node_modules', 'camaleon-mcp-server', 'package.json')
  if (!existsSync(pkgPath)) return null
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string }
    return pkg.version
  } catch {
    return null
  }
}
