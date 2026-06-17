import { getProductDetails } from "@/app/actions/product";
import ProductDetailClient from "./ProductDetailClient";
import PublicLayout from "@/components/PublicLayout";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
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
