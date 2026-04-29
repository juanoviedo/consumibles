"use client";

import { useState, useEffect } from "react";

export default function StoreFront({ products }: { products: any[] }) {
  const [carrito, setCarrito] = useState<Record<string, { nombre: string; precio: number; cantidad: number }>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(8);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Lazy loading by scroll
  useEffect(() => {
    const handleScroll = () => {
      // Si el cliente está a menos de 400px del final de la página, cargar más productos
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 400) {
        setVisibleCount((prev) => prev + 6);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descripcion1 && p.descripcion1.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const CONFIG = {
    telefono: "573332782483",
    mensajeCabecera: "¡Hola! Quisiera realizar el siguiente pedido:\n\n",
  };

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

  const ControlCantidad = ({ nombre, codigo, precio }: { nombre: string; codigo: string; precio: number }) => {
    const cantidad = carrito[codigo]?.cantidad || 0;
    return (
      <div className="control-cantidad">
        <button className="btn-menos" onClick={() => modificarCantidad(codigo, nombre, precio, -1)}>-</button>
        <div className="indicador-carrito">
          <i className="icon-basket"></i> <span className="cantidad-producto">{cantidad}</span>
        </div>
        <button className="btn-mas" onClick={() => modificarCantidad(codigo, nombre, precio, 1)}>+</button>
      </div>
    );
  };

  return (
    <>
      <br></br>
      <br></br>
      <br></br>
      <h2 className="products-title">Nuestro Catálogo</h2>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar equipo, repuesto, código..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setVisibleCount(8); // Resetear visibilidad al buscar
          }}
        />
      </div>

      <div className="products-grid">
        {filteredProducts.length === 0 ? (
          <p className="no-results">No se encontraron resultados para "{searchTerm}"</p>
        ) : (
          visibleProducts.map((p) => (
            <div key={p.id} className="product-card">
              <div className="img-container">
                <img src={p.imagenUrl} alt={p.nombre} />
              </div>
              <div className="card-body">
                <h2>{p.nombre}</h2>
                <p className="codigo-ref">Ref: {p.codigo}</p>
                <p className="precio">{formatearMoneda(p.precio)}</p>

                <div className="desc">
                  <p>{p.descripcion1}</p>
                  {p.descripcion2 && <p>{p.descripcion2}</p>}
                </div>

                <ControlCantidad nombre={p.nombre} codigo={p.codigo} precio={p.precio} />

                <a target="_blank" href={`https://wa.me/573168314501?text=Hola.%20Necesito%20mas%20info%20sobre%20${encodeURIComponent(p.nombre)}`} className="cuadrolink">
                  <div className="cuadrodentro">¡Consultar ahora!</div>
                </a>
              </div>
            </div>
          ))
        )}
      </div>



      <div className="btn-flotante-carrito" onClick={() => setIsCartOpen(!isCartOpen)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "white" }}>
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        {totalItems > 0 && <span className="badge-carrito">{totalItems}</span>}
      </div>

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
