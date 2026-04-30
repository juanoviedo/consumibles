"use client";
import { useState } from "react";
import { changePasswordAction } from "@/app/actions/user";

export default function PerfilClient({ email }: { email: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const res = await changePasswordAction(formData);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Contraseña actualizada exitosamente.");
      (e.target as HTMLFormElement).reset();
    }
    
    setIsSubmitting(false);
  };

  return (
    <section className="glass-container" style={{ maxWidth: "600px" }}>
      <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Cambiar Contraseña</h2>
      <p style={{ color: "var(--admin-text-muted)", marginBottom: "20px" }}>
        Estás conectado como: <strong>{email}</strong>
      </p>

      {error && <div style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", color: "#fca5a5", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>{error}</div>}
      {success && <div style={{ background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10b981", color: "#6ee7b7", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>{success}</div>}

      <form onSubmit={handleSubmit} className="admin-grid-form" style={{ gridTemplateColumns: "1fr" }}>
        <input type="hidden" name="email" value={email} />
        
        <div className="admin-input-group">
          <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Contraseña Actual</label>
          <input type="password" name="currentPassword" required />
        </div>
        
        <div className="admin-input-group">
          <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Nueva Contraseña</label>
          <input type="password" name="newPassword" required minLength={6} />
        </div>
        
        <div style={{ marginTop: "10px" }}>
          <button type="submit" className="admin-btn" disabled={isSubmitting} style={{ width: "100%" }}>
            {isSubmitting ? "Guardando..." : "Actualizar Contraseña"}
          </button>
        </div>
      </form>
    </section>
  );
}
