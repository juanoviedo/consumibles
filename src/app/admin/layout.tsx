import { cookies } from "next/headers";
import AdminSidebarClient from "./AdminSidebarClient";
import { prisma } from "@/lib/prisma";
import "@/app/css/admin.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  
  if (!session) {
    // Si no hay sesión (ej. en /admin/login), solo renderizamos el contenido
    return <>{children}</>;
  }

  const sessionData = JSON.parse(session);

  let isSuperAdmin = sessionData.isSuperAdmin;
  if (sessionData.email) {
    const user = await prisma.user.findUnique({
      where: { email: sessionData.email },
      select: { isSuperAdmin: true },
    });
    if (user && user.isSuperAdmin !== null) {
      isSuperAdmin = user.isSuperAdmin;
    }
  }

  return (
    <div className="admin-body">
      <AdminSidebarClient email={sessionData.email} isSuperAdmin={isSuperAdmin}>
        {children}
      </AdminSidebarClient>
    </div>
  );
}

