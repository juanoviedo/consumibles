'use client';

import React from 'react';
import { useFormStatus } from 'react-dom';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}

export default function SubmitButton({
  children,
  loading,
  loadingText = 'Procesando...',
  className = 'admin-btn',
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isSubmitting = pending || loading;

  return (
    <button
      type="submit"
      disabled={disabled || isSubmitting}
      className={className}
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
            animation: 'spin-button 1s linear infinite',
            width: '18px',
            height: '18px',
            display: 'inline-block',
          }}
        >
          <style>{`
            @keyframes spin-button {
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
