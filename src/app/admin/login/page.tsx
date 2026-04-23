"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import "@/app/css/admin.css";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="admin-body">
      <div className="admin-login-wrapper">
        <div className="admin-login-card glass-container">
          <form action={action} style={{ display: "flex", flexDirection: "column" }}>
            <h2>Acceso Administrativo</h2>
            
            <div className="admin-input-group">
              <input type="email" name="email" placeholder="Correo Electrónico" required />
            </div>
            
            <div className="admin-input-group">
              <input type="password" name="password" placeholder="Contraseña de Administrador" required />
            </div>

            {state?.error && <p style={{ color: "#ef4444", fontSize: "14px", marginTop: "-10px", marginBottom: "15px", textAlign: "center" }}>{state.error}</p>}
            
            <button type="submit" className="admin-btn" disabled={isPending}>
              {isPending ? "Ingresando..." : "Ingresar"}
            </button>

            <a href="/admin/recuperar" style={{ fontSize: "12px", textAlign: "center", marginTop: "15px", color: "var(--admin-text-muted)", textDecoration: "none" }}>
              Olvidé mi contraseña
            </a>
          </form>
        </div>
      </div>
    </div>
  );
}
