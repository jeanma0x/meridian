import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  const users = await db.user.findMany({ select: { email: true, id: true } })
  console.log('Users found:', users.map(u => u.email))
  const user = users[0]
  if (!user) { console.error('User not found'); process.exit(1) }

  const result = await db.notification.createMany({
    data: [
      { userId: user.id, type: 'COMMITMENT_DUE',  message: 'El commitment "Enviar spec de reportes" vence mañana.',               read: false },
      { userId: user.id, type: 'OVERDUE',          message: 'El item "Integración API de pagos" está vencido desde hace 2 días.',  read: false },
      { userId: user.id, type: 'ESCALATION_RISK',  message: 'Rodrigo tiene 2 compromisos pendientes sin respuesta esta semana.',  read: true  },
    ],
    skipDuplicates: true,
  })

  console.log('Seeded', result.count, 'notifications for', user.email)
  await db.$disconnect()
}

main().catch(console.error)
