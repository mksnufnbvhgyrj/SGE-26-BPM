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

export const updateAudienciasOnSupabase = async (audiencias: Audiencia[]) => {
  const audienciasData = audiencias.map(a => ({
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
  
  // Members mapping
  const audienciaMembros: any[] = [];
  const audienciaPdfs: any[] = [];
  
  audiencias.forEach(a => {
    if (a.policialIds) {
      a.policialIds.forEach(memberId => {
        audienciaMembros.push({
          audiencia_id: a.id,
          member_id: memberId
        });
      });
    }
    if (a.pdfs) {
      a.pdfs.forEach(pdf => {
        audienciaPdfs.push({
          id: pdf.id,
          audiencia_id: a.id,
          name: pdf.name,
          url: pdf.url
        });
      });
    }
  });

  // To properly sync N-M we should delete the old associations and re-insert 
  // (In production it's better to calculate differences)
  // But given that we want the app to be resilient and upsertable, we do our best.

  if (audienciaMembros.length > 0) {
    await supabase.from('audiencia_membros').upsert(audienciaMembros);
  }
  
  if (audienciaPdfs.length > 0) {
    await supabase.from('audiencia_pdfs').upsert(audienciaPdfs);
  }

  return audiencias;
};

export const useAudiencias = (showToast?: (msg: string, type: 'success' | 'danger') => void) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['audiencias'],
    queryFn: fetchAudiencias,
    initialData: INITIAL_AUDIENCIAS
  });

  const mutation = useMutation({
    mutationFn: updateAudienciasOnSupabase,
    onSuccess: (data) => {
      queryClient.setQueryData(['audiencias'], data);
    },
    onError: (error: any) => {
      console.error('Error syncing audiencias:', error);
      if (showToast) showToast(`Erro ao salvar audiências: ${error.message || 'Desconhecido'}`, 'danger');
    }
  });

  return {
    audiencias: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    updateAudiencias: mutation.mutate,
    updateAudienciasAsync: mutation.mutateAsync
  };
};
