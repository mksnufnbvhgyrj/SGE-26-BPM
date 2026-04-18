import React from 'react';
import { Bell, LogOut, Clock } from 'lucide-react';
import { Member } from '../../types';

interface HeaderProps {
  user?: Member;
  onLogout: () => void;
  unreadNotifications?: number;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, unreadNotifications = 0 }) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">SGE - 26º BPM</h1>
            <p className="text-sm text-slate-500">Sistema de Gestão de Efetivo</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-slate-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {user && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user.guerra.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{user.guerra}</p>
                  <p className="text-xs text-slate-500">{user.patente}</p>
                </div>
              </div>

              {unreadNotifications > 0 && (
                <div className="relative">
                  <Bell className="w-5 h-5 text-slate-600" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                </div>
              )}
            </>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
