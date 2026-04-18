import React from 'react';
import { Search, Download, Plus, Edit2, Trash2, ArrowUpDown } from 'lucide-react';
import { Member } from '../../types';
import { getStatusClasses, formatMatricula } from '../../utils/constants';

interface MemberTableProps {
  members: Member[];
  searchTerm: string;
  sortField: keyof Member | null;
  sortDirection: 'asc' | 'desc';
  onSearchChange: (value: string) => void;
  onSort: (field: keyof Member) => void;
  onEdit: (member: Member) => void;
  onDelete: (id: number) => void;
  onViewDetails: (member: Member) => void;
}

const SortIcon = ({ direction }: { direction?: 'asc' | 'desc' }) => (
  <ArrowUpDown className={`w-4 h-4 ml-1 inline ${direction === 'desc' ? 'rotate-180' : ''}`} />
);

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  searchTerm,
  sortField,
  sortDirection,
  onSearchChange,
  onSort,
  onEdit,
  onDelete,
  onViewDetails,
}) => {

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 shrink-0">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, matrícula ou CPF..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Policial</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => onSort('ordem')}>
                Ordem {sortField === 'ordem' && <SortIcon direction={sortDirection} />}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => onSort('patente')}>
                Patente {sortField === 'patente' && <SortIcon direction={sortDirection} />}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => onSort('nome')}>
                Nome {sortField === 'nome' && <SortIcon direction={sortDirection} />}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell cursor-pointer hover:bg-slate-100" onClick={() => onSort('matricula')}>
                Matrícula {sortField === 'matricula' && <SortIcon direction={sortDirection} />}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:bg-slate-100" onClick={() => onSort('funcao')}>
                Função {sortField === 'funcao' && <SortIcon direction={sortDirection} />}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => onSort('status')}>
                Status {sortField === 'status' && <SortIcon direction={sortDirection} />}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.length > 0 ? (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{member.ordem}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{member.patente}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{member.nome}</p>
                      <p className="text-xs text-slate-500">{member.guerra}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 hidden md:table-cell">{formatMatricula(member.matricula)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 hidden lg:table-cell">{member.funcao}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClasses(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onViewDetails(member)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Ver detalhes"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onEdit(member)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(member.id)}
                        className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg font-medium">Nenhum policial encontrado</p>
                  <p className="text-sm mt-1">Tente ajustar sua busca ou adicione um novo registro</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
