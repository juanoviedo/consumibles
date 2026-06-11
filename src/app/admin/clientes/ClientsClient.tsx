"use client";

import { useState } from "react";
import { createClient, updateClient, deleteClient } from "@/app/actions/billing";

export default function ClientsClient({ clients }: { clients: any[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const startEdit = (c: any) => setEditingId(c.id);
  const cancelEdit = () => setEditingId(null);

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

          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Dirección</label>
            <input type="text" name="direccion" defaultValue={editingClient.direccion || ""} placeholder="Dirección de Facturación" />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "15px", gridColumn: "1 / -1" }}>
            <button type="submit" className="admin-btn">
              Guardar Cambios
            </button>
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

          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <input type="text" name="direccion" placeholder="Dirección física" />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "15px", gridColumn: "1 / -1" }}>
            <button type="submit" className="admin-btn">
              Registrar Cliente
            </button>
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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", margin: 0 }}>Administración de Clientes</h1>
          <p style={{ color: "var(--admin-text-muted)", marginTop: "4px" }}>
            Administra los datos de los clientes para cotizaciones y cuentas de cobro.
          </p>
        </div>
        <button className="admin-btn" onClick={() => setShowNewForm(true)}>
          + Registrar Cliente
        </button>
      </div>

      <section className="glass-container" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "30px 30px 15px 30px" }}>
          <h2 style={{ margin: 0 }}>Clientes Registrados</h2>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>NIT / Identificación</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.nit || "-"}</td>
                  <td><strong>{c.nombre}</strong></td>
                  <td>{c.email || "-"}</td>
                  <td>{c.telefono || "-"}</td>
                  <td>{c.direccion || "-"}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button type="button" onClick={() => startEdit(c)} className="admin-btn admin-btn-outline admin-btn-sm">
                        Editar
                      </button>
                      <form action={deleteClient.bind(null, c.id)}>
                        <button type="submit" className="admin-btn admin-btn-danger admin-btn-sm">
                          Borrar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--admin-text-muted)" }}>
                    No hay clientes registrados en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
