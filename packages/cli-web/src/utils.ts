import { homedir } from 'node:os'
import { join } from 'node:path'
import { execSync, type ExecSyncOptionsWithStringEncoding } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

export const INSTALL_DIR = join(homedir(), '.camaleon', 'web')
export const VERSION_FILE = join(INSTALL_DIR, 'version.json')
export const GITHUB_REPO = 'tryanglebuild/camaleion'
export const PORT = 4069
export const SERVICE_NAME = 'camaleon-web'

export function getInstalledVersion(): string | null {
  if (!existsSync(VERSION_FILE)) return null
  try {
    const data = JSON.parse(readFileSync(VERSION_FILE, 'utf-8')) as { version: string }
    return data.version
  } catch {
    return null
  }
}

export function exec(cmd: string, opts?: ExecSyncOptionsWithStringEncoding): string {
  return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', ...opts })
}

export function tryExec(cmd: string): string | null {
  try {
    return exec(cmd)
  } catch {
    return null
  }
}

export function isLinux(): boolean {
  return process.platform === 'linux'
}

export function isMac(): boolean {
  return process.platform === 'darwin'
}

export function hasSystemd(): boolean {
  return isLinux() && tryExec('systemctl --version') !== null
}
