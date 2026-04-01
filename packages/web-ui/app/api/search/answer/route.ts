import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { query, results } = await req.json()
    if (!results?.length) {
      return NextResponse.json({ answer: `No results found for "${query}".` })
    }
    const top = results.slice(0, 5)
    const titles = top.map((r: { title: string }, i: number) => `${i + 1}. ${r.title}`).join('; ')
    const types = [...new Set(top.map((r: { type: string }) => r.type))] as string[]
    const answer = `Found ${results.length} relevant entries for "${query}". Top results include: ${titles}. Entry types: ${types.join(', ')}.`
    return NextResponse.json({ answer })
  } catch {
    return NextResponse.json({ answer: '' }, { status: 200 })
  }
}
