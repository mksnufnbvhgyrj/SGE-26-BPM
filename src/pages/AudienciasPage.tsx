import React from 'react';
import { Plus, Scale, FileText, Edit2, Trash2 } from 'lucide-react';
import { Audiencia, Member } from '../types';

interface AudienciasPageProps {
  audiencias: Audiencia[];
  members: Member[];
  openAudienciaModal: (a?: Audiencia) => void;
  handleDeleteAudiencia: (id: number) => void;
}

const getInitials = (name: string) => name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

export default function AudienciasPage({ 
  audiencias, 
  members, 
  openAudienciaModal, 
  handleDeleteAudiencia 
}: AudienciasPageProps) {
  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden animate-in fade-in duration-500">
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
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 hidden md:table-cell">Local</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 hidden md:table-cell">Processo</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Policiais Convocados</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 hidden md:table-cell">Doc</th>
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
                      <td className="px-4 py-3 border-b border-slate-100 text-slate-700 hidden md:table-cell">{item.local}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-slate-700 font-mono hidden md:table-cell">{item.processo}</td>
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
                      <td className="px-4 py-3 border-b border-slate-100 text-center hidden md:table-cell">
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
                        <button aria-label="Excluir item" onClick={() => handleDeleteAudiencia(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
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
  );
}
