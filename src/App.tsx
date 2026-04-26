import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Search, Download, Plus, Edit2, Trash2, Users, CheckCircle, Sun, Activity, X, ArrowUpDown, FolderOpen, FileText, BarChart3, FileUp, Settings, LogOut, Menu, Scale, ChevronLeft, ChevronRight, Briefcase, User, Info, Layers, ShieldAlert, Crosshair, Paperclip, Stethoscope, History, Award, GraduationCap, Baby, Archive, Medal, Shirt, Palmtree, HeartPulse, Hospital, MapPin, CalendarOff, Calculator, TrendingUp, ChevronsUp, Dumbbell, Clock as ClockIcon, BookOpen, Microscope, Printer, Bell, FileSpreadsheet, File, Upload, UploadCloud, Phone, Mail } from 'lucide-react';

type Status = 'Ativo' | 'Férias' | 'Licença' | 'Afastado';

export interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
}

export interface Anexo {
  id: string;
  name: string;
  url: string;
  type: string;
  date: string;
  size?: number;
}

interface Member {
  id: number;
  ordem: number;
  matricula: string;
  cpf: string;
  patente: string;
  nome: string;
  guerra: string;
  funcao: string;
  telefone?: string;
  email?: string;
  status: Status;
  pdfName?: string;
  pdfUrl?: string;
  photoUrl?: string;
  quadro?: string;
  rgMilitar?: string;
  dataEmissaoRg?: string;
  comportamento?: string;
  vinculo?: string;
  dataNascimento?: string;
  cidadeNascimento?: string;
  ufNascimento?: string;
  pasep?: string;
  regCivil?: string;
  pai?: string;
  mae?: string;
  tipoSanguineo?: string;
  fatorRh?: string;
  dataInclusao?: string;
  notifications?: Notification[];
  anexos?: Anexo[];
}

interface AudienciaPdf {
  id: string;
  name: string;
  url: string;
}

interface Audiencia {
  id: number;
  data: string;
  hora: string;
  local: string;
  processo: string;
  policialIds: number[];
  status: 'Agendada' | 'Realizada' | 'Cancelada';
  observacoes?: string;
  pdfs?: AudienciaPdf[];
}

