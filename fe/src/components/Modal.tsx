import { ReactNode, useEffect, useState } from 'react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | ReactNode;
  children: ReactNode;
}

export function DesktopModal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <div className={clsx(
      'fixed inset-0 z-50 hidden md:flex items-center justify-center p-4 transition-all duration-300 ease-out',
      isOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
    )}>
      <div
        className={clsx(
          'absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-out',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      <div className={clsx(
        'relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden transition-all duration-300 ease-out',
        isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
      )}>
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
          <h3 className="text-lg font-semibold text-indigo-800">{title}</h3>
          <button onClick={onClose} className="p-3 rounded-full hover:bg-indigo-100 text-indigo-600">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-6 overflow-auto max-h-[70vh]">{children}</div>
      </div>
    </div>
  );
}

export function MobileModal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 visible bg-black/30 backdrop-blur-sm' : 'opacity-0 invisible'}`}
        onClick={onClose}
      />
      <div className={`slide-up-modal md:hidden ${isOpen ? 'active' : ''}`}>
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto my-3 flex-shrink-0" />
        <div className="bg-white rounded-t-2xl shadow-2xl p-4 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-3 rounded-full hover:bg-gray-100 text-gray-600">
              <i className="fas fa-times"></i>
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

export function useModalState() {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}
