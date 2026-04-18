import { getProducts } from "@/app/actions/product";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) redirect("/admin/login");

  const sessionData = JSON.parse(session);
  const products = await getProducts();

  return (
    <div style={{ padding: "40px", fontFamily: "arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Centro de Administración</h1>
        <div style={{display: "flex", gap: "15px", alignItems: "center"}}>
          {sessionData.isSuperAdmin && (
             <a href="/admin/users" style={{ color: "blue", textDecoration: "none" }}>Gestionar Usuarios</a>
          )}
          <span style={{ fontSize: "14px", color: "gray" }}>{sessionData.email}</span>
          <form action={logoutAction}>
            <button type="submit" style={{ padding: "10px 15px", cursor: "pointer", background: "#333", color: "white", border: "none", borderRadius: "5px" }}>
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
      <p>Gestión de Consumibles. Solo accesible tras iniciar sesión como administrador.</p>

      <AdminClient products={products} />
    </div>
  );
}