const generateId = () => {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : (typeof window !== 'undefined' ? window.crypto : undefined);
  if (cryptoObj) {
    if (cryptoObj.randomUUID) {
      return cryptoObj.randomUUID();
    }
    if (cryptoObj.getRandomValues) {
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
        (Number(c) ^ cryptoObj.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16)
      );
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
};

const INITIAL_AUDIENCIAS: Audiencia[] = [
  { id: 1, data: '2026-04-10', hora: '14:30', local: '1ª Vara Criminal', processo: '0001234-56.2026.8.19.0001', policialIds: [1], status: 'Agendada' },
  { id: 2, data: '2026-04-12', hora: '09:00', local: 'Auditoria Militar', processo: '0009876-54.2026.8.19.0001', policialIds: [2], status: 'Realizada' },
];

const INITIAL_DATA: Member[] = [
  { id: 1, ordem: 1, matricula: "50.123-4", cpf: "111.111.111-11", patente: "Cap PM", nome: "Roberto Almeida da Costa", guerra: "R. Costa", funcao: "Cmte Cia", telefone: "21 99999-1111", status: "Ativo" },
  { id: 2, ordem: 2, matricula: "61.333-2", cpf: "222.222.222-22", patente: "1º Ten PM", nome: "Fernanda Montenegro Silva", guerra: "Montenegro", funcao: "P/1", telefone: "21 98888-2222", status: "Ativo" },
  { id: 3, ordem: 3, matricula: "77.444-5", cpf: "333.333.333-33", patente: "Subten PM", nome: "Carlos Eduardo Santos", guerra: "C. Eduardo", funcao: "Sargenteante", telefone: "21 97777-3333", status: "Férias" },
  { id: 4, ordem: 4, matricula: "88.555-6", cpf: "444.444.444-44", patente: "3º Sgt PM", nome: "Juliana Paes de Oliveira", guerra: "Paes", funcao: "Patrulha", telefone: "21 96666-4444", status: "Licença" },
  { id: 5, ordem: 5, matricula: "99.111-0", cpf: "555.555.555-55", patente: "Cb PM", nome: "Marcos Vinicius Pereira", guerra: "Vinicius", funcao: "Motorista", telefone: "21 95555-5555", status: "Ativo" },
  { id: 6, ordem: 6, matricula: "10.222-9", cpf: "666.666.666-66", patente: "Sd PM", nome: "Ana Clara Lima", guerra: "Clara", funcao: "Sentinela", telefone: "21 94444-6666", status: "Afastado" }
];

const PATENTES = ["Sd PM", "Cb PM", "3º Sgt PM", "2º Sgt PM", "1º Sgt PM", "Subten PM", "Asp Of PM", "2º Ten PM", "1º Ten PM", "Cap PM", "Maj PM", "Ten Cel PM"];

const Clock = () => {
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

type AuthRole = 'ADMIN' | 'USER' | null;

interface AuthState {
  role: AuthRole;
  user?: Member;
}

const LoginScreen = ({ onLogin, members }: { onLogin: (auth: AuthState) => void, members: Member[] }) => {
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
      console.warn(`Tentativa de login individual falhou para CPF: ${cpf}`);
      setError('CPF ou Matrícula incorretos.');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const envUser = import.meta.env.VITE_ADMIN_USER;
    const envPass = import.meta.env.VITE_ADMIN_PASS;
    if (envUser && envPass && adminUser === envUser && adminPass === envPass) {
      onLogin({ role: 'ADMIN' });
    } else {
      console.warn(`Tentativa de login de administrador falhou para usuário: ${adminUser}`);
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
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                <input 
                  type="text" required placeholder="Ex: 111.111.111-11"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={cpf} onChange={e => setCpf(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
                <input 
                  type="text" required placeholder="Ex: 50.123-4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={matricula} onChange={e => setMatricula(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full mt-2 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">
                Entrar
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
                <input 
                  type="text" required placeholder="admin"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={adminUser} onChange={e => setAdminUser(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                <input 
                  type="password" required placeholder="admin"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={adminPass} onChange={e => setAdminPass(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full mt-2 bg-slate-800 text-white py-2 rounded-md hover:bg-slate-900 font-medium transition-colors">
                Entrar como Admin
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const UserDashboard = ({ user, audiencias, onLogout, onMarkNotificationsAsRead }: { user: Member, audiencias: Audiencia[], onLogout: () => void, onMarkNotificationsAsRead: () => void }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = user.notifications?.filter(n => !n.read).length || 0;

  const handleNotificationsClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      onMarkNotificationsAsRead();
    }
  };

  const getStatusClasses = (status: Status) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800';
      case 'Férias': return 'bg-yellow-100 text-yellow-800';
      case 'Licença': return 'bg-indigo-100 text-indigo-800';
      case 'Afastado': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const userAudiencias = audiencias.filter(a => a.policialIds?.includes(user.id));
  const upcomingAudiencias = userAudiencias
    .filter(a => new Date(a.data + 'T' + a.hora) >= new Date())
    .sort((a, b) => new Date(a.data + 'T' + a.hora).getTime() - new Date(b.data + 'T' + b.hora).getTime());
  const nextAudiencia = upcomingAudiencias.length > 0 ? upcomingAudiencias[0] : null;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 flex flex-col items-center font-sans">
      <header className="w-full max-w-6xl flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 text-xl font-bold text-slate-900">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-slate-500 font-medium leading-tight">26º BPM</span>
            <span className="leading-tight">Portal do Policial</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={handleNotificationsClick}
              className="relative p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h4 className="font-semibold text-slate-800">Notificações</h4>
                  {unreadCount > 0 && <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{unreadCount} novas</span>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {user.notifications && user.notifications.length > 0 ? (
                    user.notifications.map(notif => (
                      <div key={notif.id} className={`p-4 border-b border-slate-50 last:border-0 ${notif.read ? 'bg-white' : 'bg-blue-50/30'}`}>
                        <p className="text-sm text-slate-800 mb-1.5">{notif.message}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" /> {new Date(notif.date).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center">
                      <Bell className="w-8 h-8 text-slate-300 mb-2" />
                      Nenhuma notificação no momento.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>
      
      <div className="w-full max-w-6xl flex flex-col gap-6">
        {/* Welcome & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium mb-1">Bem-vindo de volta,</p>
              <h2 className="text-2xl font-bold">{user.patente} {user.guerra}</h2>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-blue-100">Sistema Online</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-0.5">Próxima Audiência</p>
              {nextAudiencia ? (
                <div>
                  <p className="text-slate-900 font-bold">{new Date(nextAudiencia.data).toLocaleDateString('pt-BR')} às {nextAudiencia.hora}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[180px]">{nextAudiencia.local}</p>
                </div>
              ) : (
                <p className="text-slate-900 font-bold">Nenhuma agendada</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Paperclip className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-0.5">Documentos Anexos</p>
              <p className="text-2xl text-slate-900 font-bold">{user.anexos?.length || 0}</p>
              <p className="text-xs text-slate-500">Na sua ficha individual</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Minhas Audiências & Anexos */}
          <div className="lg:col-span-2 flex flex-col gap-6 order-2 lg:order-1">
            {/* Audiências */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600" /> Minhas Audiências
                </h3>
                <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">{userAudiencias.length}</span>
              </div>
              
              {userAudiencias.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider border-b border-slate-200">Data/Hora</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider border-b border-slate-200">Local</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider border-b border-slate-200">Processo</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider border-b border-slate-200">Status</th>
                        <th className="px-5 py-3 text-center font-semibold uppercase tracking-wider border-b border-slate-200">Doc</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userAudiencias.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4 font-medium text-slate-900 whitespace-nowrap">
                            {new Date(item.data).toLocaleDateString('pt-BR')} <span className="text-slate-400 font-normal">às</span> {item.hora}
                          </td>
                          <td className="px-5 py-4 text-slate-700">{item.local}</td>
                          <td className="px-5 py-4 text-slate-700 font-mono text-xs">{item.processo}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                              item.status === 'Agendada' ? 'bg-blue-100 text-blue-700' :
                              item.status === 'Realizada' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            {item.pdfs && item.pdfs.length > 0 ? (
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {item.pdfs.map((pdf, idx) => (
                                  <a key={pdf.id} href={pdf.url} target="_blank" rel="noreferrer" className="inline-flex items-center p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title={pdf.name}>
                                    <FileText className="w-4 h-4" />
                                    {item.pdfs!.length > 1 && <span className="text-[10px] ml-0.5 font-bold">{idx + 1}</span>}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center text-slate-500 flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Scale className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-medium text-slate-600">Nenhuma audiência agendada</p>
                  <p className="text-sm mt-1">Você não possui audiências vinculadas ao seu perfil no momento.</p>
                </div>
              )}
            </div>

            {/* Meus Anexos Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-blue-600" /> Meus Anexos
                </h3>
                <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">{user.anexos?.length || 0}</span>
              </div>
              
              <div className="p-5">
                {user.anexos && user.anexos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.anexos.map(anexo => {
                      const isPdf = anexo.type.includes('pdf') || anexo.name.toLowerCase().endsWith('.pdf');
                      const isExcel = anexo.type.includes('spreadsheet') || anexo.type.includes('excel') || anexo.name.toLowerCase().match(/\.(xls|xlsx)$/);
                      const isWord = anexo.type.includes('word') || anexo.name.toLowerCase().match(/\.(doc|docx)$/);
                      
                      return (
                        <div key={anexo.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`p-2.5 rounded-lg shrink-0 ${isPdf ? 'bg-red-50 text-red-600' : isExcel ? 'bg-green-50 text-green-600' : isWord ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                              {isPdf ? <FileText className="w-5 h-5" /> : isExcel ? <FileSpreadsheet className="w-5 h-5" /> : isWord ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-semibold text-slate-800 truncate" title={anexo.name}>{anexo.name}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span>{new Date(anexo.date).toLocaleDateString('pt-BR')}</span>
                                {anexo.size && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span>{formatBytes(anexo.size)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                            <a href={anexo.url} target="_blank" rel="noreferrer" download={anexo.name} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Baixar">
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-500 flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <FileUp className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-medium text-slate-600">Nenhum anexo encontrado</p>
                    <p className="text-sm mt-1">Os documentos adicionados à sua ficha aparecerão aqui.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Profile Info (ID Card Style) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden order-1 lg:order-2 sticky top-6">
            <div className="h-24 bg-slate-800 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            </div>
            <div className="px-6 pb-6 relative">
              <div className="w-24 h-24 rounded-2xl border-4 border-white bg-slate-100 absolute -top-12 shadow-md overflow-hidden flex items-center justify-center text-3xl font-bold text-slate-400">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.nome} className="w-full h-full object-cover" />
                ) : (
                  user.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                )}
              </div>
              
              <div className="mt-14 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">{user.patente} {user.guerra}</h2>
                    <p className="text-blue-600 font-medium text-sm mt-0.5">{user.nome}</p>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${getStatusClasses(user.status)}`}>
                    {user.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Matrícula</p>
                    <p className="text-slate-900 font-semibold font-mono">{user.matricula}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">CPF</p>
                    <p className="text-slate-900 font-semibold font-mono">{user.cpf}</p>
                  </div>
                </div>

                <div className="space-y-3 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Função</p>
                      <p className="text-sm font-semibold text-slate-900">{user.funcao}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Telefone</p>
                      <p className="text-sm font-semibold text-slate-900">{user.telefone || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Email</p>
                      <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{user.email || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {user.pdfUrl && (
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <a href={user.pdfUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Documento Principal</p>
                      <p className="text-xs text-slate-500 truncate max-w-[120px]">{user.pdfName}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Download className="w-4 h-4" />
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({ role: 'ADMIN' });
  const [activeAdminTab, setActiveAdminTab] = useState('efetivo');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [members, setMembers] = useState<Member[]>(INITIAL_DATA);
  const [audiencias, setAudiencias] = useState<Audiencia[]>(INITIAL_AUDIENCIAS);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'danger' } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    setToast({ message, type });
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, error } = await supabase.from('app_store').select('*');
        if (error) {
          console.error('Error loading from Supabase:', error);
          showToast(`Erro ao carregar dados do banco: ${error.message || 'Desconhecido'}`, 'danger');
          return;
        }
        
        if (data && data.length > 0) {
          const membersData = data.find(d => d.key === 'members');
          const audienciasData = data.find(d => d.key === 'audiencias');
          
          if (membersData && membersData.value) {
            setMembers(membersData.value);
          }
          if (audienciasData && audienciasData.value) {
            setAudiencias(audienciasData.value);
          }
        } else {
          // Initialize Supabase with default data if empty
          const { error: initError } = await supabase.from('app_store').upsert([
            { key: 'members', value: INITIAL_DATA },
            { key: 'audiencias', value: INITIAL_AUDIENCIAS }
          ]);
          if (initError) {
             console.error('Error initializing Supabase:', initError);
             showToast(`Erro ao inicializar banco: ${initError.message || 'Desconhecido'}`, 'danger');
          }
        }
      } catch (err: any) {
        console.error('Failed to load data:', err);
        showToast(`Falha de conexão com o servidor: ${err.message || 'Erro desconhecido'}`, 'danger');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadData();
  }, []);

  // Sync members to Supabase when changed
  useEffect(() => {
    if (isLoadingData) return;
    const handler = setTimeout(async () => {
      const { error } = await supabase.from('app_store').upsert({ key: 'members', value: members });
      if (error) {
        console.error('Error syncing members:', error);
        showToast(`Erro ao salvar efetivo: ${error.message || 'Desconhecido'}`, 'danger');
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [members, isLoadingData]);

  // Sync audiencias to Supabase when changed
  useEffect(() => {
    if (isLoadingData) return;
    const handler = setTimeout(async () => {
      const { error } = await supabase.from('app_store').upsert({ key: 'audiencias', value: audiencias });
      if (error) {
        console.error('Error syncing audiencias:', error);
        showToast(`Erro ao salvar audiências: ${error.message || 'Desconhecido'}`, 'danger');
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [audiencias, isLoadingData]);

  const [search, setSearch] = useState('');
  const [filterPatente, setFilterPatente] = useState('');
  const [filterFuncao, setFilterFuncao] = useState('');
  
  type SortableFields = 'ordem' | 'matricula' | 'cpf' | 'patente' | 'nome' | 'guerra' | 'funcao' | 'status';
  const [sortField, setSortField] = useState<SortableFields>('ordem');
  const [sortAsc, setSortAsc] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Member>>({ status: 'Ativo' });

  const [isAudienciaModalOpen, setIsAudienciaModalOpen] = useState(false);
  const [editingAudienciaId, setEditingAudienciaId] = useState<number | null>(null);
  const [audienciaFormData, setAudienciaFormData] = useState<Partial<Audiencia>>({ status: 'Agendada' });
  
  const [fichaSearch, setFichaSearch] = useState('');
  const [selectedFichaMemberId, setSelectedFichaMemberId] = useState<number | null>(null);
  const [activeFichaSection, setActiveFichaSection] = useState<string | null>(null);
  const [fichaFormData, setFichaFormData] = useState<Partial<Member>>({});
  const [isDraggingAnexo, setIsDraggingAnexo] = useState(false);

  useEffect(() => {
    if (activeFichaSection === 'Dados Principais' && selectedFichaMemberId) {
      const member = members.find(m => m.id === selectedFichaMemberId);
      if (member) {
        setFichaFormData({
          guerra: member.guerra || '',
          patente: member.patente || '',
          nome: member.nome || '',
          matricula: member.matricula || '',
          status: member.status || 'Ativo',
          quadro: member.quadro || '',
          rgMilitar: member.rgMilitar || '',
          dataEmissaoRg: member.dataEmissaoRg || '',
          comportamento: member.comportamento || 'Bom',
          cpf: member.cpf || '',
          vinculo: member.vinculo || '',
          dataNascimento: member.dataNascimento || '',
          cidadeNascimento: member.cidadeNascimento || '',
          ufNascimento: member.ufNascimento || '',
          pasep: member.pasep || '',
          regCivil: member.regCivil || '',
          pai: member.pai || '',
          mae: member.mae || '',
          tipoSanguineo: member.tipoSanguineo || '',
          fatorRh: member.fatorRh || '',
          dataInclusao: member.dataInclusao || '',
        });
      }
    }
  }, [activeFichaSection, selectedFichaMemberId, members]);

  const handleSaveFicha = () => {
    if (selectedFichaMemberId) {
      const newNotification: Notification = {
        id: generateId(),
        message: 'Sua ficha individual (Dados Principais) foi atualizada pelo administrador.',
        date: new Date().toISOString(),
        read: false
      };
      setMembers(members.map(m => 
        m.id === selectedFichaMemberId 
          ? { ...m, ...fichaFormData, notifications: [newNotification, ...(m.notifications || [])] } 
          : m
      ));
      showToast('Dados Principais atualizados com sucesso!', 'success');
    }
  };

  const processAnexoFiles = (files: FileList | File[]) => {
    if (!selectedFichaMemberId) return;
    const member = members.find(m => m.id === selectedFichaMemberId);
    if (!member) return;

    const validFiles = Array.from(files).filter(file => {
      // Limit to 5MB per file to avoid localStorage/Base64 issues
      if (file.size > 5 * 1024 * 1024) {
        showToast(`O arquivo ${file.name} excede o limite de 5MB.`, 'danger');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newAnexos: Anexo[] = [];
    let processedFiles = 0;

    validFiles.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        newAnexos.push({
          id: generateId(),
          name: file.name,
          url: base64String,
          type: file.type || 'application/octet-stream',
          date: new Date().toISOString(),
          size: file.size
        });

        processedFiles++;
        if (processedFiles === validFiles.length) {
          const newNotification: Notification = {
            id: generateId(),
            message: 'Novos anexos foram adicionados à sua ficha.',
            date: new Date().toISOString(),
            read: false
          };
          
          setMembers(members.map(m => 
            m.id === selectedFichaMemberId 
              ? { 
                  ...m, 
                  anexos: [...(m.anexos || []), ...newAnexos],
                  notifications: [newNotification, ...(m.notifications || [])]
                } 
              : m
          ));
          showToast('Anexos importados com sucesso!', 'success');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUploadAnexo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAnexoFiles(e.target.files);
    }
    e.target.value = ''; // Reset input
  };

  const handleDragOverAnexo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAnexo(true);
  };

  const handleDragLeaveAnexo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAnexo(false);
  };

  const handleDropAnexo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAnexo(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAnexoFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveAnexo = (anexoId: string) => {
    if (!selectedFichaMemberId) return;
    if (window.confirm('Tem certeza que deseja remover este anexo?')) {
      setMembers(members.map(m => 
        m.id === selectedFichaMemberId 
          ? { ...m, anexos: (m.anexos || []).filter(a => a.id !== anexoId) } 
          : m
      ));
      showToast('Anexo removido.', 'danger');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, memberId: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newNotification: Notification = {
          id: generateId(),
          message: 'Sua foto de perfil foi atualizada.',
          date: new Date().toISOString(),
          read: false
        };
        setMembers(members.map(m => 
          m.id === memberId 
            ? { ...m, photoUrl: base64String, notifications: [newNotification, ...(m.notifications || [])] } 
            : m
        ));
        showToast('Foto atualizada com sucesso!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const uniquePatentes = useMemo(() => [...new Set(members.map(m => m.patente))].sort(), [members]);
  const uniqueFuncoes = useMemo(() => [...new Set(members.map(m => m.funcao))].sort(), [members]);

  const filteredFichaMembers = useMemo(() => {
    if (!fichaSearch.trim()) return [];
    
    const searchLower = fichaSearch.toLowerCase();
    return members.filter(item => 
      item.nome.toLowerCase().includes(searchLower) || 
      item.matricula.includes(searchLower) || 
      item.id.toString() === searchLower
    );
  }, [members, fichaSearch]);

  const filteredAndSortedMembers = useMemo(() => {
    return members
      .filter(item => {
        const searchLower = search.toLowerCase();
        const matchSearch = item.nome.toLowerCase().includes(searchLower) || 
                            item.matricula.includes(searchLower) || 
                            item.funcao.toLowerCase().includes(searchLower);
        const matchPatente = filterPatente ? item.patente === filterPatente : true;
        const matchFuncao = filterFuncao ? item.funcao === filterFuncao : true;
        return matchSearch && matchPatente && matchFuncao;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        
        const strA = typeof valA === 'string' ? valA.toLowerCase() : valA;
        const strB = typeof valB === 'string' ? valB.toLowerCase() : valB;
        
        if (strA < strB) return sortAsc ? -1 : 1;
        if (strA > strB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [members, search, filterPatente, filterFuncao, sortField, sortAsc]);

  const handleSort = (field: SortableFields) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Ordem", "Matrícula", "Patente", "Nome", "Nome Guerra", "Função", "Status"];
    const rows = filteredAndSortedMembers.map(m => [
      m.ordem, m.matricula, m.patente, m.nome, m.guerra, m.funcao, m.status
    ]);
    
    const escapeCSV = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
    
    // \uFEFF is the BOM (Byte Order Mark) to ensure Excel reads UTF-8 correctly
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.map(escapeCSV).join(",") + "\n" 
      + rows.map(e => e.map(escapeCSV).join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "efetivo_26bpm.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const openModal = (member?: Member) => {
    if (member) {
      setEditingId(member.id);
      setFormData(member);
    } else {
      setEditingId(null);
      setFormData({ status: 'Ativo' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ status: 'Ativo' });
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cpf || !formData.matricula || !formData.nome) {
      showToast('Por favor, preencha CPF, Matrícula e Nome.', 'danger');
      return;
    }
    if (editingId) {
      const newNotification: Notification = {
        id: generateId(),
        message: 'Suas informações funcionais foram atualizadas pelo administrador.',
        date: new Date().toISOString(),
        read: false
      };
      setMembers(members.map(m => m.id === editingId ? { ...m, ...formData, notifications: [newNotification, ...(m.notifications || [])] } as Member : m));
      showToast('Registro atualizado com sucesso!');
    } else {
      const newMember = {
        ...formData,
        id: Date.now() + Math.floor(Math.random() * 1000),
        ordem: members.length + 1,
      } as Member;
      setMembers([...members, newMember]);
      showToast('Novo militar adicionado!', 'success');
    }
    closeModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este registro?')) {
      setMembers(members.filter(m => m.id !== id));
      showToast('Registro removido.', 'danger');
    }
  };

  const openAudienciaModal = (audiencia?: Audiencia) => {
    if (audiencia) {
      setEditingAudienciaId(audiencia.id);
      setAudienciaFormData(audiencia);
    } else {
      setEditingAudienciaId(null);
      setAudienciaFormData({ status: 'Agendada', policialIds: [] });
    }
    setIsAudienciaModalOpen(true);
  };

  const closeAudienciaModal = () => {
    setIsAudienciaModalOpen(false);
    setAudienciaFormData({ status: 'Agendada', policialIds: [] });
    setEditingAudienciaId(null);
  };

  const handleSaveAudiencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!audienciaFormData.policialIds || audienciaFormData.policialIds.length === 0) {
      showToast('Selecione pelo menos um policial convocado.', 'danger');
      return;
    }
    if (editingAudienciaId) {
      setAudiencias(audiencias.map(a => a.id === editingAudienciaId ? { ...a, ...audienciaFormData } as Audiencia : a));
      showToast('Audiência atualizada com sucesso!');
    } else {
      const newAudiencia = {
        ...audienciaFormData,
        id: Date.now() + Math.floor(Math.random() * 1000),
      } as Audiencia;
      setAudiencias([...audiencias, newAudiencia]);
      showToast('Nova audiência adicionada!', 'success');
    }
    closeAudienciaModal();
  };

  const handleAddPolicialToAudiencia = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    if (id && !(audienciaFormData.policialIds || []).includes(id)) {
      setAudienciaFormData({
        ...audienciaFormData,
        policialIds: [...(audienciaFormData.policialIds || []), id]
      });
    }
    e.target.value = "";
  };

  const handleRemovePolicialFromAudiencia = (id: number) => {
    setAudienciaFormData({
      ...audienciaFormData,
      policialIds: (audienciaFormData.policialIds || []).filter(pid => pid !== id)
    });
  };

  const handleAudienciaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > 5 * 1024 * 1024) {
      showToast('O arquivo excede o limite de 5MB.', 'danger');
      e.target.value = '';
      return;
    }
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPdf = {
          id: generateId(),
          name: file.name,
          url: reader.result as string
        };
        setAudienciaFormData({
          ...audienciaFormData,
          pdfs: [...(audienciaFormData.pdfs || []), newPdf]
        });
      };
      reader.readAsDataURL(file);
    } else if (file) {
      showToast('Por favor, selecione apenas arquivos PDF.', 'danger');
    }
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleRemoveAudienciaPdf = (pdfId: string) => {
    setAudienciaFormData({
      ...audienciaFormData,
      pdfs: (audienciaFormData.pdfs || []).filter(p => p.id !== pdfId)
    });
  };

  const handleDeleteAudiencia = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover esta audiência?')) {
      setAudiencias(audiencias.filter(a => a.id !== id));
      showToast('Audiência removida.', 'danger');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getStatusClasses = (status: Status) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800';
      case 'Férias': return 'bg-yellow-100 text-yellow-800';
      case 'Licença': return 'bg-indigo-100 text-indigo-800';
      case 'Afastado': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const stats = {
    total: members.length,
    active: members.filter(d => d.status === 'Ativo').length,
    vacation: members.filter(d => d.status === 'Férias').length,
    away: members.filter(d => ['Licença', 'Afastado'].includes(d.status)).length
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-700">Carregando dados...</h2>
        <p className="text-slate-500 mt-2">Conectando ao banco de dados</p>
      </div>
    );
  }


  if (authState.role === 'USER') {
    const liveUser = members.find(m => m.id === authState.user!.id) || authState.user!;
    return (
      <UserDashboard 
        user={liveUser} 
        audiencias={audiencias} 
        onLogout={() => setAuthState({ role: null })} 
        onMarkNotificationsAsRead={() => {
          setMembers(members.map(m => 
            m.id === liveUser.id 
              ? { ...m, notifications: m.notifications?.map(n => ({ ...n, read: true })) } 
              : m
          ));
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      {/* Sidebar (Desktop) */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-slate-900 text-slate-300 flex flex-col shrink-0 hidden md:flex relative`}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-5 bg-slate-800 text-slate-300 hover:text-white rounded-full p-1 border border-slate-700 z-10"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-6'} bg-slate-950 text-white font-bold text-lg gap-2 shrink-0 transition-all overflow-hidden whitespace-nowrap`}>
          <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-sm shrink-0">26º</span>
          {!isSidebarCollapsed && <span>BPM SGE</span>}
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto overflow-x-hidden">
          <button onClick={() => setActiveAdminTab('efetivo')} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'efetivo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`} title="Efetivo">
            <Users className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Efetivo</span>}
          </button>
          <button onClick={() => setActiveAdminTab('audiencias')} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'audiencias' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`} title="Audiências">
            <Scale className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Audiências</span>}
          </button>
          <button onClick={() => setActiveAdminTab('administrativo')} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'administrativo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`} title="Administrativo">
            <Briefcase className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Administrativo</span>}
          </button>
          <button onClick={() => setActiveAdminTab('configuracoes')} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'configuracoes' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`} title="Configurações">
            <Settings className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Configurações</span>}
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 w-full rounded-md text-slate-500 cursor-default text-left`}>
            {!isSidebarCollapsed && <span className="whitespace-nowrap text-xs">SGE v1.0.0</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full" onClick={e => e.stopPropagation()}>
            <div className="h-16 flex items-center justify-between px-6 bg-slate-950 text-white font-bold text-lg shrink-0">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-sm">26º BPM</span>
                SGE
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
              <button onClick={() => { setActiveAdminTab('efetivo'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'efetivo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Users className="w-5 h-5" /> Efetivo
              </button>
              <button onClick={() => { setActiveAdminTab('audiencias'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'audiencias' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Scale className="w-5 h-5" /> Audiências
              </button>
              <button onClick={() => { setActiveAdminTab('administrativo'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'administrativo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Briefcase className="w-5 h-5" /> Administrativo
              </button>
              <button onClick={() => { setActiveAdminTab('configuracoes'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'configuracoes' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Settings className="w-5 h-5" /> Configurações
              </button>
            </nav>
            <div className="p-4 border-t border-slate-800 shrink-0">
              <div className="text-center text-slate-500 text-xs py-2">
                SGE v1.0.0
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-100">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 hidden sm:block">
              {activeAdminTab === 'efetivo' && 'Controle de Efetivo'}
              {activeAdminTab === 'audiencias' && 'Gestão de Audiências'}
              {activeAdminTab === 'administrativo' && 'Módulo Administrativo'}
              {activeAdminTab === 'ficha_individual' && 'Ficha Individual'}
              {activeAdminTab === 'configuracoes' && 'Configurações do Sistema'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Clock />
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold" title="Administrador">
              AD
            </div>
          </div>
        </header>

        {/* Content Area */}
        {activeAdminTab === 'efetivo' && (
          <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
            {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col">
          <Users className="w-7 h-7 mb-2 text-slate-700" />
          <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Efetivo Total</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 border-b-4 border-b-green-500 flex flex-col">
          <CheckCircle className="w-7 h-7 mb-2 text-green-500" />
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Pronto Emprego</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 border-b-4 border-b-yellow-500 flex flex-col">
          <Sun className="w-7 h-7 mb-2 text-yellow-500" />
          <div className="text-3xl font-bold text-yellow-600">{stats.vacation}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Férias</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 border-b-4 border-b-red-500 flex flex-col">
          <Activity className="w-7 h-7 mb-2 text-red-500" />
          <div className="text-3xl font-bold text-red-600">{stats.away}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">LTS / Afastados</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center mb-4 shrink-0">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, matrícula, função..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button 
            onClick={() => openModal()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Membro
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse text-sm whitespace-nowrap">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                {[
                  { key: 'ordem', label: 'Ordem' },
                  { key: 'matricula', label: 'Matrícula' },
                  { key: 'patente', label: 'Patente' },
                  { key: 'nome', label: 'Nome' },
                  { key: 'funcao', label: 'Função' },
                  { key: 'status', label: 'Status' }
                ].map((col) => (
                  <th 
                    key={col.key}
                    onClick={() => handleSort(col.key as SortableFields)}
                    className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 cursor-pointer hover:bg-slate-100 hover:text-blue-600 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  Doc
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedMembers.length > 0 ? (
                filteredAndSortedMembers.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedFichaMemberId(item.id);
                      setActiveAdminTab('ficha_individual');
                    }}
                  >
                    <td className="px-4 py-3 border-b border-slate-100 text-slate-500 font-mono">#{item.ordem}</td>
                    <td className="px-4 py-3 border-b border-slate-100 font-medium text-slate-900">{item.matricula}</td>
                    <td className="px-4 py-3 border-b border-slate-100 text-slate-700">{item.patente}</td>
                    <td className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                          {item.photoUrl ? (
                            <img src={item.photoUrl} alt={item.nome} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(item.nome)
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{item.nome}</div>
                          <div className="text-xs text-slate-500">{item.guerra}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 text-slate-700">{item.funcao}</td>
                    <td className="px-4 py-3 border-b border-slate-100">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusClasses(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 text-center">
                      {item.pdfUrl ? (
                        <a href={item.pdfUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title={item.pdfName}>
                          <FileText className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 text-right">
                      <button onClick={(e) => { e.stopPropagation(); openModal(item); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FolderOpen className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-base">Nenhum registro encontrado com os filtros atuais.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {activeAdminTab === 'audiencias' && (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <h3 className="text-lg font-bold text-slate-800">Gestão de Audiências</h3>
        <button onClick={() => openAudienciaModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" /> Nova Audiência
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Data/Hora</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Local</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Processo</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Policiais Convocados</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Doc</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {audiencias.length > 0 ? (
                audiencias.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 border-b border-slate-100 font-medium text-slate-900">
                        {new Date(item.data).toLocaleDateString('pt-BR')} às {item.hora}
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-slate-700">{item.local}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-slate-700 font-mono">{item.processo}</td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <div className="flex flex-col gap-1.5">
                          {item.policialIds && item.policialIds.length > 0 ? (
                            item.policialIds.map(pid => {
                              const policial = members.find(m => m.id === pid);
                              if (!policial) return null;
                              return (
                                <div key={pid} className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
                                    {policial.photoUrl ? (
                                      <img src={policial.photoUrl} alt={policial.nome} className="w-full h-full object-cover" />
                                    ) : (
                                      getInitials(policial.nome)
                                    )}
                                  </div>
                                  <span className="text-slate-900 font-medium text-xs">{policial.patente} {policial.guerra}</span>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-slate-400 italic">Nenhum policial</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          item.status === 'Agendada' ? 'bg-blue-100 text-blue-700' :
                          item.status === 'Realizada' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-center">
                        {item.pdfs && item.pdfs.length > 0 ? (
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {item.pdfs.map((pdf, idx) => (
                              <a key={pdf.id} href={pdf.url} target="_blank" rel="noreferrer" className="inline-flex items-center p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title={pdf.name}>
                                <FileText className="w-4 h-4" />
                                {item.pdfs!.length > 1 && <span className="text-[10px] ml-0.5 font-bold">{idx + 1}</span>}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-right">
                        <button onClick={() => openAudienciaModal(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteAudiencia(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Scale className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-base">Nenhuma audiência cadastrada.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {activeAdminTab === 'configuracoes' && (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500 flex flex-col items-center justify-center h-64">
        <Settings className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">Configurações do Sistema</h3>
        <p>As configurações avançadas do sistema serão disponibilizadas em breve.</p>
      </div>
    </div>
  )}

  {activeAdminTab === 'administrativo' && (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <h3 className="text-lg font-medium text-slate-900 mb-4">Módulo Administrativo</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <button 
          onClick={() => setActiveAdminTab('ficha_individual')}
          className="bg-white p-8 rounded-lg border border-slate-200 flex flex-col items-center justify-center gap-4 hover:bg-slate-50 hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <FileText className="w-8 h-8" />
          </div>
          <span className="font-medium text-slate-800 text-lg">Ficha Individual</span>
        </button>
      </div>
    </div>
  )}

  {activeAdminTab === 'ficha_individual' && (
    <div className="flex-1 overflow-auto p-4 md:p-6 flex flex-col gap-4">
      {/* Toolbar / Filtros (Ficha Individual) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center shrink-0 relative z-20">
        <div className="flex items-center gap-3 text-slate-800 font-semibold flex-1">
          <button 
            onClick={() => {
              setActiveAdminTab('administrativo');
              setSelectedFichaMemberId(null);
              setActiveFichaSection(null);
              setFichaSearch('');
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Ficha Individual</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto relative">
          <select className="w-full md:w-auto min-w-[140px] px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 text-slate-500" disabled title="Filtro futuro">
            <option>Filtrar por...</option>
          </select>
          <div className="relative flex-1 md:w-auto md:min-w-[300px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, matrícula ou ID..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900"
              value={fichaSearch}
              onChange={(e) => {
                setFichaSearch(e.target.value);
                if (e.target.value === '') setSelectedFichaMemberId(null);
              }}
            />
            
            {/* Search Results Dropdown */}
            {fichaSearch.trim() !== '' && !selectedFichaMemberId && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                {filteredFichaMembers.length > 0 ? (
                  filteredFichaMembers.map(member => (
                    <button
                      key={member.id}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors flex items-center gap-3"
                      onClick={() => {
                        setSelectedFichaMemberId(member.id);
                        setActiveFichaSection(null);
                        setFichaSearch('');
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                        {member.photoUrl ? (
                          <img src={member.photoUrl} alt={member.nome} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(member.nome)
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{member.patente} {member.nome}</span>
                        <span className="text-xs text-slate-500">Matrícula: {member.matricula} | ID: {member.id}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center">Nenhum policial encontrado.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Área de Conteúdo da Ficha Individual */}
      {selectedFichaMemberId ? (() => {
        const member = members.find(m => m.id === selectedFichaMemberId);
        if (!member) return null;
        return (
          <div className="bg-white flex-1 rounded-lg border border-slate-200 flex flex-col p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <label className="relative w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold cursor-pointer group overflow-hidden shrink-0">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.nome} className="w-full h-full object-cover" />
                  ) : (
                    member.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FileUp className="w-6 h-6 text-white" />
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handlePhotoUpload(e, member.id)}
                  />
                </label>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{member.patente} {member.nome}</h2>
                  <p className="text-slate-500">{member.guerra} | Matrícula: {member.matricula}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedFichaMemberId(null);
                  setActiveFichaSection(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                title="Fechar ficha"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {activeFichaSection ? (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                    <button 
                      onClick={() => setActiveFichaSection(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                      title="Voltar para seções"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800">{activeFichaSection}</h3>
                  </div>
                  
                  {activeFichaSection === 'Dados Principais' ? (
                    <div className="flex flex-col gap-8 pb-8">
                      {/* Dados Funcionais */}
                      <section className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                        <h4 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-600" /> Dados Funcionais
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Nome de Guerra</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.guerra || ''} onChange={(e) => setFichaFormData({...fichaFormData, guerra: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Quadro</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="Ex: QOPM" value={fichaFormData.quadro || ''} onChange={(e) => setFichaFormData({...fichaFormData, quadro: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Posto/Grad.</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.patente || ''} onChange={(e) => setFichaFormData({...fichaFormData, patente: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">RG Militar</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="000.000" value={fichaFormData.rgMilitar || ''} onChange={(e) => setFichaFormData({...fichaFormData, rgMilitar: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Data de Emissão</label>
                            <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.dataEmissaoRg || ''} onChange={(e) => setFichaFormData({...fichaFormData, dataEmissaoRg: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Comportamento</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.comportamento || 'Bom'} onChange={(e) => setFichaFormData({...fichaFormData, comportamento: e.target.value})}>
                              <option value="Excepcional">Excepcional</option>
                              <option value="Ótimo">Ótimo</option>
                              <option value="Bom">Bom</option>
                              <option value="Insuficiente">Insuficiente</option>
                              <option value="Mau">Mau</option>
                            </select>
                          </div>
                        </div>
                      </section>

                      {/* Dados Pessoais */}
                      <section className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                        <h4 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" /> Dados Pessoais
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Nome Completo</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.nome || ''} onChange={(e) => setFichaFormData({...fichaFormData, nome: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">CPF</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="000.000.000-00" value={fichaFormData.cpf || ''} onChange={(e) => setFichaFormData({...fichaFormData, cpf: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Matrícula</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.matricula || ''} onChange={(e) => setFichaFormData({...fichaFormData, matricula: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Vínculo</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="Efetivo" value={fichaFormData.vinculo || ''} onChange={(e) => setFichaFormData({...fichaFormData, vinculo: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Data de Nascimento</label>
                            <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.dataNascimento || ''} onChange={(e) => setFichaFormData({...fichaFormData, dataNascimento: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Cidade de Nascimento</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.cidadeNascimento || ''} onChange={(e) => setFichaFormData({...fichaFormData, cidadeNascimento: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">UF Nascimento</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.ufNascimento || ''} onChange={(e) => setFichaFormData({...fichaFormData, ufNascimento: e.target.value})}>
                              <option value="">Selecione...</option>
                              <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option><option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option><option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option><option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option><option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option><option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option><option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option><option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option><option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">PASEP</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.pasep || ''} onChange={(e) => setFichaFormData({...fichaFormData, pasep: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Reg. Civil</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.regCivil || ''} onChange={(e) => setFichaFormData({...fichaFormData, regCivil: e.target.value})} />
                          </div>
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Pai</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.pai || ''} onChange={(e) => setFichaFormData({...fichaFormData, pai: e.target.value})} />
                          </div>
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Mãe</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.mae || ''} onChange={(e) => setFichaFormData({...fichaFormData, mae: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo Sanguíneo</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.tipoSanguineo || ''} onChange={(e) => setFichaFormData({...fichaFormData, tipoSanguineo: e.target.value})}>
                              <option value="">Selecione...</option>
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="AB">AB</option>
                              <option value="O">O</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Fator RH</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.fatorRh || ''} onChange={(e) => setFichaFormData({...fichaFormData, fatorRh: e.target.value})}>
                              <option value="">Selecione...</option>
                              <option value="+">Positivo (+)</option>
                              <option value="-">Negativo (-)</option>
                            </select>
                          </div>
                        </div>
                      </section>

                      {/* Situação Funcional */}
                      <section className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                        <h4 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-600" /> Situação Funcional
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Data Inclusão</label>
                            <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.dataInclusao || ''} onChange={(e) => setFichaFormData({...fichaFormData, dataInclusao: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Situação</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.status || 'Ativo'} onChange={(e) => setFichaFormData({...fichaFormData, status: e.target.value})}>
                              <option value="Ativo">Ativo</option>
                              <option value="Férias">Férias</option>
                              <option value="Licença">Licença</option>
                              <option value="Afastado">Afastado</option>
                            </select>
                          </div>
                        </div>
                      </section>
                      
                      <div className="flex justify-end gap-3 mt-4">
                        <button 
                          onClick={() => setActiveFichaSection(null)}
                          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors font-medium"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleSaveFicha}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Salvar Alterações
                        </button>
                      </div>
                    </div>
                  ) : activeFichaSection === 'Anexos' ? (
                    <div className="flex flex-col gap-8 pb-8">
                      <section className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-md font-semibold text-slate-800 flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-blue-600" /> Documentos Anexos
                          </h4>
                        </div>
                        
                        {(() => {
                          const member = members.find(m => m.id === selectedFichaMemberId);
                          const anexos = member?.anexos || [];
                          
                          return (
                            <div className="flex flex-col gap-6">
                              {/* Drag & Drop Zone */}
                              <div 
                                onDragOver={handleDragOverAnexo}
                                onDragLeave={handleDragLeaveAnexo}
                                onDrop={handleDropAnexo}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                                  isDraggingAnexo 
                                    ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                                    : 'border-slate-300 bg-white hover:bg-slate-50'
                                }`}
                              >
                                <UploadCloud className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDraggingAnexo ? 'text-blue-600' : 'text-slate-400'}`} />
                                <h3 className="text-lg font-semibold text-slate-800 mb-1">Arraste e solte seus arquivos aqui</h3>
                                <p className="text-sm text-slate-500 mb-6">ou clique no botão abaixo para selecionar do seu computador</p>
                                
                                <label className="cursor-pointer px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2 shadow-sm">
                                  <Search className="w-4 h-4" /> Procurar Arquivos
                                  <input 
                                    type="file" 
                                    multiple 
                                    className="hidden" 
                                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                                    onChange={handleUploadAnexo}
                                  />
                                </label>
                                <p className="text-xs text-slate-400 mt-4">Formatos suportados: PDF, Word, Excel. Tamanho máximo: 5MB por arquivo.</p>
                              </div>

                              {/* Lista de Anexos */}
                              {anexos.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                  {anexos.map(anexo => {
                                    const isPdf = anexo.type.includes('pdf') || anexo.name.toLowerCase().endsWith('.pdf');
                                    const isExcel = anexo.type.includes('spreadsheet') || anexo.type.includes('excel') || anexo.name.toLowerCase().match(/\.(xls|xlsx)$/);
                                    const isWord = anexo.type.includes('word') || anexo.name.toLowerCase().match(/\.(doc|docx)$/);
                                    
                                    return (
                                      <div key={anexo.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                          <div className={`p-2 rounded-md shrink-0 ${isPdf ? 'bg-red-100 text-red-600' : isExcel ? 'bg-green-100 text-green-600' : isWord ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {isPdf ? <FileText className="w-5 h-5" /> : isExcel ? <FileSpreadsheet className="w-5 h-5" /> : isWord ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
                                          </div>
                                          <div className="overflow-hidden">
                                            <p className="text-sm font-medium text-slate-800 truncate" title={anexo.name}>{anexo.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                              <span>{new Date(anexo.date).toLocaleDateString('pt-BR')}</span>
                                              {anexo.size && (
                                                <>
                                                  <span>•</span>
                                                  <span>{formatBytes(anexo.size)}</span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <a href={anexo.url} target="_blank" rel="noreferrer" download={anexo.name} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Baixar">
                                            <Download className="w-4 h-4" />
                                          </a>
                                          <button onClick={() => handleRemoveAnexo(anexo.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Remover">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </section>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
                      <Edit2 className="w-12 h-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Em Desenvolvimento</h3>
                      <p className="text-center max-w-md">
                        A seção <strong>{activeFichaSection}</strong> está em desenvolvimento e será disponibilizada em breve.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {[
                    { name: 'Dados Principais', icon: User },
                    { name: 'Dados Complementares', icon: Info },
                    { name: 'Agregações', icon: Layers },
                    { name: 'APED', icon: ShieldAlert },
                    { name: 'Arma de Fogo', icon: Crosshair },
                    { name: 'Anexos', icon: Paperclip },
                    { name: 'Atestados', icon: Stethoscope },
                    { name: 'Averbações', icon: History },
                    { name: 'Cargo/Função', icon: Briefcase },
                    { name: 'Certificados', icon: Award },
                    { name: 'Comissões', icon: Users },
                    { name: 'Cursos', icon: GraduationCap },
                    { name: 'Dependentes', icon: Baby },
                    { name: 'Diversos', icon: Archive },
                    { name: 'Elogios/Medalha', icon: Medal },
                    { name: 'Fardamento', icon: Shirt },
                    { name: 'Férias', icon: Palmtree },
                    { name: 'Inspeção de Saúde', icon: HeartPulse },
                    { name: 'Junta Médica', icon: Hospital },
                    { name: 'Justiça e Disciplina', icon: Scale },
                    { name: 'Lotações', icon: MapPin },
                    { name: 'Licenças/Dispensa', icon: CalendarOff },
                    { name: 'Pontuação', icon: Calculator },
                    { name: 'Progressões', icon: TrendingUp },
                    { name: 'Promoções', icon: ChevronsUp },
                    { name: 'TAF', icon: Dumbbell },
                    { name: 'Tempo de Serviço', icon: ClockIcon },
                    { name: 'TCC', icon: BookOpen },
                    { name: 'Trabalhos Cientifícos', icon: Microscope },
                  ].map((section, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveFichaSection(section.name)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center gap-3 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors text-slate-600 group"
                    >
                      <section.icon className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      <span className="text-sm font-medium text-center leading-tight">{section.name}</span>
                    </button>
                  ))}
                  
                  {/* Botão Especial: Gerar Ficha Individual */}
                  <button 
                    className="bg-blue-600 border border-blue-700 rounded-lg p-4 flex flex-col items-center justify-center gap-3 hover:bg-blue-700 text-white transition-colors shadow-sm group"
                  >
                    <Printer className="w-8 h-8 text-blue-200 group-hover:text-white transition-colors" />
                    <span className="text-sm font-medium text-center leading-tight">Gerar Ficha Individual</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })() : (
        <div className="bg-white flex-1 min-h-[400px] rounded-lg border border-slate-200 flex flex-col items-center justify-center text-slate-500 p-8 shadow-sm">
          <FileText className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-medium text-slate-900 mb-2">Ficha Individual</h3>
          <p className="text-center max-w-md">
            Utilize a barra de busca acima para encontrar um policial por nome, matrícula ou ID e abrir sua ficha individual para edição.
          </p>
        </div>
      )}
    </div>
  )}
</main>

{/* Modal Audiência */}
      {isAudienciaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAudienciaId ? 'Editar Audiência' : 'Agendar Nova Audiência'}
              </h3>
              <button onClick={closeAudienciaModal} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAudiencia} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Data *</label>
                    <input 
                      type="date" required
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={audienciaFormData.data || ''} onChange={e => setAudienciaFormData({...audienciaFormData, data: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Hora *</label>
                    <input 
                      type="time" required
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={audienciaFormData.hora || ''} onChange={e => setAudienciaFormData({...audienciaFormData, hora: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Local (Vara/Fórum) *</label>
                    <input 
                      type="text" required placeholder="Ex: 1ª Vara Criminal da Comarca..."
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={audienciaFormData.local || ''} onChange={e => setAudienciaFormData({...audienciaFormData, local: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Número do Processo *</label>
                    <input 
                      type="text" required placeholder="Ex: 0001234-56.2026.8.19.0001"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-sm"
                      value={audienciaFormData.processo || ''} onChange={e => setAudienciaFormData({...audienciaFormData, processo: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Policiais Convocados *</label>
                    
                    {audienciaFormData.policialIds && audienciaFormData.policialIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-1">
                        {audienciaFormData.policialIds.map(pid => {
                          const policial = members.find(m => m.id === pid);
                          if (!policial) return null;
                          return (
                            <div key={pid} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">
                              <span className="text-xs font-medium">{policial.patente} {policial.guerra}</span>
                              <button type="button" onClick={() => handleRemovePolicialFromAudiencia(pid)} className="text-blue-400 hover:text-blue-600">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <select 
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      onChange={handleAddPolicialToAudiencia}
                      value=""
                    >
                      <option value="">Adicionar policial...</option>
                      {members.filter(m => !(audienciaFormData.policialIds || []).includes(m.id)).map(m => (
                        <option key={m.id} value={m.id}>{m.patente} {m.nome} ({m.matricula})</option>
                      ))}
                    </select>
                    {(!audienciaFormData.policialIds || audienciaFormData.policialIds.length === 0) && (
                      <span className="text-xs text-red-500">Selecione pelo menos um policial.</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Status *</label>
                    <select 
                      required
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={audienciaFormData.status || 'Agendada'} onChange={e => setAudienciaFormData({...audienciaFormData, status: e.target.value as Audiencia['status']})}
                    >
                      <option value="Agendada">Agendada</option>
                      <option value="Realizada">Realizada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Observações</label>
                    <textarea 
                      rows={3} placeholder="Informações adicionais..."
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                      value={audienciaFormData.observacoes || ''} onChange={e => setAudienciaFormData({...audienciaFormData, observacoes: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Documentos Anexos (PDFs)</label>
                    <div className="flex flex-col gap-3">
                      {audienciaFormData.pdfs && audienciaFormData.pdfs.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {audienciaFormData.pdfs.map(pdf => (
                            <div key={pdf.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-slate-50">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-5 h-5 text-red-500 shrink-0" />
                                <span className="text-sm text-slate-700 truncate">{pdf.name}</span>
                              </div>
                              <button type="button" onClick={() => handleRemoveAudienciaPdf(pdf.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0" title="Remover PDF">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 cursor-pointer transition-colors text-sm font-medium">
                          <Plus className="w-4 h-4" />
                          <span>Adicionar PDF</span>
                          <input type="file" accept=".pdf" className="hidden" onChange={handleAudienciaFileUpload} />
                        </label>
                        {(!audienciaFormData.pdfs || audienciaFormData.pdfs.length === 0) && (
                          <span className="text-xs text-slate-500">Nenhum arquivo selecionado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={closeAudienciaModal} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors shadow-sm">
                  Salvar Audiência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Editar Militar' : 'Adicionar Novo Militar'}
              </h3>
              <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Matrícula *</label>
                    <input 
                      type="text" required placeholder="Ex: 123.456-7"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.matricula || ''} onChange={e => setFormData({...formData, matricula: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">CPF *</label>
                    <input 
                      type="text" required placeholder="Ex: 111.111.111-11"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Patente *</label>
                    <select 
                      required
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      value={formData.patente || ''} onChange={e => setFormData({...formData, patente: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {PATENTES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Nome Completo *</label>
                    <input 
                      type="text" required placeholder="Nome completo do policial"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Nome de Guerra</label>
                    <input 
                      type="text" placeholder="Nome na tarjeta"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.guerra || ''} onChange={e => setFormData({...formData, guerra: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Função</label>
                    <input 
                      type="text" list="funcoesList" placeholder="Ex: Patrulha"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.funcao || ''} onChange={e => setFormData({...formData, funcao: e.target.value})}
                    />
                    <datalist id="funcoesList">
                      {uniqueFuncoes.map(f => <option key={f} value={f} />)}
                    </datalist>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Telefone</label>
                    <input 
                      type="tel" placeholder="(21) 90000-0000"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input 
                      type="email" placeholder="email@exemplo.com"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Status Operacional</label>
                    <select 
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      value={formData.status || 'Ativo'} onChange={e => setFormData({...formData, status: e.target.value as Status})}
                    >
                      <option value="Ativo">🟢 Ativo - Disponível para Serviço</option>
                      <option value="Férias">🟡 Férias Regulamentares</option>
                      <option value="Licença">🔵 Licença Médica/Especial</option>
                      <option value="Afastado">🔴 Afastado/Outros</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Documento Anexo (PDF)</label>
                    <input 
                      type="file" accept=".pdf"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 5 * 1024 * 1024) {
                          alert('O arquivo excede o limite de 5MB.');
                          e.target.value = '';
                          return;
                        }
                        if (file && file.type === 'application/pdf') {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({...formData, pdfName: file.name, pdfUrl: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        } else if (file) {
                          alert('Por favor, selecione um arquivo PDF válido.');
                          e.target.value = '';
                        }
                      }}
                    />
                    {formData.pdfName && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <FileText className="w-3 h-3" /> Arquivo atual: {formData.pdfName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0 rounded-b-xl">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors">
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white font-medium ${toast.type === 'success' ? 'bg-slate-800' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Trash2 className="w-5 h-5" />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
