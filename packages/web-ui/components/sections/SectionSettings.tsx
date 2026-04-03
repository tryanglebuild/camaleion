'use client'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  Download, Sun, Moon, Database, Zap,
  FileJson, FileText, CheckCircle, XCircle, Eye, EyeOff, Save,
  Rocket, CircleDot, AlertCircle, Minus,
} from 'lucide-react'
import type { SectionProps } from './types'
import { SectionWrapper, SectionHeader } from './SectionLayout'
import { useToast } from '@/components/ui/Toaster'
import { saveClientConfig, reloadSupabase } from '@/lib/supabase'
import { contentItemVariants } from './sectionVariants'

function useTheme() {
  const [dark, setDark] = useState(false)
  useEffect(() => { setDark(localStorage.getItem('theme') === 'dark') }, [])
  const toggle = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '')
  }
  return { dark, toggle }
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

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 24px', borderBottom: '1px solid var(--border)', gap: 24,
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
        {description && <p style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{description}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function GroupHeader({ title }: { title: string }) {
  return (
    <div style={{ padding: '20px 24px 8px', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {title}
      </span>
    </div>
  )
}

function CredentialField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  const isKey = label.toLowerCase().includes('key')
  return (
    <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)' }}>
      <p style={{ fontFamily: 'var(--font-inter)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type={isKey && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 6, padding: isKey ? '8px 36px 8px 12px' : '8px 12px',
            fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12,
            color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {isKey && (
          <button
            onClick={() => setShow(v => !v)}
            style={{
              position: 'absolute', right: 10, background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--text-muted)', padding: 2,
            }}
          >
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
      </div>
    </div>
  )
}

export function SectionSettings({ direction }: SectionProps) {
  const { toast } = useToast()
  const { dark, toggle } = useTheme()
  const { status: health, reload: reloadHealth } = useHealth()
  const [exporting, setExporting] = useState<string | null>(null)

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

  const canSave   = !!(supabaseUrl && supabaseAnonKey && supabaseServiceKey)
  const canDeploy = !!(supabaseUrl && supabaseAccessToken)

  return (
    <SectionWrapper direction={direction}>
      <SectionHeader title="Settings" subtitle="Credentials, appearance and data" />

      <div data-inner-scroll style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 60px' }}>

          {/* ── Credentials ──────────────────────────────────────── */}
          <motion.div variants={contentItemVariants} initial="hidden" animate="visible">
            <GroupHeader title="Supabase credentials" />
            {credsLoaded ? (
              <>
                <CredentialField
                  label="Project URL"
                  value={supabaseUrl}
                  onChange={setSupabaseUrl}
                  placeholder="https://xxxxxxxxxxxx.supabase.co"
                />
                <CredentialField
                  label="Anon Key (public)"
                  value={supabaseAnonKey}
                  onChange={setSupabaseAnonKey}
                  placeholder="eyJhbGci…"
                />
                <CredentialField
                  label="Service Role Key (server)"
                  value={supabaseServiceKey}
                  onChange={setSupabaseServiceKey}
                  placeholder="eyJhbGci…"
                />
                <CredentialField
                  label="Access Token (Management API)"
                  value={supabaseAccessToken}
                  onChange={setSupabaseAccessToken}
                  placeholder="sbp_…"
                />
                <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    Saved to{' '}
                    <code style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 3 }}>
                      config.json
                    </code>
                    {' '}— never committed to git
                  </p>
                  <button
                    onClick={saveCredentials}
                    disabled={savingCreds || !canSave}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: (!canSave || savingCreds) ? 0.5 : 1 }}
                  >
                    <Save size={12} />
                    {savingCreds ? 'Saving…' : 'Save & reload'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: '20px 24px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)', animation: 'pulse-live 1.5s ease-in-out infinite' }} />
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-muted)' }}>Loading…</span>
              </div>
            )}
          </motion.div>

          {/* ── Connection status ─────────────────────────────────── */}
          <motion.div variants={contentItemVariants} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
            <GroupHeader title="Connection status" />
            {[
              { label: 'Database (Supabase)', icon: Database, ok: health?.supabase },
              { label: 'Embedding (OpenAI)',  icon: Zap,      ok: health?.embed    },
            ].map(({ label, icon: Icon, ok }) => (
              <SettingRow key={label} label={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={13} style={{ color: 'var(--text-muted)' }} />
                  <StatusDot ok={ok} />
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: ok ? '#22C55E' : ok === false ? '#EF4444' : 'var(--text-muted)' }}>
                    {ok == null ? 'checking…' : ok ? 'connected' : 'offline'}
                  </span>
                </div>
              </SettingRow>
            ))}
            <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={reloadHealth}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                Re-check
              </button>
            </div>
          </motion.div>

          {/* ── Deploy ───────────────────────────────────────────── */}
          <motion.div variants={contentItemVariants} initial="hidden" animate="visible" transition={{ delay: 0.08 }}>
            <GroupHeader title="Deploy to Supabase" />
            {credsLoaded && (
              <>
                <CredentialField
                  label="OpenRouter API Key"
                  value={openrouterKey}
                  onChange={setOpenrouterKey}
                  placeholder="sk-or-…"
                />
                <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: deploySteps.length ? 14 : 0 }}>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                      Applies all migrations, deploys edge functions, and sets the OpenRouter secret.
                      Requires the Access Token above.
                    </p>
                    <button
                      onClick={runDeploy}
                      disabled={deploying || !canDeploy}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, opacity: (!canDeploy || deploying) ? 0.5 : 1 }}
                    >
                      <Rocket size={12} />
                      {deploying ? 'Deploying…' : 'Deploy'}
                    </button>
                  </div>
                  {deploySteps.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
                      {deploySteps.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {s.status === 'ok'      && <CheckCircle  size={12} style={{ color: '#22C55E',        flexShrink: 0 }} />}
                          {s.status === 'error'   && <AlertCircle  size={12} style={{ color: '#EF4444',        flexShrink: 0 }} />}
                          {s.status === 'skipped' && <Minus        size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                          {s.status === 'running' && <CircleDot    size={12} style={{ color: 'var(--accent)',   flexShrink: 0 }} />}
                          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: s.status === 'error' ? '#EF4444' : s.status === 'ok' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {s.name}
                            {s.message && <span style={{ opacity: 0.7 }}> — {s.message}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>

          {/* ── Appearance ───────────────────────────────────────── */}
          <motion.div variants={contentItemVariants} initial="hidden" animate="visible" transition={{ delay: 0.11 }}>
            <GroupHeader title="Appearance" />
            <SettingRow label="Theme" description="Switch between light and dark mode">
              <button
                onClick={toggle}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                  fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--text-primary)',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-active)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {dark ? <Sun size={13} /> : <Moon size={13} />}
                {dark ? 'Light mode' : 'Dark mode'}
              </button>
            </SettingRow>
          </motion.div>

          {/* ── Export ───────────────────────────────────────────── */}
          <motion.div variants={contentItemVariants} initial="hidden" animate="visible" transition={{ delay: 0.14 }}>
            <GroupHeader title="Export data" />
            <SettingRow label="All entries as JSON" description="Full export with all fields and metadata">
              <button onClick={() => doExport('json', 'json')} disabled={exporting === 'json'} className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: exporting === 'json' ? 0.6 : 1 }}>
                <FileJson size={13} />{exporting === 'json' ? 'Exporting…' : 'Download JSON'}
              </button>
            </SettingRow>
            <SettingRow label="All entries as CSV" description="Spreadsheet-compatible format">
              <button onClick={() => doExport('csv', 'csv')} disabled={exporting === 'csv'} className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: exporting === 'csv' ? 0.6 : 1 }}>
                <FileText size={13} />{exporting === 'csv' ? 'Exporting…' : 'Download CSV'}
              </button>
            </SettingRow>
            <SettingRow label="Export by type" description="Download only a specific entry type">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {['task', 'note', 'decision', 'idea'].map(t => (
                  <button key={t} onClick={() => doExport('json', t, t)} disabled={!!exporting}
                    style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', border: '1px solid var(--border)', background: exporting === t ? 'var(--surface-2)' : 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, opacity: exporting && exporting !== t ? 0.5 : 1, transition: 'all 0.12s' }}
                    onMouseEnter={e => { if (!exporting) { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                  >
                    <Download size={9} />{exporting === t ? '…' : t}
                  </button>
                ))}
              </div>
            </SettingRow>
          </motion.div>

        </div>
      </div>
    </SectionWrapper>
  )
}
