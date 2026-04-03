import { get } from 'node:https'
import { createWriteStream, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execSync } from 'node:child_process'
import { GITHUB_REPO, INSTALL_DIR } from './utils.js'

interface GitHubRelease {
  tag_name: string
  assets: { name: string; browser_download_url: string }[]
}

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = get(url, { headers: { 'User-Agent': 'camaleon-web-cli' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        resolve(httpsGet(res.headers.location!))
        return
      }
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk.toString() })
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
  })
}

function httpsDownload(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const follow = (targetUrl: string) => {
      get(targetUrl, { headers: { 'User-Agent': 'camaleon-web-cli' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          follow(res.headers.location!)
          return
        }
        const file = createWriteStream(dest)
        res.pipe(file)
        file.on('finish', () => file.close(() => resolve()))
        file.on('error', reject)
      }).on('error', reject)
    }
    follow(url)
  })
}

export async function fetchLatestRelease(): Promise<GitHubRelease> {
  const raw = await httpsGet(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`)
  return JSON.parse(raw) as GitHubRelease
}

export async function downloadAndExtract(version: string): Promise<void> {
  const release = await fetchLatestRelease()
  const asset = release.assets.find((a) => a.name === 'web-standalone.tar.gz')
  if (!asset) throw new Error('web-standalone.tar.gz not found in release assets')

  const tarPath = join(tmpdir(), `camaleon-web-${version}.tar.gz`)
  await httpsDownload(asset.browser_download_url, tarPath)

  mkdirSync(INSTALL_DIR, { recursive: true })

  // Preserve user config across updates
  const configPath = join(INSTALL_DIR, 'packages', 'web-ui', 'config.json')
  const existingConfig = existsSync(configPath) ? readFileSync(configPath, 'utf-8') : null

  execSync(`tar -xzf "${tarPath}" -C "${INSTALL_DIR}"`, { stdio: 'pipe' })

  if (existingConfig) {
    writeFileSync(configPath, existingConfig)
  }

  writeFileSync(join(INSTALL_DIR, 'version.json'), JSON.stringify({ version }, null, 2))
}
