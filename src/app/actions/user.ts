"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "El usuario ya existe" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      isSuperAdmin: false // Siempre crea admin normal
    }
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUserAction(id: number) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}
