"use client";

import { useState } from "react";
import { 
  createQuotation, 
  updateQuotation,
  convertToBillOfCollection, 
  markAsPaid, 
  markAsRejected, 
  revertToQuotation, 
  deleteQuotation 
} from "@/app/actions/billing";
import SubmitButton from "@/components/SubmitButton";
import ActionButton from "@/components/ActionButton";
import { downloadDocumentPDF } from "@/lib/pdfGenerator";

interface QuotationItemInput {
  productId: number | "";
  nombre: string;
  codigo: string;
  cantidad: string;
  precioUnitario: string;
  priceSource?: "LISTA" | "HISTORIAL" | "";
  suggestedPrice?: number;
}

export default function QuotationsClient({
  quotations,
  clients,
  products,
  settings
}: {
  quotations: any[];
  clients: any[];
  products: any[];
  settings: any;
}) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<"TODAS" | "COTIZACIONES" | "CUENTAS_COBRO">("TODAS");
  
  // Edit States
  const [editingQuotationId, setEditingQuotationId] = useState<number | null>(null);
  const [editingQuotationNumber, setEditingQuotationNumber] = useState<string>("");

  // Creation/Edit items State
  const [selectedClientId, setSelectedClientId] = useState<number | "">("");
  const [currentItems, setCurrentItems] = useState<QuotationItemInput[]>([]);

  // Derived state to check if form is read-only
  const isFormBlocked = editingQuotationId !== null && (() => {
    const quote = quotations.find(q => q.id === editingQuotationId);
    return quote ? quote.estado !== "COTIZACION" : false;
  })();

  // Details Modal State
  const [activeDetailsQuote, setActiveDetailsQuote] = useState<any | null>(null);

  // Revert Modal State
  const [activeRevertQuoteId, setActiveRevertQuoteId] = useState<number | null>(null);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "-";
    return new Date(dateVal).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    });
  };

  // Open the creation form with one empty row by default
  const handleOpenNewForm = () => {
    setEditingQuotationId(null);
    setEditingQuotationNumber("");
    setSelectedClientId("");
    setCurrentItems([
      { productId: "", nombre: "", codigo: "", cantidad: "1", precioUnitario: "", priceSource: "", suggestedPrice: 0 }
    ]);
    setShowNewForm(true);
  };

  // Add a new empty row to the items list
  const handleAddRow = () => {
    setCurrentItems([
      ...currentItems,
      { productId: "", nombre: "", codigo: "", cantidad: "1", precioUnitario: "", priceSource: "", suggestedPrice: 0 }
    ]);
  };

  // Remove a row from the items list by index
  const handleRemoveRow = (index: number) => {
    setCurrentItems(currentItems.filter((_, i) => i !== index));
  };

  // Update item quantity inline by index
  const handleUpdateItemQty = (index: number, val: string) => {
    setCurrentItems(prev => prev.map((item, i) => 
      i === index ? { ...item, cantidad: val } : item
    ));
  };

  // Update item unit price inline by index
  const handleUpdateItemPrice = (index: number, val: string) => {
    setCurrentItems(prev => prev.map((item, i) => 
      i === index ? { ...item, precioUnitario: val } : item
    ));
  };

  // Update product selection for a specific row index
  const handleUpdateRowProduct = (index: number, val: string) => {
    if (val === "") {
      setCurrentItems(prev => prev.map((item, i) => 
        i === index ? { ...item, productId: "", nombre: "", codigo: "", precioUnitario: "", priceSource: "", suggestedPrice: 0 } : item
      ));
      return;
    }
    const prodId = Number(val);
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    let lastPrice: number | null = null;
    if (selectedClientId !== "") {
      const clientId = Number(selectedClientId);
      for (const quote of quotations) {
        if (quote.clientId === clientId && (quote.estado === "CUENTA_COBRO" || quote.estado === "PAGADA" || quote.estado === "APROBADA")) {
          const matchingItem = quote.items?.find((item: any) => item.productId === prodId);
          if (matchingItem) {
            lastPrice = matchingItem.precioUnitario;
            break;
          }
        }
      }
    }

    const price = lastPrice !== null ? lastPrice : prod.precio;
    const source = lastPrice !== null ? "HISTORIAL" : "LISTA";

    setCurrentItems(prev => prev.map((item, i) => 
      i === index ? {
        ...item,
        productId: prodId,
        nombre: prod.nombre,
        codigo: prod.codigo,
        precioUnitario: price,
        priceSource: source,
        suggestedPrice: prod.precio
      } : item
    ));
  };

  // Initialize form with existing quotation data for editing
  const handleStartEdit = (quote: any) => {
    setEditingQuotationId(quote.id);
    setEditingQuotationNumber(quote.numeroCotizacion);
    setSelectedClientId(quote.clientId);
    
    const itemsInput: QuotationItemInput[] = quote.items.map((i: any) => ({
      productId: i.productId,
      nombre: i.product?.nombre || "",
      codigo: i.product?.codigo || "",
      cantidad: i.cantidad.toString(),
      precioUnitario: i.precioUnitario.toString(),
      priceSource: "LISTA" as const,
      suggestedPrice: Number(i.product?.precio || i.precioUnitario)
    }));
    setCurrentItems(itemsInput);
    setShowNewForm(false);
  };

  // Cancel quotation edit mode
  const handleCancelEdit = () => {
    setEditingQuotationId(null);
    setEditingQuotationNumber("");
    setSelectedClientId("");
    setCurrentItems([]);
  };

  // Re-lookup prices when client changes for all items currently selected
  const handleClientChange = (clientIdStr: string) => {
    const clientId = clientIdStr === "" ? "" : Number(clientIdStr);
    setSelectedClientId(clientId);

    if (clientId !== "") {
      setCurrentItems(prev => prev.map(item => {
        if (item.productId === "") return item;
        const prod = products.find(p => p.id === item.productId);
        if (!prod) return item;

        let lastPrice: number | null = null;
        for (const quote of quotations) {
          if (quote.clientId === clientId && (quote.estado === "CUENTA_COBRO" || quote.estado === "PAGADA" || quote.estado === "APROBADA")) {
            const matchingItem = quote.items?.find((mi: any) => mi.productId === item.productId);
            if (matchingItem) {
              lastPrice = matchingItem.precioUnitario;
              break;
            }
          }
        }

        const price = lastPrice !== null ? lastPrice : prod.precio;
        const source = lastPrice !== null ? "HISTORIAL" : "LISTA";
        return {
          ...item,
          precioUnitario: price,
          priceSource: source,
          suggestedPrice: prod.precio
        };
      }));
    } else {
      setCurrentItems(prev => prev.map(item => ({
        ...item,
        priceSource: "",
        suggestedPrice: 0
      })));
    }
  };

  // Submit quotation creation
  const handleCreateQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = currentItems.filter(i => i.productId !== "");
    if (selectedClientId === "" || validItems.length === 0) {
      alert("Por favor, seleccione un cliente y añada al menos un producto válido.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createQuotation(
        Number(selectedClientId),
        validItems.map(i => ({
          productId: Number(i.productId),
          cantidad: Number(i.cantidad) || 1,
          precioUnitario: Number(i.precioUnitario) || 0
        }))
      );
      if (res && "error" in res && res.error) {
        alert("Error al guardar: " + res.error);
      } else {
        setSelectedClientId("");
        setCurrentItems([]);
        setShowNewForm(false);
      }
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit quotation edits
  const handleEditQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuotationId === null) return;
    const validItems = currentItems.filter(i => i.productId !== "");
    if (selectedClientId === "" || validItems.length === 0) {
      alert("Por favor, seleccione un cliente y añada al menos un producto válido.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateQuotation(
        editingQuotationId,
        Number(selectedClientId),
        validItems.map(i => ({
          productId: Number(i.productId),
          cantidad: Number(i.cantidad) || 1,
          precioUnitario: Number(i.precioUnitario) || 0
        }))
      );
      if (res && "error" in res && res.error) {
        alert("Error al guardar: " + res.error);
      } else {
        handleCancelEdit();
      }
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };



  // Filter logic
  const filteredDocs = quotations.filter(q => {
    if (filterType === "TODAS") return true;
    if (filterType === "COTIZACIONES") {
      return q.estado === "COTIZACION" || q.estado === "APROBADA" || q.estado === "RECHAZADA";
    }
    if (filterType === "CUENTAS_COBRO") {
      return q.estado === "CUENTA_COBRO" || q.estado === "PAGADA";
    }
    return true;
  });

  const getStatusBadgeStyle = (status: string) => {
    let background = "rgba(148, 163, 184, 0.2)";
    let color = "#cbd5e1";
    let border = "1px solid rgba(148, 163, 184, 0.3)";

    switch (status) {
      case "COTIZACION":
        background = "rgba(245, 158, 11, 0.2)";
        color = "#fbbf24";
        border = "1px solid rgba(245, 158, 11, 0.3)";
        break;
      case "APROBADA":
        background = "rgba(16, 185, 129, 0.2)";
        color = "#34d399";
        border = "1px solid rgba(16, 185, 129, 0.3)";
        break;
      case "RECHAZADA":
        background = "rgba(239, 68, 68, 0.2)";
        color = "#f87171";
        border = "1px solid rgba(239, 68, 68, 0.3)";
        break;
      case "CUENTA_COBRO":
        background = "rgba(59, 130, 246, 0.2)";
        color = "#60a5fa";
        border = "1px solid rgba(59, 130, 246, 0.3)";
        break;
      case "PAGADA":
        background = "rgba(139, 92, 246, 0.2)";
        color = "#a78bfa";
        border = "1px solid rgba(139, 92, 246, 0.3)";
        break;
    }

    return { background, color, border, padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" as const };
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case "COTIZACION": return "Cotización";
      case "APROBADA": return "Aprobada";
      case "RECHAZADA": return "Rechazada";
      case "CUENTA_COBRO": return "Cuenta de Cobro";
      case "PAGADA": return "Pagada";
      default: return status;
    }
  };

  return (
    <>
      {/* 1. HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", margin: 0 }}>Cotizaciones y Facturación</h1>
          <p style={{ color: "var(--admin-text-muted)", marginTop: "4px" }}>
            Genera cotizaciones y transfiérelas a cuentas de cobro de forma unificada en la base de datos.
          </p>
        </div>
        <button className="admin-btn" onClick={handleOpenNewForm}>
          + Crear Cotización
        </button>
      </div>

      {/* 2. FORMULARIO NUEVA O EDITAR COTIZACIÓN */}
      {(showNewForm || editingQuotationId !== null) && (
        <section className="glass-container" style={{ marginBottom: "40px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "20px" }}>
            {editingQuotationId !== null ? `Editar Cotización ${editingQuotationNumber}` : "Crear Nueva Cotización"}
          </h2>
          <form onSubmit={editingQuotationId !== null ? handleEditQuotationSubmit : handleCreateQuotationSubmit} className="admin-grid-form">
            <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Cliente</label>
              <select 
                value={selectedClientId} 
                onChange={(e) => handleClientChange(e.target.value)}
                required
                disabled={isFormBlocked}
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.nit ? `(NIT: ${c.nit})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* List of items currently added to the quote draft */}
            <div style={{ gridColumn: "1 / -1", marginTop: "15px" }}>
              <h4 style={{ fontSize: "14px", marginBottom: "10px" }}>Productos Cotizados (Edición en Línea):</h4>
              <div className="admin-table-container" style={{ maxHeight: "350px", border: "1px solid var(--admin-glass-border)" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: "150px" }}>Código</th>
                      <th>Producto</th>
                      <th style={{ width: "120px" }}>Cantidad</th>
                      <th style={{ width: "180px" }}>Precio Unit.</th>
                      <th>Subtotal</th>
                      <th style={{ width: "100px" }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item, index) => (
                      <tr key={index}>
                        <td><strong>{item.codigo || "-"}</strong></td>
                        <td>
                          <select
                            value={item.productId}
                            onChange={(e) => handleUpdateRowProduct(index, e.target.value)}
                            required
                            disabled={isFormBlocked}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: "rgba(0, 0, 0, 0.3)",
                              color: "white",
                              border: "1px solid var(--admin-glass-border)",
                              borderRadius: "6px",
                              outline: "none",
                              fontSize: "14px"
                            }}
                          >
                            <option value="">-- Seleccionar Producto --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.nombre} (Stock: {p.stockActual})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input 
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => handleUpdateItemQty(index, e.target.value)}
                            disabled={isFormBlocked}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: "rgba(0, 0, 0, 0.3)",
                              color: "white",
                              border: "1px solid var(--admin-glass-border)",
                              borderRadius: "6px",
                              outline: "none",
                              fontSize: "14px"
                            }}
                          />
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <input 
                              type="number"
                              min="0"
                              value={item.precioUnitario}
                              onChange={(e) => handleUpdateItemPrice(index, e.target.value)}
                              disabled={isFormBlocked}
                              style={{
                                width: "100%",
                                padding: "6px 10px",
                                background: "rgba(0, 0, 0, 0.3)",
                                color: "white",
                                border: "1px solid var(--admin-glass-border)",
                                borderRadius: "6px",
                                outline: "none",
                                fontSize: "14px"
                              }}
                            />
                            {item.priceSource === "HISTORIAL" && item.suggestedPrice && (
                              <span style={{ fontSize: "10px", color: "#60a5fa" }}>
                                ℹ️ Historial: {formatCurrency(item.suggestedPrice)}
                              </span>
                            )}
                            {item.priceSource === "LISTA" && item.suggestedPrice && (
                              <span style={{ fontSize: "10px", color: "var(--admin-text-muted)" }}>
                                ℹ️ Lista: {formatCurrency(item.suggestedPrice)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{formatCurrency((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0))}</td>
                        <td>
                          <button 
                            type="button" 
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            style={{ padding: "6px 12px" }}
                            onClick={() => handleRemoveRow(index)}
                            disabled={isFormBlocked}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentItems.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "var(--admin-text-muted)", padding: "15px" }}>
                          No hay productos en la lista todavía.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  onClick={handleAddRow}
                  disabled={isFormBlocked}
                >
                  + Agregar Producto
                </button>
                {currentItems.length > 0 && (
                  <div style={{ textAlign: "right", padding: "10px 0" }}>
                    <strong>Total: {formatCurrency(currentItems.reduce((acc, i) => acc + ((Number(i.cantidad) || 0) * (Number(i.precioUnitario) || 0)), 0))}</strong>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px", gridColumn: "1 / -1" }}>
              {editingQuotationId !== null && isFormBlocked ? (
                <button 
                  type="button" 
                  className="admin-btn"
                  disabled
                  style={{ opacity: 0.6, cursor: "not-allowed", background: "rgba(148, 163, 184, 0.2)", color: "#94a3b8", border: "1px solid rgba(148, 163, 184, 0.3)" }}
                >
                  Solo Lectura (Bloqueado)
                </button>
              ) : (
                <SubmitButton 
                type="submit" 
                className="admin-btn"
                loading={isSubmitting}
                loadingText="Procesando..."
                disabled={currentItems.length === 0 || selectedClientId === ""}
              >
                {editingQuotationId !== null ? "Guardar Cambios" : "Registrar Cotización"}
              </SubmitButton>
              )}
              <button 
                type="button" 
                className="admin-btn admin-btn-outline" 
                onClick={() => {
                  if (editingQuotationId !== null) {
                    handleCancelEdit();
                  } else {
                    setShowNewForm(false);
                    setCurrentItems([]);
                    setSelectedClientId("");
                  }
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 3. FILTRO DE TIPO DE DOCUMENTO */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
        <label style={{ color: "var(--admin-text-muted)", fontWeight: "bold" }}>Ver Tipo:</label>
        <div style={{ display: "flex", gap: "5px", background: "rgba(0, 0, 0, 0.2)", borderRadius: "8px", padding: "4px" }}>
          <button 
            className={`admin-btn admin-btn-sm ${filterType === "TODAS" ? "" : "admin-btn-outline"}`}
            style={{ border: "none", borderRadius: "6px" }}
            onClick={() => setFilterType("TODAS")}
          >
            Todos
          </button>
          <button 
            className={`admin-btn admin-btn-sm ${filterType === "COTIZACIONES" ? "" : "admin-btn-outline"}`}
            style={{ border: "none", borderRadius: "6px" }}
            onClick={() => setFilterType("COTIZACIONES")}
          >
            Cotizaciones
          </button>
          <button 
            className={`admin-btn admin-btn-sm ${filterType === "CUENTAS_COBRO" ? "" : "admin-btn-outline"}`}
            style={{ border: "none", borderRadius: "6px" }}
            onClick={() => setFilterType("CUENTAS_COBRO")}
          >
            Cuentas de Cobro
          </button>
        </div>
      </div>

      {/* 4. TABLA DE DOCUMENTOS */}
      <section className="glass-container" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "30px 30px 15px 30px" }}>
          <h2 style={{ margin: 0 }}>Historial de Documentos</h2>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Nº Cotización</th>
                <th>Nº Cuenta Cobro</th>
                <th>Fecha Cotización</th>
                <th>Fecha Factura</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((q) => (
                <tr key={q.id}>
                  <td className="wrap-text"><strong>{q.client?.nombre}</strong></td>
                  <td><strong>{q.numeroCotizacion}</strong></td>
                  <td>{q.numeroCuentaCobro ? <strong style={{ color: "#60a5fa" }}>{q.numeroCuentaCobro}</strong> : "-"}</td>
                  <td>{formatDate(q.fechaCotizacion)}</td>
                  <td>{formatDate(q.fechaCuentaCobro)}</td>
                  <td>
                    <span style={getStatusBadgeStyle(q.estado)}>
                      {translateStatus(q.estado)}
                    </span>
                  </td>
                  <td>{formatCurrency(q.total)}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button 
                        type="button" 
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        onClick={() => setActiveDetailsQuote(q)}
                      >
                        Ver Detalle
                      </button>

                      <button 
                        type="button" 
                        className="admin-btn admin-btn-success admin-btn-sm"
                        onClick={() => downloadDocumentPDF(q, settings)}
                      >
                        PDF
                      </button>

                      {/* EDITAR COTIZACION O VER DETALLES EN FORMULARIO */}
                      <button 
                        type="button" 
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        style={{ borderColor: "#fbbf24", color: "#fbbf24" }}
                        onClick={() => handleStartEdit(q)}
                      >
                        {q.estado === "COTIZACION" ? "Editar" : "Ver Form. (Bloqueado)"}
                      </button>

                      {/* APROBAR Y FACTURAR (CONVIERTE A CUENTA COBRO Y DESCUENTA STOCK) */}
                      {(q.estado === "COTIZACION" || q.estado === "APROBADA") && (
                        <ActionButton 
                          className="admin-btn admin-btn-success admin-btn-sm" 
                          onClick={async () => {
                            const res = await convertToBillOfCollection(q.id);
                            if (res && res.error) {
                              alert("Error al facturar: " + res.error);
                            }
                          }}
                          loadingText="Facturando..."
                        >
                          Facturar (Saca Stock)
                        </ActionButton>
                      )}

                      {/* PAGAR (REGISTRA PAGO DE LA CUENTA COBRO) */}
                      {q.estado === "CUENTA_COBRO" && (
                        <ActionButton 
                          className="admin-btn admin-btn-sm" 
                          style={{ background: "#8b5cf6" }} 
                          onClick={async () => {
                            const res = await markAsPaid(q.id);
                            if (res && res.error) {
                              alert("Error al marcar pagada: " + res.error);
                            }
                          }}
                          loadingText="Procesando..."
                        >
                          Marcar Pagada
                        </ActionButton>
                      )}

                      {/* RECHAZAR COTIZACION */}
                      {q.estado === "COTIZACION" && (
                        <ActionButton 
                          className="admin-btn admin-btn-danger admin-btn-sm" 
                          onClick={async () => {
                            const res = await markAsRejected(q.id);
                            if (res && res.error) {
                              alert("Error al rechazar: " + res.error);
                            }
                          }}
                          loadingText="Rechazando..."
                        >
                          Rechazar
                        </ActionButton>
                      )}

                      {/* REVERTIR CUENTA COBRO A COTIZACION CON POPUP */}
                      {(q.estado === "CUENTA_COBRO" || q.estado === "PAGADA") && (
                        <button 
                          type="button" 
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => setActiveRevertQuoteId(q.id)}
                        >
                          Revertir a Cotización
                        </button>
                      )}

                      <button 
                        type="button" 
                        className="admin-btn admin-btn-danger admin-btn-sm" 
                        style={{ border: "none", color: "#f87171" }} 
                        onClick={() => setDeleteConfirmId(q.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--admin-text-muted)" }}>
                    No se encontraron documentos en esta categoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. MODAL DE DETALLES (CUSTOM MODAL GLASSMORPHIC) */}
      {activeDetailsQuote && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(5px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div className="glass-container" style={{ maxWidth: "650px", width: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--admin-glass-border)", paddingBottom: "15px", marginBottom: "15px" }}>
              <h2 style={{ margin: 0 }}>Detalle de Documento</h2>
              <button 
                type="button" 
                onClick={() => setActiveDetailsQuote(null)}
                style={{ background: "transparent", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              <div>
                <strong>Nº Cotización:</strong> {activeDetailsQuote.numeroCotizacion}
                {activeDetailsQuote.numeroCuentaCobro && (
                  <div style={{ marginTop: "5px" }}>
                    <strong>Nº Cuenta Cobro:</strong> {activeDetailsQuote.numeroCuentaCobro}
                  </div>
                )}
              </div>
              <div>
                <strong>Estado:</strong> <span style={getStatusBadgeStyle(activeDetailsQuote.estado)}>{translateStatus(activeDetailsQuote.estado)}</span>
              </div>
              <div>
                <strong>Cliente:</strong> {activeDetailsQuote.client?.nombre}<br/>
                {activeDetailsQuote.client?.nit && <><strong>NIT:</strong> {activeDetailsQuote.client.nit}<br/></>}
                {activeDetailsQuote.client?.telefono && <><strong>Teléfono:</strong> {activeDetailsQuote.client.telefono}<br/></>}
                <strong>Dirección:</strong> {activeDetailsQuote.client?.direccion || "-"}
                {(activeDetailsQuote.client?.ciudad || activeDetailsQuote.client?.departamento || activeDetailsQuote.client?.pais) && (
                  <><br/><strong>Ubicación:</strong> {[activeDetailsQuote.client.ciudad, activeDetailsQuote.client.departamento, activeDetailsQuote.client.pais || "Colombia"].filter(Boolean).join(", ")}</>
                )}
              </div>
              <div>
                <strong>Fecha Cotización:</strong> {formatDate(activeDetailsQuote.fechaCotizacion)}<br/>
                {activeDetailsQuote.fechaCuentaCobro && <><strong>Fecha Emisión CC:</strong> {formatDate(activeDetailsQuote.fechaCuentaCobro)}<br/></>}
                {activeDetailsQuote.fechaVencimiento && <><strong>Fecha Vencimiento CC:</strong> {formatDate(activeDetailsQuote.fechaVencimiento)}</>}
              </div>
            </div>

            {["CUENTA_COBRO", "PAGADA"].includes(activeDetailsQuote.estado) && (
              <div style={{
                background: "rgba(16, 185, 129, 0.05)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "20px",
                fontSize: "14px"
              }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#34d399" }}>📈 Indicadores de Rentabilidad</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: "15px" }}>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)", display: "block", fontSize: "12px" }}>Costo Total Inventario</span>
                    <strong style={{ fontSize: "14px" }}>{formatCurrency(activeDetailsQuote.subtotalCosto)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)", display: "block", fontSize: "12px" }}>Utilidad Total Venta</span>
                    <strong style={{ fontSize: "14px", color: "#34d399" }}>{formatCurrency(activeDetailsQuote.utilidadTotal)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)", display: "block", fontSize: "12px" }}>Rentabilidad</span>
                    <strong style={{ fontSize: "14px" }}>{Number(activeDetailsQuote.rentabilidadPorcentual || 0).toFixed(2)}%</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)", display: "block", fontSize: "12px" }}>Días Prom. Rotación</span>
                    <strong style={{ fontSize: "14px" }}>{Number(activeDetailsQuote.diasPromedioInventario || 0).toFixed(1)} días</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)", display: "block", fontSize: "12px" }}>Rentabilidad Mensual</span>
                    <strong style={{ fontSize: "14px" }}>{Number(activeDetailsQuote.rentabilidadMensual || 0).toFixed(2)}%</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)", display: "block", fontSize: "12px" }}>Efectiva Anual (REA)</span>
                    <strong style={{ fontSize: "14px" }}>{Number(activeDetailsQuote.rentabilidadEfectivaAnual || 0).toFixed(2)}%</strong>
                  </div>
                </div>
              </div>
            )}

            <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Artículos Cotizados</h3>
            <div className="admin-table-container" style={{ border: "1px solid var(--admin-glass-border)", marginBottom: "20px" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDetailsQuote.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td>{item.product?.codigo}</td>
                      <td className="wrap-text">
                        <div>{item.product?.nombre}</div>
                        {["CUENTA_COBRO", "PAGADA"].includes(activeDetailsQuote.estado) && item.costoPromedioUnitario > 0 && (
                          <div style={{ fontSize: "11px", color: "var(--admin-text-muted)", marginTop: "4px" }}>
                            Costo: {formatCurrency(item.costoPromedioUnitario)} | 
                            Utilidad: <span style={{ color: "#34d399" }}>{formatCurrency(item.utilidadTotal)}</span> | 
                            Rentabilidad: {Number(item.rentabilidadPorcentual).toFixed(1)}% | 
                            Rotación: {item.diasInventario} d
                          </div>
                        )}
                      </td>
                      <td>{item.cantidad}</td>
                      <td>{formatCurrency(item.precioUnitario)}</td>
                      <td>{formatCurrency(item.cantidad * item.precioUnitario)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "15px" }}>
              Total: {formatCurrency(activeDetailsQuote.total)}
            </div>

             <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
               <button 
                 type="button" 
                 className="admin-btn admin-btn-success" 
                 onClick={() => downloadDocumentPDF(activeDetailsQuote, settings)}
               >
                 Descargar PDF
               </button>
               <button 
                 type="button" 
                 className="admin-btn admin-btn-outline" 
                 onClick={() => setActiveDetailsQuote(null)}
               >
                 Cerrar
               </button>
             </div>
          </div>
        </div>
      )}

      {/* 6. POPUP ESTILIZADO DE CONFIRMACIÓN PARA REVERSIÓN A COTIZACIÓN CON RETORNO DE INVENTARIO */}
      {activeRevertQuoteId !== null && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100
        }}>
          <div className="glass-container" style={{ maxWidth: "450px", width: "90%", border: "1px solid rgba(239, 68, 68, 0.3)", boxShadow: "0 8px 32px 0 rgba(239, 68, 68, 0.15)" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{
                width: "60px", height: "60px", background: "rgba(239, 68, 68, 0.2)",
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 15px auto", border: "1px solid rgba(239, 68, 68, 0.4)"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </div>
              <h3 style={{ fontSize: "1.3rem", margin: "0 0 10px 0", color: "#f87171" }}>¿Revertir a Cotización Pendiente?</h3>
              <p style={{ color: "var(--admin-text-muted)", fontSize: "14px", lineHeight: "1.5" }}>
                Estás a punto de anular los datos de facturación de este documento y regresarlo a estado <strong>Cotización</strong>.
              </p>
              <p style={{ color: "white", fontSize: "14px", fontWeight: "bold", marginTop: "15px" }}>
                ¿Deseas ingresar de nuevo las cantidades de los productos de vuelta al inventario (entrada de stock)?
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <ActionButton 
                type="button" 
                className="admin-btn"
                style={{ background: "#10b981" }}
                onClick={async () => {
                  const res = await revertToQuotation(activeRevertQuoteId, true);
                  if (res && res.error) {
                    alert("Error al revertir: " + res.error);
                  } else {
                    setActiveRevertQuoteId(null);
                  }
                }}
                loadingText="Devolviendo..."
              >
                Sí, devolver productos al inventario
              </ActionButton>

              <ActionButton 
                type="button" 
                className="admin-btn admin-btn-outline"
                style={{ color: "white", borderColor: "rgba(255,255,255,0.4)" }}
                onClick={async () => {
                  const res = await revertToQuotation(activeRevertQuoteId, false);
                  if (res && res.error) {
                    alert("Error al revertir: " + res.error);
                  } else {
                    setActiveRevertQuoteId(null);
                  }
                }}
                loadingText="Revirtiendo..."
              >
                No, mantener inventario actual
              </ActionButton>

              <button 
                type="button" 
                className="admin-btn admin-btn-outline" 
                style={{ color: "var(--admin-text-muted)" }}
                onClick={() => setActiveRevertQuoteId(null)}
              >
                Cancelar
              </button>
            </div>
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
                Esta acción es permanente y eliminará la cotización/cuenta de cobro. ¿Deseas continuar?
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <ActionButton 
                className="admin-btn admin-btn-danger"
                onClick={async () => {
                  const res = await deleteQuotation(deleteConfirmId);
                  if (res && res.error) {
                    alert("Error al eliminar: " + res.error);
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
