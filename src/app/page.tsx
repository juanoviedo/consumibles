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
  const allProducts = await getProducts();
  const allCategories = await getCategories();

  // Filter categories that should be visible on the web
  const visibleCategories = allCategories.filter(c => c.mostrarEnWeb !== false);

  // Filter products that either don't have a category or belong to a visible category
  const visibleProducts = allProducts.filter(p => {
    if (!p.categoryId) return true;
    const cat = allCategories.find(c => c.id === p.categoryId);
    return cat ? cat.mostrarEnWeb !== false : true;
  });

  return (
    <PublicLayout>
      <StoreFront products={visibleProducts} categories={visibleCategories} />
    </PublicLayout>
  );
}
