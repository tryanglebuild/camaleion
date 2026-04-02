import kleur from 'kleur'
import * as p from '@clack/prompts'
import { getInstalledVersion, PORT } from './utils.js'
import { fetchLatestRelease, downloadAndExtract } from './download.js'
import * as service from './service.js'

const LOGO = `
  ██████╗ █████╗ ███╗   ███╗ █████╗ ██╗     ███████╗ ██████╗ ███╗   ██╗
 ██╔════╝██╔══██╗████╗ ████║██╔══██╗██║     ██╔════╝██╔═══██╗████╗  ██║
 ██║     ███████║██╔████╔██║███████║██║     █████╗  ██║   ██║██╔██╗ ██║
 ██║     ██╔══██║██║╚██╔╝██║██╔══██║██║     ██╔══╝  ██║   ██║██║╚██╗██║
 ╚██████╗██║  ██║██║ ╚═╝ ██║██║  ██║███████╗███████╗╚██████╔╝██║ ╚████║
  ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝
`

async function cmdInstall() {
  console.log(kleur.cyan(LOGO))
  p.intro(kleur.bold('camaleon-web') + kleur.dim(' — Context Engine Web UI'))

  const current = getInstalledVersion()
  const s = p.spinner()

  s.start('Checking latest version...')
  let release
  try {
    release = await fetchLatestRelease()
  } catch {
    s.stop(kleur.red('Failed to fetch release info. Check your internet connection.'))
    process.exit(1)
  }
  const latest = release.tag_name.replace(/^v/, '')
  s.stop(`Latest version: ${kleur.green('v' + latest)}`)

  if (current === latest) {
    p.note(`Already on v${latest}. Run ${kleur.cyan('camaleon-web update')} to force reinstall.`)
    p.outro(`Running at ${kleur.cyan(`http://localhost:${PORT}`)}`)
    return
  }

  if (current) {
    p.note(`Updating ${kleur.dim('v' + current)} → ${kleur.green('v' + latest)}`)
  }

  s.start('Downloading build...')
  try {
    await downloadAndExtract(latest)
  } catch (e) {
    s.stop(kleur.red('Download failed: ' + (e as Error).message))
    process.exit(1)
  }
  s.stop('Build downloaded')

  s.start('Setting up service...')
  try {
    if (current) {
      service.restart()
    } else {
      service.install()
    }
  } catch (e) {
    s.stop(kleur.red('Service setup failed: ' + (e as Error).message))
    process.exit(1)
  }
  s.stop('Service running')

  p.outro(
    `${kleur.green('Done!')} Open ${kleur.cyan(`http://localhost:${PORT}`)}\n` +
    `  Configure Supabase in ${kleur.bold('Settings → ⚙️')}\n\n` +
    `  ${kleur.dim('camaleon-web stop | start | status | update | uninstall')}`
  )
}

async function cmdUpdate() {
  p.intro(kleur.bold('camaleon-web update'))

  const current = getInstalledVersion()
  if (!current) {
    p.log.warn('Not installed. Run npx camaleon-web to install.')
    process.exit(1)
  }

  const s = p.spinner()
  s.start('Checking latest version...')
  const release = await fetchLatestRelease()
  const latest = release.tag_name.replace(/^v/, '')
  s.stop(`Latest: v${latest} | Installed: v${current}`)

  if (current === latest) {
    p.outro(kleur.green(`Already up to date (v${latest})`))
    return
  }

  s.start(`Downloading v${latest}...`)
  await downloadAndExtract(latest)
  s.stop('Downloaded')

  s.start('Restarting service...')
  service.restart()
  s.stop('Restarted')

  p.outro(kleur.green(`Updated to v${latest}`))
}

function cmdStart() {
  service.start()
  console.log(kleur.green(`Started on http://localhost:${PORT}`))
}

function cmdStop() {
  service.stop()
  console.log(kleur.yellow('Stopped'))
}

function cmdStatus() {
  const current = getInstalledVersion()
  const st = service.status()
  const active = st === 'active'
  console.log(`Version : ${current ? kleur.cyan('v' + current) : kleur.dim('not installed')}`)
  console.log(`Service : ${active ? kleur.green(st) : kleur.red(st)}`)
  if (active) console.log(`URL     : ${kleur.cyan(`http://localhost:${PORT}`)}`)
}

async function cmdUninstall() {
  p.intro(kleur.bold('camaleon-web uninstall'))

  const confirm = await p.confirm({ message: 'Remove service and all installed files?' })
  if (p.isCancel(confirm) || !confirm) {
    p.outro('Cancelled')
    return
  }

  const s = p.spinner()
  s.start('Removing service...')
  service.uninstall()
  s.stop('Service removed')

  p.outro(kleur.green('Uninstalled. Config in ~/.camaleon/ was preserved.'))
}

// ─── CLI router ───────────────────────────────────────────────────────────────

const cmd = process.argv[2] ?? 'install'

switch (cmd) {
  case 'install':
  case undefined:
    await cmdInstall()
    break
  case 'update':
    await cmdUpdate()
    break
  case 'start':
    cmdStart()
    break
  case 'stop':
    cmdStop()
    break
  case 'status':
    cmdStatus()
    break
  case 'uninstall':
    await cmdUninstall()
    break
  default:
    console.log(`Unknown command: ${cmd}`)
    console.log('Usage: camaleon-web [install|update|start|stop|status|uninstall]')
    process.exit(1)
}
