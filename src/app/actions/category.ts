"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { nombre: 'asc' }
  });
  return categories;
}

export async function createCategory(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const mostrarEnWeb = formData.get("mostrarEnWeb") === "true" || formData.get("mostrarEnWeb") === "on";

  const duplicate = await prisma.category.findFirst({
    where: {
      nombre,
      createdAt: {
        gte: new Date(Date.now() - 3000)
      }
    }
  });
  if (duplicate) {
    throw new Error("Categoría duplicada detectada. Operación bloqueada.");
  }

  await prisma.category.create({
    data: { nombre, mostrarEnWeb },
  });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/catalogo");
}

export async function updateCategory(formData: FormData) {
  const id = parseInt(formData.get("id") as string, 10);
  const nombre = formData.get("nombre") as string;
  const mostrarEnWeb = formData.get("mostrarEnWeb") === "true" || formData.get("mostrarEnWeb") === "on";
  await prisma.category.update({
    where: { id },
    data: { nombre, mostrarEnWeb },
  });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/catalogo");
}

export async function deleteCategory(id: number) {
  // Desvincular productos antes de borrar la categoría
  await prisma.product.updateMany({
    where: { categoryId: id },
    data: { categoryId: null }
  });

  await prisma.category.delete({
    where: { id },
  });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/catalogo");
}
