import { ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}

export default function Button({ children, variant = 'primary', size = 'md', icon, loading, disabled, onClick, type = 'button', className }: ButtonProps) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  const variants = {
    primary: 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30',
    secondary: 'bg-white border border-black/10 text-text-primary hover:bg-gray-50',
    ghost: 'text-text-secondary hover:bg-black/5',
    danger: 'bg-danger text-white hover:bg-red-600',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        'font-medium active:scale-[0.97] transition-all duration-200 inline-flex items-center justify-center gap-2',
        sizes[size],
        variants[variant],
        (disabled || loading) && 'opacity-50 cursor-not-allowed active:scale-100',
        className
      )}
    >
      {loading ? <i className="fas fa-spinner fa-spin" /> : icon && <i className={`fas ${icon}`} />}
      {children}
    </button>
  );
}
