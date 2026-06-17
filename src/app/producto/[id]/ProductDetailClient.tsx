"use client";

import { useState, useEffect } from "react";

export default function ProductDetailClient({ product }: { product: any }) {
  const [carrito, setCarrito] = useState<Record<string, { nombre: string; precio: number; cantidad: number }>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("consumibles_cart");
    if (savedCart) {
      try {
        setCarrito(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error loading cart:", e);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (Object.keys(carrito).length > 0 || localStorage.getItem("consumibles_cart")) {
      localStorage.setItem("consumibles_cart", JSON.stringify(carrito));
    }
  }, [carrito]);

  const modificarCantidad = (codigo: string, nombre: string, precio: number, cambio: number) => {
    setCarrito((prev) => {
      const nuevoCarrito = { ...prev };
      if (!nuevoCarrito[codigo]) {
        nuevoCarrito[codigo] = { nombre, precio, cantidad: cambio };
      } else {
        nuevoCarrito[codigo] = {
          ...nuevoCarrito[codigo],
          cantidad: nuevoCarrito[codigo].cantidad + cambio,
        };
      }

      if (nuevoCarrito[codigo].cantidad <= 0) {
        delete nuevoCarrito[codigo];
      }
      return nuevoCarrito;
    });
  };

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const vaciarCarrito = () => setCarrito({});

  const CONFIG = {
    telefono: "573332782483",
    mensajeCabecera: "¡Hola! Quisiera realizar el siguiente pedido:\n\n",
  };

  const enviarWhatsApp = () => {
    let textoPedido = CONFIG.mensajeCabecera;
    let totalFinal = 0;

    Object.keys(carrito).forEach((codigo) => {
      const item = carrito[codigo];
      const subtotal = item.cantidad * item.precio;
      totalFinal += subtotal;
      textoPedido += `${item.cantidad} x ${item.nombre} (Ref: ${codigo}) - ${formatearMoneda(subtotal)}\n`;
    });

    textoPedido += `\nTOTAL: ${formatearMoneda(totalFinal)}`;
    window.open(`https://wa.me/${CONFIG.telefono}?text=${encodeURIComponent(textoPedido)}`, "_blank");
  };

  let totalItems = 0;
  let totalPrecio = 0;
  Object.keys(carrito).forEach((k) => {
    totalItems += carrito[k].cantidad;
    totalPrecio += carrito[k].cantidad * carrito[k].precio;
  });

  // Close cart on click outside
  useEffect(() => {
    if (!isCartOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const cartEl = document.getElementById("carrito-flotante");
      const btnEl = document.querySelector(".btn-flotante-carrito");
      const target = event.target as HTMLElement;
      
      if (
        cartEl && 
        !cartEl.contains(target) &&
        btnEl &&
        !btnEl.contains(target) &&
        !target.closest(".control-cantidad")
      ) {
        setIsCartOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isCartOpen]);

  const ControlCantidad = ({ nombre, codigo, precio }: { nombre: string; codigo: string; precio: number }) => {
    const cantidad = carrito[codigo]?.cantidad || 0;
    return (
      <div className="control-cantidad" onClick={(e) => e.stopPropagation()}>
        <button className="btn-menos" onClick={() => modificarCantidad(codigo, nombre, precio, -1)}>-</button>
        <div className="indicador-carrito">
          <i className="icon-basket"></i> <span className="cantidad-producto">{cantidad}</span>
        </div>
        <button className="btn-mas" onClick={() => modificarCantidad(codigo, nombre, precio, 1)}>+</button>
      </div>
    );
  };

  const ProductImageGallery = ({ imagenes, nombre }: { imagenes: string[], nombre: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!imagenes || imagenes.length === 0) return (
       <div className="img-container"><img src="" alt={nombre} /></div>
    );
    if (imagenes.length === 1) {
      return (
        <div className="img-container">
          <img src={imagenes[0]} alt={nombre} />
        </div>
      );
    }

    const nextImage = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % imagenes.length);
    };

    const prevImage = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
    };

    return (
      <div className="img-container" style={{ position: "relative" }}>
        <img src={imagenes[currentIndex]} alt={`${nombre} - ${currentIndex + 1}`} />
        
        <button 
          onClick={prevImage}
          style={{ position: "absolute", left: "5px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
        >
          &#10094;
        </button>
        <button 
          onClick={nextImage}
          style={{ position: "absolute", right: "5px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
        >
          &#10095;
        </button>
        
        <div style={{ position: "absolute", bottom: "5px", display: "flex", gap: "4px", left: "50%", transform: "translateX(-50%)" }}>
          {imagenes.map((_, i) => (
            <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i === currentIndex ? "#8b0500" : "rgba(0,0,0,0.3)" }} />
          ))}
        </div>
      </div>
    );
  };

  const images = [product.imagenUrl, ...(product.galeria || [])].filter(Boolean);

  return (
    <>
      <div style={{ maxWidth: "600px", margin: "80px auto 40px auto", padding: "0 20px", boxSizing: "border-box" }}>
        {/* Back Link */}
        <div style={{ marginBottom: "20px" }}>
          <a href="/" style={{ color: "#8b0500", textDecoration: "none", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px", fontSize: "15px" }}>
            &larr; Volver al Catálogo
          </a>
        </div>

        {/* Premium Detail Card Container */}
        <div style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid rgba(139, 5, 0, 0.08)",
          boxShadow: "0 4px 25px rgba(0,0,0,0.05)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Brand Top Bar */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "5px",
            background: "linear-gradient(90deg, #8b0500, #dc2626)",
            width: "100%"
          }} />

          {/* Reference & Badges */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
              Ref: {product.codigo}
            </span>

            {product.descuentoAplicado && (
              <div style={{
                background: "linear-gradient(135deg, #8b0500, #dc2626)",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "20px",
                boxShadow: "0 4px 6px rgba(139, 5, 0, 0.2)",
                letterSpacing: "0.5px"
              }}>
                {product.descuentoAplicado.tipo === "Porcentaje" ? `-${product.descuentoAplicado.valor}%` : `-${formatearMoneda(product.descuentoAplicado.valor)}`} OFF
              </div>
            )}
          </div>

          {/* Gallery Component */}
          <div style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            background: "#f8fafc",
            borderRadius: "16px",
            padding: "16px",
            boxSizing: "border-box",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ width: "100%", maxWidth: "320px" }}>
              <ProductImageGallery imagenes={images} nombre={product.nombre} />
            </div>
          </div>

          {/* Title, Stock & Price */}
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#0f172a", margin: "0 0 12px 0", lineHeight: "1.2" }}>
              {product.nombre}
            </h1>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ 
                fontSize: "10px", 
                color: product.stockActual > 0 ? "#71717a" : "#dc2626", 
                fontWeight: "700", 
                background: product.stockActual > 0 ? "rgba(0, 0, 0, 0.04)" : "rgba(220, 38, 38, 0.05)",
                border: product.stockActual > 0 ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(220, 38, 38, 0.15)",
                padding: "3px 8px",
                borderRadius: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                {product.stockActual > 0 ? `Disponible: ${product.stockActual} u.` : "Agotado"}
              </div>
            </div>

            {/* Price Tags */}
            {product.descuentoAplicado ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                <span style={{ fontSize: "2rem", fontWeight: "800", color: "#dc2626" }}>
                  {formatearMoneda(product.precioFinal)}
                </span>
                <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "1.1rem" }}>
                  {formatearMoneda(product.precioBase)}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: "2rem", fontWeight: "800", color: "#8b0500" }}>
                {formatearMoneda(product.precioBase)}
              </span>
            )}
          </div>

          {/* Descriptions & Specs */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
            <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
              Especificaciones y Descripción
            </h3>
            <p style={{ fontSize: "15px", color: "#475569", lineHeight: "1.6", margin: "0 0 16px 0" }}>
              {product.descripcion1}
            </p>
            {product.descripcion2 && (
              <p style={{ fontSize: "15px", color: "#475569", lineHeight: "1.6", margin: "0" }}>
                {product.descripcion2}
              </p>
            )}
          </div>

          {/* Quantity and Cart Buttons */}
          <div style={{
            borderTop: "1px solid #e2e8f0",
            paddingTop: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "10px"
          }}>
            <span style={{ fontSize: "15px", fontWeight: "600", color: "#475569" }}>Cantidad:</span>
            <ControlCantidad 
              nombre={product.nombre} 
              codigo={product.codigo} 
              precio={product.descuentoAplicado ? product.precioFinal : product.precioBase} 
            />
          </div>
        </div>
      </div>

      {/* Floating Cart Icon */}
      <div className="btn-flotante-carrito" onClick={() => setIsCartOpen(!isCartOpen)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "white" }}>
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        {totalItems > 0 && <span className="badge-carrito">{totalItems}</span>}
      </div>

      {/* Floating Cart Drawer */}
      <div id="carrito-flotante" className={isCartOpen ? "" : "carrito-oculto"}>
        <h3>Tu Pedido</h3>
        <ul id="lista-items">
          {Object.keys(carrito).map((codigo) => (
            <li key={codigo}>
              <span>{carrito[codigo].cantidad}x {carrito[codigo].nombre}</span>
              <span>{formatearMoneda(carrito[codigo].cantidad * carrito[codigo].precio)}</span>
            </li>
          ))}
        </ul>
        <p>
          <strong>Total items:</strong> <span id="total-items">{totalItems}</span>
        </p>
        {totalItems > 0 && <p><strong>Total Precio:</strong> <span id="total-precio">{formatearMoneda(totalPrecio)}</span></p>}
        <button id="btn-enviar-whatsapp" onClick={enviarWhatsApp}>
          Pedir por WhatsApp
        </button>
        <button id="btn-vaciar" onClick={vaciarCarrito}>
          Vaciar Carrito
        </button>
      </div>
    </>
  );
}
