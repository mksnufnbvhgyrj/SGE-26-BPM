import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from './lib/supabase';
import { Search, Download, Plus, Trash2, Users, CheckCircle, Sun, Activity, X, ArrowUpDown, FolderOpen, FileText, Settings, Menu, ChevronLeft, ChevronRight, Upload, ArrowRightLeft, Scale, Briefcase } from 'lucide-react';

import Clock from './components/Clock';

import { Status, Member, Audiencia, AuthState, Notification as AppNotification } from './types';
import UserDashboard from './components/UserDashboard';
import { INITIAL_DATA, INITIAL_AUDIENCIAS, PATENTES } from './utils/constants';
import { MemberRow } from './components/efetivo/MemberRow';
import { usePrefetch } from './hooks/usePrefetch';

const AudienciasPage = lazy(() => import('./pages/AudienciasPage'));
const FichaIndividualPage = lazy(() => import('./pages/FichaIndividualPage'));

const PageSkeleton = () => (
  <div className="animate-pulse p-6 space-y-4">
    <div className="h-8 bg-slate-200 rounded w-1/3" />
    <div className="h-32 bg-slate-200 rounded" />
    <div className="h-32 bg-slate-200 rounded" />
  </div>
);

export default function App() {
  const { prefetchMembers, prefetchAudiencias } = usePrefetch();
  const [authState, setAuthState] = useState<AuthState>({ role: null });
  const [activeAdminTab, setActiveAdminTab] = useState('efetivo');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [members, setMembers] = useState<Member[]>(INITIAL_DATA);
  const [audiencias, setAudiencias] = useState<Audiencia[]>(INITIAL_AUDIENCIAS);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Tenta ler das tabelas relacionais do Supabase
        const { data: membrosData, error: errMembros } = await supabase.from('membros').select('*').order('ordem', { ascending: true });
        const { data: audienciasData, error: errAudiencias } = await supabase.from('audiencias').select('*');
        
        if (!errMembros && membrosData && membrosData.length > 0) {
          setMembers(membrosData);
        } else {
          // Fallback na falta da tabela: tenta ler do modelo velho app_store para não quebrar a tela
          const { data } = await supabase.from('app_store').select('*');
          const memFallback = data?.find(d => d.key === 'members');
          if (memFallback) setMembers(memFallback.value);
        }

        if (!errAudiencias && audienciasData && audienciasData.length > 0) {
          setAudiencias(audienciasData);
        } else {
          // Fallback na falta da tabela
          const { data } = await supabase.from('app_store').select('*');
          const audFallback = data?.find(d => d.key === 'audiencias');
          if (audFallback) setAudiencias(audFallback.value);
        }

      } catch (err) {
        console.error('Falha ao carregar dados do Supabase:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadData();
  }, []);

  // Sincroniza membros alterados localmente para a tabela
  useEffect(() => {
    if (isLoadingData || members.length === 0) return;
    const timeoutId = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.from('app_store').upsert({ 
        key: 'members', 
        value: members,
        user_id: session?.user?.id
      }, { onConflict: 'user_id,key' });

      await supabase.from('membros').upsert(members, { onConflict: 'id' });
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [members, isLoadingData]);

  // Sincroniza audiencias alteradas localmente para a tabela
  useEffect(() => {
    if (isLoadingData || audiencias.length === 0) return;
    const timeoutId = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.from('app_store').upsert({ 
        key: 'audiencias', 
        value: audiencias,
        user_id: session?.user?.id
      }, { onConflict: 'user_id,key' });

      await supabase.from('audiencias').upsert(audiencias, { onConflict: 'id' });
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [audiencias, isLoadingData]);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const [filterStatus, setFilterStatus] = useState('');
  
  const [sortField, setSortField] = useState<keyof Member>('ordem');
  const [sortAsc, setSortAsc] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Member>>({ status: 'Ativo' });

  const [isAudienciaModalOpen, setIsAudienciaModalOpen] = useState(false);
  const [editingAudienciaId, setEditingAudienciaId] = useState<number | null>(null);
  const [audienciaFormData, setAudienciaFormData] = useState<Partial<Audiencia>>({ status: 'Agendada' });
  
  const [selectedFichaMemberId, setSelectedFichaMemberId] = useState<number | null>(null);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'danger' } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    setToast({ message, type });
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

  const handleSort = (field: keyof Member) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          showToast('A planilha parece estar vazia.', 'danger');
          return;
        }

        const currentMaxId = members.length > 0 ? Math.max(...members.map(m => m.id)) : 0;
        let nextId = currentMaxId + 1;

        const findKey = (row: Record<string, unknown>, candidates: string[]) => {
          const key = Object.keys(row).find(k => 
            candidates.some(c => k.toLowerCase().trim().includes(c.toLowerCase()))
          );
          return key ? row[key] : undefined;
        };

        const importedMembers: Member[] = data.map((row: Record<string, unknown>) => {
          const statusRaw = findKey(row, ['status', 'situação', 'situacao', 'estado']) || 'Ativo';
          let status: Status = 'Ativo';
          const sLower = String(statusRaw).toLowerCase();
          if (['férias', 'ferias', 'vacation'].some(s => sLower.includes(s))) status = 'Férias';
          else if (['licença', 'licenca', 'lts'].some(s => sLower.includes(s))) status = 'Licença';
          else if (['afastado', 'away'].some(s => sLower.includes(s))) status = 'Afastado';

          return {
            id: 0,
            ordem: Number(findKey(row, ['ordem', 'nº', 'posicao', 'posição'])) || 0,
            matricula: String(findKey(row, ['matricula', 'matrícula', 'id', 'registro']) || '').trim(),
            cpf: String(findKey(row, ['cpf', 'documento']) || '').trim(),
            patente: String(findKey(row, ['patente', 'grad', 'graduação', 'graduacao', 'posto']) || '').trim(),
            nome: String(findKey(row, ['nome', 'nome completo', 'policial']) || '').trim(),
            guerra: String(findKey(row, ['guerra', 'nome de guerra', 'conhecido']) || '').trim(),
            funcao: String(findKey(row, ['funcao', 'função', 'cargo', 'atribuição']) || '').trim(),
            telefone: String(findKey(row, ['telefone', 'celular', 'contato']) || '').trim(),
            email: String(findKey(row, ['email', 'e-mail', 'correio']) || '').trim(),
            status
          } as Member;
        });

        const updatedMembers = [...members];
        let importedCount = 0;
        let updatedCount = 0;

        importedMembers.forEach(newM => {
          if (!newM.nome || newM.nome === 'undefined' || newM.nome === '') return;
          
          const existingIndex = updatedMembers.findIndex(m => 
            (newM.matricula && m.matricula === newM.matricula) || 
            (newM.cpf && m.cpf === newM.cpf)
          );

          if (existingIndex >= 0) {
            updatedMembers[existingIndex] = { 
              ...updatedMembers[existingIndex], 
              ...newM, 
              id: updatedMembers[existingIndex].id,
              ordem: newM.ordem || updatedMembers[existingIndex].ordem
            };
            updatedCount++;
          } else {
            updatedMembers.push({ ...newM, id: nextId++ });
            importedCount++;
          }
        });

        setMembers(updatedMembers.sort((a, b) => a.ordem - b.ordem));
        showToast(`${importedCount} novos membros importados e ${updatedCount} atualizados.`, 'success');
        
        if (excelInputRef.current) excelInputRef.current.value = '';
      } catch (err) {
        console.error('Erro ao importar Excel:', err);
        showToast('Erro ao processar o arquivo Excel.', 'danger');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExportCSV = () => {
    const headers = ["Ordem", "Matrícula", "Patente", "Nome", "Nome Guerra", "Função", "Status"];
    const rows = filteredAndSortedMembers.map(m => [
      m.ordem, m.matricula, m.patente, m.nome, m.guerra, m.funcao, m.status
    ]);
    
    const escapeCSV = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
    
    // \uFEFF is the BOM (Byte Order Mark) to ensure Excel reads UTF-8 correctly
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.map(escapeCSV).join(",") + "\n" 
      + rows.map(e => e.map(escapeCSV).join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "efetivo_26bpm.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const openModal = (member?: Member) => {
    if (member) {
      setEditingId(member.id);
      setFormData(member);
    } else {
      setEditingId(null);
      setFormData({ status: 'Ativo' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ status: 'Ativo' });
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const currentMs = new Date().getTime();
    if (editingId) {
      const newNotification: AppNotification = {
        id: currentMs.toString(),
        message: 'Suas informações funcionais foram atualizadas pelo administrador.',
        date: new Date().toISOString(),
        read: false
      };
      setMembers(members.map(m => m.id === editingId ? { ...m, ...formData, notifications: [newNotification, ...(m.notifications || [])] } as Member : m));
      showToast('Registro atualizado com sucesso!');
    } else {
      const newMember = {
        ...formData,
        id: currentMs,
        ordem: members.length + 1,
      } as Member;
      setMembers([...members, newMember]);
      showToast('Novo militar adicionado!', 'success');
    }
    closeModal();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este registro?')) {
      setMembers(members.filter(m => m.id !== id));
      showToast('Registro removido.', 'danger');
      try {
        await supabase.from('membros').delete().eq('id', id);
      } catch (err) {
        console.error('Erro ao excluir membro do supabase', err);
      }
    }
  };

  const openAudienciaModal = (audiencia?: Audiencia) => {
    if (audiencia) {
      setEditingAudienciaId(audiencia.id);
      setAudienciaFormData(audiencia);
    } else {
      setEditingAudienciaId(null);
      setAudienciaFormData({ status: 'Agendada', policialIds: [] });
    }
    setIsAudienciaModalOpen(true);
  };

  const closeAudienciaModal = () => {
    setIsAudienciaModalOpen(false);
    setAudienciaFormData({ status: 'Agendada', policialIds: [] });
    setEditingAudienciaId(null);
  };

  const uniqueFuncoes = useMemo(() => [...new Set(members.map(m => m.funcao))].sort(), [members]);

  const filteredAndSortedMembers = members
    .filter(item => {
      const searchLower = debouncedSearch.toLowerCase();
      const matchSearch = item.nome.toLowerCase().includes(searchLower) || 
                          item.matricula.includes(searchLower) || 
                          item.funcao.toLowerCase().includes(searchLower);
      
      let matchStatus = true;
      if (filterStatus === 'Ativo') matchStatus = item.status === 'Ativo';
      if (filterStatus === 'Férias') matchStatus = item.status === 'Férias';
      if (filterStatus === 'Afastados') matchStatus = item.status === 'Licença' || item.status === 'Afastado';

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      
      const strA = typeof valA === 'string' ? valA.toLowerCase() : valA;
      const strB = typeof valB === 'string' ? valB.toLowerCase() : valB;
      
      if (strA < strB) return sortAsc ? -1 : 1;
      if (strA > strB) return sortAsc ? 1 : -1;
      return 0;
    });

  const handleSaveAudiencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!audienciaFormData.policialIds?.length) {
      showToast('Selecione pelo menos um policial convocado.', 'danger');
      return;
    }
    const currentMs = new Date().getTime();
    if (editingAudienciaId) {
      setAudiencias(audiencias.map(a => a.id === editingAudienciaId ? { ...a, ...audienciaFormData } as Audiencia : a));
      showToast('Audiência atualizada com sucesso!');
    } else {
      setAudiencias([...audiencias, { ...audienciaFormData, id: currentMs } as Audiencia]);
      showToast('Nova audiência adicionada!', 'success');
    }
    closeAudienciaModal();
  };

  const handleAddPolicialToAudiencia = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    if (id && !audienciaFormData.policialIds?.includes(id)) {
      setAudienciaFormData(prev => ({ ...prev, policialIds: [...(prev.policialIds || []), id] }));
    }
    e.target.value = '';
  };

  const handleRemovePolicialFromAudiencia = (id: number) => {
    setAudienciaFormData(prev => ({ ...prev, policialIds: (prev.policialIds || []).filter(pid => pid !== id) }));
  };

  const handleAudienciaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      if (file) showToast('Por favor, selecione apenas arquivos PDF.', 'danger');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('O arquivo excede o limite de 5MB.', 'danger');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const newPdf = { id: Math.random().toString(36).substring(7), name: file.name, url: reader.result as string };
      setAudienciaFormData(prev => ({ ...prev, pdfs: [...(prev.pdfs || []), newPdf] }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAudienciaPdf = (pdfId: string) => {
    setAudienciaFormData(prev => ({ ...prev, pdfs: (prev.pdfs || []).filter(p => p.id !== pdfId) }));
  };

  const handleDeleteAudiencia = async (id: number) => {
    if (window.confirm('Tem certeza que deseja remover esta audiência?')) {
      setAudiencias(audiencias.filter(a => a.id !== id));
      showToast('Audiência removida.', 'danger');
      try {
        await supabase.from('audiencias').delete().eq('id', id);
      } catch (err) {
        console.error('Erro ao excluir audiência do supabase', err);
      }
    }
  };

  const stats = {
    total: members.length,
    active: members.filter(d => d.status === 'Ativo').length,
    vacation: members.filter(d => d.status === 'Férias').length,
    away: members.filter(d => ['Licença', 'Afastado'].includes(d.status)).length
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-700">Carregando dados...</h2>
        <p className="text-slate-500 mt-2">Conectando ao banco de dados</p>
      </div>
    );
  }

  if (authState.role === 'USER') {
    const liveUser = members.find(m => m.id === authState.user!.id) || authState.user!;
    return (
      <UserDashboard 
        user={liveUser} 
        audiencias={audiencias} 
        onLogout={() => setAuthState({ role: null })} 
        onMarkNotificationsAsRead={() => {
          setMembers(members.map(m => 
            m.id === liveUser.id 
              ? { ...m, notifications: m.notifications?.map(n => ({ ...n, read: true })) } 
              : m
          ));
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      {/* Sidebar (Desktop) */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-slate-900 text-slate-300 flex flex-col shrink-0 hidden md:flex relative`}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-5 bg-slate-800 text-slate-300 hover:text-white rounded-full p-1 border border-slate-700 z-10"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-6'} bg-slate-950 text-white font-bold text-lg gap-2 shrink-0 transition-all overflow-hidden whitespace-nowrap`}>
          <span className="text-blue-800 bg-blue-100 px-2 py-0.5 rounded text-sm shrink-0 font-bold">26º</span>
          {!isSidebarCollapsed && <span>BPM SGE</span>}
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto overflow-x-hidden">
          <button onMouseEnter={prefetchMembers} onClick={() => setActiveAdminTab('efetivo')} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'efetivo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`} title="Efetivo">
            <Users className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Efetivo</span>}
          </button>
          <button onMouseEnter={prefetchAudiencias} onClick={() => setActiveAdminTab('audiencias')} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'audiencias' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`} title="Audiências">
            <Scale className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Audiências</span>}
          </button>
          <button onClick={() => setActiveAdminTab('permutas')} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'permutas' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`} title="Permutas">
            <ArrowRightLeft className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Permutas</span>}
          </button>
          <button onClick={() => setActiveAdminTab('administrativo')} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'administrativo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`} title="Administrativo">
            <Briefcase className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Administrativo</span>}
          </button>
          <button onClick={() => setActiveAdminTab('configuracoes')} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'configuracoes' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`} title="Configurações">
            <Settings className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Configurações</span>}
          </button>
        </nav>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') setIsMobileMenuOpen(false); }} role="button" tabIndex={0} aria-label="Fechar menu" >
          <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="presentation">
            <div className="h-16 flex items-center justify-between px-6 bg-slate-950 text-white font-bold text-lg shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-blue-800 bg-blue-100 px-2 py-0.5 rounded text-sm font-bold">26º BPM</span>
                SGE
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
              <button onMouseEnter={prefetchMembers} onClick={() => { setActiveAdminTab('efetivo'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'efetivo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Users className="w-5 h-5" /> Efetivo
              </button>
              <button onMouseEnter={prefetchAudiencias} onClick={() => { setActiveAdminTab('audiencias'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'audiencias' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Scale className="w-5 h-5" /> Audiências
              </button>
              <button onClick={() => { setActiveAdminTab('permutas'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'permutas' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <ArrowRightLeft className="w-5 h-5" /> Permutas
              </button>
              <button onClick={() => { setActiveAdminTab('administrativo'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'administrativo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Briefcase className="w-5 h-5" /> Administrativo
              </button>
              <button onClick={() => { setActiveAdminTab('configuracoes'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'configuracoes' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Settings className="w-5 h-5" /> Configurações
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-100">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate">
              {activeAdminTab === 'efetivo' && 'Controle de Efetivo'}
              {activeAdminTab === 'audiencias' && 'Gestão de Audiências'}
              {activeAdminTab === 'permutas' && 'Gestão de Permutas'}
              {activeAdminTab === 'administrativo' && 'Módulo Administrativo'}
              {activeAdminTab === 'ficha_individual' && 'Ficha Individual'}
              {activeAdminTab === 'configuracoes' && 'Configurações do Sistema'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Clock />
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold" title="Administrador">
              AD
            </div>
          </div>
        </header>

        {/* Content Area */}
        {activeAdminTab === 'efetivo' && (
          <div className="flex-1 flex flex-col p-2 sm:p-4 md:p-6 overflow-hidden">
            {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-2 md:mb-4 shrink-0">
        <button 
          onClick={() => setFilterStatus('')}
          className={`bg-white p-2 md:p-5 rounded-lg shadow-sm border flex flex-col text-left transition-all ${filterStatus === '' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
        >
          <Users className="w-4 h-4 md:w-7 md:h-7 mb-1 md:mb-2 text-slate-700" />
          <div className="text-lg md:text-3xl font-bold text-slate-900 leading-tight md:leading-normal">{stats.total}</div>
          <div className="text-[9px] md:text-xs text-slate-500 uppercase tracking-wide font-semibold mt-0.5 md:mt-1">Efetivo Total</div>
        </button>
        <button 
          onClick={() => setFilterStatus('Ativo')}
          className={`bg-white p-2 md:p-5 rounded-lg shadow-sm border-x border-t border-b-2 md:border-b-4 border-b-green-500 flex flex-col text-left transition-all ${filterStatus === 'Ativo' ? 'border-x-green-500 border-t-green-500 ring-2 ring-green-500/20 bg-green-50/50' : 'border-x-slate-200 border-t-slate-200 hover:bg-slate-50'}`}
        >
          <CheckCircle className="w-4 h-4 md:w-7 md:h-7 mb-1 md:mb-2 text-green-500" />
          <div className="text-lg md:text-3xl font-bold text-green-600 leading-tight md:leading-normal">{stats.active}</div>
          <div className="text-[9px] md:text-xs text-slate-500 uppercase tracking-wide font-semibold mt-0.5 md:mt-1">Pronto Emprego</div>
        </button>
        <button 
          onClick={() => setFilterStatus('Férias')}
          className={`bg-white p-2 md:p-5 rounded-lg shadow-sm border-x border-t border-b-2 md:border-b-4 border-b-yellow-500 flex flex-col text-left transition-all ${filterStatus === 'Férias' ? 'border-x-yellow-500 border-t-yellow-500 ring-2 ring-yellow-500/20 bg-yellow-50/50' : 'border-x-slate-200 border-t-slate-200 hover:bg-slate-50'}`}
        >
          <Sun className="w-4 h-4 md:w-7 md:h-7 mb-1 md:mb-2 text-yellow-500" />
          <div className="text-lg md:text-3xl font-bold text-yellow-600 leading-tight md:leading-normal">{stats.vacation}</div>
          <div className="text-[9px] md:text-xs text-slate-500 uppercase tracking-wide font-semibold mt-0.5 md:mt-1">Férias</div>
        </button>
        <button 
          onClick={() => setFilterStatus('Afastados')}
          className={`bg-white p-2 md:p-5 rounded-lg shadow-sm border-x border-t border-b-2 md:border-b-4 border-b-red-500 flex flex-col text-left transition-all ${filterStatus === 'Afastados' ? 'border-x-red-500 border-t-red-500 ring-2 ring-red-500/20 bg-red-50/50' : 'border-x-slate-200 border-t-slate-200 hover:bg-slate-50'}`}
        >
          <Activity className="w-4 h-4 md:w-7 md:h-7 mb-1 md:mb-2 text-red-500" />
          <div className="text-lg md:text-3xl font-bold text-red-600 leading-tight md:leading-normal">{stats.away}</div>
          <div className="text-[9px] md:text-xs text-slate-500 uppercase tracking-wide font-semibold mt-0.5 md:mt-1">LTS / Afastados</div>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2 items-center mb-2 md:mb-4 shrink-0">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-4 h-4 md:w-5 md:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, matrícula, função..." 
            className="w-full pl-9 pr-3 py-1.5 md:pl-10 md:pr-4 md:py-2 text-sm md:text-base border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="file" 
            ref={excelInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
          <button 
            onClick={() => excelInputRef.current?.click()}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium text-xs md:text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            title="Importar de Planilha Excel"
          >
            <Upload className="w-4 h-4" /> Importar
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium text-xs md:text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button 
            onClick={() => openModal()}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-xs md:text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4" /> Novo Membro
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="overflow-auto flex-1 contain-layout gpu-layer smooth-scroll">
          <table className="w-full border-collapse text-sm whitespace-nowrap">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                {[
                  { key: 'ordem', label: 'Ordem', hideOnMobile: true },
                  { key: 'matricula', label: 'Matrícula', hideOnMobile: true },
                  { key: 'patente', label: 'Patente', hideOnMobile: false },
                  { key: 'nome', label: 'Nome', hideOnMobile: false },
                  { key: 'funcao', label: 'Função', hideOnMobile: true },
                  { key: 'status', label: 'Status', hideOnMobile: false }
                ].map((col) => (
                  <th 
                    key={col.key}
                    onClick={() => handleSort(col.key as keyof Member)}
                    className={`px-2 py-2 md:px-4 md:py-3 text-left font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 cursor-pointer hover:bg-slate-100 hover:text-blue-600 select-none transition-colors ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                  >
                    <div className="flex items-center gap-1 text-xs md:text-sm">
                      {col.label}
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </div>
                  </th>
                ))}
                <th className="px-2 py-2 md:px-4 md:py-3 text-center font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 hidden md:table-cell text-xs md:text-sm">
                  Doc
                </th>
                <th className="px-2 py-2 md:px-4 md:py-3 text-right font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-xs md:text-sm">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedMembers.length > 0 ? (
                filteredAndSortedMembers.map((item) => (
                  <MemberRow 
                    key={item.id} 
                    member={item}
                    onEdit={openModal}
                    onDelete={handleDelete}
                    onClick={(id) => {
                      setSelectedFichaMemberId(id);
                      setActiveAdminTab('ficha_individual');
                    }}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FolderOpen className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-base">Nenhum registro encontrado com os filtros atuais.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {activeAdminTab === 'audiencias' && (
    <Suspense fallback={<PageSkeleton />}>
      <AudienciasPage 
        audiencias={audiencias}
        members={members}
        openAudienciaModal={openAudienciaModal}
        handleDeleteAudiencia={handleDeleteAudiencia}
      />
    </Suspense>
  )}

  {activeAdminTab === 'permutas' && (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <h3 className="text-lg font-bold text-slate-800">Gestão de Permutas</h3>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" /> Registrar Permuta
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-8 text-center flex-1">
        <ArrowRightLeft className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Módulo em Desenvolvimento</h2>
        <p className="text-slate-500 max-w-md">O controle de trocas de serviço (permutas) será liberado nas próximas atualizações. Acompanhe!</p>
      </div>
    </div>
  )}

  {activeAdminTab === 'configuracoes' && (
    <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50">
      
      {/* Implementação do Padrão do Usuário: Tipografia Básica e Hierarquia */}
      <div className="max-w-4xl mx-auto space-y-8 text-left">
        
        {/* Style Guide Canvas */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-8 border-b border-slate-100 pb-4">
            <span className="text-blue-800 bg-blue-100 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
              Guia de Estilos / Style Guide
            </span>
            <p className="text-gray-600">
              Padrões visuais, hierarquia de texto e tokens de design adotados pelo sistema.
            </p>
          </div>

          <div className="space-y-6">
            
            {/* Hierarquia solicitada */}
            <div className="p-6 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4 block">Hierarquia de Títulos (H1, H2, H3)</span>
              <div className="space-y-4">
                
                <h1 className="text-2xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3">
                  Dashboard
                </h1>
                
                <div className="pl-4 space-y-4">
                  <h2 className="text-xl font-semibold text-slate-800">
                    Resumo
                  </h2>
                  
                  <div className="pl-4">
                    <h3 className="text-lg font-medium text-slate-700">
                      Detalhes
                    </h3>
                    <p className="text-gray-600 mt-2 text-sm max-w-lg">
                      O uso das tags semânticas corretas e tamanhos progressivos (`text-2xl`, `text-xl`, `text-lg`) garante acessibilidade e organização da informação na tela.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Design Tokens Extras */}
            <div className="p-6 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4 block">Design Tokens Individuais</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">Badge Secundário</h4>
                  <span className="text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full text-sm font-medium">
                    Badge
                  </span>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">Texto Secundário Padrão</h4>
                  <p className="text-gray-600">
                    Texto secundário
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )}

  {activeAdminTab === 'administrativo' && (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <h3 className="text-lg font-medium text-slate-900 mb-4">Módulo Administrativo</h3>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <button 
          onClick={() => setActiveAdminTab('ficha_individual')}
          className="bg-white p-4 md:p-8 rounded-lg border border-slate-200 flex flex-col items-center justify-center gap-2 md:gap-4 hover:bg-slate-50 hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <FileText className="w-5 h-5 md:w-8 md:h-8" />
          </div>
          <span className="font-medium text-slate-800 text-sm md:text-lg">Ficha Individual</span>
        </button>
      </div>
    </div>
  )}

  {activeAdminTab === 'ficha_individual' && (
    <Suspense fallback={<PageSkeleton />}>
      <FichaIndividualPage 
        members={members} 
        onUpdateMember={(id, updates) => setMembers(members.map(m => m.id === id ? { ...m, ...updates } : m))} 
        selectedFichaMemberId={selectedFichaMemberId} 
        setSelectedFichaMemberId={setSelectedFichaMemberId}
        onClose={() => {
          setActiveAdminTab('administrativo');
          setSelectedFichaMemberId(null);
        }}
      />
    </Suspense>
  )}
</main>

{/* Modal Audiência */}
      {isAudienciaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-audiencia-title"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h3 id="modal-audiencia-title" className="text-lg font-bold text-slate-900">
                {editingAudienciaId ? 'Editar Audiência' : 'Agendar Nova Audiência'}
              </h3>
              <button 
                onClick={closeAudienciaModal} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAudiencia} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="aud-data" className="text-sm font-medium text-slate-700">Data *</label>
                    <input 
                      id="aud-data"
                      type="date" required
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={audienciaFormData.data || ''} onChange={e => setAudienciaFormData({...audienciaFormData, data: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="aud-hora" className="text-sm font-medium text-slate-700">Hora *</label>
                    <input 
                      id="aud-hora"
                      type="time" required
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={audienciaFormData.hora || ''} onChange={e => setAudienciaFormData({...audienciaFormData, hora: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="aud-local" className="text-sm font-medium text-slate-700">Local (Vara/Fórum) *</label>
                    <input 
                      id="aud-local"
                      type="text" required placeholder="Ex: 1ª Vara Criminal da Comarca..."
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={audienciaFormData.local || ''} onChange={e => setAudienciaFormData({...audienciaFormData, local: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="aud-processo" className="text-sm font-medium text-slate-700">Número do Processo *</label>
                    <input 
                      id="aud-processo"
                      type="text" required placeholder="Ex: 0001234-56.2026.8.19.0001"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-sm"
                      value={audienciaFormData.processo || ''} onChange={e => setAudienciaFormData({...audienciaFormData, processo: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="aud-policias" className="text-sm font-medium text-slate-700">Policiais Convocados *</label>
                    
                    {audienciaFormData.policialIds && audienciaFormData.policialIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-1">
                        {audienciaFormData.policialIds.map(pid => {
                          const policial = members.find(m => m.id === pid);
                          if (!policial) return null;
                          return (
                            <div key={pid} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">
                              <span className="text-xs font-medium">{policial.patente} {policial.guerra}</span>
                              <button type="button" onClick={() => handleRemovePolicialFromAudiencia(pid)} className="text-blue-400 hover:text-blue-600">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <select 
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      onChange={handleAddPolicialToAudiencia}
                      value=""
                    >
                      <option value="">Adicionar policial...</option>
                      {members.filter(m => !(audienciaFormData.policialIds || []).includes(m.id)).map(m => (
                        <option key={m.id} value={m.id}>{m.patente} {m.nome} ({m.matricula})</option>
                      ))}
                    </select>
                    {(!audienciaFormData.policialIds || audienciaFormData.policialIds.length === 0) && (
                      <span className="text-xs text-red-500">Selecione pelo menos um policial.</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="aud-status" className="text-sm font-medium text-slate-700">Status *</label>
                    <select 
                      id="aud-status"
                      required
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={audienciaFormData.status || 'Agendada'} onChange={e => setAudienciaFormData({...audienciaFormData, status: e.target.value as Audiencia['status']})}
                    >
                      <option value="Agendada">Agendada</option>
                      <option value="Realizada">Realizada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="aud-obs" className="text-sm font-medium text-slate-700">Observações</label>
                    <textarea 
                      id="aud-obs"
                      rows={3} placeholder="Informações adicionais..."
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                      value={audienciaFormData.observacoes || ''} onChange={e => setAudienciaFormData({...audienciaFormData, observacoes: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700" id="docs-label">Documentos Anexos (PDFs)</span>
                    <div className="flex flex-col gap-3" aria-labelledby="docs-label">
                      {audienciaFormData.pdfs && audienciaFormData.pdfs.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {audienciaFormData.pdfs.map(pdf => (
                            <div key={pdf.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-slate-50">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-5 h-5 text-red-500 shrink-0" />
                                <span className="text-sm text-slate-700 truncate">{pdf.name}</span>
                              </div>
                              <button type="button" aria-label="Excluir item" onClick={() => handleRemoveAudienciaPdf(pdf.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2" title="Remover PDF">
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 cursor-pointer transition-colors text-sm font-medium">
                          <Plus className="w-4 h-4" />
                          <span>Adicionar PDF</span>
                          <input type="file" accept=".pdf" className="hidden" onChange={handleAudienciaFileUpload} />
                        </label>
                        {(!audienciaFormData.pdfs || audienciaFormData.pdfs.length === 0) && (
                          <span className="text-xs text-slate-500">Nenhum arquivo selecionado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={closeAudienciaModal} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  Salvar Audiência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-militar-title"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h3 id="modal-militar-title" className="text-lg font-bold text-slate-900">
                {editingId ? 'Editar Militar' : 'Adicionar Novo Militar'}
              </h3>
              <button 
                onClick={closeModal} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="militar-mat" className="text-sm font-medium text-slate-700">Matrícula *</label>
                    <input 
                      id="militar-mat"
                      type="text" required placeholder="Ex: 123.456-7"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.matricula || ''} onChange={e => setFormData({...formData, matricula: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="militar-cpf" className="text-sm font-medium text-slate-700">CPF *</label>
                    <input 
                      id="militar-cpf"
                      type="text" required placeholder="Ex: 111.111.111-11"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="militar-pat" className="text-sm font-medium text-slate-700">Patente *</label>
                    <select 
                      id="militar-pat"
                      required
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      value={formData.patente || ''} onChange={e => setFormData({...formData, patente: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {PATENTES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="militar-nome" className="text-sm font-medium text-slate-700">Nome Completo *</label>
                    <input 
                      id="militar-nome"
                      type="text" required placeholder="Nome completo do policial"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="militar-guerra" className="text-sm font-medium text-slate-700">Nome de Guerra</label>
                    <input 
                      id="militar-guerra"
                      type="text" placeholder="Nome na tarjeta"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.guerra || ''} onChange={e => setFormData({...formData, guerra: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="militar-funcao" className="text-sm font-medium text-slate-700">Função</label>
                    <input 
                      id="militar-funcao"
                      type="text" list="funcoesList" placeholder="Ex: Patrulha"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.funcao || ''} onChange={e => setFormData({...formData, funcao: e.target.value})}
                    />
                    <datalist id="funcoesList">
                      {uniqueFuncoes.map(f => <option key={f} value={f} />)}
                    </datalist>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="militar-tel" className="text-sm font-medium text-slate-700">Telefone</label>
                    <input 
                      id="militar-tel"
                      type="tel" placeholder="(21) 90000-0000"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="militar-email" className="text-sm font-medium text-slate-700">Email</label>
                    <input 
                      id="militar-email"
                      type="email" placeholder="email@exemplo.com"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="militar-status" className="text-sm font-medium text-slate-700">Status Operacional</label>
                    <select 
                      id="militar-status"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      value={formData.status || 'Ativo'} onChange={e => setFormData({...formData, status: e.target.value as Status})}
                    >
                      <option value="Ativo">🟢 Ativo - Disponível para Serviço</option>
                      <option value="Férias">🟡 Férias Regulamentares</option>
                      <option value="Licença">🔵 Licença Médica/Especial</option>
                      <option value="Afastado">🔴 Afastado/Outros</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="militar-pdf" className="text-sm font-medium text-slate-700">Documento Anexo (PDF)</label>
                    <input 
                      id="militar-pdf"
                      type="file" accept=".pdf"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file && file.type === 'application/pdf') {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('O arquivo excede o limite de 5MB.');
                            e.target.value = '';
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64String = reader.result as string;
                            setFormData(prev => ({...prev, pdfName: file.name, pdfUrl: base64String}));
                          };
                          reader.readAsDataURL(file);
                        } else if (file) {
                          alert('Por favor, selecione um arquivo PDF válido.');
                          e.target.value = '';
                        }
                      }}
                    />
                    {formData.pdfName && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <FileText className="w-3 h-3" /> Arquivo atual: {formData.pdfName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0 rounded-b-xl">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white font-medium ${toast.type === 'success' ? 'bg-slate-800' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Trash2 className="w-5 h-5" />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
