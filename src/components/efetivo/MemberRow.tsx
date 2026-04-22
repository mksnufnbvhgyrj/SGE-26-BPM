import React, { memo } from 'react';
import { Edit2, Trash2, FileText } from 'lucide-react';
import { Member } from '../../types';
import { formatMatricula, getStatusClasses } from '../../utils/constants';

interface MemberRowProps {
  member: Member;
  onEdit: (m: Member) => void;
  onDelete: (id: number) => void;
  onClick: (id: number) => void;
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

export const MemberRow = memo(function MemberRow({ member, onEdit, onDelete, onClick }: MemberRowProps) {
  return (
    <tr 
      className="hover:bg-slate-50 transition-colors group cursor-pointer text-xs md:text-sm"
      onClick={() => onClick(member.id)}
    >
      <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100 text-slate-500 font-mono hidden md:table-cell">#{member.ordem}</td>
      <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100 font-medium text-slate-900 hidden md:table-cell">{formatMatricula(member.matricula)}</td>
      <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100 text-slate-700">{member.patente}</td>
      <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] md:text-xs font-bold shrink-0 overflow-hidden">
            {member.photoUrl ? <img src={member.photoUrl} alt={member.nome} className="w-full h-full object-cover" /> : getInitials(member.nome)}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{member.nome}</div>
            <div className="text-xs text-slate-500">{member.guerra}</div>
          </div>
        </div>
      </td>
      <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100 text-slate-700 hidden md:table-cell">{member.funcao}</td>
      <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100">
        <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-wide ${getStatusClasses(member.status)}`}>{member.status}</span>
      </td>
      <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100 text-center hidden md:table-cell">
        {member.pdfUrl ? (
          <a href={member.pdfUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="inline-flex p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title={member.pdfName}><FileText className="w-4 h-4" /></a>
        ) : <span className="text-slate-300">-</span>}
      </td>
      <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100 text-right">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(member); }}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(member.id); }}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}, (prev, next) => {
  // Comparação profunda apenas dos campos que mudam (otimização de renderização PWA)
  return prev.member.id === next.member.id && 
         prev.member.status === next.member.status &&
         prev.member.photoUrl === next.member.photoUrl &&
         prev.member.nome === next.member.nome &&
         prev.member.guerra === next.member.guerra &&
         prev.member.patente === next.member.patente &&
         prev.member.ordem === next.member.ordem;
});
