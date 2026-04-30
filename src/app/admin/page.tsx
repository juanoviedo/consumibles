import { getProducts } from "@/app/actions/product";
import { getCategories } from "@/app/actions/category";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import AdminDashboardClient from "./AdminDashboardClient";
import "@/app/css/admin.css";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) redirect("/admin/login");

  const sessionData = JSON.parse(session);
  const products = await getProducts();
  const categories = await getCategories();

  return (
    <div className="admin-body">
      <div className="admin-dashboard">
        <div className="admin-header">
          <div>
            <h1>Centro de Administración</h1>
            <p style={{ color: "var(--admin-text-muted)", marginTop: "8px" }}>Gestión de Consumibles y ajustes de sistema.</p>
          </div>
          <div className="admin-header-actions">
            {sessionData.isSuperAdmin && (
               <a href="/admin/users" className="admin-link">Gestionar Usuarios</a>
            )}
            <span style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>{sessionData.email}</span>
            <form action={logoutAction}>
              <button type="submit" className="admin-btn admin-btn-outline admin-btn-sm">
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>

        <AdminDashboardClient products={products} categories={categories} />
      </div>
    </div>
  );
}
