export type Status = 'Ativo' | 'Férias' | 'Licença' | 'Afastado';

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

export interface Member {
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

export interface AudienciaPdf {
  id: string;
  name: string;
  url: string;
}

export interface Audiencia {
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

export type AuthRole = 'ADMIN' | 'USER' | null;

export interface AuthState {
  role: AuthRole;
  user?: Member;
}
