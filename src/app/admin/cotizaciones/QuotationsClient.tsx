"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  createQuotation, 
  updateQuotation,
  copyQuotationAsNew,
  convertToBillOfCollection, 
  markAsPaid, 
  markAsPaidWithRetentions,
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
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlClienteId = searchParams.get("clienteId");
  const selectedFilterClient = urlClienteId ? clients.find(c => c.id === Number(urlClienteId)) : null;

  useEffect(() => {
    if (!urlClienteId) {
      router.replace("/admin/clientes");
    }
  }, [urlClienteId, router]);
  
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

  // Copy Confirmation State
  const [copyConfirmQuotation, setCopyConfirmQuotation] = useState<any | null>(null);

  // Retention Modal State
  const [activeRetentionQuote, setActiveRetentionQuote] = useState<any | null>(null);
  const [montoPagadoInput, setMontoPagadoInput] = useState("");
  const [retencionesInput, setRetencionesInput] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
    setSelectedClientId(urlClienteId ? Number(urlClienteId) : "");
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
    setSelectedClientId(urlClienteId ? Number(urlClienteId) : "");
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
    if (urlClienteId && q.clientId !== Number(urlClienteId)) {
      return false;
    }
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

      {selectedFilterClient && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(129, 140, 248, 0.15)",
          border: "1px solid rgba(129, 140, 248, 0.3)",
          borderRadius: "12px",
          padding: "12px 20px",
          marginBottom: "20px",
          backdropFilter: "blur(8px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>👤</span>
            <div>
              <div style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Filtrando por Cliente</div>
              <strong style={{ fontSize: "16px", color: "#818cf8" }}>{selectedFilterClient.nombre}</strong>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              type="button"
              className="admin-btn admin-btn-sm"
              onClick={() => {
                router.push("/admin/clientes");
              }}
              style={{ background: "#818cf8", padding: "8px 16px", fontSize: "14px", fontWeight: "bold" }}
            >
              ← Volver a Clientes
            </button>
          </div>
        </div>
      )}

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
                disabled={isFormBlocked || !!urlClienteId}
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
              <div className="admin-table-container" style={{ maxHeight: "350px", border: "1px solid var(--admin-glass-border)", width: "100%", maxWidth: "100%", overflowX: "auto" }}>
                <table className="admin-table" style={{ minWidth: "650px" }}>
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
                                 {p.esServicio ? `⚡ ${p.nombre} (Servicio)` : `${p.nombre} (Stock: ${p.stockActual})`}{p.mostrarEnWeb === false ? " [Oculto Web]" : ""}
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
            onClick={() => {
              setFilterType("TODAS");
              setSelectedId(null);
            }}
          >
            Todos
          </button>
          <button 
            className={`admin-btn admin-btn-sm ${filterType === "COTIZACIONES" ? "" : "admin-btn-outline"}`}
            style={{ border: "none", borderRadius: "6px" }}
            onClick={() => {
              setFilterType("COTIZACIONES");
              setSelectedId(null);
            }}
          >
            Cotizaciones
          </button>
          <button 
            className={`admin-btn admin-btn-sm ${filterType === "CUENTAS_COBRO" ? "" : "admin-btn-outline"}`}
            style={{ border: "none", borderRadius: "6px" }}
            onClick={() => {
              setFilterType("CUENTAS_COBRO");
              setSelectedId(null);
            }}
          >
            Cuentas de Cobro
          </button>
        </div>
      </div>

      {/* 4. TABLA DE DOCUMENTOS */}
      {(() => {
        const selectedQuote = quotations.find(q => q.id === selectedId);
        return (
          <div className="glass-container" style={{ marginBottom: "20px", padding: "15px 20px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "var(--admin-text-muted)", fontWeight: "bold" }}>
              Acciones de Documento {selectedQuote ? `(${selectedQuote.numeroCotizacion || selectedQuote.numeroCuentaCobro || `ID: ${selectedQuote.id}`})` : ""}
            </h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              {/* General Actions */}
              <button 
                type="button" 
                disabled={!selectedQuote}
                className="admin-btn admin-btn-outline"
                onClick={() => selectedQuote && setActiveDetailsQuote(selectedQuote)}
                title="Ver Detalle"
                style={{ 
                  width: "40px", 
                  height: "40px", 
                  padding: "0", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  borderRadius: "8px",
                  opacity: !selectedQuote ? 0.5 : 1, 
                  cursor: !selectedQuote ? "not-allowed" : "pointer" 
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>

              <button 
                type="button" 
                disabled={!selectedQuote}
                className="admin-btn admin-btn-outline"
                title={selectedQuote ? (selectedQuote.estado === "COTIZACION" ? "Editar Documento" : "Ver Formulario (Bloqueado)") : "Editar / Ver"}
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
                  opacity: !selectedQuote ? 0.5 : 1, 
                  cursor: !selectedQuote ? "not-allowed" : "pointer" 
                }}
                onClick={() => selectedQuote && handleStartEdit(selectedQuote)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                </svg>
              </button>

              <button 
                type="button" 
                disabled={!selectedQuote}
                className="admin-btn admin-btn-success"
                onClick={() => selectedQuote && downloadDocumentPDF(selectedQuote, settings)}
                title="Generar PDF"
                style={{ 
                  width: "40px", 
                  height: "40px", 
                  padding: "0", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  borderRadius: "8px",
                  opacity: !selectedQuote ? 0.5 : 1, 
                  cursor: !selectedQuote ? "not-allowed" : "pointer" 
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </button>

              <button 
                type="button" 
                disabled={!selectedQuote}
                className="admin-btn admin-btn-outline" 
                title="Copiar como Nueva Cotización"
                style={{ 
                  width: "40px", 
                  height: "40px", 
                  padding: "0", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  borderRadius: "8px",
                  borderColor: "#818cf8", 
                  color: "#818cf8", 
                  opacity: !selectedQuote ? 0.5 : 1, 
                  cursor: !selectedQuote ? "not-allowed" : "pointer" 
                }} 
                onClick={() => selectedQuote && setCopyConfirmQuotation(selectedQuote)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>

              {/* Conditional State Actions */}
              {selectedQuote && (selectedQuote.estado === "COTIZACION" || selectedQuote.estado === "APROBADA") && (
                <ActionButton 
                  className="admin-btn admin-btn-success" 
                  onClick={async () => {
                    if (selectedQuote) {
                      const res = await convertToBillOfCollection(selectedQuote.id);
                      if (res && res.error) {
                        alert("Error al facturar: " + res.error);
                      } else {
                        setSelectedId(null);
                      }
                    }
                  }}
                  loadingText="..."
                  title="Facturar (Genera Cuenta de Cobro)"
                  style={{ 
                    width: "40px", 
                    height: "40px", 
                    padding: "0", 
                    display: "inline-flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    borderRadius: "8px" 
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </ActionButton>
              )}

              {selectedQuote && selectedQuote.estado === "CUENTA_COBRO" && (
                <>
                  <ActionButton 
                    className="admin-btn" 
                    style={{ 
                      width: "40px", 
                      height: "40px", 
                      padding: "0", 
                      display: "inline-flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      borderRadius: "8px",
                      background: "#8b5cf6" 
                    }} 
                    onClick={async () => {
                      if (selectedQuote) {
                        const res = await markAsPaid(selectedQuote.id);
                        if (res && res.error) {
                          alert("Error al marcar pagada: " + res.error);
                        } else {
                          setSelectedId(null);
                        }
                      }
                    }}
                    loadingText="..."
                    title="Marcar Pagada"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </ActionButton>
                  <button 
                    type="button"
                    className="admin-btn admin-btn-outline" 
                    title="Pagar con Retención"
                    style={{ 
                      width: "40px", 
                      height: "40px", 
                      padding: "0", 
                      display: "inline-flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      borderRadius: "8px",
                      borderColor: "#c084fc", 
                      color: "#c084fc" 
                    }} 
                    onClick={() => {
                      if (selectedQuote) {
                        setActiveRetentionQuote(selectedQuote);
                        setMontoPagadoInput(Number(selectedQuote.total).toString());
                        setRetencionesInput("0");
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="6" cy="6" r="3" />
                      <circle cx="6" cy="18" r="3" />
                      <line x1="20" y1="4" x2="8.12" y2="15.88" />
                      <line x1="14.47" y1="14.48" x2="20" y2="20" />
                      <line x1="8.12" y1="8.12" x2="12" y2="12" />
                    </svg>
                  </button>
                </>
              )}

              {selectedQuote && selectedQuote.estado === "COTIZACION" && (
                <ActionButton 
                  className="admin-btn admin-btn-danger" 
                  onClick={async () => {
                    if (selectedQuote) {
                      const res = await markAsRejected(selectedQuote.id);
                      if (res && res.error) {
                        alert("Error al rechazar: " + res.error);
                      } else {
                        setSelectedId(null);
                      }
                    }
                  }}
                  loadingText="..."
                  title="Rechazar Cotización"
                  style={{ 
                    width: "40px", 
                    height: "40px", 
                    padding: "0", 
                    display: "inline-flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    borderRadius: "8px" 
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </ActionButton>
              )}

              {selectedQuote && (selectedQuote.estado === "CUENTA_COBRO" || selectedQuote.estado === "PAGADA") && (
                <button 
                  type="button" 
                  className="admin-btn admin-btn-danger"
                  title="Revertir a Cotización"
                  style={{ 
                    width: "40px", 
                    height: "40px", 
                    padding: "0", 
                    display: "inline-flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    borderRadius: "8px" 
                  }}
                  onClick={() => selectedQuote && setActiveRevertQuoteId(selectedQuote.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v6h6" />
                    <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
                  </svg>
                </button>
              )}

              <button 
                type="button" 
                disabled={!selectedQuote}
                className="admin-btn admin-btn-danger" 
                title="Eliminar Documento"
                style={{ 
                  width: "40px", 
                  height: "40px", 
                  padding: "0", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  borderRadius: "8px",
                  borderColor: "rgba(239, 68, 68, 0.4)", 
                  color: "#f87171", 
                  opacity: !selectedQuote ? 0.5 : 1, 
                  cursor: !selectedQuote ? "not-allowed" : "pointer" 
                }} 
                onClick={() => selectedQuote && setDeleteConfirmId(selectedQuote.id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>

              {!selectedQuote && (
                <span style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginLeft: "5px" }}>
                  (Selecciona una fila de la tabla para habilitar las acciones)
                </span>
              )}
            </div>
          </div>
        );
      })()}

      <section className="glass-container" style={{ padding: "0", overflow: "hidden" }}>
        <div className="admin-card-header">
          <h2 style={{ margin: 0 }}>Historial de Documentos</h2>
        </div>

        <div className="admin-table-container">
          <table className="admin-table" style={{ minWidth: "950px" }}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Nº Cotización</th>
                <th>Nº Cuenta Cobro</th>
                <th>Fecha Cotización</th>
                <th>Fecha Factura</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((q) => (
                <tr 
                  key={q.id}
                  onClick={() => setSelectedId(selectedId === q.id ? null : q.id)}
                  style={{ 
                    cursor: "pointer", 
                    background: selectedId === q.id ? "rgba(139, 5, 0, 0.15)" : "" 
                  }}
                >
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
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--admin-text-muted)" }}>
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
                {["CUENTA_COBRO", "PAGADA"].includes(activeDetailsQuote.estado) && settings?.debeANombre && (
                  <div style={{ marginTop: "5px", color: "#60a5fa", fontSize: "13px" }}>
                    <strong>DEBE A:</strong> {settings.debeANombre}{settings.debeACedula ? ` (CC/NIT: ${settings.debeACedula})` : ""}
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "15px" }}>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)", display: "block", fontSize: "12px" }}>Costo Total Inventario</span>
                    <strong style={{ fontSize: "14px" }}>{formatCurrency(activeDetailsQuote.subtotalCosto)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)", display: "block", fontSize: "12px" }}>Utilidad Total Venta</span>
                    <strong style={{ fontSize: "14px", color: "#34d399" }}>{formatCurrency(activeDetailsQuote.utilidadTotal)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)", display: "block", fontSize: "12px" }}>Margen de Utilidad</span>
                    <strong style={{ fontSize: "14px" }}>
                      {((Number(activeDetailsQuote.subtotalVenta || activeDetailsQuote.total || 0) > 0 
                        ? (Number(activeDetailsQuote.utilidadTotal || 0) / Number(activeDetailsQuote.subtotalVenta || activeDetailsQuote.total || 0)) 
                        : 0) * 100).toFixed(2)}%
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)", display: "block", fontSize: "12px" }}>Markup (s/ Costo)</span>
                    <strong style={{ fontSize: "14px" }}>
                      {((Number(activeDetailsQuote.subtotalCosto || 0) > 0 
                        ? (Number(activeDetailsQuote.utilidadTotal || 0) / Number(activeDetailsQuote.subtotalCosto || 0)) 
                        : 0) * 100).toFixed(2)}%
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)", display: "block", fontSize: "12px" }}>Días Prom. Rotación</span>
                    <strong style={{ fontSize: "14px" }}>{Number(activeDetailsQuote.diasPromedioInventario || 0).toFixed(1)} días</strong>
                  </div>
                </div>
              </div>
            )}

            {activeDetailsQuote.pagadoConRetenciones && (
              <div style={{
                background: "rgba(192, 132, 252, 0.05)",
                border: "1px solid rgba(192, 132, 252, 0.2)",
                borderRadius: "8px",
                padding: "12px 15px",
                marginBottom: "20px",
                fontSize: "14px"
              }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#c084fc", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  Pago Recibido con Retenciones
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)", fontSize: "12px", display: "block" }}>Neto Recibido (COP)</span>
                    <strong>{formatCurrency(Number(activeDetailsQuote.montoPagado))}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)", fontSize: "12px", display: "block" }}>Retención Aplicada (COP)</span>
                    <strong>{formatCurrency(Number(activeDetailsQuote.retenciones))} ({Number(activeDetailsQuote.total) > 0 ? ((Number(activeDetailsQuote.retenciones) / Number(activeDetailsQuote.total)) * 100).toFixed(2) : "0.00"}%)</strong>
                  </div>
                </div>
              </div>
            )}

            <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Artículos Cotizados</h3>
            <div className="admin-table-container" style={{ border: "1px solid var(--admin-glass-border)", marginBottom: "20px", width: "100%", maxWidth: "100%", overflowX: "auto" }}>
              <table className="admin-table" style={{ minWidth: "500px" }}>
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
                        {["CUENTA_COBRO", "PAGADA"].includes(activeDetailsQuote.estado) && item.costoPromedioUnitario > 0 && (() => {
                          const itemVenta = item.cantidad * item.precioUnitario;
                          const itemMargen = itemVenta > 0 ? (Number(item.utilidadTotal) / itemVenta) * 100 : 0;
                          const itemMarkup = (item.costoPromedioUnitario * item.cantidad) > 0 ? (Number(item.utilidadTotal) / (item.costoPromedioUnitario * item.cantidad)) * 100 : 0;
                          return (
                            <div style={{ fontSize: "11px", color: "var(--admin-text-muted)", marginTop: "4px" }}>
                              Costo: {formatCurrency(item.costoPromedioUnitario)} | 
                              Utilidad: <span style={{ color: "#34d399" }}>{formatCurrency(item.utilidadTotal)}</span> | 
                              Margen: {itemMargen.toFixed(1)}% | 
                              Markup: {itemMarkup.toFixed(1)}% | 
                              Rotación: {item.diasInventario} d
                            </div>
                          );
                        })()}
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
                  style={{ borderColor: "#818cf8", color: "#818cf8" }}
                  onClick={() => {
                    setCopyConfirmQuotation(activeDetailsQuote);
                    setActiveDetailsQuote(null);
                  }}
                >
                  Copiar como Cotización
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

      {copyConfirmQuotation !== null && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100
        }}>
          <div className="glass-container" style={{ maxWidth: "420px", width: "90%", border: "1px solid rgba(129, 140, 248, 0.3)", boxShadow: "0 8px 32px 0 rgba(129, 140, 248, 0.15)", padding: "30px", background: "rgba(15, 23, 42, 0.95)" }}>
            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <div style={{
                width: "60px", height: "60px", background: "rgba(129, 140, 248, 0.2)",
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 15px auto", border: "1px solid rgba(129, 140, 248, 0.4)"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </div>
              <h3 style={{ fontSize: "1.25rem", margin: "0 0 10px 0", color: "#818cf8" }}>¿Copiar Documento?</h3>
              <p style={{ color: "var(--admin-text-muted)", fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
                Se creará una **nueva cotización** con la fecha de hoy conteniendo el mismo cliente (<strong>{copyConfirmQuotation.client?.nombre}</strong>) y los mismos {copyConfirmQuotation.items?.length || 0} productos.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <ActionButton 
                className="admin-btn"
                style={{ background: "#6366f1", color: "white", flex: 1 }}
                onClick={async () => {
                  const res = await copyQuotationAsNew(copyConfirmQuotation.id);
                  if (res && res.error) {
                    alert("Error al copiar: " + res.error);
                  } else {
                    setCopyConfirmQuotation(null);
                  }
                }}
                loadingText="Copiando..."
              >
                Sí, Copiar
              </ActionButton>
              <button 
                type="button" 
                className="admin-btn admin-btn-outline" 
                style={{ color: "white", borderColor: "rgba(255,255,255,0.4)", flex: 1 }}
                onClick={() => setCopyConfirmQuotation(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeRetentionQuote !== null && (() => {
        const totalOriginal = Number(activeRetentionQuote.total);
        const parsedPaid = parseFloat(montoPagadoInput) || 0;
        const parsedRet = parseFloat(retencionesInput) || 0;
        const sum = parsedPaid + parsedRet;
        const percent = totalOriginal > 0 ? (parsedRet / totalOriginal) * 100 : 0;
        const isValid = Math.abs(sum - totalOriginal) < 0.01;

        const handlePaidChange = (val: string) => {
          setMontoPagadoInput(val);
          const num = parseFloat(val);
          if (!isNaN(num)) {
            const calculatedRet = Math.max(0, totalOriginal - num);
            setRetencionesInput(calculatedRet.toFixed(2));
          } else {
            setRetencionesInput("");
          }
        };

        const handleRetChange = (val: string) => {
          setRetencionesInput(val);
          const num = parseFloat(val);
          if (!isNaN(num)) {
            const calculatedPaid = Math.max(0, totalOriginal - num);
            setMontoPagadoInput(calculatedPaid.toFixed(2));
          } else {
            setMontoPagadoInput("");
          }
        };

        return (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)",
            display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100
          }}>
            <div className="glass-container" style={{ maxWidth: "450px", width: "90%", border: "1px solid rgba(192, 132, 252, 0.3)", boxShadow: "0 8px 32px 0 rgba(192, 132, 252, 0.15)", padding: "30px", background: "rgba(15, 23, 42, 0.95)" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{
                  width: "60px", height: "60px", background: "rgba(192, 132, 252, 0.2)",
                  borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 15px auto", border: "1px solid rgba(192, 132, 252, 0.4)"
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <h3 style={{ fontSize: "1.25rem", margin: "0 0 10px 0", color: "#c084fc" }}>Registrar Pago con Retenciones</h3>
                <p style={{ color: "var(--admin-text-muted)", fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
                  Documento: <strong>{activeRetentionQuote.numeroCuentaCobro || activeRetentionQuote.numeroCotizacion}</strong><br/>
                  Cliente: {activeRetentionQuote.client?.nombre}<br/>
                  Total Factura: <strong>{formatCurrency(totalOriginal)}</strong>
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "20px" }}>
                <div className="admin-input-group">
                  <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Monto Neto Recibido (COP)</label>
                  <input 
                    type="number" 
                    step="any"
                    min="0"
                    max={totalOriginal}
                    placeholder="Ej. 96000"
                    value={montoPagadoInput}
                    onChange={(e) => handlePaidChange(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "white",
                      border: "1px solid var(--admin-glass-border)",
                      borderRadius: "8px",
                      outline: "none",
                      fontSize: "15px"
                    }}
                  />
                </div>

                <div className="admin-input-group">
                  <label style={{ fontSize: "14px", color: "var(--admin-text-muted)" }}>Valor de Retención (COP)</label>
                  <input 
                    type="number" 
                    step="any"
                    min="0"
                    max={totalOriginal}
                    placeholder="Ej. 4000"
                    value={retencionesInput}
                    onChange={(e) => handleRetChange(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "white",
                      border: "1px solid var(--admin-glass-border)",
                      borderRadius: "8px",
                      outline: "none",
                      fontSize: "15px"
                    }}
                  />
                </div>

                <div style={{
                  background: isValid ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
                  border: `1px solid ${isValid ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "13px",
                  textAlign: "center"
                }}>
                  <div>
                    Suma: <strong>{formatCurrency(sum)}</strong> de <strong>{formatCurrency(totalOriginal)}</strong>
                  </div>
                  <div style={{ marginTop: "4px", color: isValid ? "#34d399" : "#f87171", fontWeight: "bold" }}>
                    {isValid 
                      ? `Retención Aplicada: ${percent.toFixed(2)}% (Monto cuadra perfectamente)` 
                      : `Falta / Sobra: ${formatCurrency(totalOriginal - sum)}`
                    }
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <ActionButton 
                  className="admin-btn"
                  style={{ background: "#8b5cf6", color: "white", flex: 1, opacity: isValid ? 1 : 0.6 }}
                  disabled={!isValid}
                  onClick={async () => {
                    const res = await markAsPaidWithRetentions(activeRetentionQuote.id, parsedPaid, parsedRet);
                    if (res && res.error) {
                      alert("Error al registrar el pago: " + res.error);
                    } else {
                      setActiveRetentionQuote(null);
                    }
                  }}
                  loadingText="Registrando..."
                >
                  Confirmar Pago
                </ActionButton>
                <button 
                  type="button" 
                  className="admin-btn admin-btn-outline" 
                  style={{ color: "white", borderColor: "rgba(255,255,255,0.4)", flex: 1 }}
                  onClick={() => setActiveRetentionQuote(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
