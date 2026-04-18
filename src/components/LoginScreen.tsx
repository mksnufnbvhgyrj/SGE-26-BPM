import React, { useState } from 'react';
import { Member, AuthState } from '../types';

interface LoginScreenProps {
  onLogin: (auth: AuthState) => void;
  members: Member[];
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, members }) => {
  const [loginType, setLoginType] = useState<'ADMIN' | 'USER'>('USER');
  const [cpf, setCpf] = useState('');
  const [matricula, setMatricula] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find(m => m.cpf === cpf && m.matricula === matricula);
    if (member) {
      onLogin({ role: 'USER', user: member });
    } else {
      setError('CPF ou Matrícula incorretos.');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser === 'admin' && adminPass === 'admin') {
      onLogin({ role: 'ADMIN' });
    } else {
      setError('Usuário ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <span className="bg-white text-blue-600 px-2 py-1 rounded-md text-sm">26º BPM</span>
            SGE
          </h1>
          <p className="text-blue-100 mt-2 text-sm">Sistema de Gestão de Efetivo</p>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${loginType === 'USER' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setLoginType('USER'); setError(''); }}
          >
            Acesso Individual
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${loginType === 'ADMIN' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setLoginType('ADMIN'); setError(''); }}
          >
            Administrador
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          {loginType === 'USER' ? (
            <form onSubmit={handleUserLogin} className="flex flex-col gap-4">
              <div>
                <label htmlFor="login-cpf" className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                <input
                  id="login-cpf"
                  type="text" required placeholder="Ex: 111.111.111-11"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={cpf} onChange={e => setCpf(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="login-mat" className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
                <input
                  id="login-mat"
                  type="text" required placeholder="Ex: 50.123-4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={matricula} onChange={e => setMatricula(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full mt-2 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                Entrar
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
              <div>
                <label htmlFor="admin-usr" className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
                <input
                  id="admin-usr"
                  type="text" required placeholder="admin"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={adminUser} onChange={e => setAdminUser(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="admin-pwd" className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                <input
                  id="admin-pwd"
                  type="password" required placeholder="admin"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={adminPass} onChange={e => setAdminPass(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full mt-2 bg-slate-800 text-white py-2 rounded-md hover:bg-slate-900 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2">
                Entrar como Admin
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
