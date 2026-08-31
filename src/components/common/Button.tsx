// ============================================================
// Botón reutilizable con variantes de tema D&D
// ============================================================

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  children?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-2.5 py-1.5 text-xs rounded-md',
  md: '',
  lg: 'px-6 py-3 text-base rounded-xl',
};

/**
 * Botón con variantes temáticas y soporte para ARIA.
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={`btn ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
};