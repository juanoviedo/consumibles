// gsap animations
var animation = gsap.timeline();
animation
    // .from('.lineasdenegocio', { opacity: 0, duration: 1, ease: "back.out(1.7)", x: -100 }, "+=0.4")
    .from('.btn-whatsapp', { duration: 2.4, ease: "bounce.out", y: -900})


    document.addEventListener('DOMContentLoaded', () => {
        const CONFIG = Object.freeze({
            telefono: "573168314501",
            mensajeCabecera: "¡Hola! Quisiera realizar el siguiente pedido:\n\n"
        });
    
        let carrito = {};
    
        const listaHtml = document.getElementById('lista-items');
        const totalItemsHtml = document.getElementById('total-items');
        const totalPrecioHtml = document.getElementById('total-precio');
        const carritoDiv = document.getElementById('carrito-flotante');
    
        const formatearMoneda = (valor) => {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency', currency: 'COP', minimumFractionDigits: 0
            }).format(valor);
        };
    
        const actualizarInterfazGlobal = () => {
            listaHtml.innerHTML = '';
            let totalUnidades = 0;
            let granTotalDinero = 0;
    
            Object.keys(carrito).forEach(codigo => {
                const item = carrito[codigo];
                if (item.cantidad > 0) {
                    const subtotal = item.cantidad * item.precio;
                    granTotalDinero += subtotal;
                    totalUnidades += item.cantidad;
    
                    const li = document.createElement('li');
                    li.innerHTML = `<span>${item.cantidad}x ${item.nombre}</span> <span>${formatearMoneda(subtotal)}</span>`;
                    listaHtml.appendChild(li);
                }
            });
    
            totalItemsHtml.textContent = totalUnidades;
            totalPrecioHtml.textContent = formatearMoneda(granTotalDinero);
            
            // Mostrar/Ocultar carrito flotante
            totalUnidades > 0 ? carritoDiv.classList.remove('carrito-oculto') : carritoDiv.classList.add('carrito-oculto');
        };
    
        // Lógica para los botones + y -
        document.querySelectorAll('.control-cantidad').forEach(contenedor => {
            const btnMas = contenedor.querySelector('.btn-mas');
            const btnMenos = contenedor.querySelector('.btn-menos');
            const visorCantidad = contenedor.querySelector('.cantidad-producto');
            
            const nombre = contenedor.getAttribute('data-nombre');
            const codigo = contenedor.getAttribute('data-codigo');
            const precio = parseInt(contenedor.getAttribute('data-precio'));
    
            const modificarCantidad = (cambio) => {
                if (!carrito[codigo]) {
                    carrito[codigo] = { nombre, precio, cantidad: 0 };
                }
    
                carrito[codigo].cantidad += cambio;
    
                // Seguridad: No permitir cantidades negativas
                if (carrito[codigo].cantidad < 0) carrito[codigo].cantidad = 0;
                
                // Actualizar el número en el botón del producto
                visorCantidad.textContent = carrito[codigo].cantidad;
                
                // Si la cantidad llega a 0, lo ideal es limpiar el objeto si quieres optimizar
                if (carrito[codigo].cantidad === 0) delete carrito[codigo];
    
                actualizarInterfazGlobal();
            };
    
            btnMas.addEventListener('click', () => modificarCantidad(1));
            btnMenos.addEventListener('click', () => modificarCantidad(-1));
        });
    
        // Enviar a WhatsApp
        document.getElementById('btn-enviar-whatsapp').addEventListener('click', () => {
            let textoPedido = CONFIG.mensajeCabecera;
            let totalFinal = 0;
            
            Object.keys(carrito).forEach(codigo => {
                const item = carrito[codigo];
                const subtotal = item.cantidad * item.precio;
                totalFinal += subtotal;
                textoPedido += `${item.cantidad} x ${item.nombre} (Ref: ${codigo}) - ${formatearMoneda(subtotal)}\n`;
            });
    
            textoPedido += `\nTOTAL: ${formatearMoneda(totalFinal)}`;
            window.open(`https://wa.me/${CONFIG.telefono}?text=${encodeURIComponent(textoPedido)}`, '_blank');
        });
    
        // Vaciar carrito
        document.getElementById('btn-vaciar').addEventListener('click', () => {
            carrito = {};
            document.querySelectorAll('.cantidad-producto').forEach(v => v.textContent = '0');
            actualizarInterfazGlobal();
        });
    });