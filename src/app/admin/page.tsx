import { getProducts } from "@/app/actions/product";
import { getCategories } from "@/app/actions/category";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const products = await getProducts();
  const categories = await getCategories();

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Gestión de Productos</h1>
          <p style={{ color: "var(--admin-text-muted)", marginTop: "8px" }}>Agrega, edita y elimina consumibles del catálogo.</p>
        </div>
      </div>

      <AdminClient products={products} categories={categories} />
    </>
  );
}
