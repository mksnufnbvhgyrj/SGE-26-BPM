import React from 'react';
import { useClock } from '../hooks/useClock';

const Clock: React.FC = () => {
  const currentTime = useClock();

  return (
    <div className="font-semibold text-slate-500 hidden sm:block">
      {currentTime.toLocaleDateString('pt-BR')} {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
    </div>
  );
};

export default Clock;
