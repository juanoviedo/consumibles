import StoreFront from "@/components/StoreFront";
import { getProducts } from "@/app/actions/product";
import PublicLayout from "@/components/PublicLayout";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const products = await getProducts();

  return (
    <PublicLayout>
      <StoreFront products={products} />
    </PublicLayout>
  );
}
