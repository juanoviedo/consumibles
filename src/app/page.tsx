import StoreFront from "@/components/StoreFront";
import { getProducts } from "@/app/actions/product";
import { getCategories } from "@/app/actions/category";
import PublicLayout from "@/components/PublicLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo de Consumibles y Repuestos",
  description: "Explora nuestro catálogo completo de consumibles, repuestos y equipos para corte plasma. Optimizamos tu producción en la industria metalmecánica.",
};

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const products = await getProducts();
  const categories = await getCategories();

  return (
    <PublicLayout>
      <StoreFront products={products} categories={categories} />
    </PublicLayout>
  );
}
