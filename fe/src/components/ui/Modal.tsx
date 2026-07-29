import { ReactNode, useEffect } from 'react';
import clsx from 'clsx';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ open, onClose, children, title, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className={clsx(
      'fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out',
      open ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
    )}>
      <div
        className={clsx(
          'absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-out',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      <div className={clsx(
        'relative bg-white rounded-3xl shadow-2xl w-full max-h-[85vh] overflow-y-auto transition-all duration-300 ease-out',
        sizes[size],
        open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
      )}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
              <i className="fas fa-times text-text-tertiary"></i>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
