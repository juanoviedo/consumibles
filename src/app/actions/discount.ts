"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface DiscountInput {
  nombre: string;
  tipoDescuento: string;
  valorDescuento: number;
  fechaInicio: string | Date;
  fechaFin: string | Date;
  activo: boolean;
  productIds: number[];
}

export async function getDiscounts() {
  const discounts = await prisma.discount.findMany({
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { fechaCreacion: "desc" },
  });

  return discounts.map((d) => ({
    ...d,
    valorDescuento: Number(d.valorDescuento),
    products: d.products.map((pd) => ({
      ...pd,
      product: {
        ...pd.product,
        precio: Number(pd.product.precio),
        precioPromedioCompra: Number(pd.product.precioPromedioCompra),
        valorInventarioActual: Number(pd.product.valorInventarioActual),
      },
    })),
  }));
}

export async function createDiscount(data: DiscountInput) {
  if (!data.nombre) throw new Error("El nombre es requerido");
  if (data.valorDescuento <= 0) throw new Error("El valor del descuento debe ser mayor a cero");
  
  await prisma.$transaction(async (tx) => {
    const discount = await tx.discount.create({
      data: {
        nombre: data.nombre,
        tipoDescuento: data.tipoDescuento,
        valorDescuento: data.valorDescuento,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        activo: data.activo,
        usuarioCreacion: "Admin",
      },
    });

    if (data.productIds && data.productIds.length > 0) {
      await tx.productDiscount.createMany({
        data: data.productIds.map((productId) => ({
          idProducto: productId,
          idDescuento: discount.id,
        })),
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/descuentos");
}

export async function updateDiscount(id: number, data: DiscountInput) {
  if (!data.nombre) throw new Error("El nombre es requerido");
  if (data.valorDescuento <= 0) throw new Error("El valor del descuento debe ser mayor a cero");

  await prisma.$transaction(async (tx) => {
    await tx.discount.update({
      where: { id },
      data: {
        nombre: data.nombre,
        tipoDescuento: data.tipoDescuento,
        valorDescuento: data.valorDescuento,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        activo: data.activo,
      },
    });

    // Delete existing associations
    await tx.productDiscount.deleteMany({
      where: { idDescuento: id },
    });

    // Create new associations
    if (data.productIds && data.productIds.length > 0) {
      await tx.productDiscount.createMany({
        data: data.productIds.map((productId) => ({
          idProducto: productId,
          idDescuento: id,
        })),
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/descuentos");
}

export async function deleteDiscount(id: number) {
  await prisma.discount.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/descuentos");
}

export async function toggleDiscountStatus(id: number, activo: boolean) {
  await prisma.discount.update({
    where: { id },
    data: { activo },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/descuentos");
}
