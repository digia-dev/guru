import { useState, InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function PasswordInput({ label, className, ...props }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
          <input
          type={show ? 'text' : 'password'}
          className={clsx('input-field pr-11', className)}
          {...props}
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors">
          <i className={`fas ${show ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
        </button>
      </div>
    </div>
  );
}
