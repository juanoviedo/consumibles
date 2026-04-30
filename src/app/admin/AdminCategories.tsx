"use client";
import { useState } from "react";
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/category";

export default function AdminCategories({ categories }: { categories: any[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const startEdit = (c: any) => setEditingId(c.id);
  const cancelEdit = () => setEditingId(null);

  return (
    <>
      <section className="glass-container" style={{ marginBottom: "40px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Agregar Nueva Categoría</h2>
        <form
          action={createCategory}
          className="admin-grid-form"
        >
          <div className="admin-input-group">
            <input type="text" name="nombre" placeholder="Nombre de la Categoría" required />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", marginBottom: "15px" }}>
            <button type="submit" className="admin-btn">
              Guardar Categoría
            </button>
          </div>
        </form>
      </section>

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
                  {editingId === c.id ? (
                    <td colSpan={3}>
                      <form action={async (formData) => { 
                          await updateCategory(formData); 
                          setEditingId(null); 
                      }} className="admin-edit-form" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input type="hidden" name="id" value={c.id} />
                        <div className="admin-input-group" style={{ marginBottom: 0, flex: 1 }}>
                          <input type="text" name="nombre" defaultValue={c.nombre} required />
                        </div>
                        <div>
                          <button type="submit" className="admin-btn admin-btn-success admin-btn-sm" style={{ marginRight: "10px" }}>Guardar</button>
                          <button type="button" onClick={cancelEdit} className="admin-btn admin-btn-outline admin-btn-sm">Cancelar</button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
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
                    </>
                  )}
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
