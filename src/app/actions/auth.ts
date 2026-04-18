"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function loginAction(state: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Credenciales incorrectas" };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return { error: "Credenciales incorrectas" };

  const cookieStore = await cookies();
  const sessionData = JSON.stringify({ email: user.email, isSuperAdmin: user.isSuperAdmin });
  
  cookieStore.set("admin_session", sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 día
    path: "/",
  });
  
  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin/login");
}
