import { Member, Audiencia } from '../types';

export const INITIAL_AUDIENCIAS: Audiencia[] = [
  { id: 1, data: '2026-04-10', hora: '14:30', local: '1ª Vara Criminal', processo: '0001234-56.2026.8.19.0001', policialIds: [1], status: 'Agendada' },
  { id: 2, data: '2026-04-12', hora: '09:00', local: 'Auditoria Militar', processo: '0009876-54.2026.8.19.0001', policialIds: [2], status: 'Realizada' },
];

export const INITIAL_DATA: Member[] = [
  { id: 1, ordem: 1, matricula: "50.123-4", cpf: "111.111.111-11", patente: "Cap PM", nome: "Roberto Almeida da Costa", guerra: "R. Costa", funcao: "Cmte Cia", telefone: "21 99999-1111", status: "Ativo" },
  { id: 2, ordem: 2, matricula: "61.333-2", cpf: "222.222.222-22", patente: "1º Ten PM", nome: "Fernanda Montenegro Silva", guerra: "Montenegro", funcao: "P/1", telefone: "21 98888-2222", status: "Ativo" },
  { id: 3, ordem: 3, matricula: "77.444-5", cpf: "333.333.333-33", patente: "Subten PM", nome: "Carlos Eduardo Santos", guerra: "C. Eduardo", funcao: "Sargenteante", telefone: "21 97777-3333", status: "Férias" },
  { id: 4, ordem: 4, matricula: "88.555-6", cpf: "444.444.444-44", patente: "3º Sgt PM", nome: "Juliana Paes de Oliveira", guerra: "Paes", funcao: "Patrulha", telefone: "21 96666-4444", status: "Licença" },
  { id: 5, ordem: 5, matricula: "99.111-0", cpf: "555.555.555-55", patente: "Cb PM", nome: "Marcos Vinicius Pereira", guerra: "Vinicius", funcao: "Motorista", telefone: "21 95555-5555", status: "Ativo" },
  { id: 6, ordem: 6, matricula: "10.222-9", cpf: "666.666.666-66", patente: "Sd PM", nome: "Ana Clara Lima", guerra: "Clara", funcao: "Sentinela", telefone: "21 94444-6666", status: "Afastado" }
];

export const PATENTES = ["Sd PM", "Cb PM", "3º Sgt PM", "2º Sgt PM", "1º Sgt PM", "Subten PM", "Asp Of PM", "2º Ten PM", "1º Ten PM", "Cap PM", "Maj PM", "Ten Cel PM"];
