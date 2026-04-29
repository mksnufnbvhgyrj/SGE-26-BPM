import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Audiencia } from '../types';
import { INITIAL_AUDIENCIAS } from '../utils/constants';

export const fetchAudiencias = async (): Promise<Audiencia[]> => {
  const { data, error } = await supabase
    .from('audiencias')
    .select('*, audiencia_membros(member_id), audiencia_pdfs(*)');
    
  if (error) {
    if (error.code === '42P01') return INITIAL_AUDIENCIAS;
    throw error;
  }

  return (data || []).map(row => ({
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
      
      if (deletedIds.length > 0) {
        const { error: delError } = await supabase.from('audiencias').delete().in('id', deletedIds);
        if (delError) throw delError;
      }

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

      // Collect all child data and affected IDs
      const allMembrosData: any[] = [];
      const allPdfsData: any[] = [];
      const affectedAudIds = newAudiencias.map(a => a.id);

      newAudiencias.forEach(audiencia => {
        if (audiencia.policialIds && audiencia.policialIds.length > 0) {
          audiencia.policialIds.forEach(mid => {
            allMembrosData.push({ audiencia_id: audiencia.id, member_id: mid });
          });
        }
        if (audiencia.pdfs && audiencia.pdfs.length > 0) {
          audiencia.pdfs.forEach(pdf => {
            allPdfsData.push({
              id: pdf.id,
              audiencia_id: audiencia.id,
              name: pdf.name,
              url: pdf.url
            });
          });
        }
      });

      // Batched operations for better performance and consistency
      // Delete old relations for all affected audiencias first
      await supabase.from('audiencia_membros').delete().in('audiencia_id', affectedAudIds);
      await supabase.from('audiencia_pdfs').delete().in('audiencia_id', affectedAudIds);

      // Then insert new relations
      if (allMembrosData.length > 0) {
        const { error: mError } = await supabase.from('audiencia_membros').insert(allMembrosData);
        if (mError) throw mError;
      }
      if (allPdfsData.length > 0) {
        const { error: pError } = await supabase.from('audiencia_pdfs').insert(allPdfsData);
        if (pError) throw pError;
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
      if (context?.previousAudiencias) queryClient.setQueryData(['audiencias'], context.previousAudiencias);
      if (showToast) showToast(`Erro ao salvar audiências: ${(error as any).message || 'Desconhecido'}`, 'danger');
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
