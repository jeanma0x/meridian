import { auth } from '@clerk/nextjs/server'
import { callAI, PROMPTS } from '@/lib/ai'
import type { NarrateResult } from '@/types'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { text } = await req.json()
    if (!text?.trim()) return Response.json({ error: 'No text' }, { status: 400 })

    console.log('Calling Groq with text length:', text.length)
    const raw = await callAI(PROMPTS.narrate, text)
    console.log('Groq response:', raw)

    const parsed = JSON.parse(raw) as NarrateResult
    return Response.json(parsed)
  } catch (e) {
    console.error('Narrate error:', e)
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
