import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) redirect("/admin/login");

  const sessionData = JSON.parse(session);
  if (!sessionData.isSuperAdmin) {
    return (
      <div className="glass-container" style={{ textAlign: "center", padding: "40px" }}>
        <h2 style={{ margin: "0 0 10px 0", color: "#ef4444" }}>Acceso Denegado</h2>
        <p style={{ color: "var(--admin-text-muted)" }}>Solo el Super Admin puede gestionar los administradores.</p>
      </div>
    );
  }

  const users = await prisma.user.findMany();

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Administradores</h1>
          <p style={{ color: "var(--admin-text-muted)", marginTop: "8px" }}>Invita a nuevos usuarios para ayudar a administrar el catálogo.</p>
        </div>
      </div>

      <UsersClient users={users} sessionData={sessionData} />
    </>
  );
}
