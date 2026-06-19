"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getIncomingOrders() {
  const orders = await prisma.incomingOrder.findMany({
    include: {
      product: true,
    },
    orderBy: { fechaPedido: "desc" },
  });
  return orders.map(o => ({
    ...o,
    costoUnitario: Number(o.costoUnitario),
    product: {
      ...o.product,
      precio: Number(o.product.precio),
      precioPromedioCompra: Number(o.product.precioPromedioCompra),
      valorInventarioActual: Number(o.product.valorInventarioActual)
    }
  }));
}

export async function createIncomingOrder(formData: FormData) {
  const productId = parseInt(formData.get("productId") as string, 10);
  const cantidad = parseInt(formData.get("cantidad") as string, 10);
  const costoUnitarioInput = formData.get("costoUnitario");
  const costoTotalInput = formData.get("costoTotal");
  let costoUnitario = 0;

  if (costoUnitarioInput !== null && costoUnitarioInput !== "") {
    costoUnitario = parseFloat(costoUnitarioInput as string || "0");
  } else if (costoTotalInput !== null && costoTotalInput !== "") {
    const costoTotal = parseFloat(costoTotalInput as string || "0");
    costoUnitario = cantidad > 0 ? (costoTotal / cantidad) : 0;
  }
  const fechaEstimadaRaw = formData.get("fechaEstimada") as string;
  const fechaEstimada = fechaEstimadaRaw ? new Date(fechaEstimadaRaw) : null;

  const fechaPedidoRaw = formData.get("fechaPedido") as string;
  const fechaPedido = fechaPedidoRaw ? new Date(fechaPedidoRaw) : new Date();

  const duplicate = await prisma.incomingOrder.findFirst({
    where: {
      productId,
      cantidad,
      costoUnitario,
      createdAt: {
        gte: new Date(Date.now() - 3000)
      }
    }
  });
  if (duplicate) {
    throw new Error("Pedido duplicado detectado. Operación bloqueada.");
  }

  await prisma.incomingOrder.create({
    data: {
      productId,
      cantidad,
      costoUnitario,
      fechaPedido,
      fechaEstimada,
      estado: "EN_CAMINO",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos-camino");
}

export async function completeIncomingOrder(id: number) {
  // 1. Obtener los detalles del pedido en camino
  const order = await prisma.incomingOrder.findUnique({
    where: { id },
  });

  if (!order) {
    throw new Error("Pedido no encontrado");
  }

  if (order.estado !== "EN_CAMINO") {
    throw new Error("El pedido ya no está en camino");
  }

  // 2. Ejecutar la actualización en una transacción interactiva
  await prisma.$transaction(async (tx) => {
    // A. Obtener el producto
    const product = await tx.product.findUnique({
      where: { id: order.productId }
    });

    if (!product) {
      throw new Error("Producto no encontrado");
    }

    const stockPrevio = product.stockActual;
    const stockNuevo = stockPrevio + order.cantidad;

    let precioPromedioNuevo = 0;
    let fechaPromedioNuevo: Date | null = null;

    if (!product.costoInicialConfigurado || Number(product.precioPromedioCompra) <= 0 || stockPrevio <= 0) {
      precioPromedioNuevo = Number(order.costoUnitario);
      fechaPromedioNuevo = new Date(order.fechaPedido);
    } else {
      const pPrevio = Number(product.precioPromedioCompra);
      const pCompra = Number(order.costoUnitario);
      precioPromedioNuevo = ((stockPrevio * pPrevio) + (order.cantidad * pCompra)) / stockNuevo;

      const tPrevio = product.fechaPromedioCompra 
        ? new Date(product.fechaPromedioCompra).getTime() 
        : new Date(order.fechaPedido).getTime();
      const tCompra = new Date(order.fechaPedido).getTime();
      const tNuevo = ((stockPrevio * tPrevio) + (order.cantidad * tCompra)) / stockNuevo;
      fechaPromedioNuevo = new Date(tNuevo);
    }

    const valorInventarioNuevo = stockNuevo * precioPromedioNuevo;

    // B. Actualizar el producto con nuevos stocks y costos
    await tx.product.update({
      where: { id: order.productId },
      data: {
        stockActual: stockNuevo,
        precioPromedioCompra: precioPromedioNuevo,
        fechaPromedioCompra: fechaPromedioNuevo,
        valorInventarioActual: valorInventarioNuevo,
        costoInicialConfigurado: true
      }
    });

    // C. Marcar el pedido como completado
    await tx.incomingOrder.update({
      where: { id },
      data: {
        estado: "COMPLETADO",
      },
    });

    // D. Registrar en el historial de inventario (InventoryLog)
    await tx.inventoryLog.create({
      data: {
        productId: order.productId,
        tipo: "COMPRA",
        cantidad: order.cantidad,
        costoUnit: order.costoUnitario,
        stockPrevio,
        stockNuevo,
        detalle: `Pedido completado #${order.id}. Compra de ${order.cantidad} unidades a $${Number(order.costoUnitario).toLocaleString()}/u`
      }
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos-camino");
}

export async function cancelIncomingOrder(id: number) {
  await prisma.incomingOrder.update({
    where: { id },
    data: {
      estado: "CANCELADO",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos-camino");
}

export async function updateIncomingOrder(formData: FormData) {
  const id = parseInt(formData.get("id") as string, 10);
  const productId = parseInt(formData.get("productId") as string, 10);
  const cantidad = parseInt(formData.get("cantidad") as string, 10);
  const costoUnitarioInput = formData.get("costoUnitario");
  const costoTotalInput = formData.get("costoTotal");
  let costoUnitario = 0;

  if (costoUnitarioInput !== null && costoUnitarioInput !== "") {
    costoUnitario = parseFloat(costoUnitarioInput as string || "0");
  } else if (costoTotalInput !== null && costoTotalInput !== "") {
    const costoTotal = parseFloat(costoTotalInput as string || "0");
    costoUnitario = cantidad > 0 ? (costoTotal / cantidad) : 0;
  }
  const fechaEstimadaRaw = formData.get("fechaEstimada") as string;
  const fechaEstimada = fechaEstimadaRaw ? new Date(fechaEstimadaRaw) : null;

  const fechaPedidoRaw = formData.get("fechaPedido") as string;
  const fechaPedido = fechaPedidoRaw ? new Date(fechaPedidoRaw) : undefined;

  await prisma.incomingOrder.update({
    where: { id },
    data: {
      productId,
      cantidad,
      costoUnitario,
      fechaPedido,
      fechaEstimada,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos-camino");
}

export async function deleteIncomingOrder(id: number) {
  await prisma.incomingOrder.delete({
    where: { id },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos-camino");
}
