import { getProducts } from "@/app/actions/product";
import { getCategories } from "@/app/actions/category";
import { getQuotations, getClients } from "@/app/actions/billing";
import DashboardClient from "./DashboardClient";

export default async function AdminDashboardPage() {
  const quotations = await getQuotations();
  const products = await getProducts();
  const categories = await getCategories();
  const clients = await getClients();

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Dashboard de Administración</h1>
          <p style={{ color: "var(--admin-text-muted)", marginTop: "8px" }}>Resumen financiero, métricas de rendimiento y estadísticas generales.</p>
        </div>
      </div>

      <DashboardClient 
        quotations={quotations} 
        products={products} 
        categories={categories} 
        clients={clients} 
      />
    </>
  );
}
