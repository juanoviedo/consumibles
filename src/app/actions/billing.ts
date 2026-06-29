"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { QuotationStatus } from "@prisma/client";

function safeDecimal(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  const MAX_LIMIT = 99999999.99;
  const MIN_LIMIT = -99999999.99;
  if (val > MAX_LIMIT) return MAX_LIMIT;
  if (val < MIN_LIMIT) return MIN_LIMIT;
  return val;
}

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
  const contacto = formData.get("contacto") as string;
  const direccion = formData.get("direccion") as string;
  const ciudad = formData.get("ciudad") as string;
  const departamento = formData.get("departamento") as string;
  const pais = formData.get("pais") as string;

  const duplicate = await prisma.client.findFirst({
    where: {
      OR: [
        nit ? { nit } : null,
        { nombre }
      ].filter(Boolean) as any,
      createdAt: {
        gte: new Date(Date.now() - 3000)
      }
    }
  });
  if (duplicate) {
    throw new Error("Cliente duplicado detectado. Operación bloqueada.");
  }

  await prisma.client.create({
    data: {
      nit: nit || null,
      nombre,
      email: email || null,
      telefono: telefono || null,
      contacto: contacto || null,
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
  const contacto = formData.get("contacto") as string;
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
      contacto: contacto || null,
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
    subtotalVenta: Number(q.subtotalVenta),
    subtotalCosto: Number(q.subtotalCosto),
    utilidadTotal: Number(q.utilidadTotal),
    rentabilidadPorcentual: Number(q.rentabilidadPorcentual),
    rentabilidadMensual: Number(q.rentabilidadMensual),
    rentabilidadEfectivaAnual: Number(q.rentabilidadEfectivaAnual),
    diasPromedioInventario: Number(q.diasPromedioInventario),
    items: q.items.map((i) => ({
      ...i,
      precioUnitario: Number(i.precioUnitario),
      costoPromedioUnitario: Number(i.costoPromedioUnitario),
      utilidadUnitaria: Number(i.utilidadUnitaria),
      utilidadTotal: Number(i.utilidadTotal),
      rentabilidadPorcentual: Number(i.rentabilidadPorcentual),
      rentabilidadMensual: Number(i.rentabilidadMensual),
      rentabilidadEfectivaAnual: Number(i.rentabilidadEfectivaAnual),
      product: {
        ...i.product,
        precio: Number(i.product.precio),
        precioPromedioCompra: Number(i.product.precioPromedioCompra),
        valorInventarioActual: Number(i.product.valorInventarioActual)
      },
    })),
  }));
}

export async function createQuotation(
  clientId: number,
  items: { productId: number; cantidad: number; precioUnitario: number }[]
) {
  try {
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

    const duplicate = await prisma.quotation.findFirst({
      where: {
        clientId,
        total,
        createdAt: {
          gte: new Date(Date.now() - 3000)
        }
      }
    });
    if (duplicate) {
      throw new Error("Cotización duplicada detectada. Operación bloqueada.");
    }

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
    return { success: true, quotation };
  } catch (err: any) {
    console.error("Error al crear cotización:", err);
    return { error: err.message || "Error interno al crear cotización" };
  }
}

export async function updateQuotation(
  id: number,
  clientId: number,
  items: { productId: number; cantidad: number; precioUnitario: number }[]
) {
  try {
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
    return { success: true };
  } catch (err: any) {
    console.error("Error al actualizar cotización:", err);
    return { error: err.message || "Error interno al actualizar cotización" };
  }
}

export async function copyQuotationAsNew(quotationId: number) {
  try {
    const source = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: true,
      },
    });

    if (!source) {
      throw new Error("Documento de origen no encontrado.");
    }

    const itemsToCopy = source.items.map((item) => ({
      productId: item.productId,
      cantidad: item.cantidad,
      precioUnitario: Number(item.precioUnitario),
    }));

    const result = await createQuotation(source.clientId, itemsToCopy);

    revalidatePath("/admin/cotizaciones");
    return result;
  } catch (err: any) {
    console.error("Error al copiar cotización:", err);
    return { error: err.message || "Error interno al copiar cotización" };
  }
}



/**
 * Convierte una cotización en Cuenta de Cobro (estado CUENTA_COBRO).
 * Genera el consecutivo de cuenta de cobro y resta los productos del inventario.
 */
