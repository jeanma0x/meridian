import { auth } from '@clerk/nextjs/server'
import { callAI, PROMPTS } from '@/lib/ai'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { title } = await req.json()
    if (!title?.trim()) return Response.json({ error: 'title is required' }, { status: 400 })

    const raw    = await callAI(PROMPTS.generateDescription, title.trim())
    const parsed = JSON.parse(raw) as { description: string }

    return Response.json(parsed)
  } catch (e) {
    console.error('Description generation error:', e)
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
