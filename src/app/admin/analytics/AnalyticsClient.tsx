"use client";

import { useState, useEffect } from "react";
import { getAnalyticsStatsAction } from "@/app/actions/analytics";

export default function AnalyticsClient() {
  const [range, setRange] = useState("last7days");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchStats = async (selectedRange: string) => {
    setLoading(true);
    try {
      const stats = await getAnalyticsStatsAction(selectedRange);
      setData(stats);
    } catch (err) {
      console.error("Error al cargar analítica:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(range);
  }, [range]);

  const formatSeconds = (sec: number) => {
    if (!sec) return "0s";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div style={{ padding: "20px", color: "var(--admin-text-main, #1e293b)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700", margin: 0, color: "#8b0500" }}>
            Analítica Web Propia
          </h1>
          <p style={{ color: "#64748b", margin: "5px 0 0 0", fontSize: "0.95rem" }}>
            Estadísticas reales de consumo de consumiblescali.com (Tráfico de administradores excluido).
          </p>
        </div>

        {/* Range Selector */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#fff",
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "#334155",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="last7days">Últimos 7 días</option>
            <option value="last30days">Últimos 30 días</option>
            <option value="thisMonth">Este mes</option>
            <option value="lastMonth">Mes anterior</option>
            <option value="all">Todo el histórico</option>
          </select>
          <button
            onClick={() => fetchStats(range)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              background: "#8b0500",
              color: "#fff",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
          <p style={{ fontSize: "1.1rem" }}>Cargando estadísticas de analítica...</p>
        </div>
      ) : !data ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#ef4444" }}>
          <p>No se pudieron obtener los datos de analítica.</p>
        </div>
      ) : (
        <>
          {/* Main KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "25px" }}>
            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", borderLeft: "4px solid #8b0500" }}>
              <span style={{ color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "700" }}>Visitantes Únicos</span>
              <h2 style={{ fontSize: "2rem", margin: "8px 0 0 0", color: "#0f172a" }}>{data.summary.totalVisitors}</h2>
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", borderLeft: "4px solid #0284c7" }}>
              <span style={{ color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "700" }}>Sesiones Totales</span>
              <h2 style={{ fontSize: "2rem", margin: "8px 0 0 0", color: "#0f172a" }}>{data.summary.totalSessions}</h2>
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", borderLeft: "4px solid #16a34a" }}>
              <span style={{ color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "700" }}>Páginas Vistas</span>
              <h2 style={{ fontSize: "2rem", margin: "8px 0 0 0", color: "#0f172a" }}>{data.summary.totalPageViews}</h2>
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", borderLeft: "4px solid #8b5cf6" }}>
              <span style={{ color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "700" }}>Páginas / Sesión</span>
              <h2 style={{ fontSize: "2rem", margin: "8px 0 0 0", color: "#0f172a" }}>{data.summary.pagesPerSession}</h2>
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", borderLeft: "4px solid #ea580c" }}>
              <span style={{ color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "700" }}>Duración Promedio</span>
              <h2 style={{ fontSize: "2rem", margin: "8px 0 0 0", color: "#0f172a" }}>{formatSeconds(data.summary.avgDuration)}</h2>
            </div>
          </div>

          {/* Ecommerce KPI Section */}
          <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "15px", color: "#334155" }}>
            Eventos Ecommerce y Conversión
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px", marginBottom: "30px" }}>
            <div style={{ background: "#ecfdf5", padding: "20px", borderRadius: "12px", border: "1px solid #a7f3d0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#047857", fontWeight: "700", fontSize: "0.9rem" }}>Clics en WhatsApp</span>
                <span style={{ fontSize: "1.2rem" }}>💬</span>
              </div>
              <h2 style={{ fontSize: "2.2rem", margin: "10px 0 0 0", color: "#065f46" }}>{data.ecommerce.whatsappClicksCount}</h2>
            </div>

            <div style={{ background: "#eff6ff", padding: "20px", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#1d4ed8", fontWeight: "700", fontSize: "0.9rem" }}>Añadidos al Carrito</span>
                <span style={{ fontSize: "1.2rem" }}>🛒</span>
              </div>
              <h2 style={{ fontSize: "2.2rem", margin: "10px 0 0 0", color: "#1e40af" }}>{data.ecommerce.addToCartCount}</h2>
            </div>

            <div style={{ background: "#fef3c7", padding: "20px", borderRadius: "12px", border: "1px solid #fde68a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#b45309", fontWeight: "700", fontSize: "0.9rem" }}>Visualizaciones Producto</span>
                <span style={{ fontSize: "1.2rem" }}>👁️</span>
              </div>
              <h2 style={{ fontSize: "2.2rem", margin: "10px 0 0 0", color: "#92400e" }}>{data.ecommerce.productViewsCount}</h2>
            </div>
          </div>

          {/* Detailed Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
            {/* Top Pages */}
            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "1.1rem", margin: "0 0 15px 0", color: "#0f172a" }}>Páginas Más Visitadas</h3>
              {data.pages.topPages.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Sin datos registrados aún.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {data.pages.topPages.map((p: any, idx: number) => (
                    <li key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.9rem" }}>
                      <span style={{ fontWeight: "600", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "230px" }}>{p.name}</span>
                      <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>{p.count} vistas</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Geography (Cities & Countries) */}
            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "1.1rem", margin: "0 0 15px 0", color: "#0f172a" }}>Ubicación Geográfica (Ciudades)</h3>
              {data.geography.cities.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Sin datos de ubicación registrados.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {data.geography.cities.map((c: any, idx: number) => (
                    <li key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.9rem" }}>
                      <span style={{ color: "#334155", fontWeight: "500" }}>{c.name}</span>
                      <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>{c.count} visitas</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Technology (Devices, OS, Browsers) */}
            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "1.1rem", margin: "0 0 15px 0", color: "#0f172a" }}>Dispositivos y Navegadores</h3>
              <div style={{ marginBottom: "15px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>Dispositivo</span>
                <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                  {data.technology.devices.map((d: any, idx: number) => (
                    <div key={idx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 12px", borderRadius: "8px", flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "capitalize" }}>{d.name}</div>
                      <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "1.1rem" }}>{d.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>Sistemas Operativos</span>
                <ul style={{ listStyle: "none", padding: 0, margin: "5px 0 0 0" }}>
                  {data.technology.os.map((o: any, idx: number) => (
                    <li key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.85rem" }}>
                      <span style={{ color: "#334155" }}>{o.name}</span>
                      <span style={{ fontWeight: "600", color: "#475569" }}>{o.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Traffic Sources & Referrers */}
            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "1.1rem", margin: "0 0 15px 0", color: "#0f172a" }}>Fuentes de Tráfico (Referrers)</h3>
              {data.traffic.referrers.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Tráfico directo o sin referrers.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {data.traffic.referrers.map((r: any, idx: number) => (
                    <li key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.9rem" }}>
                      <span style={{ color: "#334155", fontWeight: "500" }}>{r.name}</span>
                      <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>{r.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Exclusion Diagnostic Footer Badge */}
          <div style={{ marginTop: "30px", padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748b" }}>
            <span>🔒 <strong>Exclusión Automática Activa:</strong> El sistema detecta y filtra retroactivamente la IP de los administradores mediante SHA-256 hash.</span>
            <span style={{ background: "#fee2e2", color: "#991b1b", padding: "3px 8px", borderRadius: "12px", fontWeight: "700", fontSize: "0.8rem" }}>
              {data.summary.excludedSessionsCount} sesiones excluidas
            </span>
          </div>
        </>
      )}
    </div>
  );
}
