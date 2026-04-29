import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@consumiblescali.com';
  const password = 'admin'; // Contraseña inicial, pueden cambiarla luego

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('El usuario administrador ya existe. Su contraseña no ha sido modificada.');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      isSuperAdmin: true
    }
  });

  console.log(`✅ Administrador creado exitosamente:`);
  console.log(`Email: ${email}`);
  console.log(`Contraseña: ${password}`);
}

main()
  .catch((e) => {
    console.error('❌ Error creando administrador:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
