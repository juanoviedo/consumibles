"use client";
import { useState } from "react";
import { createUserAction, deleteUserAction } from "@/app/actions/user";
import SubmitButton from "@/components/SubmitButton";
import ActionButton from "@/components/ActionButton";

export default function UsersClient({ 
  users, 
  sessionData 
}: { 
  users: any[], 
  sessionData: any 
}) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleConfirmDelete = async (id: number) => {
    await deleteUserAction(id);
  };

  return (
    <>
      <section className="glass-container" style={{ marginBottom: "40px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Agregar Nuevo Admin</h2>
        <form action={createUserAction as any} className="admin-grid-form">
          <div className="admin-input-group">
            <input type="email" name="email" placeholder="Correo electrónico" required />
          </div>
          <div className="admin-input-group">
            <input type="password" name="password" placeholder="Contraseña inicial" required />
          </div>
          <div className="admin-input-group" style={{ gridColumn: "1/-1", display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
            <input type="checkbox" name="isSuperAdmin" id="isSuperAdmin" value="true" style={{ width: "auto" }} />
            <label htmlFor="isSuperAdmin" style={{ cursor: "pointer", color: "var(--admin-text-main)" }}>Este usuario será Super Admin (podrá gestionar a otros administradores)</label>
          </div>
          <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end" }}>
            <SubmitButton className="admin-btn" loadingText="Creando...">Crear Administrador</SubmitButton>
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
                    {u.email !== sessionData.email && (
                      <button 
                        type="button" 
                        onClick={() => setDeleteConfirmId(u.id)} 
                        className="admin-btn admin-btn-danger admin-btn-sm"
                      >
                        Revocar Acceso
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reusable styled delete confirmation modal */}
      {deleteConfirmId !== null && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100
        }}>
          <div className="glass-container" style={{ maxWidth: "400px", width: "90%", border: "1px solid rgba(239, 68, 68, 0.3)", boxShadow: "0 8px 32px 0 rgba(239, 68, 68, 0.15)", padding: "30px", background: "rgba(15, 23, 42, 0.95)" }}>
            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <div style={{
                width: "60px", height: "60px", background: "rgba(239, 68, 68, 0.2)",
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 15px auto", border: "1px solid rgba(239, 68, 68, 0.4)"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </div>
              <h3 style={{ fontSize: "1.25rem", margin: "0 0 10px 0", color: "#f87171" }}>¿Revocar Acceso?</h3>
              <p style={{ color: "var(--admin-text-muted)", fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
                Esta acción revocará de forma permanente el acceso de administrador para este usuario. ¿Deseas continuar?
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <ActionButton 
                className="admin-btn admin-btn-danger"
                onClick={async () => {
                  await handleConfirmDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                loadingText="Revocando..."
                style={{ flex: 1 }}
              >
                Sí, Revocar
              </ActionButton>
              <button 
                type="button" 
                className="admin-btn admin-btn-outline" 
                style={{ color: "white", borderColor: "rgba(255,255,255,0.4)", flex: 1 }}
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
