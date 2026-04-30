"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

export default function AdminSidebarClient({ 
  children, 
  email, 
  isSuperAdmin 
}: { 
  children: React.ReactNode, 
  email: string, 
  isSuperAdmin: boolean 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  // If we are exactly on the login page, don't show the sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="admin-layout-wrapper">
      {/* Mobile Toggle Button */}
      <button className="admin-mobile-toggle" onClick={toggleSidebar}>
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        )}
      </button>

      {/* Overlay for mobile */}
      <div className={`sidebar-overlay ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(false)}></div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <h2>Panel de Control</h2>
          <p style={{ color: "var(--admin-text-muted)", fontSize: "12px", marginTop: "5px", wordBreak: "break-all" }}>{email}</p>
        </div>
        
        <nav className="admin-sidebar-nav">
          <a href="/admin" className={`admin-nav-item ${pathname === "/admin" ? "active" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            Productos
          </a>
          <a href="/admin/categorias" className={`admin-nav-item ${pathname === "/admin/categorias" ? "active" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            Categorías
          </a>
          
          <a href="/admin/users" className={`admin-nav-item ${pathname === "/admin/users" ? "active" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Administradores
          </a>

          <a href="/admin/perfil" className={`admin-nav-item ${pathname === "/admin/perfil" ? "active" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Mi Perfil
          </a>

          <div style={{ borderTop: "1px solid var(--admin-glass-border)", paddingTop: "10px", marginTop: "10px" }}>
            <form action={logoutAction}>
              <button type="submit" className="admin-nav-item" style={{ width: "100%", background: "transparent", border: "none", textAlign: "left", cursor: "pointer", fontSize: "1rem", color: "#ef4444" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Cerrar Sesión
              </button>
            </form>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content-area">
        <div className="admin-dashboard" style={{ padding: 0, maxWidth: "1200px", margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
