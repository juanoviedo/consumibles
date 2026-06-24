"use client";
import { useState } from "react";
import { createProduct, deleteProduct, updateProduct, initializeProductCost, adjustProductStock } from "@/app/actions/product";
import SubmitButton from "@/components/SubmitButton";
import ActionButton from "@/components/ActionButton";

export default function AdminClient({ 
  products, 
  categories, 
  inventoryLogs 
}: { 
  products: any[], 
  categories: any[],
  inventoryLogs?: any[]
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<number | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState<"products" | "audit" | "adjustments">("products");
  const [initializingProduct, setInitializingProduct] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const filteredProducts = filterCategoryId === "ALL" 
    ? products 
    : products.filter(p => p.categoryId === filterCategoryId);

  const startEdit = (p: any) => setEditingId(p.id);
  const cancelEdit = () => setEditingId(null);

  const editingProduct = products.find(p => p.id === editingId);

  if (editingProduct) {
    return (
      <section className="glass-container" style={{ marginBottom: "40px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Editar Producto: {editingProduct.nombre}</h2>
        <form
          action={async (formData) => { 
            const res = await updateProduct(formData); 
            if (res && res.error) {
              alert("Error al actualizar producto: " + res.error);
            } else {
              setEditingId(null); 
            }
          }}
          className="admin-grid-form"
        >
          <input type="hidden" name="id" value={editingProduct.id} />
          
          <div className="admin-input-group">
            <input type="text" name="codigo" defaultValue={editingProduct.codigo} required />
          </div>
          <div className="admin-input-group">
            <input type="text" name="nombre" defaultValue={editingProduct.nombre} required />
          </div>
          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Precio (COP)</label>
            <input type="number" name="precio" defaultValue={editingProduct.precio} required />
          </div>
          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Categoría</label>
            <select name="categoryId" defaultValue={editingProduct.categoryId || ""}>
              <option value="">Sin Categoría / Todas</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Inventario Actual (Solo Lectura)</label>
            <input type="number" defaultValue={editingProduct.stockActual ?? 0} readOnly style={{ background: "rgba(255, 255, 255, 0.05)", cursor: "not-allowed", border: "1px solid var(--admin-glass-border)", color: "var(--admin-text-muted)" }} />
          </div>
          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Inventario Mínimo</label>
            <input type="number" name="minStock" defaultValue={editingProduct.minStock ?? 0} required min="0" />
          </div>
          <div className="admin-input-group" style={{ display: "flex", gap: "10px", gridColumn: "1 / -1", flexWrap: "wrap", borderTop: "1px solid var(--admin-glass-border)", paddingTop: "15px", paddingBottom: "5px" }}>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)", display: "block", marginBottom: "5px" }}>Costo Promedio de Compra (Lectura)</label>
              <input 
                type="text" 
                readOnly 
                value={editingProduct.costoInicialConfigurado 
                  ? `COP ${Number(editingProduct.precioPromedioCompra).toLocaleString("es-CO", { minimumFractionDigits: 2 })}` 
                  : "No configurado / Sin costo inicial"
                } 
                style={{ background: "rgba(255, 255, 255, 0.05)", cursor: "not-allowed", border: "1px solid var(--admin-glass-border)", color: "var(--admin-text-muted)", width: "100%", padding: "10px", borderRadius: "5px" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)", display: "block", marginBottom: "5px" }}>Fecha Promedio de Compra (Lectura)</label>
              <input 
                type="text" 
                readOnly 
                value={editingProduct.fechaPromedioCompra 
                  ? new Date(editingProduct.fechaPromedioCompra).toLocaleDateString("es-CO", { timeZone: "UTC" }) 
                  : "-"
                } 
                style={{ background: "rgba(255, 255, 255, 0.05)", cursor: "not-allowed", border: "1px solid var(--admin-glass-border)", color: "var(--admin-text-muted)", width: "100%", padding: "10px", borderRadius: "5px" }}
              />
            </div>
          </div>
          <div className="admin-input-group" style={{ display: "flex", gap: "10px", gridColumn: "1 / -1", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label style={{ fontSize: "14px", marginBottom: "5px", display: "block" }}>Nueva Imagen Principal Local</label>
              <input type="file" name="imagenFile" accept="image/*" />
            </div>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label style={{ fontSize: "14px", marginBottom: "5px", display: "block" }}>O URL de Imagen Principal</label>
              <input type="text" name="imagenUrl" defaultValue={editingProduct.imagenUrl} />
            </div>
          </div>
          <div className="admin-input-group" style={{ display: "flex", gap: "10px", gridColumn: "1 / -1", flexWrap: "wrap", borderTop: "1px solid var(--admin-glass-border)", paddingTop: "15px" }}>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label style={{ fontSize: "14px", marginBottom: "5px", display: "block" }}>Subir a Galería (Múltiples fotos)</label>
              <input type="file" name="galeriaFiles" accept="image/*" multiple />
            </div>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label style={{ fontSize: "14px", marginBottom: "5px", display: "block" }}>URLs de Galería (Separadas por coma)</label>
              <textarea name="galeriaUrlsString" defaultValue={editingProduct.galeria?.join(", ") || ""} rows={2} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} placeholder="https://..., https://..." />
            </div>
          </div>
          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <textarea name="descripcion1" defaultValue={editingProduct.descripcion1} required rows={3} />
          </div>
          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <textarea name="descripcion2" defaultValue={editingProduct.descripcion2} rows={2} />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
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
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Agregar Nuevo Producto</h2>
        <form
          action={async (formData) => {
            const res = await createProduct(formData);
            if (res && res.error) {
              alert("Error al crear producto: " + res.error);
            } else {
              setShowNewForm(false);
            }
          }}
          className="admin-grid-form"
        >
          <div className="admin-input-group">
            <input type="text" name="codigo" placeholder="Código (ej. 220930)" required />
          </div>
          <div className="admin-input-group">
            <input type="text" name="nombre" placeholder="Nombre" required />
          </div>
          <div className="admin-input-group">
            <input type="number" name="precio" placeholder="Precio (COP)" required />
          </div>
          <div className="admin-input-group">
            <select name="categoryId">
              <option value="">Sin Categoría / Todas</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="admin-input-group">
            <input type="number" name="minStock" placeholder="Inventario Mínimo (ej. 5)" defaultValue={0} required min="0" />
          </div>
          <div className="admin-input-group" style={{ display: "flex", gap: "10px", gridColumn: "1 / -1", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label style={{ fontSize: "14px", marginBottom: "5px", display: "block" }}>Subir Imagen Principal Local</label>
              <input type="file" name="imagenFile" accept="image/*" />
            </div>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label style={{ fontSize: "14px", marginBottom: "5px", display: "block" }}>O URL de Imagen Principal</label>
              <input type="text" name="imagenUrl" placeholder="URL de Imagen (ej. /img/finecut.png)" />
            </div>
          </div>
          <div className="admin-input-group" style={{ display: "flex", gap: "10px", gridColumn: "1 / -1", flexWrap: "wrap", borderTop: "1px solid var(--admin-glass-border)", paddingTop: "15px" }}>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label style={{ fontSize: "14px", marginBottom: "5px", display: "block" }}>Subir a Galería (Múltiples fotos)</label>
              <input type="file" name="galeriaFiles" accept="image/*" multiple />
            </div>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label style={{ fontSize: "14px", marginBottom: "5px", display: "block" }}>URLs de Galería (Separadas por coma)</label>
              <textarea name="galeriaUrlsString" rows={2} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} placeholder="https://..., https://..." />
            </div>
          </div>
          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <textarea name="descripcion1" placeholder="Descripción 1" required rows={3} />
          </div>
          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <textarea name="descripcion2" placeholder="Descripción opcional 2" rows={2} />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <SubmitButton className="admin-btn" loadingText="Guardando...">
              Guardar Nuevo Producto
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
      {/* Sub-Tabs Navigation */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "25px", borderBottom: "1px solid var(--admin-glass-border)", paddingBottom: "10px" }}>
        <button 
          onClick={() => setActiveTab("products")} 
          style={{
            background: "transparent",
            border: "none",
            color: activeTab === "products" ? "white" : "var(--admin-text-muted)",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            padding: "8px 16px",
            borderBottom: activeTab === "products" ? "2px solid #60a5fa" : "none",
            transition: "all 0.2s"
          }}
        >
          📦 Catálogo de Productos
        </button>
        <button 
          onClick={() => setActiveTab("adjustments")} 
          style={{
            background: "transparent",
            border: "none",
            color: activeTab === "adjustments" ? "white" : "var(--admin-text-muted)",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            padding: "8px 16px",
            borderBottom: activeTab === "adjustments" ? "2px solid #60a5fa" : "none",
            transition: "all 0.2s"
          }}
        >
          🔧 Ajustes de Stock
        </button>
        <button 
          onClick={() => setActiveTab("audit")} 
          style={{
            background: "transparent",
            border: "none",
            color: activeTab === "audit" ? "white" : "var(--admin-text-muted)",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            padding: "8px 16px",
            borderBottom: activeTab === "audit" ? "2px solid #60a5fa" : "none",
            transition: "all 0.2s"
          }}
        >
          📜 Historial de Auditoría
        </button>
      </div>

      {activeTab === "products" && (
        <>
          {/* Inventory Valuation & Capital Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginBottom: "30px"
          }}>
            <div className="glass-container" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ color: "var(--admin-text-muted)", fontSize: "14px", fontWeight: "bold" }}>Capital Total en Inventario</span>
              <span style={{ fontSize: "28px", fontWeight: "bold", color: "#34d399" }}>
                COP {products.reduce((acc, p) => acc + (p.valorInventarioActual || 0), 0).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
              </span>
              <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>Valorizado según el costo promedio actual de cada producto</span>
            </div>
            <div className="glass-container" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ color: "var(--admin-text-muted)", fontSize: "14px", fontWeight: "bold" }}>Total Unidades Disponibles</span>
              <span style={{ fontSize: "28px", fontWeight: "bold", color: "#60a5fa" }}>
                {products.reduce((acc, p) => acc + (p.stockActual || 0), 0).toLocaleString()} und.
              </span>
              <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>Cantidad acumulada de todos los productos en catálogo</span>
            </div>
            <div className="glass-container" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ color: "var(--admin-text-muted)", fontSize: "14px", fontWeight: "bold" }}>Productos con Costo Pendiente</span>
              <span style={{ fontSize: "28px", fontWeight: "bold", color: "#fbbf24" }}>
                {products.filter(p => !p.costoInicialConfigurado).length} productos
              </span>
              <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>Requieren configuración de costo inicial para calcular rentabilidad</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ color: "var(--admin-text-muted)", fontWeight: "bold" }}>Filtrar por Categoría:</label>
              <select 
                value={filterCategoryId} 
                onChange={(e) => setFilterCategoryId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                className="admin-input" 
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--admin-glass-border)", background: "rgba(15, 23, 42, 0.95)", color: "white", minWidth: "200px" }}
              >
                <option value="ALL">Todas las categorías</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <button className="admin-btn" onClick={() => setShowNewForm(true)}>
              + Agregar Nuevo Producto
            </button>
          </div>

          <section className="glass-container" style={{ padding: "0", overflow: "hidden" }}>
            <div style={{ padding: "30px 30px 15px 30px" }}>
              <h2 style={{ margin: 0 }}>Productos Actuales</h2>
            </div>
            
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Código</th>
                    <th>Imagen</th>
                    <th>Categoría</th>
                    <th>Costo Prom.</th>
                    <th>Valor Inv.</th>
                    <th>Precio</th>
                    <th>Inventario</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isUnderMin = p.stockActual <= p.minStock;
                    const hasIncoming = p.incomingOrders && p.incomingOrders.length > 0;
                    const totalIncomingQty = p.incomingOrders?.reduce((acc: number, order: any) => acc + order.cantidad, 0) || 0;
                    
                    return (
                      <tr key={p.id}>
                        <td className="wrap-text" style={{ fontWeight: "bold" }}>{p.nombre}</td>
                        <td>{p.codigo}</td>
                        <td>
                          <img src={p.imagenUrl} alt={p.nombre} width="50" />
                        </td>
                        <td>{p.category ? p.category.nombre : "-"}</td>
                        <td>
                          {p.costoInicialConfigurado ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontWeight: "bold" }}>
                                COP {Number(p.precioPromedioCompra).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                              </span>
                              {p.fechaPromedioCompra && (
                                <span style={{ fontSize: "10px", color: "var(--admin-text-muted)" }}>
                                  Ponderado: {new Date(p.fechaPromedioCompra).toLocaleDateString("es-CO", { timeZone: "UTC" })}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                              <span style={{
                                padding: "3px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "bold",
                                background: "rgba(239, 68, 68, 0.15)",
                                color: "#f87171",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                display: "inline-block",
                                textAlign: "center"
                              }}>
                                ⚠️ Sin Costo
                              </span>
                              <button
                                type="button"
                                onClick={() => setInitializingProduct(p)}
                                className="admin-btn admin-btn-outline admin-btn-sm"
                                style={{ padding: "3px 8px", fontSize: "11px" }}
                              >
                                Configurar
                              </button>
                            </div>
                          )}
                        </td>
                        <td>
                          COP {Number(p.valorInventarioActual || 0).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                        </td>
                        <td>COP {Number(p.precio).toLocaleString("es-CO", { minimumFractionDigits: 0 })}</td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span 
                                className={`badge-stock ${isUnderMin ? "stock-bajo" : "stock-ok"}`}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  fontWeight: "bold",
                                  background: isUnderMin ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                                  color: isUnderMin ? "#f87171" : "#34d399",
                                  border: isUnderMin ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)"
                                }}
                              >
                                {p.stockActual} / {p.minStock}
                              </span>
                            </div>
                            {(hasIncoming || isUnderMin) && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                {hasIncoming && (
                                  <span 
                                    style={{
                                      fontSize: "11px",
                                      background: "rgba(59, 130, 246, 0.2)",
                                      color: "#60a5fa",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      border: "1px solid rgba(59, 130, 246, 0.3)",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px"
                                    }}
                                    title="Hay un pedido en camino"
                                  >
                                    🚚 En camino (+{totalIncomingQty})
                                  </span>
                                )}
                                {!hasIncoming && isUnderMin && (
                                  <span 
                                    style={{
                                      fontSize: "11px",
                                      background: "rgba(245, 158, 11, 0.2)",
                                      color: "#fbbf24",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      border: "1px solid rgba(245, 158, 11, 0.3)",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px"
                                    }}
                                  >
                                    ⚠️ Reordenar
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            <button type="button" onClick={() => startEdit(p)} className="admin-btn admin-btn-outline admin-btn-sm">Editar</button>
                            <button 
                              type="button" 
                              onClick={() => setDeleteConfirmId(p.id)} 
                              className="admin-btn admin-btn-danger admin-btn-sm"
                            >
                              Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "var(--admin-text-muted)" }}>
                        No hay productos en esta categoría.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {activeTab === "audit" && (
        <section className="glass-container" style={{ padding: "0", overflow: "hidden" }}>
          <div style={{ padding: "30px 30px 15px 30px" }}>
            <h2 style={{ margin: 0 }}>Historial de Movimientos de Inventario</h2>
            <p style={{ color: "var(--admin-text-muted)", fontSize: "14px", marginTop: "5px" }}>
              Registro cronológico de compras, ventas, inicializaciones y reversiones de stock.
            </p>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Costo Unit.</th>
                  <th>Stock Prev.</th>
                  <th>Stock Nuevo</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {inventoryLogs && inventoryLogs.map((log: any) => {
                  let badgeColor = "rgba(59, 130, 246, 0.2)";
                  let textColor = "#60a5fa";
                  if (log.tipo === "COMPRA") {
                    badgeColor = "rgba(16, 185, 129, 0.2)";
                    textColor = "#34d399";
                  } else if (log.tipo === "VENTA") {
                    badgeColor = "rgba(239, 68, 68, 0.2)";
                    textColor = "#f87171";
                  } else if (log.tipo === "INICIALIZACION") {
                    badgeColor = "rgba(245, 158, 11, 0.2)";
                    textColor = "#fbbf24";
                  } else if (log.tipo === "REVERSION") {
                    badgeColor = "rgba(139, 92, 246, 0.2)";
                    textColor = "#a78bfa";
                  } else if (log.tipo === "AJUSTE_INGRESO") {
                    badgeColor = "rgba(16, 185, 129, 0.15)";
                    textColor = "#10b981";
                  } else if (log.tipo === "AJUSTE_SALIDA") {
                    badgeColor = "rgba(239, 68, 68, 0.15)";
                    textColor = "#ef4444";
                  }

                  return (
                    <tr key={log.id}>
                      <td className="wrap-text" style={{ fontWeight: "bold" }}>
                        {log.product ? log.product.nombre : `ID: ${log.productId}`}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {new Date(log.createdAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          background: badgeColor,
                          color: textColor,
                          border: `1px solid ${textColor}40`
                        }}>
                          {log.tipo}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "bold" }}>
                        {log.tipo === "VENTA" ? `-${log.cantidad}` : `+${log.cantidad}`}
                      </td>
                      <td>
                        {log.costoUnit > 0 ? `COP ${Number(log.costoUnit).toLocaleString("es-CO", { minimumFractionDigits: 0 })}` : "-"}
                      </td>
                      <td style={{ textAlign: "center" }}>{log.stockPrevio}</td>
                      <td style={{ textAlign: "center", fontWeight: "bold" }}>{log.stockNuevo}</td>
                      <td className="wrap-text" style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
                        {log.detalle}
                      </td>
                    </tr>
                  );
                })}
                {(!inventoryLogs || inventoryLogs.length === 0) && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--admin-text-muted)" }}>
                      No se han registrado movimientos de inventario aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "adjustments" && (
        <section className="glass-container" style={{ marginBottom: "40px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Realizar Ajuste de Inventario (Entradas y Salidas)</h2>
          <form
            action={async (formData) => {
              const productId = parseInt(formData.get("productId") as string, 10);
              const tipo = formData.get("tipo") as "INGRESO" | "SALIDA";
              const cantidad = parseInt(formData.get("cantidad") as string, 10);
              const detalle = formData.get("detalle") as string;
              
              try {
                const res = await adjustProductStock(productId, tipo, cantidad, detalle);
                if (res && res.error) {
                  alert("Error al registrar ajuste: " + res.error);
                } else {
                  alert("Ajuste de inventario registrado con éxito");
                  setActiveTab("products");
                }
              } catch (err: any) {
                alert("Error al registrar ajuste: " + err.message);
              }
            }}
            className="admin-grid-form"
          >
            <div className="admin-input-group">
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)", display: "block", marginBottom: "6px" }}>Seleccionar Producto</label>
              <select name="productId" required defaultValue="">
                <option value="" disabled>-- Seleccione un producto --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (Código: {p.codigo} | Stock actual: {p.stockActual})
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-input-group">
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)", display: "block", marginBottom: "6px" }}>Tipo de Ajuste</label>
              <select name="tipo" required defaultValue="SALIDA">
                <option value="INGRESO">🟢 INGRESO (Entrada / Ajuste Positivo)</option>
                <option value="SALIDA">🔴 SALIDA (Pérdida, Daño / Ajuste Negativo)</option>
              </select>
            </div>

            <div className="admin-input-group">
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)", display: "block", marginBottom: "6px" }}>Cantidad de Unidades</label>
              <input type="number" name="cantidad" required min="1" placeholder="Ej. 5" />
            </div>

            <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)", display: "block", marginBottom: "6px" }}>Detalle / Motivo del Ajuste</label>
              <textarea 
                name="detalle" 
                required 
                rows={3} 
                placeholder="Escriba el motivo, ej: '3 piezas dañadas en transporte', 'Ajuste de inventario físico mensual', etc." 
              />
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <SubmitButton className="admin-btn" loadingText="Registrando...">
                Registrar Ajuste
              </SubmitButton>
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => setActiveTab("products")}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Initial Cost Modal Overlay */}
      {initializingProduct && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div className="glass-container" style={{ width: "100%", maxWidth: "450px", padding: "30px", border: "1px solid var(--admin-glass-border)", background: "rgba(15, 23, 42, 0.95)" }}>
            <h3 style={{ margin: "0 0 15px 0", color: "white" }}>Inicializar Costo de Inventario</h3>
            <p style={{ fontSize: "14px", color: "var(--admin-text-muted)", marginBottom: "15px" }}>
              Configura el costo promedio ponderado inicial y la fecha promedio de adquisición para <strong>{initializingProduct.nombre}</strong>.
            </p>
            
            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--admin-glass-border)",
              borderRadius: "8px",
              padding: "10px 15px",
              marginBottom: "20px",
              fontSize: "14px"
            }}>
              <strong>Inventario Actual:</strong> <span style={{ color: initializingProduct.stockActual > 0 ? "#34d399" : "#f87171", fontWeight: "bold" }}>{initializingProduct.stockActual} unidades</span>
            </div>

            {initializingProduct.stockActual <= 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                  padding: "15px",
                  color: "#f87171",
                  fontSize: "14px",
                  lineHeight: "1.5"
                }}>
                  <strong>⚠️ Acción no permitida:</strong> Este producto no tiene unidades en inventario (Stock: 0). Registre una compra o actualice el stock antes de configurar el costo promedio inicial.
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button type="button" onClick={() => setInitializingProduct(null)} className="admin-btn">Aceptar</button>
                </div>
              </div>
            ) : (
              <form action={async (formData) => {
                const cost = parseFloat(formData.get("precioPromedioInicial") as string || "0");
                const date = formData.get("fechaPromedioInicial") as string;
                const res = await initializeProductCost(initializingProduct.id, cost, date);
                if (res && res.error) {
                  alert("Error al inicializar costo: " + res.error);
                } else {
                  setInitializingProduct(null);
                }
              }} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div className="admin-input-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Costo Promedio Inicial (COP)</label>
                  <input 
                    type="number" 
                    name="precioPromedioInicial" 
                    required 
                    min="0" 
                    step="any" 
                    placeholder="Ej. 15000" 
                    className="admin-input" 
                    style={{ width: "100%" }} 
                  />
                </div>
                <div className="admin-input-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Fecha Promedio de Adquisición</label>
                  <input 
                    type="date" 
                    name="fechaPromedioInicial" 
                    required 
                    className="admin-input" 
                    style={{ width: "100%" }} 
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px" }}>
                  <button type="button" onClick={() => setInitializingProduct(null)} className="admin-btn admin-btn-outline">Cancelar</button>
                  <SubmitButton className="admin-btn" loadingText="Inicializando...">Inicializar</SubmitButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
                Esta acción es permanente y eliminará el producto del catálogo. ¿Deseas continuar?
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <ActionButton 
                className="admin-btn admin-btn-danger"
                onClick={async () => {
                  const res = await deleteProduct(deleteConfirmId);
                  if (res && res.error) {
                    alert("Error al eliminar el producto: " + res.error);
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
