import { homedir } from 'node:os'
import { join } from 'node:path'
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs'
import { INSTALL_DIR, PORT, SERVICE_NAME, exec, tryExec, hasSystemd, isMac } from './utils.js'

// ─── Linux systemd (user service, no sudo needed) ─────────────────────────────

function systemdUnitPath(): string {
  const dir = join(homedir(), '.config', 'systemd', 'user')
  mkdirSync(dir, { recursive: true })
  return join(dir, `${SERVICE_NAME}.service`)
}

function systemdUnit(): string {
  const node = process.execPath
  return `[Unit]
Description=Camaleon Web UI
After=network.target

[Service]
Type=simple
WorkingDirectory=${INSTALL_DIR}
Environment=PORT=${PORT}
Environment=HOSTNAME=0.0.0.0
ExecStart=${node} ${join(INSTALL_DIR, 'server.js')}
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
`
}

// ─── macOS launchd ─────────────────────────────────────────────────────────────

function launchdPlistPath(): string {
  const dir = join(homedir(), 'Library', 'LaunchAgents')
  mkdirSync(dir, { recursive: true })
  return join(dir, `com.camaleon.web.plist`)
}

function launchdPlist(): string {
  const node = process.execPath
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.camaleon.web</string>
  <key>ProgramArguments</key>
  <array>
    <string>${node}</string>
    <string>${join(INSTALL_DIR, 'server.js')}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PORT</key>
    <string>${PORT}</string>
    <key>HOSTNAME</key>
    <string>0.0.0.0</string>
  </dict>
  <key>WorkingDirectory</key>
  <string>${INSTALL_DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${join(homedir(), '.camaleon', 'web.log')}</string>
  <key>StandardErrorPath</key>
  <string>${join(homedir(), '.camaleon', 'web.error.log')}</string>
</dict>
</plist>
`
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function install(): void {
  if (hasSystemd()) {
    writeFileSync(systemdUnitPath(), systemdUnit())
    exec('systemctl --user daemon-reload')
    exec(`systemctl --user enable --now ${SERVICE_NAME}`)
  } else if (isMac()) {
    writeFileSync(launchdPlistPath(), launchdPlist())
    tryExec(`launchctl unload "${launchdPlistPath()}"`)
    exec(`launchctl load "${launchdPlistPath()}"`)
  } else {
    throw new Error('Unsupported platform. Only Linux (systemd) and macOS are supported.')
  }
}

export function start(): void {
  if (hasSystemd()) exec(`systemctl --user start ${SERVICE_NAME}`)
  else if (isMac()) exec(`launchctl start com.camaleon.web`)
}

export function stop(): void {
  if (hasSystemd()) exec(`systemctl --user stop ${SERVICE_NAME}`)
  else if (isMac()) exec(`launchctl stop com.camaleon.web`)
}

export function restart(): void {
  if (hasSystemd()) exec(`systemctl --user restart ${SERVICE_NAME}`)
  else if (isMac()) {
    tryExec(`launchctl stop com.camaleon.web`)
    exec(`launchctl start com.camaleon.web`)
  }
}

export function status(): string {
  if (hasSystemd()) {
    return tryExec(`systemctl --user is-active ${SERVICE_NAME}`)?.trim() ?? 'unknown'
  } else if (isMac()) {
    const out = tryExec(`launchctl list com.camaleon.web`)
    return out ? 'active' : 'inactive'
  }
  return 'unknown'
}

export function uninstall(): void {
  if (hasSystemd()) {
    tryExec(`systemctl --user disable --now ${SERVICE_NAME}`)
    const path = systemdUnitPath()
    if (existsSync(path)) unlinkSync(path)
    tryExec('systemctl --user daemon-reload')
  } else if (isMac()) {
    const path = launchdPlistPath()
    tryExec(`launchctl unload "${path}"`)
    if (existsSync(path)) unlinkSync(path)
  }
}
