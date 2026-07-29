import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className, hover = false, padding = true, onClick }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-[24px] border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
        padding && 'p-5',
        hover && 'hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-200',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
