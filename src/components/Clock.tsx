import React, { useState, useEffect } from 'react';

export const Clock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="font-semibold text-slate-500 hidden sm:block">
      {currentTime.toLocaleDateString('pt-BR')} {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
    </div>
  );
};
