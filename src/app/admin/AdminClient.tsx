"use client";
import { useState } from "react";
import { createProduct, deleteProduct, updateProduct } from "@/app/actions/product";

export default function AdminClient({ products, categories }: { products: any[], categories: any[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<number | "ALL">("ALL");

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
            await updateProduct(formData); 
            setEditingId(null); 
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
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Inventario Actual</label>
            <input type="number" name="stock" defaultValue={editingProduct.stock ?? 0} required min="0" />
          </div>
          <div className="admin-input-group">
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Inventario Mínimo</label>
            <input type="number" name="minStock" defaultValue={editingProduct.minStock ?? 0} required min="0" />
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
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Agregar Nuevo Producto</h2>
        <form
          action={async (formData) => {
            await createProduct(formData);
            setShowNewForm(false);
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
            <input type="number" name="stock" placeholder="Inventario Inicial (ej. 10)" defaultValue={0} required min="0" />
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
            <button type="submit" className="admin-btn">
              Guardar Nuevo Producto
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
                <th>Código</th>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Costo Prom.</th>
                <th>Precio</th>
                <th>Inventario</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const isUnderMin = p.stock <= p.minStock;
                const hasIncoming = p.incomingOrders && p.incomingOrders.length > 0;
                const totalIncomingQty = p.incomingOrders?.reduce((acc: number, order: any) => acc + order.cantidad, 0) || 0;
                
                return (
                  <tr key={p.id}>
                    <td>{p.codigo}</td>
                    <td>
                      <img src={p.imagenUrl} alt={p.nombre} width="50" />
                    </td>
                    <td>{p.nombre}</td>
                    <td>{p.category ? p.category.nombre : "-"}</td>
                    <td>
                      {p.costoPromedio > 0 
                        ? `COP ${Number(p.costoPromedio).toLocaleString("es-CO", { minimumFractionDigits: 0 })}` 
                        : "-"}
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
                            {p.stock} / {p.minStock}
                          </span>
                        </div>
                        {isUnderMin && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {hasIncoming ? (
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
                            ) : (
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
                        <form action={deleteProduct.bind(null, p.id)}>
                          <button type="submit" className="admin-btn admin-btn-danger admin-btn-sm">Borrar</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--admin-text-muted)" }}>
                    No hay productos en esta categoría.
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
