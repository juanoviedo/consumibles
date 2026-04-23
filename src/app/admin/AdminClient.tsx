"use client";
import { useState } from "react";
import { createProduct, deleteProduct, updateProduct } from "@/app/actions/product";

export default function AdminClient({ products }: { products: any[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const startEdit = (p: any) => setEditingId(p.id);
  const cancelEdit = () => setEditingId(null);

  return (
    <>
      <section className="glass-container" style={{ marginBottom: "40px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Agregar Nuevo Producto</h2>
        <form
          action={createProduct}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}
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
            <input type="text" name="imagenUrl" placeholder="URL de Imagen (ej. /img/finecut.png)" required />
          </div>
          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <textarea name="descripcion1" placeholder="Descripción 1" required rows={3} />
          </div>
          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <textarea name="descripcion2" placeholder="Descripción opcional 2" rows={2} />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
            <button type="submit" className="admin-btn" style={{ maxWidth: "250px" }}>
              Guardar Nuevo Producto
            </button>
          </div>
        </form>
      </section>

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
                <th>Precio</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  {editingId === p.id ? (
                    <td colSpan={5}>
                      <form action={async (formData) => { 
                          await updateProduct(formData); 
                          setEditingId(null); 
                      }} className="admin-edit-form">
                        <input type="hidden" name="id" value={p.id} />
                        
                        <div className="admin-input-group"><input type="text" name="codigo" defaultValue={p.codigo} required /></div>
                        <div className="admin-input-group"><input type="text" name="nombre" defaultValue={p.nombre} required /></div>
                        <div className="admin-input-group"><input type="number" name="precio" defaultValue={p.precio} required /></div>
                        <div className="admin-input-group"><input type="text" name="imagenUrl" defaultValue={p.imagenUrl} required /></div>
                        <div className="admin-input-group" style={{gridColumn: "1/-1"}}><textarea name="descripcion1" defaultValue={p.descripcion1} required /></div>
                        <div className="admin-input-group" style={{gridColumn: "1/-1"}}><textarea name="descripcion2" defaultValue={p.descripcion2} /></div>
                        
                        <div className="admin-edit-form-full">
                          <button type="submit" className="admin-btn admin-btn-success admin-btn-sm">Guardar</button>
                          <button type="button" onClick={cancelEdit} className="admin-btn admin-btn-outline admin-btn-sm">Cancelar</button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td>{p.codigo}</td>
                      <td>
                        <img src={p.imagenUrl} alt={p.nombre} width="50" />
                      </td>
                      <td>{p.nombre}</td>
                      <td>COP {p.precio}</td>
                      <td>
                        <div className="admin-table-actions">
                          <button type="button" onClick={() => startEdit(p)} className="admin-btn admin-btn-outline admin-btn-sm">Editar</button>
                          <form action={deleteProduct.bind(null, p.id)}>
                            <button type="submit" className="admin-btn admin-btn-danger admin-btn-sm">Borrar</button>
                          </form>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
