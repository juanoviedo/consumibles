import { getProductDetails } from "@/app/actions/product";
import ProductDetailClient from "./ProductDetailClient";
import PublicLayout from "@/components/PublicLayout";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) {
    return {};
  }
  const product = await getProductDetails(productId);
  if (!product) {
    return {};
  }

  const desc = product.descripcion1 
    ? product.descripcion1.substring(0, 155) 
    : `Compra ${product.nombre} en Colombia. Consumibles, repuestos y accesorios de antorcha para corte por plasma, láser de fibra y mesas CNC.`;

  return {
    title: `${product.nombre}${product.codigo ? ` (${product.codigo})` : ""}`,
    description: desc,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    notFound();
  }

  const product = await getProductDetails(productId);

  if (!product) {
    notFound();
  }

  return (
    <PublicLayout>
      <ProductDetailClient product={product} />
    </PublicLayout>
  );
}
