"use client";

import { useState } from "react";
import { 
  createDiscount, 
  updateDiscount, 
  deleteDiscount, 
  toggleDiscountStatus 
} from "@/app/actions/discount";
import SubmitButton from "@/components/SubmitButton";
import ActionButton from "@/components/ActionButton";

interface DiscountsClientProps {
  products: any[];
  discounts: any[];
}

export default function DiscountsClient({ products, discounts }: DiscountsClientProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form states
  const [nombre, setNombre] = useState("");
  const [tipoDescuento, setTipoDescuento] = useState("Porcentaje");
  const [valorDescuento, setValorDescuento] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [activo, setActivo] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [prodSearch, setProdSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "-";
    return new Date(dateVal).toLocaleString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const toLocalDatetimeString = (dateInput: Date | string) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const startNewDiscount = () => {
    setEditingId(null);
    setNombre("");
    setTipoDescuento("Porcentaje");
    setValorDescuento("");
    
    // Set default dates: start now, end in 7 days
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 7);
    
    setFechaInicio(toLocalDatetimeString(now));
    setFechaFin(toLocalDatetimeString(future));
    setActivo(true);
    setSelectedProductIds([]);
    setProdSearch("");
    setShowNewForm(true);
  };

  const startEdit = (d: any) => {
    setEditingId(d.id);
    setNombre(d.nombre);
    setTipoDescuento(d.tipoDescuento);
    setValorDescuento(d.valorDescuento.toString());
    setFechaInicio(toLocalDatetimeString(d.fechaInicio));
    setFechaFin(toLocalDatetimeString(d.fechaFin));
    setActivo(d.activo);
    setSelectedProductIds(d.products.map((p: any) => p.idProducto));
    setProdSearch("");
    setShowNewForm(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) return alert("Por favor ingresa un nombre");
    const val = parseFloat(valorDescuento);
    if (isNaN(val) || val <= 0) return alert("Por favor ingresa un valor de descuento válido mayor a cero");
    if (tipoDescuento === "Porcentaje" && val > 100) return alert("El porcentaje no puede ser mayor al 100%");
    if (!fechaInicio || !fechaFin) return alert("Por favor selecciona las fechas de vigencia");
    if (new Date(fechaInicio) > new Date(fechaFin)) return alert("La fecha de inicio no puede ser posterior a la fecha de fin");

    try {
      setIsSubmitting(true);
      await createDiscount({
        nombre,
        tipoDescuento,
        valorDescuento: val,
        fechaInicio,
        fechaFin,
        activo,
        productIds: selectedProductIds
      });
      setShowNewForm(false);
    } catch (err: any) {
      alert("Error al crear descuento: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null) return;
    if (!nombre) return alert("Por favor ingresa un nombre");
    const val = parseFloat(valorDescuento);
    if (isNaN(val) || val <= 0) return alert("Por favor ingresa un valor de descuento válido mayor a cero");
    if (tipoDescuento === "Porcentaje" && val > 100) return alert("El porcentaje no puede ser mayor al 100%");
    if (!fechaInicio || !fechaFin) return alert("Por favor selecciona las fechas de vigencia");
    if (new Date(fechaInicio) > new Date(fechaFin)) return alert("La fecha de inicio no puede ser posterior a la fecha de fin");

    try {
      setIsSubmitting(true);
      await updateDiscount(editingId, {
        nombre,
        tipoDescuento,
        valorDescuento: val,
        fechaInicio,
        fechaFin,
        activo,
        productIds: selectedProductIds
      });
      setEditingId(null);
    } catch (err: any) {
      alert("Error al actualizar descuento: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async (id: number) => {
    try {
      await deleteDiscount(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert("Error al eliminar descuento: " + err.message);
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await toggleDiscountStatus(id, !currentActive);
    } catch (err: any) {
      alert("Error al cambiar estado: " + err.message);
    }
  };

  const getStatusBadge = (d: any) => {
    if (!d.activo) {
      return (
        <span style={{ background: "rgba(148, 163, 184, 0.2)", color: "#cbd5e1", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>
          Inactivo
        </span>
      );
    }
    const now = new Date();
    const inicio = new Date(d.fechaInicio);
    const fin = new Date(d.fechaFin);
    if (now < inicio) {
      return (
        <span style={{ background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>
          Programado
        </span>
      );
    } else if (now > fin) {
      return (
        <span style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>
          Vencido
        </span>
      );
    } else {
      return (
        <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>
          Vigente
        </span>
      );
    }
  };

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(prodSearch.toLowerCase()) || 
    p.codigo.toLowerCase().includes(prodSearch.toLowerCase())
  );

  return (
    <>
      {/* Action Header */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        {!showNewForm && editingId === null && (
          <button className="admin-btn" onClick={startNewDiscount}>
            + Crear Descuento
          </button>
        )}
      </div>

      {/* Creation / Editing Form */}
      {(showNewForm || editingId !== null) && (
        <section className="glass-container" style={{ marginBottom: "40px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "20px" }}>
            {editingId !== null ? `Editar Descuento: ${nombre}` : "Agregar Nuevo Descuento"}
          </h2>
          <form onSubmit={editingId !== null ? handleEditSubmit : handleCreateSubmit} className="admin-grid-form">
            <div className="admin-input-group">
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Nombre de la Promoción</label>
              <input 
                type="text" 
                placeholder="Ej. Black Friday, Oferta Lanzamiento" 
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required 
              />
            </div>

            <div className="admin-input-group">
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Tipo de Descuento</label>
              <select value={tipoDescuento} onChange={e => setTipoDescuento(e.target.value)}>
                <option value="Porcentaje">Porcentaje (%)</option>
                <option value="ValorFijo">Valor Fijo ($ COP)</option>
              </select>
            </div>

            <div className="admin-input-group">
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>
                Valor del Descuento {tipoDescuento === "Porcentaje" ? "(%)" : "($ COP)"}
              </label>
              <input 
                type="number" 
                min="0.01" 
                step="any" 
                placeholder={tipoDescuento === "Porcentaje" ? "Ej. 20" : "Ej. 5000"} 
                value={valorDescuento}
                onChange={e => setValorDescuento(e.target.value)}
                required 
              />
            </div>

            <div className="admin-input-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "25px" }}>
              <input 
                type="checkbox" 
                id="form-activo"
                checked={activo}
                onChange={e => setActivo(e.target.checked)}
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
              <label htmlFor="form-activo" style={{ fontSize: "14px", cursor: "pointer", userSelect: "none" }}>
                Descuento activo
              </label>
            </div>

            <div className="admin-input-group">
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Fecha y Hora de Inicio</label>
              <input 
                type="datetime-local" 
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                required 
              />
            </div>

            <div className="admin-input-group">
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Fecha y Hora de Fin</label>
              <input 
                type="datetime-local" 
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                required 
              />
            </div>

            {/* Product Assignment Component */}
            <div className="admin-input-group" style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)", display: "block", marginBottom: "8px" }}>
                Asignar a Productos ({selectedProductIds.length} seleccionados)
              </label>
              
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <input 
                  type="text" 
                  placeholder="Buscar producto por nombre o código de referencia..." 
                  value={prodSearch}
                  onChange={e => setProdSearch(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", fontSize: "14px" }}
                />
                {selectedProductIds.length > 0 && (
                  <button 
                    type="button" 
                    className="admin-btn admin-btn-outline admin-btn-sm" 
                    onClick={() => setSelectedProductIds([])}
                    style={{ padding: "8px 16px" }}
                  >
                    Desmarcar Todos
                  </button>
                )}
              </div>

              <div style={{
                maxHeight: "180px",
                overflowY: "auto",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid var(--admin-glass-border)",
                borderRadius: "8px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                {filteredProducts.map(p => {
                  const isChecked = selectedProductIds.includes(p.id);
                  return (
                    <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                          } else {
                            setSelectedProductIds([...selectedProductIds, p.id]);
                          }
                        }}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      <span>
                        {p.nombre} <strong style={{ color: "var(--admin-text-muted)", fontSize: "12px" }}>(Ref: {p.codigo} - Base: {formatCurrency(p.precioBase)})</strong>
                      </span>
                    </label>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div style={{ color: "var(--admin-text-muted)", padding: "10px", textAlign: "center" }}>
                    No se encontraron productos.
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px", gridColumn: "1 / -1" }}>
              <SubmitButton className="admin-btn" loading={isSubmitting} loadingText="Guardando...">
                {editingId !== null ? "Guardar Cambios" : "Crear Descuento"}
              </SubmitButton>
              <button 
                type="button" 
                className="admin-btn admin-btn-outline" 
                onClick={() => {
                  setShowNewForm(false);
                  setEditingId(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Main Discounts List Section */}
      <section className="glass-container" style={{ padding: "0", overflow: "hidden" }}>
        <div className="admin-card-header">
          <h2 style={{ margin: 0 }}>Descuentos Registrados</h2>
        </div>

        <div className="admin-table-container">
          <table className="admin-table" style={{ minWidth: "850px" }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th>Productos Asociados</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: "bold" }}>{d.nombre}</td>
                  <td>{d.tipoDescuento === "Porcentaje" ? "Porcentaje" : "Valor Fijo"}</td>
                  <td style={{ fontWeight: "bold", color: "#f87171" }}>
                    {d.tipoDescuento === "Porcentaje" ? `${d.valorDescuento}%` : formatCurrency(d.valorDescuento)}
                  </td>
                  <td>
                    <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
                      <div><strong style={{ color: "var(--admin-text-muted)" }}>Inicio:</strong> {formatDate(d.fechaInicio)}</div>
                      <div><strong style={{ color: "var(--admin-text-muted)" }}>Fin:</strong> {formatDate(d.fechaFin)}</div>
                    </div>
                  </td>
                  <td>{getStatusBadge(d)}</td>
                  <td>
                    {d.products.length === 0 ? (
                      <span style={{ color: "var(--admin-text-muted)", fontSize: "13px" }}>Ninguno</span>
                    ) : (
                      <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px",
                        maxWidth: "280px",
                        maxHeight: "65px",
                        overflowY: "auto",
                        paddingRight: "5px"
                      }}>
                        {d.products.map((pd: any) => (
                          <span 
                            key={pd.product.id} 
                            style={{
                              background: "rgba(255, 255, 255, 0.08)",
                              border: "1px solid var(--admin-glass-border)",
                              color: "#fff",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {pd.product.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <ActionButton 
                        className={`admin-btn admin-btn-sm ${d.activo ? "admin-btn-outline" : "admin-btn-success"}`}
                        onClick={async () => await handleToggleActive(d.id, d.activo)}
                        loadingText={d.activo ? "Desactivando..." : "Activando..."}
                        style={{ padding: "6px 12px" }}
                      >
                        {d.activo ? "Desactivar" : "Activar"}
                      </ActionButton>

                      <button 
                        type="button" 
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        onClick={() => startEdit(d)}
                        style={{ padding: "6px 12px" }}
                      >
                        Editar
                      </button>

                      <button 
                        type="button" 
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => setDeleteConfirmId(d.id)}
                        style={{ padding: "6px 12px" }}
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {discounts.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--admin-text-muted)" }}>
                    No hay descuentos registrados en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Styled Deletion Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100
        }}>
          <div className="glass-container" style={{ maxWidth: "420px", width: "90%", border: "1px solid rgba(239, 68, 68, 0.3)", boxShadow: "0 8px 32px 0 rgba(239, 68, 68, 0.15)", padding: "30px", background: "rgba(15, 23, 42, 0.95)" }}>
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
                ¿Estás seguro de que deseas eliminar este descuento? Los productos asociados volverán a mostrar su precio base original. Esta acción no se puede deshacer.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <ActionButton 
                className="admin-btn admin-btn-danger"
                onClick={async () => await handleConfirmDelete(deleteConfirmId)}
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
