import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Audiencia } from '../types';
import { INITIAL_AUDIENCIAS } from '../utils/constants';

export const fetchAudiencias = async (): Promise<Audiencia[]> => {
  const { data, error } = await supabase
    .from('audiencias')
    .select('*, audiencia_membros(member_id), audiencia_pdfs(*)');
    
  if (error) {
    if (error.code === '42P01') {
      return INITIAL_AUDIENCIAS;
    }
    throw error;
  }
  
  if (!data || data.length === 0) {
    return INITIAL_AUDIENCIAS;
  }

  return data.map(row => ({
    id: row.id,
    data: row.data,
    hora: row.hora,
    local: row.local,
    processo: row.processo,
    status: row.status,
    observacoes: row.observacoes || undefined,
    policialIds: row.audiencia_membros?.map((am: any) => am.member_id) || [],
    pdfs: row.audiencia_pdfs || []
  }));
};

export const useAudiencias = (showToast?: (msg: string, type: 'success' | 'danger') => void) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['audiencias'],
    queryFn: fetchAudiencias,
    initialData: INITIAL_AUDIENCIAS
  });

  const mutation = useMutation({
    mutationFn: async (newAudiencias: Audiencia[]) => {
      const oldAudiencias = queryClient.getQueryData<Audiencia[]>(['audiencias']) || [];
      const newIds = new Set(newAudiencias.map(a => a.id));
      const deletedIds = oldAudiencias.filter(a => !newIds.has(a.id)).map(a => a.id);
      
      // Remove audiências excluídas (cascata deleta audiencia_membros e audiencia_pdfs)
      if (deletedIds.length > 0) {
        const { error: delError } = await supabase
          .from('audiencias')
          .delete()
          .in('id', deletedIds);
        if (delError) throw delError;
      }

      // Prepara upsert
      const audienciasData = newAudiencias.map(a => ({
        id: a.id,
        data: a.data,
        hora: a.hora,
        local: a.local,
        processo: a.processo,
        status: a.status,
        observacoes: a.observacoes
      }));
      
      const { error: audError } = await supabase.from('audiencias').upsert(audienciasData);
      if (audError) throw audError;
      
      // Sincroniza membros e PDFs: para cada audiência, remove associações antigas e reinsere
      for (const audiencia of newAudiencias) {
        // Remove associações antigas
        await supabase.from('audiencia_membros').delete().eq('audiencia_id', audiencia.id);
        if (audiencia.policialIds && audiencia.policialIds.length > 0) {
          const membrosData = audiencia.policialIds.map(mid => ({
            audiencia_id: audiencia.id,
            member_id: mid
          }));
          await supabase.from('audiencia_membros').upsert(membrosData);
        }

        await supabase.from('audiencia_pdfs').delete().eq('audiencia_id', audiencia.id);
        if (audiencia.pdfs && audiencia.pdfs.length > 0) {
          const pdfsData = audiencia.pdfs.map(pdf => ({
            id: pdf.id,
            audiencia_id: audiencia.id,
            name: pdf.name,
            url: pdf.url
          }));
          await supabase.from('audiencia_pdfs').upsert(pdfsData);
        }
      }

      return newAudiencias;
    },
    onMutate: async (newAudiencias) => {
      await queryClient.cancelQueries({ queryKey: ['audiencias'] });
      const previousAudiencias = queryClient.getQueryData<Audiencia[]>(['audiencias']);
      queryClient.setQueryData(['audiencias'], newAudiencias);
      return { previousAudiencias };
    },
    onError: (error, newAudiencias, context) => {
      console.error('Error syncing audiencias:', error);
      if (context?.previousAudiencias) {
        queryClient.setQueryData(['audiencias'], context.previousAudiencias);
      }
      if (showToast) showToast(`Erro ao salvar audiências: ${error.message || 'Desconhecido'}`, 'danger');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['audiencias'] });
    },
  });

  return {
    audiencias: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    updateAudiencias: mutation.mutate,
    updateAudienciasAsync: mutation.mutateAsync
  };
};
