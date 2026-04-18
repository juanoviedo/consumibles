"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, undefined);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "arial" }}>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "40px", background: "#f4f4f4", borderRadius: "8px", minWidth: "300px" }}>
        <h2>Acceso Administrativo</h2>
        <input type="email" name="email" placeholder="Correo Electrónico" required style={{ padding: "10px" }} />
        <input type="password" name="password" placeholder="Contraseña de Administrador" required style={{ padding: "10px" }} />
        {state?.error && <p style={{ color: "red", fontSize: "14px" }}>{state.error}</p>}
        <button type="submit" disabled={isPending} style={{ background: "#8b0500", color: "white", padding: "10px", border: "none", cursor: "pointer", opacity: isPending ? 0.7 : 1 }}>
          {isPending ? "Ingresando..." : "Ingresar"}
        </button>
        <a href="/admin/recuperar" style={{fontSize: "12px", textAlign: "center", marginTop: "10px", color: "#666"}}>Olvidé mi contraseña</a>
      </form>
    </div>
  );
}
