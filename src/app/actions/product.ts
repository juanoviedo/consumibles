"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

async function uploadImage(imageFile: File | null): Promise<string | null> {
  if (!imageFile || imageFile.size === 0 || imageFile.name === "undefined") return null;
  
  const extension = imageFile.name.split('.').pop() || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
  
  const { data, error } = await supabase.storage
    .from("consumables-pics")
    .upload(fileName, imageFile, {
      contentType: imageFile.type,
      upsert: false
    });

  if (error) {
    console.error("Error al subir la imagen:", error);
    throw new Error(`Error subiendo la imagen: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("consumables-pics")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

export async function getProducts() {
  const products = await prisma.product.findMany({
    orderBy: { nombre: 'asc' },
    include: { category: true }
  });
  return products.map(p => ({
    ...p,
    precio: Number(p.precio)
  }));
}

export async function createProduct(formData: FormData) {
  const codigo = formData.get("codigo") as string;
  const nombre = formData.get("nombre") as string;
  const precio = parseInt(formData.get("precio") as string, 10);
  let imagenUrl = formData.get("imagenUrl") as string;
  const descripcion1 = formData.get("descripcion1") as string;
  const descripcion2 = formData.get("descripcion2") as string;
  const categoryIdRaw = formData.get("categoryId") as string;
  const categoryId = categoryIdRaw ? parseInt(categoryIdRaw, 10) : null;
  
  const file = formData.get("imagenFile") as File | null;
  try {
    const uploadedUrl = await uploadImage(file);
    if (uploadedUrl) {
      imagenUrl = uploadedUrl; // Overwrite the manually passed string if a file was uploaded
    }
  } catch(err) {
    console.error(err);
    // Continue with the manual string or empty string
  }

  await prisma.product.create({
    data: { codigo, nombre, precio, imagenUrl: imagenUrl || "", descripcion1, descripcion2, categoryId },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateProduct(formData: FormData) {
  const id = parseInt(formData.get("id") as string, 10);
  const codigo = formData.get("codigo") as string;
  const nombre = formData.get("nombre") as string;
  const precio = parseInt(formData.get("precio") as string, 10);
  let imagenUrl = formData.get("imagenUrl") as string;
  const descripcion1 = formData.get("descripcion1") as string;
  const descripcion2 = formData.get("descripcion2") as string;
  const categoryIdRaw = formData.get("categoryId") as string;
  const categoryId = categoryIdRaw ? parseInt(categoryIdRaw, 10) : null;

  const file = formData.get("imagenFile") as File | null;
  try {
    const uploadedUrl = await uploadImage(file);
    if (uploadedUrl) {
      imagenUrl = uploadedUrl;
    }
  } catch(err) {
    console.error(err);
  }

  await prisma.product.update({
    where: { id },
    data: { codigo, nombre, precio, imagenUrl: imagenUrl || "", descripcion1, descripcion2, categoryId },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteProduct(id: number) {
  // Opcional: Para una versión futura, buscar la imagenUrl en la DB, extraer el nombre del archivo al final de la URL
  // y usar supabase.storage.from('consumables-pics').remove([fileName]) para no dejar huérfanos.
  
  await prisma.product.delete({
    where: { id },
  });
  revalidatePath("/");
  revalidatePath("/admin");
}
