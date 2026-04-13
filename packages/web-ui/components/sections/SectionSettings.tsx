'use client'
import { useState, useEffect } from 'react'
import {
  CheckCircle, XCircle,
  AlertCircle, Minus, CircleDot,
} from 'lucide-react'
import type { SectionProps } from './types'
import { SectionWrapper, SectionHeader } from './SectionLayout'
import { useToast } from '@/components/ui/Toaster'
import { supabase, saveClientConfig, reloadSupabase } from '@/lib/supabase'

function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark')
  useEffect(() => { setThemeState(localStorage.getItem('theme') === 'light' ? 'light' : 'dark') }, [])
  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t)
    localStorage.setItem('theme', t)
    document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : '')
  }
  return { theme, setTheme }
}

function useHealth() {
  const [status, setStatus] = useState<{ supabase?: boolean; embed?: boolean } | null>(null)
  function check() {
    setStatus(null)
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setStatus({ supabase: d.supabase?.ok, embed: d.embed?.ok }))
      .catch(() => setStatus({ supabase: false, embed: false }))
  }
  useEffect(() => { check() }, [])
  return { status, reload: check }
}

function StatusDot({ ok }: { ok?: boolean }) {
  if (ok == null) return (
    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--border)', animation: 'pulse-live 1.5s ease-in-out infinite' }} />
  )
  return ok
    ? <CheckCircle size={14} style={{ color: '#22C55E' }} />
    : <XCircle size={14} style={{ color: '#EF4444' }} />
}


