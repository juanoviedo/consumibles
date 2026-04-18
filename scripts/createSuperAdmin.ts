import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'juan.oviedo.lutkens@gmail.com';
  const plainPassword = 'admin'; // Contraseña inicial para el superadmin

  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isSuperAdmin: true
      }
    });
    console.log("Super Admin creado con exito.");
  } else {
    console.log("El Super Admin ya existe.");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
