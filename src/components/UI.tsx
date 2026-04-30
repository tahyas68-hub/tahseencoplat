import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger',
  size?: 'sm' | 'md' | 'lg'
}) {
  const variants = {
    primary: 'bg-bento-accent text-white hover:bg-opacity-90',
    secondary: 'bg-bento-card text-bento-text border border-bento-border hover:bg-gray-50',
    outline: 'border border-bento-accent text-bento-accent hover:bg-bento-accent hover:text-white',
    ghost: 'text-bento-muted hover:text-bento-text hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button 
      className={cn(
        'rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2', 
        variants[variant],
        sizes[size],
        className
      )} 
      {...props} 
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn('bg-bento-card border border-bento-border rounded-xl shadow-sm p-5', className)} 
      {...props} 
    />
  );
}

export function Input({ label, error, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string, error?: string }) {
  return (
    <div className="space-y-1 w-full">
      {label && <label className="text-[10px] uppercase tracking-widest font-bold text-bento-muted">{label}</label>}
      <input 
        className={cn(
          'w-full px-4 py-2 bg-white border border-bento-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bento-accent focus:border-transparent transition-all',
          error && 'border-red-500 focus:ring-red-500',
          className
        )} 
        {...props} 
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
