"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  const products = await prisma.product.findMany();
  return products.map(p => ({
    ...p,
    precio: Number(p.precio)
  }));
}

export async function createProduct(formData: FormData) {
  const codigo = formData.get("codigo") as string;
  const nombre = formData.get("nombre") as string;
  const precio = parseInt(formData.get("precio") as string, 10);
  const imagenUrl = formData.get("imagenUrl") as string;
  const descripcion1 = formData.get("descripcion1") as string;
  const descripcion2 = formData.get("descripcion2") as string;

  await prisma.product.create({
    data: { codigo, nombre, precio, imagenUrl, descripcion1, descripcion2 },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateProduct(formData: FormData) {
  const id = parseInt(formData.get("id") as string, 10);
  const codigo = formData.get("codigo") as string;
  const nombre = formData.get("nombre") as string;
  const precio = parseInt(formData.get("precio") as string, 10);
  const imagenUrl = formData.get("imagenUrl") as string;
  const descripcion1 = formData.get("descripcion1") as string;
  const descripcion2 = formData.get("descripcion2") as string;

  await prisma.product.update({
    where: { id },
    data: { codigo, nombre, precio, imagenUrl, descripcion1, descripcion2 },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteProduct(id: number) {
  await prisma.product.delete({
    where: { id },
  });
  revalidatePath("/");
  revalidatePath("/admin");
}
