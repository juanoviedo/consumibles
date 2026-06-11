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
  const fechaEstimadaRaw = formData.get("fechaEstimada") as string;
  
  const fechaEstimada = fechaEstimadaRaw ? new Date(fechaEstimadaRaw) : null;

  await prisma.incomingOrder.create({
    data: {
      productId,
      cantidad,
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

  // 2. Incrementar el stock del producto e indicar que el pedido está completado en una transacción
  await prisma.$transaction([
    prisma.product.update({
      where: { id: order.productId },
      data: {
        stock: {
          increment: order.cantidad,
        },
      },
    }),
    prisma.incomingOrder.update({
      where: { id },
      data: {
        estado: "COMPLETADO",
      },
    }),
  ]);

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
