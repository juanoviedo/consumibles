import React, { useState, useEffect } from 'react';

export default function ExpertSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check localStorage to see if user has already dismissed the section
    const dismissed = localStorage.getItem("dismissed_expert_section");
    if (dismissed !== "true") {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("dismissed_expert_section", "true");
  };

  if (!isVisible) return null;

  return (
    <section className="expert-trust-section" style={{
      maxWidth: "1200px",
      margin: "20px auto 30px auto",
      padding: "0 15px",
      boxSizing: "border-box"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid rgba(139, 5, 0, 0.12)",
        boxShadow: "0 10px 30px rgba(139, 5, 0, 0.05)",
        overflow: "hidden",
        position: "relative"
      }}>
        {/* Top Accent line */}
        <div style={{
          height: "6px",
          background: "linear-gradient(90deg, #8b0500, #dc2626)",
          width: "100%"
        }} />

        {/* Close Button */}
        <button 
          onClick={handleClose}
          title="Cerrar esta ventana"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(0, 0, 0, 0.05)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#71717a",
            transition: "all 0.2s",
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(139, 5, 0, 0.1)";
            e.currentTarget.style.color = "#8b0500";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 0, 0, 0.05)";
            e.currentTarget.style.color = "#71717a";
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div style={{
          padding: "30px 25px",
          display: "flex",
          flexDirection: "column",
          gap: "25px"
        }}>
          {/* Header row with Avatar & Title */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
            paddingRight: "40px" // prevent collision with close button
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(139, 5, 0, 0.08)",
              border: "2px solid #8b0500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              boxShadow: "0 4px 10px rgba(139, 5, 0, 0.15)"
            }}>
              👨‍🔧
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: "1.6em",
                color: "#18181b",
                fontWeight: "bold"
              }}>
                ¿Necesitas Soporte Técnico Especializado?
              </h2>
              <p style={{
                margin: "4px 0 0 0",
                fontSize: "1.05em",
                color: "#8b0500",
                fontWeight: "700"
              }}>
                Asesoría Técnica Gratuita con tu Compra de Consumibles
              </p>
            </div>
          </div>

          {/* Core Biography and Info */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "10px"
          }}>
            {/* Bio Column */}
            <div style={{
              background: "rgba(244, 244, 245, 0.5)",
              border: "1px solid rgba(0, 0, 0, 0.05)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <h3 style={{ margin: 0, color: "#18181b", fontSize: "1.2em", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🇧🇷</span> Capacitación y Experiencia
              </h3>
              <p style={{ margin: 0, color: "#4b5563", fontSize: "0.95em", lineHeight: "1.6" }}>
                Soy experto calificado en sistemas de corte por plasma, entrenado y capacitado directamente en la sede de <strong>Hypertherm en Guarulhos - Brasil</strong>. Cuento con certificación oficial para operar y optimizar equipos <strong>MaxPro 200</strong> y toda la línea de antorchas y sistemas <strong>Hypertherm PowerMax</strong>.
              </p>
              <p style={{ margin: 0, color: "#4b5563", fontSize: "0.95em", lineHeight: "1.6" }}>
                Además, tengo amplio recorrido práctico en la industria metalmecánica: fui parte del equipo que construyó y ensambló las reconocidas mesas de corte CNC <strong>Practicut</strong>.
              </p>
            </div>

            {/* Benefit Column */}
            <div style={{
              background: "rgba(139, 5, 0, 0.03)",
              border: "1px solid rgba(139, 5, 0, 0.15)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <h3 style={{ margin: 0, color: "#8b0500", fontSize: "1.2em", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📞</span> Asesoría Telefónica Directa
              </h3>
              <p style={{ margin: 0, color: "#4b5563", fontSize: "0.95em", lineHeight: "1.6" }}>
                Actualmente asesoro telefónicamente a múltiples talleres en Colombia, ahorrándoles millones de pesos en costosas visitas técnicas. Mi objetivo es transferirte este conocimiento para que <strong>conozcas a fondo tu propia máquina</strong>, logres operarla de forma óptima y puedas tú mismo realizar reparaciones, modificaciones y mejoras en tu producción.
              </p>
              <div style={{
                background: "#fff",
                border: "1px solid rgba(139, 5, 0, 0.15)",
                borderRadius: "8px",
                padding: "12px",
                marginTop: "4px"
              }}>
                <h4 style={{ margin: "0 0 4px 0", color: "#18181b", fontSize: "0.95em", fontWeight: "bold" }}>
                  💡 ¿Cómo acceder a esta asesoría gratuita?
                </h4>
                <p style={{ margin: 0, color: "#4b5563", fontSize: "0.9em", lineHeight: "1.5" }}>
                  Solo debes realizar compras acumuladas de <strong>mínimo $500.000 COP al año</strong> en nuestros consumibles. Automáticamente adquieres el derecho a soporte técnico telefónico sin ningún costo adicional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
