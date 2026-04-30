import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PerfilClient from "./PerfilClient";

export default async function PerfilPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) redirect("/admin/login");

  const sessionData = JSON.parse(session);

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Mi Perfil</h1>
          <p style={{ color: "var(--admin-text-muted)", marginTop: "8px" }}>Gestiona tus credenciales de acceso de forma segura.</p>
        </div>
      </div>

      <PerfilClient email={sessionData.email} />
    </>
  );
}
