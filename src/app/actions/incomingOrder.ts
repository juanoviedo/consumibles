"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getIncomingOrders() {
  const orders = await prisma.incomingOrder.findMany({
    where: { estado: "EN_CAMINO" },
    include: {
      product: true,
    },
    orderBy: { fechaPedido: "desc" },
  });
  return orders;
}

export async function createIncomingOrder(formData: FormData) {
  const productId = parseInt(formData.get("productId") as string, 10);
  const cantidad = parseInt(formData.get("cantidad") as string, 10);
  const costoUnitario = parseFloat(formData.get("costoUnitario") as string || "0");
  const fechaEstimadaRaw = formData.get("fechaEstimada") as string;
  
  const fechaEstimada = fechaEstimadaRaw ? new Date(fechaEstimadaRaw) : null;

  await prisma.incomingOrder.create({
    data: {
      productId,
      cantidad,
      costoUnitario,
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
    // A. Incrementar el stock del producto
    await tx.product.update({
      where: { id: order.productId },
      data: {
        stock: {
          increment: order.cantidad,
        },
      },
    });

    // B. Marcar el pedido como completado
    await tx.incomingOrder.update({
      where: { id },
      data: {
        estado: "COMPLETADO",
      },
    });

    // C. Calcular el costo promedio ponderado basado en todos los pedidos completados
    const completedOrders = await tx.incomingOrder.findMany({
      where: {
        productId: order.productId,
        estado: "COMPLETADO",
      },
    });

    let totalCost = 0;
    let totalQuantity = 0;

    for (const o of completedOrders) {
      totalCost += o.cantidad * Number(o.costoUnitario);
      totalQuantity += o.cantidad;
    }

    const costoPromedio = totalQuantity > 0 ? (totalCost / totalQuantity) : 0;

    // D. Actualizar el costo promedio en el producto
    await tx.product.update({
      where: { id: order.productId },
      data: {
        costoPromedio,
      },
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
