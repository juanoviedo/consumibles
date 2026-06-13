import { getQuotations, getClients, getSettings } from "@/app/actions/billing";
import { getProducts } from "@/app/actions/product";
import QuotationsClient from "./QuotationsClient";

export default async function CotizacionesPage() {
  const quotations = await getQuotations();
  const clients = await getClients();
  const products = await getProducts();
  const settings = await getSettings();

  return (
    <QuotationsClient 
      quotations={quotations} 
      clients={clients} 
      products={products} 
      settings={settings}
    />
  );
}
