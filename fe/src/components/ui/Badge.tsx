import clsx from 'clsx';

interface BadgeProps {
  children: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export default function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const variants = {
    default: 'bg-soft-purple text-primary',
    success: 'bg-soft-green text-green-600',
    warning: 'bg-soft-orange text-orange-500',
    danger: 'bg-red-50 text-red-500',
    info: 'bg-soft-blue text-blue-500',
  };

  return (
    <span className={clsx(
      'inline-flex items-center font-medium rounded-full',
      size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
      variants[variant]
    )}>
      {children}
    </span>
  );
}
