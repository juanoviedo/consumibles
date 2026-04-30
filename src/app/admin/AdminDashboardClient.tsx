"use client";
import { useState } from "react";
import AdminClient from "./AdminClient";
import AdminCategories from "./AdminCategories";

export default function AdminDashboardClient({ products, categories }: { products: any[], categories: any[] }) {
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");

  return (
    <>
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button 
          onClick={() => setActiveTab("products")}
          className={`admin-btn ${activeTab === "products" ? "" : "admin-btn-outline"}`}
          style={{ padding: "10px 20px" }}
        >
          Gestionar Productos
        </button>
        <button 
          onClick={() => setActiveTab("categories")}
          className={`admin-btn ${activeTab === "categories" ? "" : "admin-btn-outline"}`}
          style={{ padding: "10px 20px" }}
        >
          Gestionar Categorías
        </button>
      </div>

      {activeTab === "products" && <AdminClient products={products} categories={categories} />}
      {activeTab === "categories" && <AdminCategories categories={categories} />}
    </>
  );
}
