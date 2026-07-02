import { requireUser } from '@/lib/auth'
import { callAI, PROMPTS } from '@/lib/ai'
import type { NarrateResult } from '@/types'

export async function POST(req: Request) {
  await requireUser()

  const body = await req.json()
  const { text } = body

  if (!text?.trim()) return Response.json({ error: 'text is required' }, { status: 400 })

  const raw    = await callAI(PROMPTS.narrate, text)
  const result = JSON.parse(raw) as NarrateResult

  return Response.json(result)
}
