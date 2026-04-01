import { supabaseAdmin } from '@/lib/supabase-server'
import type { Person } from '@context-engine/shared'
import { PeopleClient } from './PeopleClient'

async function getPeople(): Promise<Person[]> {
  const { data } = await supabaseAdmin
    .from('people').select('*').order('name', { ascending: true })
  return (data ?? []) as Person[]
}

export default async function PeoplePage() {
  const people = await getPeople()
  return <PeopleClient people={people} />
}
