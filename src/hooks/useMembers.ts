import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Member, Notification, Anexo } from '../types';
import { INITIAL_DATA } from '../utils/constants';

// Mappers to handle snake_case to camelCase and vice-versa
const toSnakeCase = (member: Member) => ({
  id: member.id,
  ordem: member.ordem,
  matricula: member.matricula,
  cpf: member.cpf,
  patente: member.patente,
  nome: member.nome,
  guerra: member.guerra,
  funcao: member.funcao,
  telefone: member.telefone,
  email: member.email,
  status: member.status,
  pdf_name: member.pdfName,
  pdf_url: member.pdfUrl,
  photo_url: member.photoUrl,
  quadro: member.quadro,
  rg_militar: member.rgMilitar,
  data_emissao_rg: member.dataEmissaoRg,
  comportamento: member.comportamento,
  vinculo: member.vinculo,
  data_nascimento: member.dataNascimento,
  cidade_nascimento: member.cidadeNascimento,
  uf_nascimento: member.ufNascimento,
  pasep: member.pasep,
  reg_civil: member.regCivil,
  pai: member.pai,
  mae: member.mae,
  tipo_sanguineo: member.tipoSanguineo,
  fator_rh: member.fatorRh,
  data_inclusao: member.dataInclusao
});

const toCamelCase = (row: any): Member => ({
  id: row.id,
  ordem: row.ordem,
  matricula: row.matricula,
  cpf: row.cpf,
  patente: row.patente,
  nome: row.nome,
  guerra: row.guerra,
  funcao: row.funcao,
  telefone: row.telefone,
  email: row.email,
  status: row.status,
  pdfName: row.pdf_name,
  pdfUrl: row.pdf_url,
  photoUrl: row.photo_url,
  quadro: row.quadro,
  rgMilitar: row.rg_militar,
  dataEmissaoRg: row.data_emissao_rg,
  comportamento: row.comportamento,
  vinculo: row.vinculo,
  dataNascimento: row.data_nascimento,
  cidadeNascimento: row.cidade_nascimento,
  ufNascimento: row.uf_nascimento,
  pasep: row.pasep,
  regCivil: row.reg_civil,
  pai: row.pai,
  mae: row.mae,
  tipoSanguineo: row.tipo_sanguineo,
  fatorRh: row.fator_rh,
  dataInclusao: row.data_inclusao,
  notifications: row.notifications || [],
  anexos: row.anexos || []
});

export const fetchMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase
    .from('members')
    .select('*, notifications(*), anexos(*)');
  
  if (error) {
    if (error.code === '42P01') {
      // Table doesn't exist yet, return initial data
      return INITIAL_DATA;
    }
    throw error;
  }
  
  if (!data || data.length === 0) {
    return INITIAL_DATA;
  }

  return data.map(toCamelCase).sort((a, b) => a.ordem - b.ordem);
};

export const updateMembersOnSupabase = async (members: Member[]) => {
  // We use batch upsert for members.
  const membersData = members.map(toSnakeCase);
  const { error: membersError } = await supabase.from('members').upsert(membersData);
  if (membersError) throw membersError;

  // Insert notifications and anexos that might be new
  const notifications: any[] = [];
  const anexos: any[] = [];
  
  members.forEach(m => {
    if (m.notifications) {
      m.notifications.forEach(n => {
        notifications.push({
          id: n.id,
          member_id: m.id,
          message: n.message,
          date: n.date,
          read: n.read
        });
      });
    }
    if (m.anexos) {
      m.anexos.forEach(a => {
        anexos.push({
          id: a.id,
          member_id: m.id,
          name: a.name,
          url: a.url,
          type: a.type,
          date: a.date,
          size: a.size
        });
      });
    }
  });

  if (notifications.length > 0) {
    const { error } = await supabase.from('notifications').upsert(notifications);
    if (error) throw error;
  }
  
  if (anexos.length > 0) {
    const { error } = await supabase.from('anexos').upsert(anexos);
    if (error) throw error;
  }

  return members;
};

export const useMembers = (showToast?: (msg: string, type: 'success' | 'danger') => void) => {

  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['members'],
    queryFn: fetchMembers,
    initialData: INITIAL_DATA
  });

  const mutation = useMutation({
    mutationFn: updateMembersOnSupabase,
    onSuccess: (data) => {
      queryClient.setQueryData(['members'], data);
    },
    onError: (error: any) => {
      console.error('Error syncing members:', error);
      if (showToast) showToast(`Erro ao salvar efetivo: ${error.message || 'Desconhecido'}`, 'danger');
    }
  });

  return {
    members: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    updateMembers: mutation.mutate,
    updateMembersAsync: mutation.mutateAsync
  };
};
