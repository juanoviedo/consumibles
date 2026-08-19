"use client";

import { useState } from "react";
import { createIncomingOrder, completeIncomingOrder, cancelIncomingOrder, updateIncomingOrder, deleteIncomingOrder, revertIncomingOrder } from "@/app/actions/incomingOrder";
import SubmitButton from "@/components/SubmitButton";
import ActionButton from "@/components/ActionButton";

export default function IncomingOrdersClient({ 
  orders, 
  products 
}: { 
  orders: any[], 
  products: any[] 
}) {
  const [activeTab, setActiveTab] = useState<"activos" | "historial">("activos");
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // States to calculate unit cost and total cost dynamically
  const [newTipo, setNewTipo] = useState<string>("PEDIDO");
  const [newSelectedProductId, setNewSelectedProductId] = useState<string>("");
  const [newQty, setNewQty] = useState<string>("1");
  const [newUnitCost, setNewUnitCost] = useState<string>("");
  const [newTotalCost, setNewTotalCost] = useState<string>("");
  const [newMotivo, setNewMotivo] = useState<string>("");

  const [editTipo, setEditTipo] = useState<string>("PEDIDO");
  const [editQty, setEditQty] = useState<string>("");
  const [editUnitCost, setEditUnitCost] = useState<string>("");
  const [editTotalCost, setEditTotalCost] = useState<string>("");
  const [editMotivo, setEditMotivo] = useState<string>("");

  const selectedProduct = products.find(p => p.id === parseInt(newSelectedProductId, 10));

  // Bidirectional sync for New Form
  const handleNewQtyChange = (val: string) => {
    setNewQty(val);
    if (val === "") {
      setNewTotalCost("");
      return;
    }
    const qty = parseInt(val, 10) || 0;
    const unitCost = parseFloat(newUnitCost) || 0;
    setNewTotalCost((qty * unitCost).toString());
  };

  const handleNewUnitCostChange = (val: string) => {
    setNewUnitCost(val);
    if (val === "") {
      setNewTotalCost("");
      return;
    }
    const unitCost = parseFloat(val) || 0;
    const qty = parseInt(newQty, 10) || 0;
    setNewTotalCost((qty * unitCost).toString());
  };

  const handleNewTotalCostChange = (val: string) => {
    setNewTotalCost(val);
    if (val === "") {
      setNewUnitCost("");
      return;
    }
    const totalCost = parseFloat(val) || 0;
    const qty = parseInt(newQty, 10) || 0;
    setNewUnitCost(qty > 0 ? (totalCost / qty).toString() : "0");
  };

  // Bidirectional sync for Edit Form
  const handleEditQtyChange = (val: string) => {
    setEditQty(val);
    if (val === "") {
      setEditTotalCost("");
      return;
    }
    const qty = parseInt(val, 10) || 0;
    const unitCost = parseFloat(editUnitCost) || 0;
    setEditTotalCost((qty * unitCost).toString());
  };

  const handleEditUnitCostChange = (val: string) => {
    setEditUnitCost(val);
    if (val === "") {
      setEditTotalCost("");
      return;
    }
    const unitCost = parseFloat(val) || 0;
    const qty = parseInt(editQty, 10) || 0;
    setEditTotalCost((qty * unitCost).toString());
  };

  const handleEditTotalCostChange = (val: string) => {
    setEditTotalCost(val);
    if (val === "") {
      setEditUnitCost("");
      return;
    }
    const totalCost = parseFloat(val) || 0;
    const qty = parseInt(editQty, 10) || 0;
    setEditUnitCost(qty > 0 ? (totalCost / qty).toString() : "0");
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    });
  };

  const editingOrder = orders.find((o) => o.id === editingId);

  if (editingOrder) {
    const formattedFechaEstimada = editingOrder.fechaEstimada
      ? new Date(editingOrder.fechaEstimada).toISOString().split("T")[0]
      : "";

    return (
      <section className="glass-container" style={{ marginBottom: "40px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Editar Registro / Pedido #{editingOrder.id}</h2>
        <form
          action={async (formData) => {
            const res = await updateIncomingOrder(formData);
            if (res && res.error) {
              alert("Error al actualizar: " + res.error);
            } else {
              setEditingId(null);
            }
          }}
          className="admin-grid-form"
        >
          <input type="hidden" name="id" value={editingOrder.id} />

          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Seleccionar Producto</label>
            <select name="productId" required defaultValue={editingOrder.productId}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (Ref: {p.codigo} | Stock: {p.stockActual})
                </option>
              ))}
            </select>
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Cantidad de Unidades</label>
            <input 
              type="number" 
              name="cantidad" 
              required 
              min="1" 
              value={editQty}
              onChange={(e) => handleEditQtyChange(e.target.value)}
              placeholder="Ej. 50" 
            />
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Costo Unitario (COP)</label>
            <input 
              type="number" 
              name="costoUnitario" 
              required 
              min="0" 
              step="any"
              value={editUnitCost}
              onChange={(e) => handleEditUnitCostChange(e.target.value)}
              placeholder="Ej. 15000" 
            />
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Costo Total del Pedido (COP)</label>
            <input 
              type="number" 
              name="costoTotal" 
              required 
              min="0" 
              step="any"
              value={editTotalCost}
              onChange={(e) => handleEditTotalCostChange(e.target.value)}
              placeholder="Ej. 750000" 
            />
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Fecha de Registro / Compra</label>
            <input 
              type="date" 
              name="fechaPedido" 
              defaultValue={editingOrder.fechaPedido ? new Date(editingOrder.fechaPedido).toISOString().split("T")[0] : ""} 
              required
            />
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Fecha Estimada de Llegada</label>
            <input type="date" name="fechaEstimada" defaultValue={formattedFechaEstimada} />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "15px", gridColumn: "1 / -1" }}>
            <SubmitButton className="admin-btn" loadingText="Guardando...">
              Guardar Cambios
            </SubmitButton>
            <button type="button" className="admin-btn admin-btn-outline" onClick={() => setEditingId(null)}>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ margin: 0 }}>
              {newTipo === "PEDIDO" 
                ? "📦 Registrar Pedido de Compra (En Tránsito)" 
                : newTipo === "AJUSTE_INGRESO" 
                  ? "🟢 Ajuste de Stock / Entrada con Precio Inicial" 
                  : "🔴 Ajuste de Stock / Salida (Merma / Daño)"}
            </h2>
            <p style={{ color: "var(--admin-text-muted)", fontSize: "14px", margin: "4px 0 0" }}>
              {newTipo === "PEDIDO"
                ? "Registra pedidos que están en camino y que sumarán stock al recibirlos."
                : newTipo === "AJUSTE_INGRESO"
                  ? "Ingresa unidades inmediatamente al inventario y configura/actualiza su costo promedio."
                  : "Descuenta unidades inmediatamente por merma, pérdida o corrección física."}
            </p>
          </div>
          <button 
            type="button" 
            className="admin-btn admin-btn-outline" 
            onClick={() => setShowNewForm(false)}
            style={{ padding: "6px 12px", fontSize: "13px" }}
          >
            ✕ Cerrar Formulario
          </button>
        </div>

        <form
          action={async (formData) => {
            const res = await createIncomingOrder(formData);
            if (res && res.error) {
              alert("Error al registrar: " + res.error);
            } else {
              setShowNewForm(false);
              if (newTipo !== "PEDIDO") {
                setActiveTab("historial");
              }
            }
          }}
          className="admin-grid-form"
        >
          {/* Selector de Tipo de Movimiento */}
          <div className="admin-input-group" style={{ gridColumn: "1 / -1", background: "rgba(255,255,255,0.03)", padding: "15px", borderRadius: "10px", border: "1px solid var(--admin-glass-border)" }}>
            <label style={{ fontSize: "14px", fontWeight: "bold", color: "#f8fafc", display: "block", marginBottom: "10px" }}>
              Selecciona el Tipo de Operación:
            </label>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <label style={{ 
                flex: "1 1 200px",
                display: "flex", 
                alignItems: "center", 
                gap: "10px", 
                padding: "12px 14px", 
                borderRadius: "8px", 
                cursor: "pointer",
                background: newTipo === "PEDIDO" ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${newTipo === "PEDIDO" ? "#60a5fa" : "rgba(255,255,255,0.1)"}`,
                transition: "all 0.2s"
              }}>
                <input 
                  type="radio" 
                  name="tipo" 
                  value="PEDIDO" 
                  checked={newTipo === "PEDIDO"} 
                  onChange={() => setNewTipo("PEDIDO")} 
                />
                <div>
                  <div style={{ fontWeight: "bold", color: "#60a5fa", fontSize: "14px" }}>📦 Pedido en Camino</div>
                  <div style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>Llegada estimada a futuro</div>
                </div>
              </label>

              <label style={{ 
                flex: "1 1 200px",
                display: "flex", 
                alignItems: "center", 
                gap: "10px", 
                padding: "12px 14px", 
                borderRadius: "8px", 
                cursor: "pointer",
                background: newTipo === "AJUSTE_INGRESO" ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${newTipo === "AJUSTE_INGRESO" ? "#34d399" : "rgba(255,255,255,0.1)"}`,
                transition: "all 0.2s"
              }}>
                <input 
                  type="radio" 
                  name="tipo" 
                  value="AJUSTE_INGRESO" 
                  checked={newTipo === "AJUSTE_INGRESO"} 
                  onChange={() => setNewTipo("AJUSTE_INGRESO")} 
                />
                <div>
                  <div style={{ fontWeight: "bold", color: "#34d399", fontSize: "14px" }}>🟢 Entrada Directa / Precio Inicial</div>
                  <div style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>Ajuste positivo inmediato con costo</div>
                </div>
              </label>

              <label style={{ 
                flex: "1 1 200px",
                display: "flex", 
                alignItems: "center", 
                gap: "10px", 
                padding: "12px 14px", 
                borderRadius: "8px", 
                cursor: "pointer",
                background: newTipo === "AJUSTE_SALIDA" ? "rgba(239, 68, 68, 0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${newTipo === "AJUSTE_SALIDA" ? "#f87171" : "rgba(255,255,255,0.1)"}`,
                transition: "all 0.2s"
              }}>
                <input 
                  type="radio" 
                  name="tipo" 
                  value="AJUSTE_SALIDA" 
                  checked={newTipo === "AJUSTE_SALIDA"} 
                  onChange={() => setNewTipo("AJUSTE_SALIDA")} 
                />
                <div>
                  <div style={{ fontWeight: "bold", color: "#f87171", fontSize: "14px" }}>🔴 Salida / Merma de Stock</div>
                  <div style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>Descuento inmediato por pérdida o daño</div>
                </div>
              </label>
            </div>
          </div>

          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Seleccionar Producto</label>
            <select 
              name="productId" 
              required 
              value={newSelectedProductId}
              onChange={(e) => {
                setNewSelectedProductId(e.target.value);
                const prod = products.find(p => p.id === parseInt(e.target.value, 10));
                if (prod && Number(prod.precioPromedioCompra) > 0 && !newUnitCost) {
                  setNewUnitCost(Number(prod.precioPromedioCompra).toString());
                  setNewTotalCost((parseInt(newQty || "1", 10) * Number(prod.precioPromedioCompra)).toString());
                }
              }}
            >
              <option value="" disabled>-- Seleccione un Producto --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (Ref: {p.codigo} | Stock: {p.stockActual} | Costo actual: ${Number(p.precioPromedioCompra || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>
              {newTipo === "AJUSTE_SALIDA" ? "Cantidad a Descontar" : "Cantidad de Unidades"}
            </label>
            <input 
              type="number" 
              name="cantidad" 
              required 
              min="1" 
              max={newTipo === "AJUSTE_SALIDA" && selectedProduct ? selectedProduct.stockActual : undefined}
              value={newQty}
              onChange={(e) => handleNewQtyChange(e.target.value)}
              placeholder="Ej. 10" 
            />
            {newTipo === "AJUSTE_SALIDA" && selectedProduct && (
              <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", marginTop: "4px", display: "block" }}>
                Stock disponible para descontar: <strong>{selectedProduct.stockActual} unidades</strong>
              </span>
            )}
          </div>

          {newTipo !== "AJUSTE_SALIDA" ? (
            <>
              <div className="admin-input-group">
                <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>
                  {newTipo === "AJUSTE_INGRESO" ? "Costo / Precio Inicial Unitario (COP)" : "Costo Unitario de Compra (COP)"}
                </label>
                <input 
                  type="number" 
                  name="costoUnitario" 
                  required 
                  min="0" 
                  step="any"
                  value={newUnitCost}
                  onChange={(e) => handleNewUnitCostChange(e.target.value)}
                  placeholder="Ej. 15000" 
                />
              </div>

              <div className="admin-input-group">
                <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Costo Total (COP)</label>
                <input 
                  type="number" 
                  name="costoTotal" 
                  required 
                  min="0" 
                  step="any"
                  value={newTotalCost}
                  onChange={(e) => handleNewTotalCostChange(e.target.value)}
                  placeholder="Ej. 150000" 
                />
              </div>
            </>
          ) : (
            <div className="admin-input-group">
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Costo Promedio Actual (Lectura)</label>
              <input 
                type="text" 
                readOnly 
                value={selectedProduct ? `COP ${Number(selectedProduct.precioPromedioCompra || 0).toLocaleString()}` : "Seleccione producto"} 
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--admin-glass-border)", color: "var(--admin-text-muted)" }}
              />
            </div>
          )}

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Fecha de Operación</label>
            <input 
              type="date" 
              name="fechaPedido" 
              defaultValue={new Date().toLocaleDateString("en-CA")} 
              required
            />
          </div>

          {newTipo === "PEDIDO" && (
            <div className="admin-input-group">
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Fecha Estimada de Llegada</label>
              <input type="date" name="fechaEstimada" />
            </div>
          )}

          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>
              {newTipo === "PEDIDO" ? "Observaciones / Proveedor (Opcional)" : "Motivo o Detalle del Ajuste"}
            </label>
            <input 
              type="text" 
              name="motivo" 
              value={newMotivo}
              onChange={(e) => setNewMotivo(e.target.value)}
              placeholder={newTipo === "PEDIDO" ? "Ej. Proveedor Hypertherm Miami, Factura #1234" : "Ej. Inventario inicial físico, 2 piezas con daño de fábrica..."} 
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "15px", gridColumn: "1 / -1" }}>
            <SubmitButton className="admin-btn" loadingText="Procesando...">
              {newTipo === "PEDIDO" ? "Registrar Pedido en Tránsito" : "Aplicar Ajuste de Stock"}
            </SubmitButton>
            <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowNewForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </section>
    );
  }

  const displayedOrders = orders.filter((o) => {
    if (activeTab === "activos") {
      return o.estado === "EN_CAMINO";
    } else {
      return o.estado === "COMPLETADO" || o.estado === "CANCELADO";
    }
  });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", margin: 0 }}>Pedidos y Movimientos de Stock</h1>
          <p style={{ color: "var(--admin-text-muted)", marginTop: "4px" }}>
            Gestiona pedidos de abastecimiento, compras en camino y ajustes de stock con costo inicial.
          </p>
        </div>
        <button 
          className="admin-btn" 
          onClick={() => {
            setShowNewForm(true);
            setNewTipo("PEDIDO");
            setNewSelectedProductId("");
            setNewQty("1");
            setNewUnitCost("");
            setNewTotalCost("");
            setNewMotivo("");
          }}
        >
          + Registrar Pedido o Ajuste de Stock
        </button>
      </div>

      {/* Sub-Tabs Navigation */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "25px", borderBottom: "1px solid var(--admin-glass-border)", paddingBottom: "10px" }}>
        <button 
          onClick={() => {
            setActiveTab("activos");
            setSelectedId(null);
          }} 
          style={{
            background: "transparent",
            border: "none",
            color: activeTab === "activos" ? "white" : "var(--admin-text-muted)",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            padding: "8px 16px",
            borderBottom: activeTab === "activos" ? "2px solid #60a5fa" : "none",
            transition: "all 0.2s"
          }}
        >
          🚚 En Tránsito / Pendientes ({orders.filter(o => o.estado === "EN_CAMINO").length})
        </button>
        <button 
          onClick={() => {
            setActiveTab("historial");
            setSelectedId(null);
          }} 
          style={{
            background: "transparent",
            border: "none",
            color: activeTab === "historial" ? "white" : "var(--admin-text-muted)",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            padding: "8px 16px",
            borderBottom: activeTab === "historial" ? "2px solid #60a5fa" : "none",
            transition: "all 0.2s"
          }}
        >
          📜 Historial y Ajustes Aplicados ({orders.filter(o => o.estado !== "EN_CAMINO").length})
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        {/* Actions for selection */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {activeTab === "activos" ? (
            <>
              <ActionButton 
                type="button"
                disabled={selectedId === null}
                onClick={async () => {
                  if (selectedId !== null) {
                    const res = await completeIncomingOrder(selectedId);
                    if (res && res.error) {
                      alert("Error al completar el pedido: " + res.error);
                    } else {
                      setSelectedId(null);
                    }
                  }
                }}
                loadingText="..."
                className="admin-btn admin-btn-success"
                title="Recibido (Suma al Stock)"
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </ActionButton>
              <button 
                type="button" 
                disabled={selectedId === null}
                onClick={() => {
                  const selected = orders.find(o => o.id === selectedId);
                  if (selected) {
                    setEditingId(selected.id);
                    setEditQty(selected.cantidad.toString());
                    const unitCost = Number(selected.costoUnitario || 0);
                    setEditUnitCost(unitCost ? unitCost.toString() : "");
                    setEditTotalCost(unitCost ? (selected.cantidad * unitCost).toString() : "");
                  }
                }} 
                className="admin-btn admin-btn-outline"
                title="Editar Pedido"
                style={{ 
                  width: "40px", 
                  height: "40px", 
                  padding: "0", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  borderRadius: "8px",
                  borderColor: "#fbbf24", 
                  color: "#fbbf24", 
                  opacity: selectedId === null ? 0.5 : 1, 
                  cursor: selectedId === null ? "not-allowed" : "pointer" 
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                </svg>
              </button>
              <ActionButton 
                type="button"
                disabled={selectedId === null}
                onClick={async () => {
                  if (selectedId !== null) {
                    const res = await cancelIncomingOrder(selectedId);
                    if (res && res.error) {
                      alert("Error al cancelar el pedido: " + res.error);
                    } else {
                      setSelectedId(null);
                    }
                  }
                }}
                loadingText="..."
                className="admin-btn admin-btn-outline"
                title="Cancelar Pedido"
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </ActionButton>
            </>
          ) : (
            <>
              {/* Actions for Historial: Reversar & Editar */}
              <ActionButton 
                type="button"
                disabled={selectedId === null}
                onClick={async () => {
                  if (selectedId !== null) {
                    const res = await revertIncomingOrder(selectedId);
                    if (res && res.error) {
                      alert("Error al reversar el pedido: " + res.error);
                    } else {
                      setSelectedId(null);
                      setActiveTab("activos");
                    }
                  }
                }}
                loadingText="..."
                className="admin-btn admin-btn-outline"
                title="Reversar Pedido a En Tránsito"
                style={{ 
                  padding: "0 14px", 
                  height: "40px", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "6px",
                  borderRadius: "8px",
                  borderColor: "#38bdf8", 
                  color: "#38bdf8", 
                  opacity: selectedId === null ? 0.5 : 1, 
                  cursor: selectedId === null ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
                <span>Reversar a Tránsito</span>
              </ActionButton>

              <ActionButton 
                type="button"
                disabled={selectedId === null}
                onClick={async () => {
                  if (selectedId !== null) {
                    const selected = orders.find(o => o.id === selectedId);
                    const res = await revertIncomingOrder(selectedId);
                    if (res && res.error) {
                      alert("Error al reversar el pedido para editar: " + res.error);
                    } else if (selected) {
                      setActiveTab("activos");
                      setEditingId(selected.id);
                      setEditQty(selected.cantidad.toString());
                      const unitCost = Number(selected.costoUnitario || 0);
                      setEditUnitCost(unitCost ? unitCost.toString() : "");
                      setEditTotalCost(unitCost ? (selected.cantidad * unitCost).toString() : "");
                      setSelectedId(null);
                    }
                  }
                }}
                loadingText="..."
                className="admin-btn admin-btn-outline"
                title="Reversar y Editar Pedido"
                style={{ 
                  padding: "0 14px", 
                  height: "40px", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "6px",
                  borderRadius: "8px",
                  borderColor: "#fbbf24", 
                  color: "#fbbf24", 
                  opacity: selectedId === null ? 0.5 : 1, 
                  cursor: selectedId === null ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                </svg>
                <span>Reversar y Editar</span>
              </ActionButton>
            </>
          )}

          <button 
            type="button" 
            disabled={selectedId === null}
            onClick={() => selectedId !== null && setDeleteConfirmId(selectedId)} 
            className="admin-btn admin-btn-danger"
            title="Eliminar Pedido"
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
      </div>

      <section className="glass-container" style={{ padding: "0", overflow: "hidden" }}>
        <div className="admin-card-header">
          <h2 style={{ margin: 0 }}>
            {activeTab === "activos" ? "Pedidos Activos en Tránsito" : "Historial de Pedidos y Ajustes de Stock"}
          </h2>
        </div>

        <div className="admin-table-container">
          <table className="admin-table" style={{ minWidth: "900px" }}>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Código/Ref</th>
                <th>Cantidad</th>
                <th>Costo (U. / Total)</th>
                <th>Fecha</th>
                <th>Motivo / Detalle</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.map((o) => {
                const tipo = o.tipo || "PEDIDO";
                let tipoLabel = "📦 Pedido";
                let tipoBg = "rgba(59, 130, 246, 0.15)";
                let tipoColor = "#60a5fa";

                if (tipo === "AJUSTE_INGRESO") {
                  tipoLabel = "🟢 Entrada / Ajuste";
                  tipoBg = "rgba(16, 185, 129, 0.15)";
                  tipoColor = "#34d399";
                } else if (tipo === "AJUSTE_SALIDA") {
                  tipoLabel = "🔴 Salida / Merma";
                  tipoBg = "rgba(239, 68, 68, 0.15)";
                  tipoColor = "#f87171";
                } else if (tipo === "INICIALIZACION") {
                  tipoLabel = "⭐ Inicialización";
                  tipoBg = "rgba(245, 158, 11, 0.15)";
                  tipoColor = "#fbbf24";
                }

                return (
                  <tr 
                    key={o.id}
                    onClick={() => setSelectedId(selectedId === o.id ? null : o.id)}
                    style={{ 
                      cursor: "pointer", 
                      background: selectedId === o.id ? "rgba(139, 5, 0, 0.15)" : "" 
                    }}
                  >
                    <td>
                      <span 
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          background: tipoBg,
                          color: tipoColor,
                          border: `1px solid ${tipoColor}40`,
                          whiteSpace: "nowrap"
                        }}
                      >
                        {tipoLabel}
                      </span>
                    </td>
                    <td className="wrap-text" style={{ fontWeight: "bold" }}>
                      {o.product?.nombre}
                    </td>
                    <td>{o.product?.codigo}</td>
                    <td>
                      <strong style={{ color: tipo === "AJUSTE_SALIDA" ? "#f87171" : "inherit" }}>
                        {tipo === "AJUSTE_SALIDA" ? `-${o.cantidad}` : `+${o.cantidad}`} uds
                      </strong>
                    </td>
                    <td>
                      <div>COP {o.costoUnitario ? Number(o.costoUnitario).toLocaleString("es-CO", { minimumFractionDigits: 0 }) : "0"}</div>
                      <div style={{ fontSize: "11px", color: "var(--admin-text-muted)", marginTop: "2px" }}>
                        Total: COP {(o.cantidad * Number(o.costoUnitario || 0)).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                      </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatDate(o.fechaPedido)}
                      {o.fechaEstimada && tipo === "PEDIDO" && o.estado === "EN_CAMINO" && (
                        <div style={{ fontSize: "11px", color: "#60a5fa", marginTop: "2px" }}>
                          Est: {formatDate(o.fechaEstimada)}
                        </div>
                      )}
                    </td>
                    <td className="wrap-text" style={{ fontSize: "13px", color: "var(--admin-text-muted)", maxWidth: "200px" }}>
                      {o.motivo || "-"}
                    </td>
                    <td>
                      <span 
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          background: o.estado === "COMPLETADO" 
                            ? "rgba(16, 185, 129, 0.2)" 
                            : o.estado === "CANCELADO"
                              ? "rgba(239, 68, 68, 0.2)"
                              : "rgba(59, 130, 246, 0.2)",
                          color: o.estado === "COMPLETADO" 
                            ? "#34d399" 
                            : o.estado === "CANCELADO"
                              ? "#f87171"
                              : "#60a5fa",
                          border: o.estado === "COMPLETADO" 
                            ? "1px solid rgba(16, 185, 129, 0.3)" 
                            : o.estado === "CANCELADO"
                              ? "1px solid rgba(239, 68, 68, 0.3)"
                              : "1px solid rgba(59, 130, 246, 0.3)"
                        }}
                      >
                        {o.estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {displayedOrders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--admin-text-muted)" }}>
                    {activeTab === "activos" 
                      ? "No hay pedidos en tránsito pendientes actualmente."
                      : "No hay registros históricos de pedidos o ajustes."}
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
                Esta acción es permanente y eliminará el registro de este pedido. ¿Deseas continuar?
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <ActionButton 
                className="admin-btn admin-btn-danger"
                onClick={async () => {
                  const res = await deleteIncomingOrder(deleteConfirmId);
                  if (res && res.error) {
                    alert("Error al eliminar el pedido: " + res.error);
                  } else {
                    setDeleteConfirmId(null);
                  }
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
