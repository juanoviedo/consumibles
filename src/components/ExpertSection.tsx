'use client';

import React, { useState, useEffect } from 'react';

export default function ExpertSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar la ventana flotante 10 segundos después de cargar la página
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Cerrar con tecla Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'expertFadeIn 0.35s ease-out forwards',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @keyframes expertFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes expertSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .expert-modal-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .expert-modal-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .expert-modal-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
      `}</style>

      <div
        className="expert-modal-scrollbar"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          maxWidth: '760px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.06)',
          position: 'relative',
          animation: 'expertSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Header Bar Gradient */}
        <div
          style={{
            height: '6px',
            background: 'linear-gradient(90deg, #8b0500 0%, #dc2626 50%, #f59e0b 100%)',
            width: '100%',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
          }}
        />

        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Cerrar ventana"
          title="Cerrar ventana"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'all 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
            e.currentTarget.style.color = '#8b0500';
            e.currentTarget.style.borderColor = '#fca5a5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div style={{ padding: '32px 28px 24px' }}>
          {/* Header with Badge and Avatar */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', marginBottom: '20px', paddingRight: '36px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                minWidth: '64px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: '2px solid rgba(139, 5, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                boxShadow: '0 8px 16px -4px rgba(139, 5, 0, 0.15)',
              }}
            >
              👨‍🔧
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#8b0500',
                    border: '1px solid #fecaca',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                  }}
                >
                  ⚡ Soporte Técnico Certificado
                </span>
                <span
                  style={{
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '20px',
                  }}
                >
                  🇧🇷 Hypertherm Brasil
                </span>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.45rem',
                  fontWeight: '800',
                  color: '#0f172a',
                  lineHeight: '1.25',
                  letterSpacing: '-0.4px',
                }}
              >
                ¿Necesitas Asesoría Técnica en Plasma?
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.92rem', color: '#64748b' }}>
                Aprende a diagnosticar, calibrar y optimizar tu equipo con acompañamiento directo.
              </p>
            </div>
          </div>

          {/* 2 Column Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {/* Card 1: Capacitacion */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🎓</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
                  Experiencia y Capacitación
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: '1.55' }}>
                Capacitado directamente en la sede de <strong>Hypertherm en Guarulhos - Brasil</strong> para sistemas <strong>MaxPro 200</strong> y antorchas <strong>PowerMax</strong>.
              </p>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: '1.55' }}>
                Experiencia práctica como ensamblador de las reconocidas mesas de corte CNC <strong>Practicut</strong>.
              </p>
            </div>

            {/* Card 2: Beneficio Exclusivo */}
            <div
              style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📞</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#9a3412' }}>
                  Asesoría Telefónica Directa
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: '1.55' }}>
                Asesoramos talleres en todo el país, ahorrándoles millones de pesos en visitas técnicas para que tú mismo operes y mantengas tu mesa al 100%.
              </p>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #fdba74',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginTop: 'auto',
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#8b0500', marginBottom: '2px' }}>
                  💡 ¿Cómo acceder gratis?
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
                  Con compras acumuladas desde <strong>$500.000 COP al año</strong> en consumibles, recibes soporte técnico gratuito.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              flexWrap: 'wrap',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '18px',
            }}
          >
            <a
              href="https://wa.me/573332782483?text=Hola,%20quisiera%20recibir%20asesoria%20tecnica%20sobre%20consumibles%20de%20plasma"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '10px 18px',
                fontSize: '0.9rem',
                fontWeight: '700',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              <span>💬 Consultar Asesoría</span>
            </a>

            <button
              onClick={handleClose}
              style={{
                background: 'linear-gradient(135deg, #8b0500 0%, #dc2626 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '11px 24px',
                fontSize: '0.95rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(139, 5, 0, 0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 5, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 5, 0, 0.3)';
              }}
            >
              Entendido, ver catálogo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

