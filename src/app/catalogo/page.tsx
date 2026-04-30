import StoreFront from "@/components/StoreFront";
import { getProducts } from "@/app/actions/product";
import { getCategories } from "@/app/actions/category";
import PublicLayout from "@/components/PublicLayout";

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
