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
  try {
    const productId = parseInt(formData.get("productId") as string, 10);
    const tipo = (formData.get("tipo") as string) || "PEDIDO"; // PEDIDO, AJUSTE_INGRESO, AJUSTE_SALIDA, INICIALIZACION
    const cantidad = parseInt(formData.get("cantidad") as string, 10);
    const motivo = (formData.get("motivo") as string) || "";
    const aplicarInmediato = formData.get("aplicarInmediato") === "true" || tipo !== "PEDIDO";

    if (isNaN(cantidad) || cantidad <= 0) {
      throw new Error("La cantidad debe ser un número mayor a 0.");
    }

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

    // Si es un AJUSTE DE SALIDA, aplicar inmediatamente descontando inventario
    if (tipo === "AJUSTE_SALIDA") {
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: productId }
        });

        if (!product) {
          throw new Error("Producto no encontrado");
        }

        const stockPrevio = product.stockActual;
        if (stockPrevio < cantidad) {
          throw new Error(`Stock insuficiente. Stock actual: ${stockPrevio}, intento de salida: ${cantidad}`);
        }

        const stockNuevo = stockPrevio - cantidad;
        const pPromedio = Number(product.precioPromedioCompra || 0);
        const valorInventarioNuevo = stockNuevo * pPromedio;

        await tx.product.update({
          where: { id: productId },
          data: {
            stockActual: stockNuevo,
            valorInventarioActual: valorInventarioNuevo
          }
        });

        await tx.incomingOrder.create({
          data: {
            productId,
            cantidad,
            costoUnitario: pPromedio,
            fechaPedido,
            fechaEstimada: null,
            estado: "COMPLETADO",
            tipo: "AJUSTE_SALIDA",
            motivo: motivo || "Ajuste manual de salida / merma"
          }
        });

        await tx.inventoryLog.create({
          data: {
            productId,
            tipo: "AJUSTE_SALIDA",
            cantidad,
            costoUnit: pPromedio,
            stockPrevio,
            stockNuevo,
            detalle: motivo || `Ajuste manual de salida: -${cantidad} u`
          }
        });
      });

      revalidatePath("/");
      revalidatePath("/admin");
      revalidatePath("/admin/productos");
      revalidatePath("/admin/pedidos-camino");
      return { success: true };
    }

    // Si es un AJUSTE DE ENTRADA o INICIALIZACION con aplicación directa
    if (aplicarInmediato && (tipo === "AJUSTE_INGRESO" || tipo === "INICIALIZACION")) {
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: productId }
        });

        if (!product) {
          throw new Error("Producto no encontrado");
        }

        const stockPrevio = product.stockActual;
        const stockNuevo = stockPrevio + cantidad;

        let precioPromedioNuevo = 0;
        let fechaPromedioNuevo: Date | null = null;

        if (tipo === "INICIALIZACION" || !product.costoInicialConfigurado || Number(product.precioPromedioCompra) <= 0 || stockPrevio <= 0) {
          precioPromedioNuevo = costoUnitario;
          fechaPromedioNuevo = fechaPedido;
        } else {
          const pPrevio = Number(product.precioPromedioCompra);
          const pCompra = costoUnitario;
          precioPromedioNuevo = ((stockPrevio * pPrevio) + (cantidad * pCompra)) / stockNuevo;

          const tPrevio = product.fechaPromedioCompra 
            ? new Date(product.fechaPromedioCompra).getTime() 
            : fechaPedido.getTime();
          const tCompra = fechaPedido.getTime();
          const tNuevo = ((stockPrevio * tPrevio) + (cantidad * tCompra)) / stockNuevo;
          fechaPromedioNuevo = new Date(tNuevo);
        }

        const valorInventarioNuevo = stockNuevo * precioPromedioNuevo;

        await tx.product.update({
          where: { id: productId },
          data: {
            stockActual: stockNuevo,
            precioPromedioCompra: precioPromedioNuevo,
            fechaPromedioCompra: fechaPromedioNuevo,
            valorInventarioActual: valorInventarioNuevo,
            costoInicialConfigurado: true
          }
        });

        await tx.incomingOrder.create({
          data: {
            productId,
            cantidad,
            costoUnitario,
            fechaPedido,
            fechaEstimada,
            estado: "COMPLETADO",
            tipo,
            motivo: motivo || (tipo === "INICIALIZACION" ? "Configuración de costo y stock inicial" : "Ajuste de inventario / entrada con costo")
          }
        });

        await tx.inventoryLog.create({
          data: {
            productId,
            tipo: tipo === "INICIALIZACION" ? "INICIALIZACION" : "AJUSTE_INGRESO",
            cantidad,
            costoUnit: costoUnitario,
            stockPrevio,
            stockNuevo,
            detalle: motivo || (tipo === "INICIALIZACION" ? `Inicialización de costo a $${costoUnitario.toLocaleString()} (${cantidad} u)` : `Ajuste de entrada: +${cantidad} u a $${costoUnitario.toLocaleString()}/u`)
          }
        });
      });

      revalidatePath("/");
      revalidatePath("/admin");
      revalidatePath("/admin/productos");
      revalidatePath("/admin/pedidos-camino");
      return { success: true };
    }

    // Pedido regular (EN_CAMINO)
    const duplicate = await prisma.incomingOrder.findFirst({
      where: {
        productId,
        cantidad,
        costoUnitario,
        tipo,
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
        tipo,
        motivo: motivo || null
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/productos");
    revalidatePath("/admin/pedidos-camino");
    return { success: true };
  } catch (err: any) {
    console.error("Error creating incoming order / adjustment:", err);
    return { error: err.message || "Error interno del servidor" };
  }
}

export async function completeIncomingOrder(id: number) {
  try {
    const order = await prisma.incomingOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error("Pedido no encontrado");
    }

    if (order.estado !== "EN_CAMINO") {
      throw new Error("El pedido ya no está en camino");
    }

    await prisma.$transaction(async (tx) => {
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

      if (order.tipo === "INICIALIZACION" || !product.costoInicialConfigurado || Number(product.precioPromedioCompra) <= 0 || stockPrevio <= 0) {
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

      await tx.incomingOrder.update({
        where: { id },
        data: {
          estado: "COMPLETADO",
        },
      });

      const logType = order.tipo === "INICIALIZACION" ? "INICIALIZACION" : order.tipo === "AJUSTE_INGRESO" ? "AJUSTE_INGRESO" : "COMPRA";

      await tx.inventoryLog.create({
        data: {
          productId: order.productId,
          tipo: logType,
          cantidad: order.cantidad,
          costoUnit: order.costoUnitario,
          stockPrevio,
          stockNuevo,
          detalle: order.motivo || `Pedido completado #${order.id}. Compra de ${order.cantidad} unidades a $${Number(order.costoUnitario).toLocaleString()}/u`
        }
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/productos");
    revalidatePath("/admin/pedidos-camino");
    return { success: true };
  } catch (err: any) {
    console.error("Error completing incoming order:", err);
    return { error: err.message || "Error interno del servidor" };
  }
}

export async function cancelIncomingOrder(id: number) {
  try {
    await prisma.incomingOrder.update({
      where: { id },
      data: {
        estado: "CANCELADO",
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/productos");
    revalidatePath("/admin/pedidos-camino");
    return { success: true };
  } catch (err: any) {
    console.error("Error cancelling incoming order:", err);
    return { error: err.message || "Error interno del servidor" };
  }
}

export async function revertIncomingOrder(id: number) {
  try {
    const order = await prisma.incomingOrder.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!order) {
      throw new Error("Pedido no encontrado");
    }

    if (order.estado === "EN_CAMINO") {
      return { success: true, message: "El pedido ya está en camino" };
    }

    if (order.estado === "COMPLETADO") {
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: order.productId },
        });

        if (!product) {
          throw new Error("Producto no encontrado");
        }

        const stockPrevio = product.stockActual;
        let stockNuevo = stockPrevio;

        if (order.tipo === "AJUSTE_SALIDA") {
          // Revertir una salida devuelve las unidades al stock
          stockNuevo = stockPrevio + order.cantidad;
        } else {
          // Revertir una entrada / compra / inicialización descuenta las unidades
          stockNuevo = Math.max(0, stockPrevio - order.cantidad);
        }

        const pPromedio = Number(product.precioPromedioCompra || 0);
        const valorInventarioNuevo = stockNuevo * pPromedio;

        await tx.product.update({
          where: { id: order.productId },
          data: {
            stockActual: stockNuevo,
            valorInventarioActual: valorInventarioNuevo,
          },
        });

        await tx.incomingOrder.update({
          where: { id },
          data: {
            estado: "EN_CAMINO",
          },
        });

        await tx.inventoryLog.create({
          data: {
            productId: order.productId,
            tipo: "REVERSION",
            cantidad: order.tipo === "AJUSTE_SALIDA" ? order.cantidad : -order.cantidad,
            costoUnit: order.costoUnitario,
            stockPrevio,
            stockNuevo,
            detalle: `Reversión de ${order.tipo} #${order.id} a estado EN_CAMINO para edición.`,
          },
        });
      });
    } else if (order.estado === "CANCELADO") {
      await prisma.incomingOrder.update({
        where: { id },
        data: {
          estado: "EN_CAMINO",
        },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/productos");
    revalidatePath("/admin/pedidos-camino");
    return { success: true };
  } catch (err: any) {
    console.error("Error reverting incoming order:", err);
    return { error: err.message || "Error interno del servidor" };
  }
}

export async function updateIncomingOrder(formData: FormData) {
  try {
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
    revalidatePath("/admin/productos");
    revalidatePath("/admin/pedidos-camino");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating incoming order:", err);
    return { error: err.message || "Error interno del servidor" };
  }
}

export async function deleteIncomingOrder(id: number) {
  try {
    await prisma.incomingOrder.delete({
      where: { id },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/productos");
    revalidatePath("/admin/pedidos-camino");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting incoming order:", err);
    return { error: err.message || "Error interno del servidor" };
  }
}