export async function convertToBillOfCollection(quotationId: number) {
  try {
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
      let subtotalVenta = 0;
      let subtotalCosto = 0;
      let weightedDaysSum = 0;

      // 1. Validar y descontar del inventario, y registrar snapshots
      for (const item of quotation.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Producto con ID ${item.productId} no encontrado`);
        }

        if (product.stockActual < item.cantidad) {
          throw new Error(`Stock insuficiente para el producto "${product.nombre}". Disponible: ${product.stockActual}, requerido: ${item.cantidad}`);
        }

        const stockPrevio = product.stockActual;
        const stockNuevo = stockPrevio - item.cantidad;

        const costoPromedioUnitario = Number(product.precioPromedioCompra);
        const fechaPromedioCompra = product.fechaPromedioCompra;

        const precioUnit = Number(item.precioUnitario);
        const utilidadUnitaria = safeDecimal(precioUnit - costoPromedioUnitario);
        const utilidadTotal = safeDecimal(utilidadUnitaria * item.cantidad);

        // Calcular días en inventario (mínimo 1)
        let diasInventario = 1;
        if (fechaPromedioCompra) {
          const diffTime = fechaCuentaCobro.getTime() - new Date(fechaPromedioCompra).getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          diasInventario = diffDays < 1 ? 1 : diffDays;
        }

        // Rentabilidad del ítem
        let rentabilidadPorcentual = 0;
        let rentabilidadMensual = 0;
        let rentabilidadEfectivaAnual = 0;
        if (costoPromedioUnitario > 0) {
          const r = utilidadUnitaria / costoPromedioUnitario;
          rentabilidadPorcentual = safeDecimal(r * 100);
          rentabilidadMensual = safeDecimal((Math.pow(1 + r, 30 / diasInventario) - 1) * 100);
          rentabilidadEfectivaAnual = safeDecimal((Math.pow(1 + r, 365 / diasInventario) - 1) * 100);
        }

        // Snapshot financiero a nivel de item
        await tx.quotationItem.update({
          where: { id: item.id },
          data: {
            costoPromedioUnitario,
            fechaPromedioCompra,
            utilidadUnitaria,
            utilidadTotal,
            diasInventario,
            rentabilidadPorcentual,
            rentabilidadMensual,
            rentabilidadEfectivaAnual
          }
        });

        // Descontar del inventario y valorizar
        const valorInventarioActual = stockNuevo * costoPromedioUnitario;
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockActual: stockNuevo,
            valorInventarioActual
          }
        });

        // Crear log de inventario
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            tipo: "VENTA",
            cantidad: item.cantidad,
            costoUnit: costoPromedioUnitario,
            stockPrevio,
            stockNuevo,
            detalle: `Venta facturada en Cuenta de Cobro ${numeroCuentaCobro}. Cantidad: ${item.cantidad}. Costo Unitario: $${costoPromedioUnitario.toLocaleString()}`
          }
        });

        // Acumuladores de cabecera
        subtotalVenta += precioUnit * item.cantidad;
        subtotalCosto += costoPromedioUnitario * item.cantidad;
        weightedDaysSum += diasInventario * (costoPromedioUnitario * item.cantidad);
      }

      // 2. Calcular consolidados de cabecera
      const utilidadTotalConsolidada = safeDecimal(subtotalVenta - subtotalCosto);
      let diasPromedioInventario = 1;
      if (subtotalCosto > 0) {
        diasPromedioInventario = weightedDaysSum / subtotalCosto;
      }
      if (diasPromedioInventario < 1) {
        diasPromedioInventario = 1;
      }

      let rentabilidadPorcentualConsolidada = 0;
      let rentabilidadMensualConsolidada = 0;
      let rentabilidadEfectivaAnualConsolidada = 0;
      if (subtotalCosto > 0) {
        const r_consolidado = utilidadTotalConsolidada / subtotalCosto;
        rentabilidadPorcentualConsolidada = safeDecimal(r_consolidado * 100);
        rentabilidadMensualConsolidada = safeDecimal((Math.pow(1 + r_consolidado, 30 / diasPromedioInventario) - 1) * 100);
        rentabilidadEfectivaAnualConsolidada = safeDecimal((Math.pow(1 + r_consolidado, 365 / diasPromedioInventario) - 1) * 100);
      }

      // 3. Actualizar la cabecera de la cotización a Cuenta de Cobro
      await tx.quotation.update({
        where: { id: quotationId },
        data: {
          estado: QuotationStatus.CUENTA_COBRO,
          numeroCuentaCobro,
          fechaCuentaCobro,
          fechaVencimiento,
          subtotalVenta: safeDecimal(subtotalVenta),
          subtotalCosto: safeDecimal(subtotalCosto),
          utilidadTotal: utilidadTotalConsolidada,
          rentabilidadPorcentual: rentabilidadPorcentualConsolidada,
          rentabilidadMensual: rentabilidadMensualConsolidada,
          rentabilidadEfectivaAnual: rentabilidadEfectivaAnualConsolidada,
          diasPromedioInventario
        },
      });
    });

    revalidatePath("/admin/cotizaciones");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Error al facturar:", err);
    return { error: err.message || "Error interno del servidor" };
  }
}

export async function markAsPaid(quotationId: number) {
  try {
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        estado: QuotationStatus.PAGADA,
      },
    });

    revalidatePath("/admin/cotizaciones");
    return { success: true };
  } catch (err: any) {
    console.error("Error in markAsPaid:", err);
    return { error: err.message || "Error interno del servidor" };
  }
}

export async function markAsRejected(quotationId: number) {
  try {
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        estado: QuotationStatus.RECHAZADA,
      },
    });

    revalidatePath("/admin/cotizaciones");
    return { success: true };
  } catch (err: any) {
    console.error("Error in markAsRejected:", err);
    return { error: err.message || "Error interno del servidor" };
  }
}

/**
 * Revierte una Cuenta de Cobro o Cotización Aprobada/Pagada de vuelta a estado COTIZACION.
 * Limpia los campos de facturación y opcionalmente reabastece el inventario.
 */
export async function revertToQuotation(quotationId: number, devolverInventario: boolean) {
  try {
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
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });
          if (!product) {
            throw new Error(`Producto con ID ${item.productId} no encontrado`);
          }

          const stockPrevio = product.stockActual;
          const stockNuevo = stockPrevio + item.cantidad;
          const costoPromedio = Number(product.precioPromedioCompra);
          const valorInventarioActual = stockNuevo * costoPromedio;

          // Devolver al stock del producto
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockActual: stockNuevo,
              valorInventarioActual
            },
          });

          // Registrar log de reversión
          await tx.inventoryLog.create({
            data: {
              productId: item.productId,
              tipo: "REVERSION",
              cantidad: item.cantidad,
              costoUnit: costoPromedio,
              stockPrevio,
              stockNuevo,
              detalle: `Reversión de venta: Cuenta de Cobro ${quotation.numeroCuentaCobro || ""}. Cantidad devuelta: ${item.cantidad}`
            }
          });

          // Limpiar snapshots de item
          await tx.quotationItem.update({
            where: { id: item.id },
            data: {
              costoPromedioUnitario: 0,
              fechaPromedioCompra: null,
              utilidadUnitaria: 0,
              utilidadTotal: 0,
              diasInventario: 0,
              rentabilidadPorcentual: 0,
              rentabilidadMensual: 0,
              rentabilidadEfectivaAnual: 0
            }
          });
        }
      }

      // 2. Regresar la cotización al estado inicial PENDIENTE/COTIZACION y limpiar campos financieros de cabecera
      await tx.quotation.update({
        where: { id: quotationId },
        data: {
          estado: QuotationStatus.COTIZACION,
          numeroCuentaCobro: null,
          fechaCuentaCobro: null,
          fechaVencimiento: null,
          subtotalVenta: 0,
          subtotalCosto: 0,
          utilidadTotal: 0,
          rentabilidadPorcentual: 0,
          rentabilidadMensual: 0,
          rentabilidadEfectivaAnual: 0,
          diasPromedioInventario: 0
        },
      });
    });

    revalidatePath("/admin/cotizaciones");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Error in revertToQuotation:", err);
    return { error: err.message || "Error interno al revertir" };
  }
}

export async function deleteQuotation(id: number) {
  try {
    // Nota: Al borrar, la relación onDelete: Cascade en QuotationItem eliminará sus ítems automáticamente.
    await prisma.quotation.delete({
      where: { id },
    });

    revalidatePath("/admin/cotizaciones");
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteQuotation:", err);
    return { error: err.message || "Error al eliminar cotización" };
  }
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
        companyName: "CONSUMIBLES & REPUESTOS",
        companySlogan: "Equipos de Corte Plasma y Soldadura Industrial",
        companyPhone: "+57 316 831 4501",
      },
    });
  }
  return {
    ...settings,
    startQuotationNumber: Number(settings.startQuotationNumber),
    startBillNumber: Number(settings.startBillNumber),
    bankDetails: settings.bankDetails,
    companyName: settings.companyName || "CONSUMIBLES & REPUESTOS",
    companySlogan: settings.companySlogan || "Equipos de Corte Plasma y Soldadura Industrial",
    companyPhone: settings.companyPhone || "+57 316 831 4501",
  };
}

export async function updateSettings(formData: FormData) {
  const startQuotationNumber = parseInt(formData.get("startQuotationNumber") as string || "1", 10);
  const startBillNumber = parseInt(formData.get("startBillNumber") as string || "1", 10);
  const bankDetails = formData.get("bankDetails") as string || "";
  const companyName = formData.get("companyName") as string || "CONSUMIBLES & REPUESTOS";
  const companySlogan = formData.get("companySlogan") as string || "Equipos de Corte Plasma y Soldadura Industrial";
  const companyPhone = formData.get("companyPhone") as string || "+57 316 831 4501";

  await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: {
      startQuotationNumber,
      startBillNumber,
      bankDetails,
      companyName,
      companySlogan,
      companyPhone,
    },
    create: {
      id: 1,
      startQuotationNumber,
      startBillNumber,
      bankDetails,
      companyName,
      companySlogan,
      companyPhone,
    },
  });

  revalidatePath("/admin/cotizaciones");
  revalidatePath("/admin/configuracion");
}
