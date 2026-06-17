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
    include: { 
      category: true,
      incomingOrders: {
        where: { estado: "EN_CAMINO" }
      },
      discounts: {
        include: {
          discount: true
        }
      }
    }
  });

  const now = new Date();

  return products.map(p => {
    const precioBase = Number(p.precio);
    let maxSavings = 0;
    let appliedDiscount: { idDescuento: number; nombre: string; tipo: string; valor: number } | null = null;

    if (p.discounts && p.discounts.length > 0) {
      for (const pd of p.discounts) {
        const d = pd.discount;
        if (!d || !d.activo) continue;

        const inicio = new Date(d.fechaInicio);
        const fin = new Date(d.fechaFin);
        if (now < inicio || now > fin) continue;

        let savings = 0;
        if (d.tipoDescuento === "Porcentaje") {
          savings = precioBase * (Number(d.valorDescuento) / 100);
        } else if (d.tipoDescuento === "ValorFijo") {
          savings = Number(d.valorDescuento);
        }

        if (savings > precioBase) {
          savings = precioBase;
        }

        if (savings > maxSavings) {
          maxSavings = savings;
          appliedDiscount = {
            idDescuento: d.id,
            nombre: d.nombre,
            tipo: d.tipoDescuento,
            valor: Number(d.valorDescuento)
          };
        }
      }
    }

    const precioFinal = precioBase - maxSavings;

    return {
      ...p,
      precio: precioBase, // Keep original precio as base price for standard components
      precioBase,
      precioFinal,
      idProducto: p.id,
      descuentoAplicado: appliedDiscount,
      precioPromedioCompra: Number(p.precioPromedioCompra),
      valorInventarioActual: Number(p.valorInventarioActual)
    };
  });
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
  const minStock = parseInt(formData.get("minStock") as string || "0", 10);
  
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

  const galeriaFiles = formData.getAll("galeriaFiles") as File[];
  const galeriaUrls: string[] = [];

  for (const f of galeriaFiles) {
    if (f && f.size > 0 && f.name !== "undefined") {
      try {
        const url = await uploadImage(f);
        if (url) galeriaUrls.push(url);
      } catch (err) {
        console.error(err);
      }
    }
  }

  const galeriaUrlsString = formData.get("galeriaUrlsString") as string;
  if (galeriaUrlsString) {
    const splitUrls = galeriaUrlsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
    galeriaUrls.push(...splitUrls);
  }

  await prisma.product.create({
    data: { 
      codigo, 
      nombre, 
      precio, 
      imagenUrl: imagenUrl || "", 
      galeria: galeriaUrls, 
      descripcion1, 
      descripcion2, 
      categoryId, 
      stockActual: 0, 
      minStock,
      precioPromedioCompra: 0,
      valorInventarioActual: 0,
      costoInicialConfigurado: false
    },
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
  const minStock = parseInt(formData.get("minStock") as string || "0", 10);

  const file = formData.get("imagenFile") as File | null;
  try {
    const uploadedUrl = await uploadImage(file);
    if (uploadedUrl) {
      imagenUrl = uploadedUrl;
    }
  } catch(err) {
    console.error(err);
  }

  const galeriaFiles = formData.getAll("galeriaFiles") as File[];
  const galeriaUrls: string[] = [];

  for (const f of galeriaFiles) {
    if (f && f.size > 0 && f.name !== "undefined") {
      try {
        const url = await uploadImage(f);
        if (url) galeriaUrls.push(url);
      } catch (err) {
        console.error(err);
      }
    }
  }

  const galeriaUrlsString = formData.get("galeriaUrlsString") as string;
  if (galeriaUrlsString) {
    const splitUrls = galeriaUrlsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
    galeriaUrls.push(...splitUrls);
  }

  await prisma.product.update({
    where: { id },
    data: { 
      codigo, 
      nombre, 
      precio, 
      imagenUrl: imagenUrl || "", 
      galeria: galeriaUrls, 
      descripcion1, 
      descripcion2, 
      categoryId, 
      minStock
    },
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

export async function getProductDetails(id: number) {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      discounts: {
        include: {
          discount: true
        }
      }
    }
  });

  if (!p) return null;

  const precioBase = Number(p.precio);
  let maxSavings = 0;
  let appliedDiscount: { idDescuento: number; nombre: string; tipo: string; valor: number } | null = null;
  const now = new Date();

  if (p.discounts && p.discounts.length > 0) {
    for (const pd of p.discounts) {
      const d = pd.discount;
      if (!d || !d.activo) continue;

      const inicio = new Date(d.fechaInicio);
      const fin = new Date(d.fechaFin);
      if (now < inicio || now > fin) continue;

      let savings = 0;
      if (d.tipoDescuento === "Porcentaje") {
        savings = precioBase * (Number(d.valorDescuento) / 100);
      } else if (d.tipoDescuento === "ValorFijo") {
        savings = Number(d.valorDescuento);
      }

      if (savings > precioBase) {
        savings = precioBase;
      }

      if (savings > maxSavings) {
        maxSavings = savings;
        appliedDiscount = {
          idDescuento: d.id,
          nombre: d.nombre,
          tipo: d.tipoDescuento,
          valor: Number(d.valorDescuento)
        };
      }
    }
  }

  const precioFinal = precioBase - maxSavings;

  return {
    ...p,
    precio: precioBase,
    precioBase,
    precioFinal,
    idProducto: p.id,
    descuentoAplicado: appliedDiscount,
    precioPromedioCompra: Number(p.precioPromedioCompra),
    valorInventarioActual: Number(p.valorInventarioActual)
  };
}

export async function initializeProductCost(
  productId: number,
  precioPromedioInicial: number,
  fechaPromedioInicial: string | Date
) {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    throw new Error("Producto no encontrado");
  }

  const stockActual = product.stockActual;
  const valorInventarioActual = stockActual * precioPromedioInicial;

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: {
        precioPromedioCompra: precioPromedioInicial,
        fechaPromedioCompra: new Date(fechaPromedioInicial),
        valorInventarioActual,
        costoInicialConfigurado: true
      }
    }),
    prisma.inventoryLog.create({
      data: {
        productId,
        tipo: "INICIALIZACION",
        cantidad: stockActual,
        costoUnit: precioPromedioInicial,
        stockPrevio: stockActual,
        stockNuevo: stockActual,
        detalle: `Inicialización de costo a $${precioPromedioInicial.toLocaleString()} con fecha ${new Date(fechaPromedioInicial).toLocaleDateString("es-CO", { timeZone: "UTC" })}`
      }
    })
  ]);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function getInventoryLogs() {
  const logs = await prisma.inventoryLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      product: true
    }
  });
  return logs.map(l => ({
    ...l,
    costoUnit: Number(l.costoUnit),
    product: {
      ...l.product,
      precio: Number(l.product.precio),
      precioPromedioCompra: Number(l.product.precioPromedioCompra),
      valorInventarioActual: Number(l.product.valorInventarioActual)
    }
  }));
}

