import React, { useState } from 'react';
import { Member, Audiencia, Status, Notification } from '../types';
import { formatBytes } from '../utils/formatters';
import { ShieldAlert, Bell, Clock as ClockIcon, LogOut, Scale, Paperclip, FileText, FileSpreadsheet, File, FileUp, Download, Briefcase, Phone, Mail } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { MemberAvatar } from './MemberAvatar';

export const UserDashboard = ({ user, audiencias, onLogout, onMarkNotificationsAsRead }: { user: Member, audiencias: Audiencia[], onLogout: () => void, onMarkNotificationsAsRead: () => void }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = user.notifications?.filter(n => !n.read).length || 0;

  const handleNotificationsClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      onMarkNotificationsAsRead();
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
              <MemberAvatar 
                name={user.nome} 
                photoUrl={user.photoUrl} 
                size="xl" 
                className="absolute -top-12 shadow-md w-24 h-24 text-3xl" 
              />
              
              <div className="mt-14 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">{user.patente} {user.guerra}</h2>
                    <p className="text-blue-600 font-medium text-sm mt-0.5">{user.nome}</p>
                  </div>
                  <StatusBadge status={user.status} />
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
