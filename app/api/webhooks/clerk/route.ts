import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

type ClerkUserCreatedEvent = {
  type: 'user.created' | 'user.updated' | 'user.deleted'
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
  }
}

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    return Response.json({ error: 'CLERK_WEBHOOK_SECRET not configured' }, { status: 500 })
  }

  // Raw body — svix necesita el body sin parsear para verificar la firma
  const body = await req.text()

  const headersList = await headers()
  const svixId = headersList.get('svix-id')
  const svixTimestamp = headersList.get('svix-timestamp')
  const svixSignature = headersList.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  let event: ClerkUserCreatedEvent
  try {
    const wh = new Webhook(webhookSecret)
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserCreatedEvent
  } catch {
    return Response.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  if (event.type === 'user.created') {
    const { id, email_addresses, primary_email_address_id, first_name, last_name } = event.data

    const primaryEmail = email_addresses.find(
      (e) => e.id === primary_email_address_id
    )?.email_address

    if (!primaryEmail) {
      return Response.json({ error: 'No primary email found' }, { status: 400 })
    }

    const name = [first_name, last_name].filter(Boolean).join(' ') || null

    await db.user.create({
      data: {
        clerkId: id,
        email: primaryEmail,
        name,
      },
    })
  }

  return Response.json({ received: true })
}
