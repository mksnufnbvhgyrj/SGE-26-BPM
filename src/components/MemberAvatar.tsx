import React from 'react';

export const MemberAvatar = ({ name, photoUrl, size = 'md', className = '' }: { name: string, photoUrl?: string, size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-slate-200 flex flex-shrink-0 items-center justify-center text-slate-500 font-bold overflow-hidden border-2 border-white shadow-sm ${className}`}>
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
};