export function SectionSettings({ direction }: SectionProps) {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { status: health, reload: reloadHealth } = useHealth()
  const [exporting, setExporting] = useState<string | null>(null)
  const [stats, setStats] = useState<{ entries: number; projects: number; people: number } | null>(null)

  const [supabaseUrl, setSupabaseUrl]               = useState('')
  const [supabaseAnonKey, setSupabaseAnonKey]       = useState('')
  const [supabaseServiceKey, setSupabaseServiceKey] = useState('')
  const [supabaseAccessToken, setSupabaseAccessToken] = useState('')
  const [openrouterKey, setOpenrouterKey]           = useState('')
  const [savingCreds, setSavingCreds]               = useState(false)
  const [credsLoaded, setCredsLoaded]               = useState(false)

  type DeployStep = { name: string; status: 'ok' | 'error' | 'skipped' | 'running'; message?: string }
  const [deploying, setDeploying]     = useState(false)
  const [deploySteps, setDeploySteps] = useState<DeployStep[]>([])

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => {
        setSupabaseUrl(d.supabaseUrl ?? '')
        setSupabaseAnonKey(d.supabaseAnonKey ?? '')
        setSupabaseServiceKey(d.supabaseServiceKey ?? '')
        setSupabaseAccessToken(d.supabaseAccessToken ?? '')
        setOpenrouterKey(d.openrouterKey ?? '')
        setCredsLoaded(true)
      })
      .catch(() => setCredsLoaded(true))

    Promise.all([
      supabase.from('entries').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }),
      supabase.from('people').select('id', { count: 'exact', head: true }),
    ]).then(([e, p, pe]) => setStats({ entries: e.count ?? 0, projects: p.count ?? 0, people: pe.count ?? 0 }))
  }, [])

  async function saveCredentials() {
    setSavingCreds(true)
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseUrl, supabaseAnonKey, supabaseServiceKey, supabaseAccessToken, openrouterKey }),
      })
      saveClientConfig({ supabaseUrl, supabaseAnonKey })
      reloadSupabase()
      toast('Credentials saved — reloading…')
      setTimeout(() => window.location.reload(), 900)
    } catch {
      toast('Failed to save credentials', 'error')
    }
    setSavingCreds(false)
  }

  async function runDeploy() {
    setDeploying(true)
    setDeploySteps([{ name: 'Saving credentials…', status: 'running' }])
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseUrl, supabaseAnonKey, supabaseServiceKey, supabaseAccessToken, openrouterKey }),
      })
      setDeploySteps([{ name: 'Connecting…', status: 'running' }])
      const res = await fetch('/api/deploy', { method: 'POST' })
      const data = await res.json() as { steps?: DeployStep[]; error?: string; ok?: boolean }
      if (data.error) {
        setDeploySteps([{ name: data.error, status: 'error' }])
      } else {
        setDeploySteps(data.steps ?? [])
        if (data.ok) toast('Deploy completed successfully')
        else toast('Deploy finished with errors', 'warning')
      }
    } catch {
      setDeploySteps([{ name: 'Network error', status: 'error' }])
    }
    setDeploying(false)
  }

  async function doExport(format: 'json' | 'csv', label: string, type?: string) {
    setExporting(label)
    try {
      const params = new URLSearchParams({ format })
      if (type) params.set('type', type)
      const res = await fetch(`/api/export?${params}`)
      const blob = await res.blob()
      const url2 = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url2
      a.download = `${type ? `${type}s` : 'context-engine'}-${new Date().toISOString().slice(0, 10)}.${format}`
      a.click()
      URL.revokeObjectURL(url2)
      toast(`Exported as ${format.toUpperCase()}`)
    } catch {
      toast('Export failed', 'error')
    }
    setExporting(null)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Support both legacy array format and multi-entity format
      const isMulti = !Array.isArray(data) && (data.people || data.projects || data.entries)

      const rawEntries: Record<string, unknown>[]  = isMulti ? (data.entries  ?? []) : (Array.isArray(data) ? data : data.entries ?? [])
      const rawPeople: Record<string, unknown>[]   = isMulti ? (data.people   ?? []) : []
      const rawProjects: Record<string, unknown>[] = isMulti ? (data.projects ?? []) : []

      if (rawPeople.length === 0 && rawProjects.length === 0 && rawEntries.length === 0) {
        toast('No data found in file', 'warning'); return
      }

      let totals: string[] = []

      if (rawPeople.length > 0) {
        const { error } = await supabase.from('people').upsert(rawPeople, { onConflict: 'id' })
        if (error) throw new Error(`people: ${error.message}`)
        totals.push(`${rawPeople.length} people`)
      }

      if (rawProjects.length > 0) {
        const { error } = await supabase.from('projects').upsert(rawProjects, { onConflict: 'id' })
        if (error) throw new Error(`projects: ${error.message}`)
        totals.push(`${rawProjects.length} projects`)
      }

      if (rawEntries.length > 0) {
        // Strip joined relation fields from export format
        const entries = rawEntries.map(({ project: _p, person: _pe, ...rest }) => rest)
        const { error } = await supabase.from('entries').upsert(entries, { onConflict: 'id' })
        if (error) throw new Error(`entries: ${error.message}`)
        totals.push(`${entries.length} entries`)
      }

      toast(`Imported ${totals.join(', ')}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Import failed', 'error')
    }
    e.target.value = ''
  }

  const canSave   = !!(supabaseUrl && supabaseAnonKey && supabaseServiceKey)
  const canDeploy = !!(supabaseUrl && supabaseAccessToken)

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border)',
    borderRadius: 0, padding: '7px 10px', fontFamily: 'var(--font-jetbrains-mono)',
    fontSize: 11, color: 'var(--text-primary)', outline: 'none', marginBottom: 4,
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.1em',
    color: 'var(--text-muted)', textTransform: 'uppercase' as const, marginBottom: 3, display: 'block',
  }

  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 0 }

  const btnOutlineStyle: React.CSSProperties = {
    background: 'none', border: '1px solid var(--border)', borderRadius: 0,
    padding: '7px 12px', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9,
    letterSpacing: '0.1em', color: 'var(--text-muted)', cursor: 'pointer',
    textTransform: 'uppercase', width: '100%', transition: 'all 0.15s',
    textAlign: 'center' as const,
  }

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader title="Settings" subtitle="Configuration & system" />
      <div style={{
        flex: 1, minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 1,
        background: 'var(--border)',
        overflow: 'hidden',
      }}>

        {/* Panel 1: CONNECTION */}
        <div style={{ background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ height: 3, background: '#0891B2', flexShrink: 0 }} />
          <div style={{ height: 40, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CONNECTION</span>
          </div>
          <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
            {credsLoaded ? (
              <>
                <div style={fieldStyle}><label style={labelStyle}>Supabase URL</label><input type="text" placeholder="https://xxx.supabase.co" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = '#0891B2'} onBlur={e => e.target.style.borderColor = 'var(--border)'} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Anon Key</label><input type="password" placeholder="eyJ…" value={supabaseAnonKey} onChange={e => setSupabaseAnonKey(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = '#0891B2'} onBlur={e => e.target.style.borderColor = 'var(--border)'} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Service Role Key</label><input type="password" placeholder="eyJ…" value={supabaseServiceKey} onChange={e => setSupabaseServiceKey(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = '#0891B2'} onBlur={e => e.target.style.borderColor = 'var(--border)'} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Access Token</label><input type="password" placeholder="sbp_…" value={supabaseAccessToken} onChange={e => setSupabaseAccessToken(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = '#0891B2'} onBlur={e => e.target.style.borderColor = 'var(--border)'} /></div>
                <div style={fieldStyle}><label style={labelStyle}>OpenRouter API Key</label><input type="password" placeholder="sk-or-…" value={openrouterKey} onChange={e => setOpenrouterKey(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = '#0891B2'} onBlur={e => e.target.style.borderColor = 'var(--border)'} /></div>
                <button onClick={saveCredentials} disabled={savingCreds || !canSave}
                  style={{ width: '100%', background: '#0891B2', border: 'none', borderRadius: 0, padding: '8px', color: '#fff', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: canSave && !savingCreds ? 'pointer' : 'not-allowed', opacity: (!canSave || savingCreds) ? 0.5 : 1, marginTop: 4 }}>
                  {savingCreds ? 'SAVING…' : 'SAVE & RELOAD'}
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)', animation: 'pulse-live 1.5s ease-in-out infinite' }} />
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-muted)' }}>Loading…</span>
              </div>
            )}
            {health !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: health?.supabase ? '#22C55E' : '#EF4444', ...(health?.supabase ? { animation: 'pulse-live 2.5s ease-in-out infinite' } : {}) }} />
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                  {health?.supabase ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: APPEARANCE */}
        <div style={{ background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ height: 3, background: '#7C3AED', flexShrink: 0 }} />
          <div style={{ height: 40, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>APPEARANCE</span>
          </div>
          <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>THEME</span>
              <div style={{ display: 'flex', gap: 1 }}>
                {(['light', 'dark'] as const).map(t => (
                  <button key={t} onClick={() => setTheme(t)}
                    style={{
                      flex: 1, padding: '8px 4px',
                      background: theme === t ? '#7C3AED' : 'var(--surface-1)',
                      border: `1px solid ${theme === t ? '#7C3AED' : 'var(--border)'}`,
                      color: theme === t ? '#fff' : 'var(--text-muted)',
                      fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.1em',
                      textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0, transition: 'all 0.15s',
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>COLOR TOKENS</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  ['accent', '#2563EB'], ['chat-amber', '#B45309'], ['proj-cyan', '#0891B2'],
                  ['people-rose', '#E11D48'], ['search-purple', '#7C3AED'], ['status-done', '#16A34A'],
                  ['status-pending', '#D97706'], ['status-blocked', '#DC2626'],
                ].map(([name, color]) => (
                  <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: 18, height: 18, background: color }} />
                    <span style={{ fontSize: 8, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: DATA */}
        <div style={{ background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ height: 3, background: '#16A34A', flexShrink: 0 }} />
          <div style={{ height: 40, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>DATA</span>
          </div>
          <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: 20 }}>
              {([['entries', stats?.entries], ['projects', stats?.projects], ['people', stats?.people]] as [string, number | undefined][]).map(([label, count]) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {count ?? '—'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => doExport('json', 'json')} disabled={exporting === 'json'}
                style={{ ...btnOutlineStyle, opacity: exporting === 'json' ? 0.6 : 1 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.color = '#16A34A' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >{exporting === 'json' ? 'EXPORTING…' : 'EXPORT JSON'}</button>
              <button onClick={() => doExport('csv', 'csv')} disabled={exporting === 'csv'}
                style={{ ...btnOutlineStyle, opacity: exporting === 'csv' ? 0.6 : 1 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.color = '#16A34A' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >{exporting === 'csv' ? 'EXPORTING…' : 'EXPORT CSV'}</button>
              <label style={{ cursor: 'pointer' }}>
                <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                <span style={{ ...btnOutlineStyle, display: 'block' }}>IMPORT JSON</span>
              </label>
            </div>
          </div>
        </div>

        {/* Panel 4: SYSTEM */}
        <div style={{ background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ height: 3, background: '#B45309', flexShrink: 0 }} />
          <div style={{ height: 40, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SYSTEM</span>
          </div>
          <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            {/* Health */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>HEALTH</span>
              {[
                { label: 'Database', ok: health?.supabase },
                { label: 'Embedding', ok: health?.embed },
              ].map(({ label, ok }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusDot ok={ok} />
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: ok ? '#22C55E' : ok === false ? '#EF4444' : 'var(--text-muted)' }}>
                    {label} — {ok == null ? 'checking…' : ok ? 'connected' : 'offline'}
                  </span>
                </div>
              ))}
              <button onClick={reloadHealth}
                style={{ ...btnOutlineStyle, width: 'auto', alignSelf: 'flex-start', padding: '5px 10px', marginTop: 2 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#B45309'; e.currentTarget.style.color = '#B45309' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >RE-CHECK</button>
            </div>
            {/* Deploy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>DEPLOY</span>
              <button onClick={runDeploy} disabled={deploying || !canDeploy}
                style={{ background: '#B45309', border: 'none', borderRadius: 0, padding: '8px', color: '#fff', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: canDeploy && !deploying ? 'pointer' : 'not-allowed', opacity: (!canDeploy || deploying) ? 0.5 : 1 }}>
                {deploying ? 'DEPLOYING…' : 'DEPLOY TO SUPABASE'}
              </button>
              {deploySteps.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {deploySteps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.status === 'ok'      && <CheckCircle  size={11} style={{ color: '#22C55E', flexShrink: 0 }} />}
                      {s.status === 'error'   && <AlertCircle  size={11} style={{ color: '#EF4444', flexShrink: 0 }} />}
                      {s.status === 'skipped' && <Minus        size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                      {s.status === 'running' && <CircleDot    size={11} style={{ color: '#B45309', flexShrink: 0 }} />}
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: s.status === 'error' ? '#EF4444' : s.status === 'ok' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {s.name}{s.message && <span style={{ opacity: 0.7 }}> — {s.message}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Version */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>VERSION</span>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text-muted)' }}>v1.0.0</span>
            </div>
          </div>
        </div>

      </div>
    </SectionWrapper>
  )
}
