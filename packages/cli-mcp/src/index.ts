import kleur from 'kleur'
import * as p from '@clack/prompts'
import { loadSavedEnv, saveEnv, installServer, getInstalledVersion, getInstalledServerPath, type McpEnv } from './install.js'

const LOGO = `
  ██████╗ █████╗ ███╗   ███╗ █████╗ ██╗     ███████╗ ██████╗ ███╗   ██╗
 ██╔════╝██╔══██╗████╗ ████║██╔══██╗██║     ██╔════╝██╔═══██╗████╗  ██║
 ██║     ███████║██╔████╔██║███████║██║     █████╗  ██║   ██║██╔██╗ ██║
 ██║     ██╔══██║██║╚██╔╝██║██╔══██║██║     ██╔══╝  ██║   ██║██║╚██╗██║
 ╚██████╗██║  ██║██║ ╚═╝ ██║██║  ██║███████╗███████╗╚██████╔╝██║ ╚████║
  ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝
`

function printMcpConfig(serverPath: string, env: McpEnv): void {
  const config = {
    mcpServers: {
      'context-engine': {
        command: 'node',
        args: [serverPath],
        env: {
          SUPABASE_URL: env.supabaseUrl,
          SUPABASE_ANON_KEY: env.supabaseAnonKey,
          SUPABASE_SERVICE_KEY: env.supabaseServiceKey,
          ...(env.braveApiKey ? { BRAVE_API_KEY: env.braveApiKey } : {}),
        },
      },
    },
  }

  console.log('\n' + kleur.bold().cyan('  ── Add to your Claude config ──────────────────────────'))
  console.log(kleur.dim('  Claude Code:    ~/.claude/mcp.json'))
  console.log(kleur.dim('  Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json'))
  console.log('')
  console.log(kleur.yellow(JSON.stringify(config, null, 2).split('\n').map(l => '  ' + l).join('\n')))
  console.log(kleur.bold().cyan('  ─────────────────────────────────────────────────────────\n'))
}

async function cmdInstall() {
  console.log(kleur.cyan(LOGO))
  p.intro(kleur.bold('camaleon-mcp') + kleur.dim(' — Context Engine MCP Server'))

  const saved = loadSavedEnv()

  const answers = await p.group(
    {
      supabaseUrl: () =>
        p.text({
          message: 'Supabase URL',
          placeholder: 'https://xxxx.supabase.co',
          initialValue: saved.supabaseUrl ?? '',
          validate: (v) => (!v.startsWith('https://') ? 'Must be a valid URL' : undefined),
        }),
      supabaseAnonKey: () =>
        p.text({
          message: 'Supabase Anon Key',
          placeholder: 'eyJ...',
          initialValue: saved.supabaseAnonKey ?? '',
          validate: (v) => (!v ? 'Required' : undefined),
        }),
      supabaseServiceKey: () =>
        p.text({
          message: 'Supabase Service Role Key',
          placeholder: 'eyJ...',
          initialValue: saved.supabaseServiceKey ?? '',
          validate: (v) => (!v ? 'Required' : undefined),
        }),
      braveApiKey: () =>
        p.text({
          message: 'Brave Search API Key (optional — enables fetch_world_context)',
          placeholder: 'BSA...',
          initialValue: saved.braveApiKey ?? '',
        }),
    },
    {
      onCancel: () => {
        p.cancel('Cancelled')
        process.exit(0)
      },
    }
  )

  const env = answers as McpEnv

  const s = p.spinner()

  s.start('Saving credentials...')
  saveEnv(env)
  s.stop('Credentials saved to ~/.camaleon/.env')

  s.start('Installing MCP server...')
  let serverPath: string
  try {
    serverPath = installServer()
  } catch (e) {
    s.stop(kleur.red('Install failed: ' + (e as Error).message))
    process.exit(1)
  }
  s.stop('MCP server installed')

  printMcpConfig(serverPath, env)

  p.outro(
    kleur.green('Done!') + ' After adding the config above:\n' +
    `  ${kleur.bold('Claude Code')}    → restart Claude Code, run ${kleur.cyan('claude mcp list')} to confirm\n` +
    `  ${kleur.bold('Claude Desktop')} → restart the app\n\n` +
    `  ${kleur.dim('camaleon-mcp update  — update to latest version')}`
  )
}

async function cmdUpdate() {
  p.intro(kleur.bold('camaleon-mcp update'))

  const current = getInstalledVersion()
  if (!current) {
    p.log.warn('Not installed. Run npx camaleon-mcp to install.')
    process.exit(1)
  }

  const s = p.spinner()
  s.start(`Updating from v${current}...`)
  try {
    installServer()
  } catch (e) {
    s.stop(kleur.red('Update failed: ' + (e as Error).message))
    process.exit(1)
  }
  const updated = getInstalledVersion()
  s.stop(`Updated to v${updated}`)

  if (current !== updated) {
    const saved = loadSavedEnv()
    p.note('Server path unchanged. No need to update your Claude config.')
    printMcpConfig(getInstalledServerPath(), saved as McpEnv)
  }

  p.outro(kleur.green('Done!'))
}

// ─── CLI router ───────────────────────────────────────────────────────────────

const cmd = process.argv[2] ?? 'install'

switch (cmd) {
  case 'install':
    await cmdInstall()
    break
  case 'update':
    await cmdUpdate()
    break
  default:
    console.log(`Unknown command: ${cmd}`)
    console.log('Usage: camaleon-mcp [install|update]')
    process.exit(1)
}
