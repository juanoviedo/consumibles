import StoreFront from "@/components/StoreFront";
import { getProducts } from "@/app/actions/product";
import { getCategories } from "@/app/actions/category";
import PublicLayout from "@/components/PublicLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Consumibles de Plasma y Láser en Colombia | Repuestos Hypertherm y CNC",
  },
  description: "Catálogo y distribución de consumibles de plasma y láser en Colombia. Boquillas, electrodos, lentes de protección y repuestos para equipos Hypertherm y corte láser.",
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
