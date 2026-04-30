import { cookies } from "next/headers";
import AdminSidebarClient from "./AdminSidebarClient";
import "@/app/css/admin.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  
  if (!session) {
    // Si no hay sesión (ej. en /admin/login), solo renderizamos el contenido
    return <>{children}</>;
  }

  const sessionData = JSON.parse(session);

  return (
    <div className="admin-body">
      <AdminSidebarClient email={sessionData.email} isSuperAdmin={sessionData.isSuperAdmin}>
        {children}
      </AdminSidebarClient>
    </div>
  );
}
