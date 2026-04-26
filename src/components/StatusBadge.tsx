import React from 'react';
import { Status } from '../types';

export const getStatusClasses = (status: Status | string) => {
  switch (status) {
    case 'Ativo': return 'bg-green-100 text-green-800';
    case 'Férias': return 'bg-yellow-100 text-yellow-800';
    case 'Licença': return 'bg-indigo-100 text-indigo-800';
    case 'Afastado': return 'bg-red-100 text-red-800';
    default: return 'bg-slate-100 text-slate-800';
  }
};

export const StatusBadge = ({ status, className = '' }: { status: Status | string, className?: string }) => {
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(status)} ${className}`}>
      {status}
    </span>
  );
};
