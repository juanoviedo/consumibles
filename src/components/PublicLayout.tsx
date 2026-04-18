import React from 'react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header>
        <div className="contenedor">
          <a href="/">Consumibles Duramax</a>
          <nav className="menu">
            <a href="/" className="sombrear">
              ¡Somos expertos en Plasma!
            </a>
          </nav>
        </div>
      </header>
      
      <main>
        {children}
      </main>

      <div className="btn-whatsapp">
        <a href="https://wa.me/573168314501?text=Hola.%20Quiero%20más%20información%20sobre%20consumibles!" target="_blank" rel="noreferrer">
          <img src="/img/wsplogo.png" alt="Whatsapp Mantenimientos" width="60" />
        </a>
      </div>

      <footer>
        <div>
          <p style={{ textAlign: "center", width: "100%", margin: "0 auto" }}>
            Cel: <a href="https://wa.me/573168314501" target="_blank" rel="noreferrer" style={{color: "inherit", textDecoration: "none"}}>+57 3168314501</a><br />
            E-mail: juan.oviedo.lutkens@gmail.com
          </p>
        </div>
      </footer>
    </>
  );
}
