"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { QuotationStatus } from "@prisma/client";

// --- CLIENTS CRUD ---

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
  const ciudad = formData.get("ciudad") as string;
  const departamento = formData.get("departamento") as string;
  const pais = formData.get("pais") as string;

  await prisma.client.create({
    data: {
      nit: nit || null,
      nombre,
      email: email || null,
      telefono: telefono || null,
      direccion: direccion || null,
      ciudad: ciudad || null,
      departamento: departamento || null,
      pais: pais || "Colombia",
    },
  });

  revalidatePath("/admin/clientes");
}

export async function updateClient(formData: FormData) {
  const id = parseInt(formData.get("id") as string, 10);
  const nit = formData.get("nit") as string;
  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const telefono = formData.get("telefono") as string;
  const direccion = formData.get("direccion") as string;
  const ciudad = formData.get("ciudad") as string;
  const departamento = formData.get("departamento") as string;
  const pais = formData.get("pais") as string;

  await prisma.client.update({
    where: { id },
    data: {
      nit: nit || null,
      nombre,
      email: email || null,
      telefono: telefono || null,
      direccion: direccion || null,
      ciudad: ciudad || null,
      departamento: departamento || null,
      pais: pais || "Colombia",
    },
  });

  revalidatePath("/admin/clientes");
}

export async function deleteClient(id: number) {
  await prisma.client.delete({
    where: { id },
  });

  revalidatePath("/admin/clientes");
}

// --- QUOTATIONS & BILLING ---

export async function getQuotations() {
  const quotations = await prisma.quotation.findMany({
    include: {
      client: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Convert Decimal prices to numbers for easier serializability in Next.js Client Components
  return quotations.map((q) => ({
    ...q,
    total: Number(q.total),
    items: q.items.map((i) => ({
      ...i,
      precioUnitario: Number(i.precioUnitario),
      product: {
        ...i.product,
        precio: Number(i.product.precio),
      },
    })),
  }));
}

export async function createQuotation(
  clientId: number,
  items: { productId: number; cantidad: number; precioUnitario: number }[]
) {
  if (items.length === 0) {
    throw new Error("El documento debe contener al menos un producto.");
  }

  const total = items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0);

  // Generar número correlativo para la cotización
  const settings = await getSettings();
  const quotationsList = await prisma.quotation.findMany({
    select: { numeroCotizacion: true }
  });
  let nextNum = settings.startQuotationNumber;
  quotationsList.forEach(q => {
    const match = q.numeroCotizacion.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num >= nextNum) {
        nextNum = num + 1;
      }
    }
  });
  const numeroCotizacion = `COT-${nextNum.toString().padStart(4, "0")}`;

  const quotation = await prisma.quotation.create({
    data: {
      numeroCotizacion,
      clientId,
      total,
      estado: QuotationStatus.COTIZACION,
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

export async function updateQuotation(
  id: number,
  clientId: number,
  items: { productId: number; cantidad: number; precioUnitario: number }[]
) {
  if (items.length === 0) {
    throw new Error("El documento debe contener al menos un producto.");
  }

  const total = items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0);

  // Ejecutamos en transacción: eliminar ítems viejos e insertar los nuevos
  await prisma.$transaction(async (tx) => {
    // 1. Eliminar items anteriores
    await tx.quotationItem.deleteMany({
      where: { quotationId: id },
    });

    // 2. Actualizar cabecera de la cotización
    await tx.quotation.update({
      where: { id },
      data: {
        clientId,
        total,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
          })),
        },
      },
    });
  });

  revalidatePath("/admin/cotizaciones");
}


/**
 * Convierte una cotización en Cuenta de Cobro (estado CUENTA_COBRO).
 * Genera el consecutivo de cuenta de cobro y resta los productos del inventario.
 */
