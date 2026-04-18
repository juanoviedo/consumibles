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
      <div style={{ padding: "40px", fontFamily: "arial" }}>
        <h2>Acceso Denegado</h2>
        <p>Solo el Super Admin (juan.oviedo.lutkens@gmail.com) puede invitar a nuevos administradores.</p>
        <a href="/admin">Volver al inicio</a>
      </div>
    );
  }

  const users = await prisma.user.findMany();

  return (
    <div style={{ padding: "40px", fontFamily: "arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Gestión de Administradores</h1>
        <a href="/admin" style={{ padding: "10px", background: "#f4f4f4", textDecoration: "none", color: "black", borderRadius: "5px" }}>Volver a Productos</a>
      </div>
      <p>Invita a tu esposa o familiares a administrar los productos. Ellos podrán crear y editar consumibles, pero no borrar usuarios.</p>

      <form action={createUserAction as any} style={{ margin: "20px 0", background: "#f4f4f4", padding: "20px", maxWidth: "400px", borderRadius: "8px" }}>
        <h3>Invitar Nuevo Admin</h3>
        <input type="email" name="email" placeholder="Correo del familiar" required style={{ display: "block", marginBottom: "10px", width: "100%", padding: "5px" }} />
        <input type="password" name="password" placeholder="Contraseña inicial asignada" required style={{ display: "block", marginBottom: "10px", width: "100%", padding: "5px" }} />
        <button type="submit" style={{ background: "#8b0500", color: "#fff", padding: "10px", cursor: "pointer", border: "none", width: "100%" }}>Crear Administrador</button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr style={{ background: "#8b0500", color: "#fff", textAlign: "left" }}>
            <th style={{ padding: "10px" }}>Email</th>
            <th style={{ padding: "10px" }}>Rol</th>
            <th style={{ padding: "10px" }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #ccc" }}>
              <td style={{ padding: "10px" }}>{u.email}</td>
              <td style={{ padding: "10px" }}>{u.isSuperAdmin ? "Super Admin" : "Admin"}</td>
              <td style={{ padding: "10px" }}>
                {!u.isSuperAdmin && (
                  <form action={async () => { "use server"; await deleteUserAction(u.id); }}>
                    <button type="submit" style={{ color: "red", cursor: "pointer", border: "none", background: "none" }}>Revocar Acceso</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
