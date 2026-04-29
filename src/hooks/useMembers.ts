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
    if (error.code === '42P01') return INITIAL_DATA;
    throw error;
  }
  return (data || []).map(toCamelCase).sort((a, b) => a.ordem - b.ordem);
};

export const useMembers = (showToast?: (msg: string, type: 'success' | 'danger') => void) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['members'],
    queryFn: fetchMembers,
    initialData: INITIAL_DATA
  });

  const mutation = useMutation({
    mutationFn: async (newMembers: Member[]) => {
      const oldMembers = queryClient.getQueryData<Member[]>(['members']) || [];
      const newIds = new Set(newMembers.map(m => m.id));
      const deletedIds = oldMembers.filter(m => !newIds.has(m.id)).map(m => m.id);
      
      if (deletedIds.length > 0) {
        const { error: delError } = await supabase.from('members').delete().in('id', deletedIds);
        if (delError) throw delError;
      }

      const membersData = newMembers.map(toSnakeCase);
      const { error: membersError } = await supabase.from('members').upsert(membersData);
      if (membersError) throw membersError;

      // Collect all child data
      const notifications: any[] = [];
      const anexos: any[] = [];
      const updatedIds = newMembers.map(m => m.id);

      newMembers.forEach(m => {
        if (m.notifications) {
          m.notifications.forEach(n => {
            notifications.push({ id: n.id, member_id: m.id, message: n.message, date: n.date, read: n.read });
          });
        }
        if (m.anexos) {
          m.anexos.forEach(a => {
            anexos.push({ id: a.id, member_id: m.id, name: a.name, url: a.url, type: a.type, date: a.date, size: a.size });
          });
        }
      });

      // To ensure consistency and avoid orphans, we delete all notifications and anexos 
      // for the updated members before re-inserting.
      // NOTE: For true atomicity, these operations should ideally be moved to a Supabase RPC function.
      await supabase.from('notifications').delete().in('member_id', updatedIds);
      await supabase.from('anexos').delete().in('member_id', updatedIds);

      if (notifications.length > 0) {
        const { error } = await supabase.from('notifications').insert(notifications);
        if (error) throw error;
      }
      if (anexos.length > 0) {
        const { error } = await supabase.from('anexos').insert(anexos);
        if (error) throw error;
      }
      return newMembers;
    },
    onMutate: async (newMembers) => {
      await queryClient.cancelQueries({ queryKey: ['members'] });
      const previousMembers = queryClient.getQueryData<Member[]>(['members']);
      queryClient.setQueryData(['members'], newMembers);
      return { previousMembers };
    },
    onError: (error, newMembers, context) => {
      console.error('Error syncing members:', error);
      if (context?.previousMembers) queryClient.setQueryData(['members'], context.previousMembers);
      if (showToast) showToast(`Erro ao salvar efetivo: ${(error as any).message || 'Desconhecido'}`, 'danger');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  return {
    members: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    updateMembers: mutation.mutate,
    updateMembersAsync: mutation.mutateAsync
  };
};
