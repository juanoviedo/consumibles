"use client";

import { useActionState } from "react";
import { recoverPasswordAction } from "@/app/actions/recover";

export default function RecuperarPage() {
  const [state, action, isPending] = useActionState(recoverPasswordAction, undefined);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "arial" }}>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "40px", background: "#f4f4f4", borderRadius: "8px", minWidth: "300px" }}>
        <h2>Recuperar Contraseña</h2>
        <p style={{fontSize: "13px"}}>Te enviaremos un enlace de recuperación.</p>
        <input type="email" name="email" placeholder="Correo Electrónico" required style={{ padding: "10px" }} />
        {state?.error && <p style={{ color: "red", fontSize: "14px" }}>{state.error}</p>}
        {state?.success && <p style={{ color: "green", fontSize: "14px" }}>{state.success}</p>}
        <button type="submit" disabled={isPending} style={{ background: "#8b0500", color: "white", padding: "10px", border: "none", cursor: "pointer", opacity: isPending ? 0.7 : 1 }}>
          {isPending ? "Enviando..." : "Enviar Correo"}
        </button>
        <a href="/admin/login" style={{fontSize: "12px", textAlign: "center", marginTop: "10px", color: "#666"}}>Volver al Login</a>
      </form>
    </div>
  );
}
