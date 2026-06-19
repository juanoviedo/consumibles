'use client';

import React, { useState } from 'react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<any>;
  loadingText?: string;
}

export default function ActionButton({
  children,
  onClick,
  loadingText = 'Procesando...',
  className = 'admin-btn',
  disabled,
  ...props
}: ActionButtonProps) {
  const [localLoading, setLocalLoading] = useState(false);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick) return;

    // Prevent any action if already loading
    if (localLoading) return;

    try {
      const result = onClick(event);
      if (result instanceof Promise) {
        setLocalLoading(true);
        await result;
      }
    } catch (error) {
      // Re-throw or handle error if needed, but ensure we reset loading state
    } finally {
      setLocalLoading(false);
    }
  };

  const isSubmitting = localLoading;

  return (
    <button
      type="button"
      disabled={disabled || isSubmitting}
      className={className}
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...props.style,
      }}
      {...props}
    >
      {isSubmitting && (
        <svg
          viewBox="0 0 50 50"
          style={{
            animation: 'spin-action 1s linear infinite',
            width: '18px',
            height: '18px',
            display: 'inline-block',
          }}
        >
          <style>{`
            @keyframes spin-action {
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            style={{
              strokeDasharray: '90, 150',
              strokeDashoffset: '0',
            }}
          />
        </svg>
      )}
      {isSubmitting ? loadingText : children}
    </button>
  );
}
