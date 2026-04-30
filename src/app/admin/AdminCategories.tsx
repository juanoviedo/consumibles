"use client";
import { useState } from "react";
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/category";

export default function AdminCategories({ categories }: { categories: any[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const startEdit = (c: any) => setEditingId(c.id);
  const cancelEdit = () => setEditingId(null);

  const editingCategory = categories.find(c => c.id === editingId);

  if (editingCategory) {
    return (
      <section className="glass-container" style={{ marginBottom: "40px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Editar Categoría: {editingCategory.nombre}</h2>
        <form
          action={async (formData) => { 
            await updateCategory(formData); 
            setEditingId(null); 
          }}
          className="admin-grid-form"
        >
          <input type="hidden" name="id" value={editingCategory.id} />
          <div className="admin-input-group">
            <input type="text" name="nombre" defaultValue={editingCategory.nombre} required />
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px", gridColumn: "1/-1" }}>
            <button type="submit" className="admin-btn">Guardar Cambios</button>
            <button type="button" className="admin-btn admin-btn-outline" onClick={cancelEdit}>Cancelar</button>
          </div>
        </form>
      </section>
    );
  }

  if (showNewForm) {
    return (
      <section className="glass-container" style={{ marginBottom: "40px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Agregar Nueva Categoría</h2>
        <form
          action={async (formData) => {
            await createCategory(formData);
            setShowNewForm(false);
          }}
          className="admin-grid-form"
        >
          <div className="admin-input-group">
            <input type="text" name="nombre" placeholder="Nombre de la Categoría" required />
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginBottom: "15px" }}>
            <button type="submit" className="admin-btn">
              Guardar Categoría
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
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        <button className="admin-btn" onClick={() => setShowNewForm(true)}>
          + Agregar Nueva Categoría
        </button>
      </div>

      <section className="glass-container" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "30px 30px 15px 30px" }}>
          <h2 style={{ margin: 0 }}>Categorías Actuales</h2>
        </div>
        
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.nombre}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button type="button" onClick={() => startEdit(c)} className="admin-btn admin-btn-outline admin-btn-sm">Editar</button>
                      <form action={deleteCategory.bind(null, c.id)}>
                        <button type="submit" className="admin-btn admin-btn-danger admin-btn-sm">Borrar</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "20px", color: "#666" }}>No hay categorías registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
