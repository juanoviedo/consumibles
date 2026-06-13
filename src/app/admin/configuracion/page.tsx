import { getSettings, updateSettings } from "@/app/actions/billing";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <div className="admin-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1>Configuración del Sistema</h1>
          <p style={{ color: "var(--admin-text-muted)", marginTop: "4px" }}>
            Define los parámetros por defecto para la generación de documentos.
          </p>
        </div>
      </div>

      <section className="glass-container" style={{ maxWidth: "600px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Datos de la Empresa e Impresión</h2>
        <form action={updateSettings} className="admin-grid-form">
          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)", display: "block", marginBottom: "6px" }}>
              Nombre de la Empresa (se muestra en PDF)
            </label>
            <input 
              type="text" 
              name="companyName" 
              defaultValue={settings.companyName} 
              required 
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(0,0,0,0.2)",
                color: "white",
                border: "1px solid var(--admin-glass-border)",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
          </div>

          <div className="admin-input-group" style={{ gridColumn: "1 / -1", marginTop: "15px" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)", display: "block", marginBottom: "6px" }}>
              Slogan de la Empresa (se muestra en PDF)
            </label>
            <input 
              type="text" 
              name="companySlogan" 
              defaultValue={settings.companySlogan} 
              required 
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(0,0,0,0.2)",
                color: "white",
                border: "1px solid var(--admin-glass-border)",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
          </div>

          <div className="admin-input-group" style={{ gridColumn: "1 / -1", marginTop: "15px" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)", display: "block", marginBottom: "6px" }}>
              Celular / Teléfono de Contacto (se muestra en PDF)
            </label>
            <input 
              type="text" 
              name="companyPhone" 
              defaultValue={settings.companyPhone} 
              required 
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(0,0,0,0.2)",
                color: "white",
                border: "1px solid var(--admin-glass-border)",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1", margin: "20px 0", borderTop: "1px solid var(--admin-glass-border)" }}></div>

          <h3 style={{ gridColumn: "1 / -1", margin: "0 0 10px 0", fontSize: "16px", fontWeight: "600" }}>Consecutivos de Documentos</h3>

          <div className="admin-input-group" style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)", display: "block", marginBottom: "6px" }}>
              Número Inicial para Primera Cotización (ej: 1, 100, 1000)
            </label>
            <input 
              type="number" 
              name="startQuotationNumber" 
              defaultValue={settings.startQuotationNumber} 
              min="1"
              required 
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(0,0,0,0.2)",
                color: "white",
                border: "1px solid var(--admin-glass-border)",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
            <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", marginTop: "4px", display: "block" }}>
              La primera cotización generada tendrá este número (ej: COT-1000). Las siguientes incrementarán de forma correlativa.
            </span>
          </div>

          <div className="admin-input-group" style={{ gridColumn: "1 / -1", marginTop: "15px" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)", display: "block", marginBottom: "6px" }}>
              Número Inicial para Primera Cuenta de Cobro (ej: 1, 500, 5000)
            </label>
            <input 
              type="number" 
              name="startBillNumber" 
              defaultValue={settings.startBillNumber} 
              min="1"
              required 
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(0,0,0,0.2)",
                color: "white",
                border: "1px solid var(--admin-glass-border)",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
            <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", marginTop: "4px", display: "block" }}>
              La primera cuenta de cobro generada tendrá este número (ej: CC-5000). Las siguientes incrementarán de forma correlativa.
            </span>
          </div>

          <div className="admin-input-group" style={{ gridColumn: "1 / -1", marginTop: "15px" }}>
            <label style={{ fontSize: "14px", color: "var(--admin-text-muted)", display: "block", marginBottom: "6px" }}>
              Instrucciones y Datos Bancarios de Pago (se mostrarán en la Cuenta de Cobro)
            </label>
            <textarea 
              name="bankDetails" 
              defaultValue={settings.bankDetails} 
              rows={4}
              required 
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(0,0,0,0.2)",
                color: "white",
                border: "1px solid var(--admin-glass-border)",
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
            <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", marginTop: "4px", display: "block" }}>
              Ingresa los datos bancarios o instrucciones que se imprimirán en el pie de página de la Cuenta de Cobro.
            </span>
          </div>

          <div style={{ marginTop: "25px", gridColumn: "1 / -1" }}>
            <button type="submit" className="admin-btn">
              Guardar Configuración
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
