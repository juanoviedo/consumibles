"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- CLIENTS ---

export async function getClients() {
  return await prisma.client.findMany({
    orderBy: { nombre: "asc" },
  });
}

export async function createClient(formData: FormData) {
  const nit = formData.get("nit") as string;
  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const telefono = formData.get("telefono") as string;
  const direccion = formData.get("direccion") as string;

  await prisma.client.create({
    data: {
      nit: nit || null,
      nombre,
      email: email || null,
      telefono: telefono || null,
      direccion: direccion || null,
    },
  });

  revalidatePath("/admin/clientes");
}

// --- QUOTATIONS ---

export async function getQuotations() {
  return await prisma.quotation.findMany({
    include: {
      client: true,
      items: {
        include: {
          product: true,
        },
      },
      billOfCollection: true,
    },
    orderBy: { fecha: "desc" },
  });
}

export async function createQuotation(
  clientId: number,
  items: { productId: number; cantidad: number; precioUnitario: number }[]
) {
  if (items.length === 0) {
    throw new Error("La cotización debe tener al menos un producto");
  }

  // 1. Calcular el total
  const total = items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0);

  // 2. Obtener un número secuencial simple para la cotización
  const count = await prisma.quotation.count();
  const numeroCotizacion = `COT-${(count + 1).toString().padStart(4, "0")}`;

  // 3. Crear cotización con sus ítems en una transacción
  const quotation = await prisma.quotation.create({
    data: {
      numeroCotizacion,
      clientId,
      total,
      estado: "PENDIENTE",
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        })),
      },
    },
  });

  revalidatePath("/admin/cotizaciones");
  return quotation;
}

/**
 * Aprueba una cotización, genera la cuenta de cobro correspondiente
 * y descuenta las cantidades de productos del stock (inventario).
 */
export async function approveQuotation(quotationId: number) {
  // 1. Obtener la cotización con sus productos e ítems
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      items: true,
    },
  });

  if (!quotation) {
    throw new Error("Cotización no encontrada");
  }

  if (quotation.estado === "APROBADA") {
    throw new Error("La cotización ya fue aprobada");
  }

  // 2. Generar número de cuenta de cobro secuencial
  const billsCount = await prisma.billOfCollection.count();
  const numeroCuenta = `CC-${(billsCount + 1).toString().padStart(4, "0")}`;

  // 3. Ejecutar actualización de estado, creación de cuenta de cobro y descuento de inventario en una transacción
  await prisma.$transaction(async (tx) => {
    // A. Actualizar estado de la cotización
    await tx.quotation.update({
      where: { id: quotationId },
      data: { estado: "APROBADA" },
    });

    // B. Crear cuenta de cobro asociada
    await tx.billOfCollection.create({
      data: {
        numeroCuenta,
        quotationId,
        clientId: quotation.clientId,
        total: quotation.total,
        estado: "PENDIENTE",
        fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Vence en 30 días por defecto
      },
    });

    // C. Descontar stock de productos
    for (const item of quotation.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.cantidad,
          },
        },
      });
    }
  });

  revalidatePath("/admin/cotizaciones");
  revalidatePath("/admin/cuentas-cobro");
  revalidatePath("/admin"); // Para actualizar la vista de productos y stock
}

// --- BILLS OF COLLECTION ---

export async function getBillsOfCollection() {
  return await prisma.billOfCollection.findMany({
    include: {
      client: true,
      quotation: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
    orderBy: { fecha: "desc" },
  });
}
