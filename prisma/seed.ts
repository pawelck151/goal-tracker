import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.USER_EMAIL
  if (!email) throw new Error('USER_EMAIL not set in .env')

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      morningTime: '08:00',
      eveningTime: '20:00',
      timezone: 'Europe/Warsaw',
    },
  })

  console.log(`Seeded user: ${user.email}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