export async function convertToBillOfCollection(quotationId: number) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true },
  });

  if (!quotation) {
    throw new Error("Cotización no encontrada");
  }

  if (quotation.estado !== QuotationStatus.COTIZACION && quotation.estado !== QuotationStatus.APROBADA) {
    throw new Error("El documento no está en estado válido para ser facturado.");
  }

  // Generar número consecutivo para la cuenta de cobro
  const settings = await getSettings();
  const quotationsWithBills = await prisma.quotation.findMany({
    where: { numeroCuentaCobro: { not: null } },
    select: { numeroCuentaCobro: true }
  });
  let nextNum = settings.startBillNumber;
  quotationsWithBills.forEach(q => {
    if (q.numeroCuentaCobro) {
      const match = q.numeroCuentaCobro.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num >= nextNum) {
          nextNum = num + 1;
        }
      }
    }
  });
  const numeroCuentaCobro = `CC-${nextNum.toString().padStart(4, "0")}`;

  const fechaCuentaCobro = new Date();
  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaCuentaCobro.getDate() + 30); // 30 días para pagar

  await prisma.$transaction(async (tx) => {
    // 1. Actualizar campos de cotización a cuenta de cobro
    await tx.quotation.update({
      where: { id: quotationId },
      data: {
        estado: QuotationStatus.CUENTA_COBRO,
        numeroCuentaCobro,
        fechaCuentaCobro,
        fechaVencimiento,
      },
    });

    // 2. Descontar del inventario
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
  revalidatePath("/admin");
}

export async function markAsPaid(quotationId: number) {
  await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      estado: QuotationStatus.PAGADA,
    },
  });

  revalidatePath("/admin/cotizaciones");
}

export async function markAsRejected(quotationId: number) {
  await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      estado: QuotationStatus.RECHAZADA,
    },
  });

  revalidatePath("/admin/cotizaciones");
}

/**
 * Revierte una Cuenta de Cobro o Cotización Aprobada/Pagada de vuelta a estado COTIZACION.
 * Limpia los campos de facturación y opcionalmente reabastece el inventario.
 */
export async function revertToQuotation(quotationId: number, devolverInventario: boolean) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true },
  });

  if (!quotation) {
    throw new Error("Documento no encontrado");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Si se solicita y estaba facturado, devolver artículos al stock
    if (devolverInventario && (quotation.estado === QuotationStatus.CUENTA_COBRO || quotation.estado === QuotationStatus.PAGADA)) {
      for (const item of quotation.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.cantidad,
            },
          },
        });
      }
    }

    // 2. Regresar la cotización al estado inicial PENDIENTE/COTIZACION
    await tx.quotation.update({
      where: { id: quotationId },
      data: {
        estado: QuotationStatus.COTIZACION,
        numeroCuentaCobro: null,
        fechaCuentaCobro: null,
        fechaVencimiento: null,
      },
    });
  });

  revalidatePath("/admin/cotizaciones");
  revalidatePath("/admin");
}

export async function deleteQuotation(id: number) {
  // Nota: Al borrar, la relación onDelete: Cascade en QuotationItem eliminará sus ítems automáticamente.
  await prisma.quotation.delete({
    where: { id },
  });

  revalidatePath("/admin/cotizaciones");
}

// --- SYSTEM SETTINGS ---

export async function getSettings() {
  let settings = await prisma.systemSettings.findFirst({
    where: { id: 1 },
  });
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        id: 1,
        startQuotationNumber: 1,
        startBillNumber: 1,
        bankDetails: "Transferencias a:\nNequi: 316 831 4501\nBancolombia Ahorros: 123-456789-01",
      },
    });
  }
  return {
    ...settings,
    startQuotationNumber: Number(settings.startQuotationNumber),
    startBillNumber: Number(settings.startBillNumber),
    bankDetails: settings.bankDetails,
  };
}

export async function updateSettings(formData: FormData) {
  const startQuotationNumber = parseInt(formData.get("startQuotationNumber") as string || "1", 10);
  const startBillNumber = parseInt(formData.get("startBillNumber") as string || "1", 10);
  const bankDetails = formData.get("bankDetails") as string || "";

  await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: {
      startQuotationNumber,
      startBillNumber,
      bankDetails,
    },
    create: {
      id: 1,
      startQuotationNumber,
      startBillNumber,
      bankDetails,
    },
  });

  revalidatePath("/admin/cotizaciones");
  revalidatePath("/admin/configuracion");
}
