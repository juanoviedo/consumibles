"use client";
import { useState } from "react";
import { createProduct, deleteProduct, updateProduct } from "@/app/actions/product";

export default function AdminClient({ products }: { products: any[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const startEdit = (p: any) => setEditingId(p.id);
  const cancelEdit = () => setEditingId(null);

  return (
    <>
      <section style={{ margin: "40px 0" }}>
        <h2>Agregar Nuevo Producto</h2>
        <form
          action={createProduct}
          style={{
            display: "flex", flexDirection: "column", gap: "10px",
            maxWidth: "400px", background: "#f4f4f4", padding: "20px", borderRadius: "8px"
          }}
        >
          <input type="text" name="codigo" placeholder="Código (ej. 220930)" required />
          <input type="text" name="nombre" placeholder="Nombre" required />
          <input type="number" name="precio" placeholder="Precio (COP)" required />
          <input type="text" name="imagenUrl" placeholder="URL de Imagen (ej. /img/finecut.png)" required />
          <textarea name="descripcion1" placeholder="Descripción 1" required />
          <textarea name="descripcion2" placeholder="Descripción opcional 2" />
          <button type="submit" style={{ background: "#8b0500", color: "#fff", padding: "10px", border: "none", cursor: "pointer" }}>
            Guardar Nuevo Producto
          </button>
        </form>
      </section>

      <h2>Productos Actuales</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr style={{ background: "#8b0500", color: "#fff", textAlign: "left" }}>
            <th style={{ padding: "10px" }}>Código</th>
            <th style={{ padding: "10px" }}>Imagen</th>
            <th style={{ padding: "10px" }}>Nombre</th>
            <th style={{ padding: "10px" }}>Precio</th>
            <th style={{ padding: "10px" }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #ccc" }}>
              {editingId === p.id ? (
                <td colSpan={5} style={{ padding: "10px", background: "#f9f9f9" }}>
                  <form action={async (formData) => { 
                      await updateProduct(formData); 
                      setEditingId(null); 
                  }} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="text" name="codigo" defaultValue={p.codigo} required />
                    <input type="text" name="nombre" defaultValue={p.nombre} required />
                    <input type="number" name="precio" defaultValue={p.precio} required />
                    <input type="text" name="imagenUrl" defaultValue={p.imagenUrl} required />
                    <textarea name="descripcion1" defaultValue={p.descripcion1} style={{width: "100%"}} required />
                    <textarea name="descripcion2" defaultValue={p.descripcion2} style={{width: "100%"}} />
                    <button type="submit" style={{ background: "green", color: "white", padding: "5px 10px", cursor: "pointer" }}>Guardar</button>
                    <button type="button" onClick={cancelEdit} style={{ background: "#ccc", color: "black", padding: "5px 10px", cursor: "pointer" }}>Cancelar</button>
                  </form>
                </td>
              ) : (
                <>
                  <td style={{ padding: "10px" }}>{p.codigo}</td>
                  <td style={{ padding: "10px" }}>
                    <img src={p.imagenUrl} alt={p.nombre} width="50" />
                  </td>
                  <td style={{ padding: "10px" }}>{p.nombre}</td>
                  <td style={{ padding: "10px" }}>COP {p.precio}</td>
                  <td style={{ padding: "10px", display: "flex", gap: "10px" }}>
                    <button type="button" onClick={() => startEdit(p)} style={{ color: "blue", cursor: "pointer", border: "none", background: "none" }}>Editar</button>
                    <form action={deleteProduct.bind(null, p.id)}>
                      <button type="submit" style={{ color: "red", cursor: "pointer", border: "none", background: "none" }}>Borrar</button>
                    </form>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
