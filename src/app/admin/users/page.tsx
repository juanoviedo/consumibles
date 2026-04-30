import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createUserAction, deleteUserAction } from "@/app/actions/user";

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

      <section className="glass-container" style={{ marginBottom: "40px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Agregar Nuevo Admin</h2>
        <form action={createUserAction as any} className="admin-grid-form">
          <div className="admin-input-group">
            <input type="email" name="email" placeholder="Correo electrónico" required />
          </div>
          <div className="admin-input-group">
            <input type="password" name="password" placeholder="Contraseña inicial" required />
          </div>
          <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="admin-btn">Crear Administrador</button>
          </div>
        </form>
      </section>

      <section className="glass-container" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "30px 30px 15px 30px" }}>
          <h2 style={{ margin: 0 }}>Usuarios Actuales</h2>
        </div>
        
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>
                    <span style={{ 
                      background: u.isSuperAdmin ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.1)", 
                      color: u.isSuperAdmin ? "#10b981" : "#fff",
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      fontSize: "12px", 
                      fontWeight: "bold" 
                    }}>
                      {u.isSuperAdmin ? "Super Admin" : "Admin"}
                    </span>
                  </td>
                  <td>
                    {!u.isSuperAdmin && (
                      <form action={async () => { "use server"; await deleteUserAction(u.id); }}>
                        <button type="submit" className="admin-btn admin-btn-danger admin-btn-sm">Revocar Acceso</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