export async function adjustProductStock(
  productId: number,
  tipo: "INGRESO" | "SALIDA",
  cantidad: number,
  detalle: string
) {
  if (cantidad <= 0) {
    throw new Error("La cantidad debe ser mayor a cero");
  }

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error("Producto no encontrado");
    }

    const stockActual = product.stockActual;
    let newStock = stockActual;

    if (tipo === "INGRESO") {
      newStock = stockActual + cantidad;
    } else if (tipo === "SALIDA") {
      newStock = stockActual - cantidad;
      if (newStock < 0) {
        throw new Error("El inventario resultante no puede ser menor a cero");
      }
    } else {
      throw new Error("Tipo de ajuste no válido");
    }

    const precioPromedio = Number(product.precioPromedioCompra || 0);
    const newValor = newStock * precioPromedio;

    await tx.product.update({
      where: { id: productId },
      data: {
        stockActual: newStock,
        valorInventarioActual: newValor
      }
    });

    await tx.inventoryLog.create({
      data: {
        productId,
        tipo: tipo === "INGRESO" ? "AJUSTE_INGRESO" : "AJUSTE_SALIDA",
        cantidad,
        costoUnit: precioPromedio,
        stockPrevio: stockActual,
        stockNuevo: newStock,
        detalle: detalle || `Ajuste manual de tipo ${tipo}`
      }
    });
  });

  revalidatePath("/");
  revalidatePath("/admin");
}
