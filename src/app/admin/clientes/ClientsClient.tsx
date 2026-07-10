"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, updateClient, deleteClient } from "@/app/actions/billing";
import SubmitButton from "@/components/SubmitButton";
import ActionButton from "@/components/ActionButton";

export default function ClientsClient({ clients }: { clients: any[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const startEdit = (c: any) => setEditingId(c.id);
  const cancelEdit = () => setEditingId(null);

  const handleConfirmDelete = async (id: number) => {
    await deleteClient(id);
  };

  const editingClient = clients.find((c) => c.id === editingId);

  if (editingClient) {
    return (
      <section className="glass-container" style={{ marginBottom: "40px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Editar Cliente: {editingClient.nombre}</h2>
        <form
          action={async (formData) => {
            await updateClient(formData);
            setEditingId(null);
          }}
          className="admin-grid-form"
        >
          <input type="hidden" name="id" value={editingClient.id} />
          
          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>NIT / Identificación</label>
            <input type="text" name="nit" defaultValue={editingClient.nit || ""} placeholder="NIT o Cédula" />
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Nombre Completo / Razón Social</label>
            <input type="text" name="nombre" defaultValue={editingClient.nombre} required placeholder="Nombre del Cliente" />
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Correo Electrónico</label>
            <input type="email" name="email" defaultValue={editingClient.email || ""} placeholder="ejemplo@correo.com" />
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Teléfono</label>
            <input type="text" name="telefono" defaultValue={editingClient.telefono || ""} placeholder="3333333333" />
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Contacto Principal</label>
            <input type="text" name="contacto" defaultValue={editingClient.contacto || ""} placeholder="Nombre del Contacto" />
          </div>

          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Dirección</label>
            <input type="text" name="direccion" defaultValue={editingClient.direccion || ""} placeholder="Dirección de Facturación" />
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Ciudad</label>
            <input type="text" name="ciudad" defaultValue={editingClient.ciudad || ""} placeholder="Ej. Cali" />
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Departamento</label>
            <input type="text" name="departamento" defaultValue={editingClient.departamento || ""} placeholder="Ej. Valle del Cauca" />
          </div>

          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>País</label>
            <input type="text" name="pais" defaultValue={editingClient.pais || "Colombia"} required placeholder="Colombia" />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "15px", gridColumn: "1 / -1" }}>
            <SubmitButton className="admin-btn" loadingText="Guardando...">
              Guardar Cambios
            </SubmitButton>
            <button type="button" className="admin-btn admin-btn-outline" onClick={cancelEdit}>
              Cancelar
            </button>
          </div>
        </form>
      </section>
    );
  }

  if (showNewForm) {
    return (
      <section className="glass-container" style={{ marginBottom: "40px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Agregar Nuevo Cliente</h2>
        <form
          action={async (formData) => {
            await createClient(formData);
            setShowNewForm(false);
          }}
          className="admin-grid-form"
        >
          <div className="admin-input-group">
            <input type="text" name="nit" placeholder="NIT / Identificación (ej. 12345678-9)" />
          </div>

          <div className="admin-input-group">
            <input type="text" name="nombre" required placeholder="Nombre o Razón Social" />
          </div>

          <div className="admin-input-group">
            <input type="email" name="email" placeholder="Correo Electrónico" />
          </div>

          <div className="admin-input-group">
            <input type="text" name="telefono" placeholder="Teléfono" />
          </div>

          <div className="admin-input-group">
            <input type="text" name="contacto" placeholder="Contacto Principal" />
          </div>

          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <input type="text" name="direccion" placeholder="Dirección física" />
          </div>

          <div className="admin-input-group">
            <input type="text" name="ciudad" placeholder="Ciudad (ej. Cali)" />
          </div>

          <div className="admin-input-group">
            <input type="text" name="departamento" placeholder="Departamento (ej. Valle del Cauca)" />
          </div>

          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <input type="text" name="pais" placeholder="País" defaultValue="Colombia" required />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "15px", gridColumn: "1 / -1" }}>
            <SubmitButton className="admin-btn" loadingText="Registrando...">
              Registrar Cliente
            </SubmitButton>
            <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowNewForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", margin: 0 }}>Administración de Clientes</h1>
          <p style={{ color: "var(--admin-text-muted)", marginTop: "4px" }}>
            Administra los datos de los clientes para cotizaciones y cuentas de cobro.
          </p>
        </div>

        {/* Actions for selection */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button 
            type="button" 
            disabled={selectedId === null}
            onClick={() => {
              if (selectedId !== null) {
                router.push(`/admin/cotizaciones?clienteId=${selectedId}`);
              }
            }} 
            className="admin-btn admin-btn-outline"
            title="Ver Cotizaciones y Facturas"
            style={{ 
              width: "40px", 
              height: "40px", 
              padding: "0", 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center", 
              borderRadius: "8px",
              borderColor: "#818cf8",
              color: "#818cf8",
              opacity: selectedId === null ? 0.5 : 1, 
              cursor: selectedId === null ? "not-allowed" : "pointer" 
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </button>
          <button 
            type="button" 
            disabled={selectedId === null}
            onClick={() => {
              const selected = clients.find(c => c.id === selectedId);
              if (selected) startEdit(selected);
            }} 
            className="admin-btn admin-btn-outline"
            title="Editar Cliente"
            style={{ 
              width: "40px", 
              height: "40px", 
              padding: "0", 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center", 
              borderRadius: "8px",
              opacity: selectedId === null ? 0.5 : 1, 
              cursor: selectedId === null ? "not-allowed" : "pointer" 
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
            </svg>
          </button>
          <button 
            type="button" 
            disabled={selectedId === null}
            onClick={() => selectedId !== null && setDeleteConfirmId(selectedId)} 
            className="admin-btn admin-btn-danger"
            title="Borrar Cliente"
            style={{ 
              width: "40px", 
              height: "40px", 
              padding: "0", 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center", 
              borderRadius: "8px",
              opacity: selectedId === null ? 0.5 : 1, 
              cursor: selectedId === null ? "not-allowed" : "pointer" 
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
          {selectedId !== null && (
            <span style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
              (1 seleccionado)
            </span>
          )}
        </div>

        <button className="admin-btn" onClick={() => setShowNewForm(true)}>
          + Registrar Cliente
        </button>
      </div>

      <section className="glass-container" style={{ padding: "0", overflow: "hidden" }}>
        <div className="admin-card-header">
          <h2 style={{ margin: 0 }}>Clientes Registrados</h2>
        </div>

        <div className="admin-table-container">
          <table className="admin-table" style={{ minWidth: "900px" }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>NIT / Identificación</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Dirección / Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr 
                  key={c.id}
                  onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                  style={{ 
                    cursor: "pointer", 
                    background: selectedId === c.id ? "rgba(139, 5, 0, 0.15)" : "" 
                  }}
                >
                  <td className="wrap-text"><strong>{c.nombre}</strong></td>
                  <td>{c.nit || "-"}</td>
                  <td>{c.email || "-"}</td>
                  <td>
                    {c.telefono || "-"}
                    {c.contacto && (
                      <div style={{ fontSize: "12px", color: "var(--admin-text-muted)", marginTop: "2px" }}>
                        Contacto: {c.contacto}
                      </div>
                    )}
                  </td>
                  <td>
                    {c.direccion || ""}
                    {(c.ciudad || c.departamento || c.pais) && (
                      <div style={{ fontSize: "12px", color: "var(--admin-text-muted)", marginTop: "4px" }}>
                        {[c.ciudad, c.departamento, c.pais].filter(Boolean).join(", ")}
                      </div>
                    )}
                    {!c.direccion && !c.ciudad && !c.departamento && !c.pais && "-"}
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "var(--admin-text-muted)" }}>
                    No hay clientes registrados en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
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
              <h3 style={{ fontSize: "1.25rem", margin: "0 0 10px 0", color: "#f87171" }}>¿Confirmar Eliminación?</h3>
              <p style={{ color: "var(--admin-text-muted)", fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
                Esta acción es permanente y eliminará al cliente. Todas sus cotizaciones y facturas asociadas se eliminarán automáticamente. ¿Deseas continuar?
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <ActionButton 
                className="admin-btn admin-btn-danger"
                onClick={async () => {
                  await handleConfirmDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                loadingText="Eliminando..."
                style={{ flex: 1 }}
              >
                Sí, Eliminar
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
