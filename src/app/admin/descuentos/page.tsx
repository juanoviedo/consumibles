import { getProducts } from "@/app/actions/product";
import { getDiscounts } from "@/app/actions/discount";
import DiscountsClient from "./DiscountsClient";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  const products = await getProducts();
  const discounts = await getDiscounts();

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Gestión de Descuentos</h1>
          <p style={{ color: "var(--admin-text-muted)", marginTop: "8px" }}>
            Administra promociones y aplícalas dinámicamente a tus productos.
          </p>
        </div>
      </div>

      <DiscountsClient products={products} discounts={discounts} />
    </>
  );
}
