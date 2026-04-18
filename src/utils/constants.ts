import { Member, Audiencia } from '../types';

export const PATENTES = [
  "Sd PM",
  "Cb PM",
  "3º Sgt PM",
  "2º Sgt PM",
  "1º Sgt PM",
  "Subten PM",
  "Asp Of PM",
  "2º Ten PM",
  "1º Ten PM",
  "Cap PM",
  "Maj PM",
  "Ten Cel PM"
];

export const INITIAL_DATA: Member[] = [
  { id: 1, ordem: 1, matricula: "50.123-4", cpf: "111.111.111-11", patente: "Cap PM", nome: "Roberto Almeida da Costa", guerra: "R. Costa", funcao: "Cmte Cia", telefone: "21 99999-1111", status: "Ativo" as const },
  { id: 2, ordem: 2, matricula: "61.333-2", cpf: "222.222.222-22", patente: "1º Ten PM", nome: "Fernanda Montenegro Silva", guerra: "Montenegro", funcao: "P/1", telefone: "21 98888-2222", status: "Ativo" as const },
  { id: 3, ordem: 3, matricula: "77.444-5", cpf: "333.333.333-33", patente: "Subten PM", nome: "Carlos Eduardo Santos", guerra: "C. Eduardo", funcao: "Sargenteante", telefone: "21 97777-3333", status: "Férias" as const },
  { id: 4, ordem: 4, matricula: "88.555-6", cpf: "444.444.444-44", patente: "3º Sgt PM", nome: "Juliana Paes de Oliveira", guerra: "Paes", funcao: "Patrulha", telefone: "21 96666-4444", status: "Licença" as const },
  { id: 5, ordem: 5, matricula: "99.111-0", cpf: "555.555.555-55", patente: "Cb PM", nome: "Marcos Vinicius Pereira", guerra: "Vinicius", funcao: "Motorista", telefone: "21 95555-5555", status: "Ativo" as const },
  { id: 6, ordem: 6, matricula: "10.222-9", cpf: "666.666.666-66", patente: "Sd PM", nome: "Ana Clara Lima", guerra: "Clara", funcao: "Sentinela", telefone: "21 94444-6666", status: "Afastado" as const }
];

export const INITIAL_AUDIENCIAS: Audiencia[] = [
  { id: 1, data: '2026-04-10', hora: '14:30', local: '1ª Vara Criminal', processo: '0001234-56.2026.8.19.0001', policialIds: [1], status: 'Agendada' as const },
  { id: 2, data: '2026-04-12', hora: '09:00', local: 'Auditoria Militar', processo: '0009876-54.2026.8.19.0001', policialIds: [2], status: 'Realizada' as const },
];

export const getStatusClasses = (status: string) => {
  switch (status) {
    case 'Ativo': return 'bg-green-100 text-green-800';
    case 'Férias': return 'bg-yellow-100 text-yellow-800';
    case 'Licença': return 'bg-indigo-100 text-indigo-800';
    case 'Afastado': return 'bg-red-100 text-red-800';
    default: return 'bg-slate-100 text-slate-800';
  }
};

export const formatCPF = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
};

export const formatMatricula = (matricula: string) => {
  return matricula.replace(/(\d{2})(\d)/, '$1.$2')
                  .replace(/(\d{3})(\d)/, '$1-$2')
                  .replace(/(-\d)\d+?$/, '$1');
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
