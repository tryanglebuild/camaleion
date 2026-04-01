import { supabaseAdmin } from '@/lib/supabase-server'
import { CompaniesClient } from './CompaniesClient'
import type { Project } from '@context-engine/shared'

async function getCompaniesWithProjects() {
  const { data } = await supabaseAdmin
    .from('projects')
    .select('*')
    .not('company', 'is', null)
    .order('company')
    .order('name')
  const projects = (data ?? []) as Project[]

  const map = new Map<string, Project[]>()
  for (const p of projects) {
    const key = (p.company ?? 'Unknown').toLowerCase()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }

  return Array.from(map.entries()).map(([company, projs]) => ({ company, projects: projs }))
}

export default async function CompaniesPage() {
  const companies = await getCompaniesWithProjects()
  return <CompaniesClient companies={companies} />
}
