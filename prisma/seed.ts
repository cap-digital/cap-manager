import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@capmanager.com' },
    update: {},
    create: {
      email: 'admin@capmanager.com',
      senha: hashedPassword,
      nome: 'Administrador',
      role: 'admin',
      ativo: true,
    },
  })

  console.log('Usuario admin criado:', admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
