import { getCategories } from "@/app/actions/category";
import AdminCategories from "../AdminCategories";

export default async function AdminCategoriasPage() {
  const categories = await getCategories();

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Gestión de Categorías</h1>
          <p style={{ color: "var(--admin-text-muted)", marginTop: "8px" }}>Agrupa tus productos para una mejor navegación en el catálogo.</p>
        </div>
      </div>

      <AdminCategories categories={categories} />
    </>
  );
}
