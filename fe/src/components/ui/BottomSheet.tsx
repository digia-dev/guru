import { ReactNode, useEffect } from 'react';
import clsx from 'clsx';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className={clsx('fixed inset-0 z-50 lg:hidden', open ? 'visible' : 'invisible')}>
      <div className={clsx('absolute inset-0 bg-black/30 backdrop-blur-sm', open ? 'animate-fade-in' : 'opacity-0')} onClick={onClose} />
      <div className={clsx(
        'fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-h-[85vh] flex flex-col overflow-hidden transition-transform duration-300',
        open ? 'translate-y-0' : 'translate-y-full'
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-1 rounded-full bg-black/20 mx-auto" />
          </div>
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5">
            <i className="fas fa-times text-text-tertiary"></i>
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
