import StoreFront from "@/components/StoreFront";
import { getProducts } from "@/app/actions/product";
import PublicLayout from "@/components/PublicLayout";

export default async function CatalogoPage() {
  const products = await getProducts();
  
  return (
    <PublicLayout>
      <StoreFront products={products} />
    </PublicLayout>
  );
}
