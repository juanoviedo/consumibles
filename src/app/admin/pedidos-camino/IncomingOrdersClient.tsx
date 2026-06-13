"use client";

import { useState } from "react";
import { createIncomingOrder, completeIncomingOrder, cancelIncomingOrder, updateIncomingOrder } from "@/app/actions/incomingOrder";

export default function IncomingOrdersClient({ 
  orders, 
  products 
}: { 
  orders: any[], 
  products: any[] 
}) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // States to calculate unit cost and total cost dynamically
  const [newQty, setNewQty] = useState<number>(1);
  const [newUnitCost, setNewUnitCost] = useState<number>(0);
  const [newTotalCost, setNewTotalCost] = useState<number>(0);

  const [editQty, setEditQty] = useState<number>(1);
  const [editUnitCost, setEditUnitCost] = useState<number>(0);
  const [editTotalCost, setEditTotalCost] = useState<number>(0);

  // Bidirectional sync for New Form
  const handleNewQtyChange = (qty: number) => {
    setNewQty(qty);
    setNewTotalCost(qty * newUnitCost);
  };

  const handleNewUnitCostChange = (unitCost: number) => {
    setNewUnitCost(unitCost);
    setNewTotalCost(newQty * unitCost);
  };

  const handleNewTotalCostChange = (totalCost: number) => {
    setNewTotalCost(totalCost);
    setNewUnitCost(newQty > 0 ? totalCost / newQty : 0);
  };

  // Bidirectional sync for Edit Form
  const handleEditQtyChange = (qty: number) => {
    setEditQty(qty);
    setEditTotalCost(qty * editUnitCost);
  };

  const handleEditUnitCostChange = (unitCost: number) => {
    setEditUnitCost(unitCost);
    setEditTotalCost(editQty * unitCost);
  };

  const handleEditTotalCostChange = (totalCost: number) => {
    setEditTotalCost(totalCost);
    setEditUnitCost(editQty > 0 ? totalCost / editQty : 0);
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const editingOrder = orders.find((o) => o.id === editingId);

  if (editingOrder) {
    const formattedFechaEstimada = editingOrder.fechaEstimada
      ? new Date(editingOrder.fechaEstimada).toISOString().split("T")[0]
      : "";

    return (
      <section className="glass-container" style={{ marginBottom: "40px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Editar Pedido</h2>
        <form
          action={async (formData) => {
            await updateIncomingOrder(formData);
            setEditingId(null);
          }}
          className="admin-grid-form"
        >
          <input type="hidden" name="id" value={editingOrder.id} />

          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Seleccionar Producto</label>
            <select name="productId" required defaultValue={editingOrder.productId}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (Ref: {p.codigo})
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
              onChange={(e) => handleEditQtyChange(parseInt(e.target.value, 10) || 1)}
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
              onChange={(e) => handleEditUnitCostChange(parseFloat(e.target.value) || 0)}
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
              onChange={(e) => handleEditTotalCostChange(parseFloat(e.target.value) || 0)}
              placeholder="Ej. 750000" 
            />
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Fecha Estimada de Llegada</label>
            <input type="date" name="fechaEstimada" defaultValue={formattedFechaEstimada} />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "15px", gridColumn: "1 / -1" }}>
            <button type="submit" className="admin-btn">
              Guardar Cambios
            </button>
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
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Registrar Pedido en Camino</h2>
        <form
          action={async (formData) => {
            await createIncomingOrder(formData);
            setShowNewForm(false);
          }}
          className="admin-grid-form"
        >
          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Seleccionar Producto</label>
            <select name="productId" required defaultValue="">
              <option value="" disabled>-- Seleccione un Producto --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (Ref: {p.codigo})
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
              value={newQty}
              onChange={(e) => handleNewQtyChange(parseInt(e.target.value, 10) || 1)}
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
              value={newUnitCost}
              onChange={(e) => handleNewUnitCostChange(parseFloat(e.target.value) || 0)}
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
              value={newTotalCost}
              onChange={(e) => handleNewTotalCostChange(parseFloat(e.target.value) || 0)}
              placeholder="Ej. 750000" 
            />
          </div>

          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Fecha Estimada de Llegada</label>
            <input type="date" name="fechaEstimada" />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "15px", gridColumn: "1 / -1" }}>
            <button type="submit" className="admin-btn">
              Registrar Pedido
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
          <h1 style={{ fontSize: "2rem", fontWeight: "700", margin: 0 }}>Pedidos en Camino</h1>
          <p style={{ color: "var(--admin-text-muted)", marginTop: "4px" }}>
            Gestiona los pedidos de abastecimiento de inventario en tránsito.
          </p>
        </div>
        <button 
          className="admin-btn" 
          onClick={() => {
            setShowNewForm(true);
            setNewQty(1);
            setNewUnitCost(0);
            setNewTotalCost(0);
          }}
        >
          + Registrar Pedido en Camino
        </button>
      </div>

      <section className="glass-container" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "30px 30px 15px 30px" }}>
          <h2 style={{ margin: 0 }}>Pedidos Activos</h2>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Código/Ref</th>
                <th>Cantidad</th>
                <th>Costo (U. / Total)</th>
                <th>Fecha Pedido</th>
                <th>Llegada Estimada</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {o.product?.imagenUrl && (
                        <img src={o.product.imagenUrl} alt={o.product.nombre} width="40" />
                      )}
                      <span>{o.product?.nombre}</span>
                    </div>
                  </td>
                  <td>{o.product?.codigo}</td>
                  <td><strong>{o.cantidad} uds</strong></td>
                  <td>
                    <div>COP {o.costoUnitario ? Number(o.costoUnitario).toLocaleString("es-CO", { minimumFractionDigits: 0 }) : "0"}</div>
                    <div style={{ fontSize: "11px", color: "var(--admin-text-muted)", marginTop: "2px" }}>
                      Total: COP {(o.cantidad * Number(o.costoUnitario || 0)).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                    </div>
                  </td>
                  <td>{formatDate(o.fechaPedido)}</td>
                  <td>{formatDate(o.fechaEstimada)}</td>
                  <td>
                    <span 
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        background: "rgba(59, 130, 246, 0.2)",
                        color: "#60a5fa",
                        border: "1px solid rgba(59, 130, 246, 0.3)"
                      }}
                    >
                      {o.estado}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button 
                        type="button" 
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        style={{ borderColor: "#fbbf24", color: "#fbbf24" }}
                        onClick={() => {
                          setEditingId(o.id);
                          setEditQty(o.cantidad);
                          const unitCost = Number(o.costoUnitario || 0);
                          setEditUnitCost(unitCost);
                          setEditTotalCost(o.cantidad * unitCost);
                        }}
                      >
                        Editar
                      </button>
                      <form action={completeIncomingOrder.bind(null, o.id)}>
                        <button type="submit" className="admin-btn admin-btn-success admin-btn-sm">
                          Recibido (Suma Stock)
                        </button>
                      </form>
                      <form action={cancelIncomingOrder.bind(null, o.id)}>
                        <button type="submit" className="admin-btn admin-btn-danger admin-btn-sm">
                          Cancelar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--admin-text-muted)" }}>
                    No hay pedidos en tránsito registrados actualmente.
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
