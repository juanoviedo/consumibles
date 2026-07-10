import { Suspense } from "react";
import { getQuotations, getClients, getSettings } from "@/app/actions/billing";
import { getProducts } from "@/app/actions/product";
import QuotationsClient from "./QuotationsClient";

export default async function CotizacionesPage() {
  const quotations = await getQuotations();
  const clients = await getClients();
  const products = await getProducts();
  const settings = await getSettings();

  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px", color: "var(--admin-text-muted)" }}>
        Cargando cotizaciones...
      </div>
    }>
      <QuotationsClient 
        quotations={quotations} 
        clients={clients} 
        products={products} 
        settings={settings}
      />
    </Suspense>
  );
}
