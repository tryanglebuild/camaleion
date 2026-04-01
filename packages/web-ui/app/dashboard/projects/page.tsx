import { supabaseAdmin } from '@/lib/supabase-server'
import type { Project } from '@context-engine/shared'
import { ProjectsClient } from './ProjectsClient'

async function getProjects() {
  const { data } = await supabaseAdmin
    .from('projects')
    .select('*, entries:entries(count)')
    .order('created_at', { ascending: false })
  return (data ?? []) as (Project & { entries: { count: number }[] })[]
}

export default async function ProjectsPage() {
  const projects = await getProjects()
  return <ProjectsClient projects={projects} />
}
