"use client";

import { useState, useMemo } from "react";

interface DashboardClientProps {
  quotations: any[];
  products: any[];
  categories: any[];
  clients: any[];
}

export default function DashboardClient({
  quotations,
  products,
  categories,
  clients,
}: DashboardClientProps) {
  // Filter States
  const [dateRangeType, setDateRangeType] = useState<string>("all");
  const [startDateStr, setStartDateStr] = useState<string>("");
  const [endDateStr, setEndDateStr] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Helper to determine the start and end dates based on filter type
  const activeDateRange = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    let start = new Date(0); // Epoch start by default
    let end = new Date(today);

    if (dateRangeType === "last30") {
      const past30 = new Date();
      past30.setDate(today.getDate() - 30);
      past30.setHours(0, 0, 0, 0);
      start = past30;
    } else if (dateRangeType === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      firstDay.setHours(0, 0, 0, 0);
      start = firstDay;
    } else if (dateRangeType === "lastMonth") {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      firstDayLastMonth.setHours(0, 0, 0, 0);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      lastDayLastMonth.setHours(23, 59, 59, 999);
      start = firstDayLastMonth;
      end = lastDayLastMonth;
    } else if (dateRangeType === "last6Months") {
      const past6m = new Date();
      past6m.setDate(today.getDate() - 180);
      past6m.setHours(0, 0, 0, 0);
      start = past6m;
    } else if (dateRangeType === "custom") {
      if (startDateStr) {
        const s = new Date(startDateStr);
        s.setHours(0, 0, 0, 0);
        start = s;
      }
      if (endDateStr) {
        const e = new Date(endDateStr);
        e.setHours(23, 59, 59, 999);
        end = e;
      }
    }

    return { start, end };
  }, [dateRangeType, startDateStr, endDateStr]);

  // Main Filtered Calculations
  const filteredMetrics = useMemo(() => {
    let salesTotal = 0;
    let costTotal = 0;
    let utilityTotal = 0;
    let retencionesTotal = 0;
    let transactionCount = 0;

    // Helper states for groupings
    const monthlySales: Record<string, number> = {};
    const clientSalesMap: Record<string, { nombre: string; total: number }> = {};
    const productSalesMap: Record<string, { nombre: string; total: number; utilidad: number }> = {};
    const documentStateCounts: Record<string, number> = {
      COTIZACION: 0,
      APROBADA: 0,
      RECHAZADA: 0,
      CUENTA_COBRO: 0,
      PAGADA: 0,
    };

    quotations.forEach((q) => {
      // 1. Client Filter
      if (selectedClientId !== "all" && q.clientId !== parseInt(selectedClientId, 10)) {
        return;
      }

      // 2. Date Filter
      const docDate = q.fechaCuentaCobro ? new Date(q.fechaCuentaCobro) : new Date(q.fechaCotizacion);
      if (docDate < activeDateRange.start || docDate > activeDateRange.end) {
        return;
      }

      const isSold = ["CUENTA_COBRO", "PAGADA"].includes(q.estado);

      // 3. Category Filter & Item computations
      let qSales = 0;
      let qCost = 0;
      let qUtil = 0;
      let hasMatchingItem = false;

      q.items.forEach((item: any) => {
        const itemCatId = item.product?.categoryId;
        const matchesCategory = selectedCategoryId === "all" || itemCatId === parseInt(selectedCategoryId, 10);

        if (matchesCategory) {
          hasMatchingItem = true;
          const salesVal = item.cantidad * item.precioUnitario;
          // If cost snapshot is missing, try average cost or default to 0
          const costVal = item.cantidad * (item.costoPromedioUnitario || Number(item.product?.precioPromedioCompra) || 0);
          
          qSales += salesVal;
          qCost += costVal;
          qUtil += (salesVal - costVal);

          // Track product contribution ONLY for sold/billed documents (CUENTA_COBRO, PAGADA)
          if (isSold && item.product?.nombre) {
            const pName = item.product.nombre;
            const pId = item.productId.toString();
            if (!productSalesMap[pId]) {
              productSalesMap[pId] = { nombre: pName, total: 0, utilidad: 0 };
            }
            productSalesMap[pId].total += salesVal;
            productSalesMap[pId].utilidad += (salesVal - costVal);
          }
        }
      });

      // If category filter is active and this quotation has no items matching the category, skip it.
      if (selectedCategoryId !== "all" && !hasMatchingItem) {
        return;
      }

      // Aggregate Document count
      transactionCount++;

      // Count states
      if (documentStateCounts[q.estado] !== undefined) {
        documentStateCounts[q.estado]++;
      }

      // Accumulate metrics for billed documents (CUENTA_COBRO and PAGADA)
      if (["CUENTA_COBRO", "PAGADA"].includes(q.estado)) {
        // If no category filter is active, use the exact database values
        if (selectedCategoryId === "all") {
          salesTotal += q.total;
          costTotal += q.subtotalCosto;
          utilityTotal += q.utilidadTotal;
          if (q.estado === "PAGADA" && q.pagadoConRetenciones) {
            retencionesTotal += Number(q.retenciones || 0);
          }
        } else {
          // If category filter is active, use the calculated item values
          salesTotal += qSales;
          costTotal += qCost;
          utilityTotal += qUtil;
          // Proportionate retention for this category
          if (q.estado === "PAGADA" && q.pagadoConRetenciones && q.total > 0) {
            const retentionRatio = qSales / q.total;
            retencionesTotal += Number(q.retenciones || 0) * retentionRatio;
          }
        }
      }

      // Monthly Grouping (aggregate sales for this quotation)
      const year = docDate.getFullYear();
      const month = String(docDate.getMonth() + 1).padStart(2, "0");
      const monthKey = `${year}-${month}`;
      const salesVolume = selectedCategoryId === "all" ? q.total : qSales;
      if (["CUENTA_COBRO", "PAGADA"].includes(q.estado)) {
        monthlySales[monthKey] = (monthlySales[monthKey] || 0) + salesVolume;
      }

      // Client Accumulation
      if (q.client?.nombre && ["CUENTA_COBRO", "PAGADA"].includes(q.estado)) {
        const cId = q.clientId.toString();
        if (!clientSalesMap[cId]) {
          clientSalesMap[cId] = { nombre: q.client.nombre, total: 0 };
        }
        clientSalesMap[cId].total += selectedCategoryId === "all" ? q.total : qSales;
      }
    });

    // Calculate profitability percentage (Margin and Markup)
    const margenPromedio = salesTotal > 0 ? (utilityTotal / salesTotal) * 100 : 0;
    const markupPromedio = costTotal > 0 ? (utilityTotal / costTotal) * 100 : 0;

    // Convert Monthly sales record to sorted list
    const sortedMonthlySales = Object.entries(monthlySales)
      .map(([key, val]) => ({ month: key, total: val }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // last 6 months that have data

    // Convert Client sales to sorted list
    const topClients = Object.values(clientSalesMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Convert Product sales to list
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    return {
      salesTotal,
      costTotal,
      utilityTotal,
      retencionesTotal,
      margenPromedio,
      markupPromedio,
      transactionCount,
      sortedMonthlySales,
      topClients,
      topProducts,
      documentStateCounts,
    };
  }, [quotations, selectedClientId, selectedCategoryId, activeDateRange]);

  // 4. Stored Inventory Capital computation (always live)
  const totalInventoryCapital = useMemo(() => {
    return products.filter(p => !p.esServicio).reduce((acc, p) => acc + (p.stockActual * Number(p.precioPromedioCompra || 0)), 0);
  }, [products]);

  // Max value calculation for month bar chart scaling
  const maxMonthlySales = useMemo(() => {
    if (filteredMetrics.sortedMonthlySales.length === 0) return 1;
    return Math.max(...filteredMetrics.sortedMonthlySales.map((m) => m.total), 1);
  }, [filteredMetrics.sortedMonthlySales]);

  // Max value calculation for product bar chart scaling
  const maxProductSales = useMemo(() => {
    if (filteredMetrics.topProducts.length === 0) return 1;
    return Math.max(...filteredMetrics.topProducts.map((p) => p.total), 1);
  }, [filteredMetrics.topProducts]);

  // Max client sales for scaling
  const maxClientSales = useMemo(() => {
    if (filteredMetrics.topClients.length === 0) return 1;
    return Math.max(...filteredMetrics.topClients.map((c) => c.total), 1);
  }, [filteredMetrics.topClients]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", width: "100%" }}>
      
      {/* 1. FILTER BAR PANEL */}
      <div className="glass-container" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "16px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--admin-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          Filtros Analíticos
        </h3>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px"
        }}>
          {/* Date Selector */}
          <div className="admin-input-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginBottom: "6px" }}>Periodo de Fecha</label>
            <select
              value={dateRangeType}
              onChange={(e) => setDateRangeType(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(0, 0, 0, 0.3)",
                color: "white",
                border: "1px solid var(--admin-glass-border)",
                borderRadius: "6px",
                outline: "none"
              }}
            >
              <option value="all">Todo el Historial</option>
              <option value="last30">Últimos 30 Días</option>
              <option value="thisMonth">Este Mes</option>
              <option value="lastMonth">Mes Anterior</option>
              <option value="last6Months">Últimos 6 Meses</option>
              <option value="custom">Rango Personalizado</option>
            </select>
          </div>

          {/* Client Filter */}
          <div className="admin-input-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginBottom: "6px" }}>Filtrar por Cliente</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(0, 0, 0, 0.3)",
                color: "white",
                border: "1px solid var(--admin-glass-border)",
                borderRadius: "6px",
                outline: "none"
              }}
            >
              <option value="all">Todos los Clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="admin-input-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginBottom: "6px" }}>Filtrar por Categoría</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(0, 0, 0, 0.3)",
                color: "white",
                border: "1px solid var(--admin-glass-border)",
                borderRadius: "6px",
                outline: "none"
              }}
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {dateRangeType === "custom" && (
          <div style={{
            display: "flex",
            gap: "15px",
            marginTop: "15px",
            paddingTop: "15px",
            borderTop: "1px dashed var(--admin-glass-border)",
            flexWrap: "wrap"
          }}>
            <div className="admin-input-group" style={{ marginBottom: 0, flex: 1, minWidth: "150px" }}>
              <label style={{ fontSize: "12px", color: "var(--admin-text-muted)", marginBottom: "4px" }}>Fecha Inicio</label>
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "white",
                  border: "1px solid var(--admin-glass-border)",
                  borderRadius: "6px",
                  outline: "none"
                }}
              />
            </div>
            <div className="admin-input-group" style={{ marginBottom: 0, flex: 1, minWidth: "150px" }}>
              <label style={{ fontSize: "12px", color: "var(--admin-text-muted)", marginBottom: "4px" }}>Fecha Fin</label>
              <input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "white",
                  border: "1px solid var(--admin-glass-border)",
                  borderRadius: "6px",
                  outline: "none"
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. KPI METRICS GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px"
      }}>
        {/* KPI 1: Ventas */}
        <div className="glass-container" style={{
          padding: "20px",
          borderLeft: "4px solid var(--admin-primary)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          transition: "transform 0.2s",
          cursor: "default"
        }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
          <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Ingresos Billed (CC + Pagadas)</span>
          <span style={{ fontSize: "22px", fontWeight: "bold" }}>{formatCurrency(filteredMetrics.salesTotal)}</span>
          <span style={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>Basado en estado de facturación</span>
        </div>

        {/* KPI 2: Utilidad */}
        <div className="glass-container" style={{
          padding: "20px",
          borderLeft: "4px solid #34d399",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          transition: "transform 0.2s",
          cursor: "default"
        }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
          <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Utilidad Total Proyectada</span>
          <span style={{ fontSize: "22px", fontWeight: "bold", color: "#34d399" }}>{formatCurrency(filteredMetrics.utilityTotal)}</span>
          <span style={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>
            Margen: <strong>{filteredMetrics.margenPromedio.toFixed(1)}%</strong> | Markup: <strong>{filteredMetrics.markupPromedio.toFixed(1)}%</strong>
          </span>
        </div>

        {/* KPI 3: Retenciones */}
        <div className="glass-container" style={{
          padding: "20px",
          borderLeft: "4px solid #c084fc",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          transition: "transform 0.2s",
          cursor: "default"
        }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
          <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Retenciones Deducidas</span>
          <span style={{ fontSize: "22px", fontWeight: "bold", color: "#c084fc" }}>{formatCurrency(filteredMetrics.retencionesTotal)}</span>
          <span style={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>
            Cobrado neto: <strong>{formatCurrency(filteredMetrics.salesTotal - filteredMetrics.retencionesTotal)}</strong>
          </span>
        </div>

        {/* KPI 4: Capital Inventario */}
        <div className="glass-container" style={{
          padding: "20px",
          borderLeft: "4px solid #fbbf24",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          transition: "transform 0.2s",
          cursor: "default"
        }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
          <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Capital en Inventario</span>
          <span style={{ fontSize: "22px", fontWeight: "bold", color: "#fbbf24" }}>{formatCurrency(totalInventoryCapital)}</span>
          <span style={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>Valor de stock almacenado live</span>
        </div>
      </div>

      {/* 3. CHARTS LAYOUT ROW 1: Monthly sales & Top clients */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "25px"
      }}>
        {/* Monthly Sales (Vertical Bar Chart) */}
        <div className="glass-container" style={{ padding: "25px", minHeight: "350px", display: "flex", flexDirection: "column" }}>
          <h4 style={{ fontSize: "15px", margin: "0 0 20px 0", color: "#818cf8" }}>Ventas Mensuales (Últimos 6 meses)</h4>
          {filteredMetrics.sortedMonthlySales.length === 0 ? (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "var(--admin-text-muted)" }}>
              No hay ventas registradas para este periodo.
            </div>
          ) : (
            <div style={{ display: "flex", flex: 1, alignItems: "flex-end", gap: "25px", height: "180px", paddingBottom: "10px", borderBottom: "1px solid var(--admin-glass-border)", margin: "10px 0" }}>
              {filteredMetrics.sortedMonthlySales.map((m) => {
                const heightPercent = (m.total / maxMonthlySales) * 100;
                return (
                  <div key={m.month} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: "8px", position: "relative" }} className="chart-bar-group">
                    {/* Tooltip on Hover */}
                    <div className="bar-tooltip" style={{
                      position: "absolute",
                      bottom: `${heightPercent}%`,
                      background: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid var(--admin-glass-border)",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                      zIndex: 10,
                      opacity: 0,
                      pointerEvents: "none",
                      transition: "opacity 0.2s, transform 0.2s",
                      transform: "translateY(-4px)"
                    }}>
                      <strong>{formatCurrency(m.total)}</strong>
                    </div>

                    {/* Visual Bar */}
                    <div style={{
                      width: "100%",
                      height: `${Math.max(4, heightPercent)}%`,
                      background: "linear-gradient(180deg, var(--admin-primary) 0%, rgba(99, 102, 241, 0.4) 100%)",
                      borderRadius: "6px 6px 0 0",
                      transition: "filter 0.2s",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = "brightness(1.2)";
                      const tooltip = e.currentTarget.parentElement?.querySelector(".bar-tooltip") as HTMLDivElement;
                      if (tooltip) {
                        tooltip.style.opacity = "1";
                        tooltip.style.transform = "translateY(-8px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = "none";
                      const tooltip = e.currentTarget.parentElement?.querySelector(".bar-tooltip") as HTMLDivElement;
                      if (tooltip) {
                        tooltip.style.opacity = "0";
                        tooltip.style.transform = "translateY(-4px)";
                      }
                    }}
                    ></div>

                    {/* Month Label */}
                    <span style={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Clients Ranking (Progress bars) */}
        <div className="glass-container" style={{ padding: "25px", minHeight: "350px", display: "flex", flexDirection: "column" }}>
          <h4 style={{ fontSize: "15px", margin: "0 0 20px 0", color: "#34d399" }}>Top 5 Clientes con Mayores Compras</h4>
          {filteredMetrics.topClients.length === 0 ? (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "var(--admin-text-muted)" }}>
              No hay compras registradas en este periodo.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px", flex: 1 }}>
              {filteredMetrics.topClients.map((c, index) => {
                const widthPercent = (c.total / maxClientSales) * 100;
                return (
                  <div key={index} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <strong>{c.nombre}</strong>
                      <span style={{ color: "var(--admin-text-muted)" }}>{formatCurrency(c.total)}</span>
                    </div>
                    {/* Bar Container */}
                    <div style={{ height: "10px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        width: `${widthPercent}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #34d399 0%, #059669 100%)",
                        borderRadius: "4px"
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. CHARTS LAYOUT ROW 2: Category sales & Document stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "25px"
      }}>
        {/* Product Breakdown (Horizontal Bar chart) */}
        <div className="glass-container" style={{ padding: "25px", minHeight: "350px", display: "flex", flexDirection: "column" }}>
          <h4 style={{ fontSize: "15px", margin: "0 0 20px 0", color: "#fbbf24" }}>Top Productos más Vendidos (Ventas y Margen)</h4>
          {filteredMetrics.topProducts.length === 0 ? (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "var(--admin-text-muted)" }}>
              No hay ventas asociadas a productos en este periodo.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", flex: 1 }}>
              {filteredMetrics.topProducts.map((p, index) => {
                const widthPercent = (p.total / maxProductSales) * 100;
                const marginPercent = p.total > 0 ? (p.utilidad / p.total) * 100 : 0;
                return (
                  <div key={index} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", alignItems: "center" }}>
                      <strong style={{ maxWidth: "55%", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={p.nombre}>{p.nombre}</strong>
                      <span style={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>
                        Ventas: {formatCurrency(p.total)} (Margen: <strong style={{ color: "#34d399" }}>{marginPercent.toFixed(1)}%</strong>)
                      </span>
                    </div>
                    {/* Bar Container */}
                    <div style={{ height: "8px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        width: `${widthPercent}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #fbbf24 0%, #d97706 100%)",
                        borderRadius: "4px"
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Document Status distribution */}
        <div className="glass-container" style={{ padding: "25px", minHeight: "350px", display: "flex", flexDirection: "column" }}>
          <h4 style={{ fontSize: "15px", margin: "0 0 20px 0", color: "#f43f5e" }}>Volumen de Documentos por Estado</h4>
          {filteredMetrics.transactionCount === 0 ? (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "var(--admin-text-muted)" }}>
              No hay documentos registrados para este periodo.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", justifyContent: "center", flex: 1 }}>
              {Object.entries(filteredMetrics.documentStateCounts).map(([state, count]) => {
                const pct = filteredMetrics.transactionCount > 0 ? (count / filteredMetrics.transactionCount) * 100 : 0;
                
                // Color mapping
                let barColor = "var(--admin-primary)";
                if (state === "COTIZACION") barColor = "rgba(129, 140, 248, 0.8)";
                else if (state === "APROBADA") barColor = "#3b82f6";
                else if (state === "RECHAZADA") barColor = "#ef4444";
                else if (state === "CUENTA_COBRO") barColor = "#fbbf24";
                else if (state === "PAGADA") barColor = "#10b981";

                return (
                  <div key={state} style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ width: "130px", fontSize: "12px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      <strong>{state === "CUENTA_COBRO" ? "CUENTA DE COBRO" : state}</strong>
                    </div>
                    
                    <div style={{ flex: 1, height: "14px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
                      <div style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: barColor,
                        borderRadius: "6px"
                      }}></div>
                    </div>

                    <div style={{ width: "65px", fontSize: "12px", textAlign: "right", color: "var(--admin-text-muted)" }}>
                      {count} ({pct.toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
