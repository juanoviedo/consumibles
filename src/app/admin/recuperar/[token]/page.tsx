"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/app/actions/recover";
import { use } from "react";

export default function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const [state, action, isPending] = useActionState(resetPasswordAction, undefined);
  const { token } = use(params);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "arial" }}>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "40px", background: "#f4f4f4", borderRadius: "8px", minWidth: "300px" }}>
        <h2>Nueva Contraseña</h2>
        <input type="hidden" name="token" value={token} />
        <input type="password" name="password" placeholder="Tu nueva contraseña" required style={{ padding: "10px" }} />
        {state?.error && <p style={{ color: "red", fontSize: "14px" }}>{state.error}</p>}
        {state?.success && (
          <div>
            <p style={{ color: "green", fontSize: "14px", marginBottom: "15px" }}>{state.success}</p>
            <a href="/admin/login" style={{ background: "#333", color: "white", padding: "10px", display: "block", textAlign: "center", textDecoration: "none" }}>Ir al Login</a>
          </div>
        )}
        {!state?.success && (
          <button type="submit" disabled={isPending} style={{ background: "#8b0500", color: "white", padding: "10px", border: "none", cursor: "pointer", opacity: isPending ? 0.7 : 1 }}>
            {isPending ? "Guardando..." : "Actualizar Contraseña"}
          </button>
        )}
      </form>
    </div>
  );
}
