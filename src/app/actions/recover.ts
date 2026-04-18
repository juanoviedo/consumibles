"use server";

import { prisma } from "@/lib/prisma";

export async function recoverPasswordAction(state: any, formData: FormData): Promise<{error?: string, success?: string}> {
  const email = formData.get("email") as string;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Para seguridad, no decimos si existe o no
    return { success: "Si el correo está registrado, hemos enviado un enlace de recuperación." };
  }

  // Generamos un token tonto con log en consola de servidor para simulación (ya que no hay SMTP configurado)
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hora
  
  await prisma.user.update({
    where: { email },
    data: { resetToken: token, resetTokenExpiry: expiry }
  });

  console.log(`\n===============\n📧 SIMULACIÓN CORREO 📧\nURL de recuperación para ${email}:\nhttp://localhost:3000/admin/recuperar/${token}\n===============\n`);

  return { success: "Si el correo está registrado, se envió un enlace (revisa la consola del sistema para la simulación)." };
}

import bcrypt from "bcryptjs";

export async function resetPasswordAction(state: any, formData: FormData): Promise<{error?: string, success?: string}> {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gte: new Date() }
    }
  });

  if (!user) {
    return { error: "El token es inválido o ha expirado." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    }
  });

  return { success: "Contraseña actualizada exitosamente." };
}
