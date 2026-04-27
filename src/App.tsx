import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Search, Download, Plus, Edit2, Trash2, Users, CheckCircle, Sun, Activity, X, ArrowUpDown, FolderOpen, FileText, BarChart3, FileUp, Settings, LogOut, Menu, Scale, ChevronLeft, ChevronRight, Briefcase, User, Info, Layers, ShieldAlert, Crosshair, Paperclip, Stethoscope, History, Award, GraduationCap, Baby, Archive, Medal, Shirt, Palmtree, HeartPulse, Hospital, MapPin, CalendarOff, Calculator, TrendingUp, ChevronsUp, Dumbbell, Clock as ClockIcon, BookOpen, Microscope, Printer, Bell, FileSpreadsheet, File, Upload, UploadCloud, Phone, Mail } from 'lucide-react';

import { Status, Notification, Anexo, Member, AudienciaPdf, Audiencia, AuthRole, AuthState } from './types';

import { generateId } from './lib/idGenerator';
import { INITIAL_AUDIENCIAS, INITIAL_DATA, PATENTES } from './utils/constants';
import { Clock } from './components/Clock';
import { useMembers } from './hooks/useMembers';
import { useAudiencias } from './hooks/useAudiencias';
import { useSearchFilter } from './hooks/useSearchFilter';
import { formatBytes } from './utils/formatters';
import { uploadFile } from './lib/storage';
import { DropzoneArea } from './components/DropzoneArea';
import { StatusBadge } from './components/StatusBadge';
import { MemberAvatar } from './components/MemberAvatar';
import { SortableTableHeader } from './components/SortableTableHeader';
import { FichaIndividualPanel } from './components/FichaIndividualPanel';

import { LoginScreen } from './components/LoginScreen';
import { UserDashboard } from './components/UserDashboard';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({ role: null }); // CORRIGIDO: agora começa como null para mostrar tela de login
  const [activeAdminTab, setActiveAdminTab] = useState('efetivo');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'danger' } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    setToast({ message, type });
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

  const { members = [], updateMembers, isLoading: loadingMembers } = useMembers(showToast);
  const { audiencias = [], updateAudiencias, isLoading: loadingAudiencias } = useAudiencias(showToast);
  const isLoadingData = loadingMembers || loadingAudiencias;
  
  const setMembers = updateMembers;
  const setAudiencias = updateAudiencias;

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const {
    searchTerm: search,
    setSearchTerm: setSearch,
    filters,
    handleFilterChange,
    sortField,
    sortDirection,
    handleSort,
    filteredAndSortedItems: filteredAndSortedMembers
  } = useSearchFilter<Member>(members, ['nome', 'matricula', 'funcao', 'guerra'], 'ordem', 'asc');
  type SortableFields = 'ordem' | 'matricula' | 'cpf' | 'patente' | 'nome' | 'guerra' | 'funcao' | 'status';
  const sortAsc = sortDirection === 'asc';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Member>>({ status: 'Ativo' });

  const [isAudienciaModalOpen, setIsAudienciaModalOpen] = useState(false);
  const [editingAudienciaId, setEditingAudienciaId] = useState<number | null>(null);
  const [audienciaFormData, setAudienciaFormData] = useState<Partial<Audiencia>>({ status: 'Agendada' });
  
  const [fichaSearch, setFichaSearch] = useState('');
  const [selectedFichaMemberId, setSelectedFichaMemberId] = useState<number | null>(null);
  const [activeFichaSection, setActiveFichaSection] = useState<string | null>(null);
  const [fichaFormData, setFichaFormData] = useState<Partial<Member>>({});

  useEffect(() => {
    if (activeFichaSection === 'Dados Principais' && selectedFichaMemberId) {
      const member = members.find(m => m.id === selectedFichaMemberId);
      if (member) {
        setFichaFormData({
          guerra: member.guerra || '',
          patente: member.patente || '',
          nome: member.nome || '',
          matricula: member.matricula || '',
          status: member.status || 'Ativo',
          quadro: member.quadro || '',
          rgMilitar: member.rgMilitar || '',
          dataEmissaoRg: member.dataEmissaoRg || '',
          comportamento: member.comportamento || 'Bom',
          cpf: member.cpf || '',
          vinculo: member.vinculo || '',
          dataNascimento: member.dataNascimento || '',
          cidadeNascimento: member.cidadeNascimento || '',
          ufNascimento: member.ufNascimento || '',
          pasep: member.pasep || '',
          regCivil: member.regCivil || '',
          pai: member.pai || '',
          mae: member.mae || '',
          tipoSanguineo: member.tipoSanguineo || '',
          fatorRh: member.fatorRh || '',
          dataInclusao: member.dataInclusao || '',
        });
      }
    }
  }, [activeFichaSection, selectedFichaMemberId, members]);

  const handleSaveFicha = () => {
    if (selectedFichaMemberId) {
      const newNotification: Notification = {
        id: generateId(),
        message: 'Sua ficha individual (Dados Principais) foi atualizada pelo administrador.',
        date: new Date().toISOString(),
        read: false
      };
      setMembers(members.map(m => 
        m.id === selectedFichaMemberId 
          ? { ...m, ...fichaFormData, notifications: [newNotification, ...(m.notifications || [])] } 
          : m
      ));
      showToast('Dados Principais atualizados com sucesso!', 'success');
    }
  };

  const processAnexoFiles = async (files: FileList | File[]) => {
    if (!selectedFichaMemberId) return;
    const member = members.find(m => m.id === selectedFichaMemberId);
    if (!member) return;

    const validFiles = Array.from(files).filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`O arquivo ${file.name} excede o limite de 5MB.`, 'danger');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newAnexos: Anexo[] = [];

    try {
      showToast('Enviando anexos...', 'success');
      for (const file of validFiles) {
        const publicUrl = await uploadFile(file);
        newAnexos.push({
          id: generateId(),
          name: file.name,
          url: publicUrl,
          type: file.type || 'application/octet-stream',
          date: new Date().toISOString(),
          size: file.size
        });
      }

      const newNotification: Notification = {
        id: generateId(),
        message: 'Novos anexos foram adicionados à sua ficha.',
        date: new Date().toISOString(),
        read: false
      };
      
      setMembers(members.map(m => 
        m.id === selectedFichaMemberId 
          ? { 
              ...m, 
              anexos: [...(m.anexos || []), ...newAnexos],
              notifications: [newNotification, ...(m.notifications || [])]
            } 
          : m
      ));
      showToast('Anexos importados com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao importar anexos', 'danger');
    }
  };

  const handleRemoveAnexo = (anexoId: string) => {
    if (!selectedFichaMemberId) return;
    if (window.confirm('Tem certeza que deseja remover este anexo?')) {
      setMembers(members.map(m => 
        m.id === selectedFichaMemberId 
          ? { ...m, anexos: (m.anexos || []).filter(a => a.id !== anexoId) } 
          : m
      ));
      showToast('Anexo removido.', 'danger');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, memberId: number) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const publicUrl = await uploadFile(file);
        const newNotification: Notification = {
          id: generateId(),
          message: 'Sua foto de perfil foi atualizada.',
          date: new Date().toISOString(),
          read: false
        };
        setMembers(members.map(m => 
          m.id === memberId 
            ? { ...m, photoUrl: publicUrl, notifications: [newNotification, ...(m.notifications || [])] } 
            : m
        ));
        showToast('Foto atualizada com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao atualizar a foto', 'danger');
      }
    }
  };

  const uniquePatentes = useMemo(() => [...new Set(members.map(m => m.patente))].sort(), [members]);
  const uniqueFuncoes = useMemo(() => [...new Set(members.map(m => m.funcao))].sort(), [members]);

  const filteredFichaMembers = useMemo(() => {
    if (!fichaSearch.trim()) return [];
    
    const searchLower = fichaSearch.toLowerCase();
    return members.filter(item => 
      item.nome.toLowerCase().includes(searchLower) || 
      item.matricula.includes(searchLower) || 
      item.id.toString() === searchLower
    );
  }, [members, fichaSearch]);

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
    if (!formData.cpf || !formData.matricula || !formData.nome) {
      showToast('Por favor, preencha CPF, Matrícula e Nome.', 'danger');
      return;
    }
    if (editingId) {
      const newNotification: Notification = {
        id: generateId(),
        message: 'Suas informações funcionais foram atualizadas pelo administrador.',
        date: new Date().toISOString(),
        read: false
      };
      setMembers(members.map(m => m.id === editingId ? { ...m, ...formData, notifications: [newNotification, ...(m.notifications || [])] } as Member : m));
      showToast('Registro atualizado com sucesso!');
    } else {
      const newMember = {
        ...formData,
        id: Date.now() + Math.floor(Math.random() * 1000),
        ordem: members.length + 1,
      } as Member;
      setMembers([...members, newMember]);
      showToast('Novo militar adicionado!', 'success');
    }
    closeModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este registro?')) {
      setMembers(members.filter(m => m.id !== id));
      showToast('Registro removido.', 'danger');
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

  const handleSaveAudiencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!audienciaFormData.policialIds || audienciaFormData.policialIds.length === 0) {
      showToast('Selecione pelo menos um policial convocado.', 'danger');
      return;
    }
    if (editingAudienciaId) {
      setAudiencias(audiencias.map(a => a.id === editingAudienciaId ? { ...a, ...audienciaFormData } as Audiencia : a));
      showToast('Audiência atualizada com sucesso!');
    } else {
      const newAudiencia = {
        ...audienciaFormData,
        id: Date.now() + Math.floor(Math.random() * 1000),
      } as Audiencia;
      setAudiencias([...audiencias, newAudiencia]);
      showToast('Nova audiência adicionada!', 'success');
    }
    closeAudienciaModal();
  };

  const handleAddPolicialToAudiencia = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    if (id && !(audienciaFormData.policialIds || []).includes(id)) {
      setAudienciaFormData({
        ...audienciaFormData,
        policialIds: [...(audienciaFormData.policialIds || []), id]
      });
    }
    e.target.value = "";
  };

  const handleRemovePolicialFromAudiencia = (id: number) => {
    setAudienciaFormData({
      ...audienciaFormData,
      policialIds: (audienciaFormData.policialIds || []).filter(pid => pid !== id)
    });
  };

  const handleAudienciaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > 5 * 1024 * 1024) {
      showToast('O arquivo excede o limite de 5MB.', 'danger');
      e.target.value = '';
      return;
    }
    if (file && file.type === 'application/pdf') {
      try {
        const publicUrl = await uploadFile(file);
        const newPdf = {
          id: generateId(),
          name: file.name,
          url: publicUrl
        };
        setAudienciaFormData({
          ...audienciaFormData,
          pdfs: [...(audienciaFormData.pdfs || []), newPdf]
        });
        showToast('PDF adicionado!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao fazer upload do PDF.', 'danger');
      }
    } else if (file) {
      showToast('Por favor, selecione apenas arquivos PDF.', 'danger');
    }
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleRemoveAudienciaPdf = (pdfId: string) => {
    setAudienciaFormData({
      ...audienciaFormData,
      pdfs: (audienciaFormData.pdfs || []).filter(p => p.id !== pdfId)
    });
  };

  const handleDeleteAudiencia = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover esta audiência?')) {
      setAudiencias(audiencias.filter(a => a.id !== id));
      showToast('Audiência removida.', 'danger');
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
          className="absolute -right-3 top-5 bg-slate-800 text-slate-300 hover:text-white rounded-full p-2 border border-slate-700 z-10 min-w-[32px] min-h-[32px] flex items-center justify-center"
          aria-label={isSidebarCollapsed ? "Expandir menu" : "Esconder menu"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : <ChevronLeft className="w-4 h-4" aria-hidden="true" />}
        </button>
        <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-6'} bg-slate-950 text-white font-bold text-lg gap-2 shrink-0 transition-all overflow-hidden whitespace-nowrap`}>
          <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-sm shrink-0">26º</span>
          {!isSidebarCollapsed && <span>BPM SGE</span>}
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto overflow-x-hidden">
          <button onClick={() => setActiveAdminTab('efetivo')} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'efetivo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`} title="Efetivo">
            <Users className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Efetivo</span>}
          </button>
          <button onClick={() => setActiveAdminTab('audiencias')} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'audiencias' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`} title="Audiências">
            <Scale className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Audiências</span>}
          </button>
          <button onClick={() => setActiveAdminTab('administrativo')} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'administrativo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`} title="Administrativo">
            <Briefcase className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Administrativo</span>}
          </button>
          <button onClick={() => setActiveAdminTab('configuracoes')} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'configuracoes' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`} title="Configurações">
            <Settings className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Configurações</span>}
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 w-full rounded-md text-slate-500 cursor-default text-left`}>
            {!isSidebarCollapsed && <span className="whitespace-nowrap text-xs">SGE v1.0.0</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full" onClick={e => e.stopPropagation()}>
            <div className="h-16 flex items-center justify-between px-6 bg-slate-950 text-white font-bold text-lg shrink-0">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-sm">26º BPM</span>
                SGE
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white" aria-label="Fechar menu">
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
              <button onClick={() => { setActiveAdminTab('efetivo'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'efetivo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Users className="w-5 h-5" /> Efetivo
              </button>
              <button onClick={() => { setActiveAdminTab('audiencias'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'audiencias' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Scale className="w-5 h-5" /> Audiências
              </button>
              <button onClick={() => { setActiveAdminTab('administrativo'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'administrativo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Briefcase className="w-5 h-5" /> Administrativo
              </button>
              <button onClick={() => { setActiveAdminTab('configuracoes'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${activeAdminTab === 'configuracoes' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Settings className="w-5 h-5" /> Configurações
              </button>
            </nav>
            <div className="p-4 border-t border-slate-800 shrink-0">
              <div className="text-center text-slate-500 text-xs py-2">
                SGE v1.0.0
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-100">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-slate-500 hover:bg-slate-100 rounded-md" aria-label="Abrir menu">
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 hidden sm:block">
              {activeAdminTab === 'efetivo' && 'Controle de Efetivo'}
              {activeAdminTab === 'audiencias' && 'Gestão de Audiências'}
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
          <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
            {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col">
          <Users className="w-7 h-7 mb-2 text-slate-700" />
          <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Efetivo Total</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 border-b-4 border-b-green-500 flex flex-col">
          <CheckCircle className="w-7 h-7 mb-2 text-green-500" />
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Pronto Emprego</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 border-b-4 border-b-yellow-500 flex flex-col">
          <Sun className="w-7 h-7 mb-2 text-yellow-500" />
          <div className="text-3xl font-bold text-yellow-600">{stats.vacation}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Férias</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 border-b-4 border-b-red-500 flex flex-col">
          <Activity className="w-7 h-7 mb-2 text-red-500" />
          <div className="text-3xl font-bold text-red-600">{stats.away}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">LTS / Afastados</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center mb-4 shrink-0">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, matrícula, função..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button 
            onClick={() => openModal()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Membro
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse text-sm whitespace-nowrap">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                {[
                  { key: 'ordem', label: 'Ordem' },
                  { key: 'matricula', label: 'Matrícula' },
                  { key: 'patente', label: 'Patente' },
                  { key: 'nome', label: 'Nome' },
                  { key: 'funcao', label: 'Função' },
                  { key: 'status', label: 'Status' }
                ].map((col) => (
                  <SortableTableHeader
                    key={col.key}
                    label={col.label}
                    field={col.key}
                    currentSortField={sortField}
                    sortDirection={sortAsc ? 'asc' : 'desc'}
                    onSort={(field) => handleSort(field as SortableFields)}
                    className="text-xs uppercase tracking-wider text-slate-500"
                  />
                ))}
                <th className="px-4 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  Doc
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedMembers.length > 0 ? (
                filteredAndSortedMembers.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedFichaMemberId(item.id);
                      setActiveAdminTab('ficha_individual');
                    }}
                  >
                    <td className="px-4 py-3 border-b border-slate-100 text-slate-500 font-mono">#{item.ordem}</td>
                    <td className="px-4 py-3 border-b border-slate-100 font-medium text-slate-900">{item.matricula}</td>
                    <td className="px-4 py-3 border-b border-slate-100 text-slate-700">{item.patente}</td>
                    <td className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <MemberAvatar name={item.nome} photoUrl={item.photoUrl} size="sm" />
                        <div>
                          <div className="font-semibold text-slate-900">{item.nome}</div>
                          <div className="text-xs text-slate-500">{item.guerra}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 text-slate-700">{item.funcao}</td>
                    <td className="px-4 py-3 border-b border-slate-100">
                      <StatusBadge status={item.status} className="uppercase tracking-wide" />
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 text-center">
                      {item.pdfUrl ? (
                        <a href={item.pdfUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center p-2 min-w-[44px] min-h-[44px] text-red-500 hover:bg-red-50 rounded transition-colors" title={item.pdfName} aria-label={`Baixar PDF de ${item.nome}`}>
                          <FileText className="w-5 h-5" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="text-slate-300" aria-hidden="true">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 text-right">
                      <button onClick={(e) => { e.stopPropagation(); openModal(item); }} className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1" aria-label={`Editar ${item.nome}`}>
                        <Edit2 className="w-5 h-5" aria-hidden="true" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" aria-label={`Excluir ${item.nome}`}>
                        <Trash2 className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
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
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <h3 className="text-lg font-bold text-slate-800">Gestão de Audiências</h3>
        <button onClick={() => openAudienciaModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" /> Nova Audiência
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Data/Hora</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Local</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Processo</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Policiais Convocados</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Doc</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {audiencias.length > 0 ? (
                audiencias.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 border-b border-slate-100 font-medium text-slate-900">
                        {new Date(item.data).toLocaleDateString('pt-BR')} às {item.hora}
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-slate-700">{item.local}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-slate-700 font-mono">{item.processo}</td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <div className="flex flex-col gap-1.5">
                          {item.policialIds && item.policialIds.length > 0 ? (
                            item.policialIds.map(pid => {
                              const policial = members.find(m => m.id === pid);
                              if (!policial) return null;
                              return (
                                <div key={pid} className="flex items-center gap-2">
                                  <MemberAvatar name={policial.nome} photoUrl={policial.photoUrl} size="sm" />
                                  <span className="text-slate-900 font-medium text-xs">{policial.patente} {policial.guerra}</span>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-slate-400 italic">Nenhum policial</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          item.status === 'Agendada' ? 'bg-blue-100 text-blue-700' :
                          item.status === 'Realizada' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-center">
                        {item.pdfs && item.pdfs.length > 0 ? (
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {item.pdfs.map((pdf, idx) => (
                              <a key={pdf.id} href={pdf.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center p-2 min-w-[44px] min-h-[44px] text-red-500 hover:bg-red-50 rounded transition-colors" title={pdf.name} aria-label={`Baixar anexo ${idx + 1}`}>
                                <FileText className="w-5 h-5" aria-hidden="true" />
                                {item.pdfs!.length > 1 && <span className="text-[10px] ml-0.5 font-bold">{idx + 1}</span>}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300" aria-hidden="true">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-right">
                        <button onClick={() => openAudienciaModal(item)} className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1" aria-label={`Editar audiência do processo ${item.processo || ''}`}>
                          <Edit2 className="w-5 h-5" aria-hidden="true" />
                        </button>
                        <button onClick={() => handleDeleteAudiencia(item.id)} className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" aria-label={`Excluir audiência do processo ${item.processo || ''}`}>
                          <Trash2 className="w-5 h-5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Scale className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-base">Nenhuma audiência cadastrada.</p>
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

  {activeAdminTab === 'configuracoes' && (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500 flex flex-col items-center justify-center h-64">
        <Settings className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">Configurações do Sistema</h3>
        <p>As configurações avançadas do sistema serão disponibilizadas em breve.</p>
      </div>
    </div>
  )}

  {activeAdminTab === 'administrativo' && (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <h3 className="text-lg font-medium text-slate-900 mb-4">Módulo Administrativo</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <button 
          onClick={() => setActiveAdminTab('ficha_individual')}
          className="bg-white p-8 rounded-lg border border-slate-200 flex flex-col items-center justify-center gap-4 hover:bg-slate-50 hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <FileText className="w-8 h-8" />
          </div>
          <span className="font-medium text-slate-800 text-lg">Ficha Individual</span>
        </button>
      </div>
    </div>
  )}

  {activeAdminTab === 'ficha_individual' && (
        <FichaIndividualPanel 
          members={members}
          selectedFichaMemberId={selectedFichaMemberId}
          setSelectedFichaMemberId={setSelectedFichaMemberId}
          filteredFichaMembers={filteredFichaMembers}
          fichaSearch={fichaSearch}
          setFichaSearch={setFichaSearch}
          activeFichaSection={activeFichaSection}
          setActiveFichaSection={setActiveFichaSection}
          fichaFormData={fichaFormData}
          setFichaFormData={setFichaFormData}
          handleSaveFicha={handleSaveFicha}
          handlePhotoUpload={handlePhotoUpload}
          processAnexoFiles={processAnexoFiles}
          handleRemoveAnexo={handleRemoveAnexo}
          setActiveAdminTab={setActiveAdminTab}
        />
      )}
    </main>

{/* Modal Audiência */}
      {isAudienciaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAudienciaId ? 'Editar Audiência' : 'Agendar Nova Audiência'}
              </h3>
              <button onClick={closeAudienciaModal} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors" aria-label="Fechar modal">
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAudiencia} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Data *</label>
                    <input 
                      type="date" required
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={audienciaFormData.data || ''} onChange={e => setAudienciaFormData({...audienciaFormData, data: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Hora *</label>
                    <input 
                      type="time" required
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={audienciaFormData.hora || ''} onChange={e => setAudienciaFormData({...audienciaFormData, hora: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Local (Vara/Fórum) *</label>
                    <input 
                      type="text" required placeholder="Ex: 1ª Vara Criminal da Comarca..."
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={audienciaFormData.local || ''} onChange={e => setAudienciaFormData({...audienciaFormData, local: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Número do Processo *</label>
                    <input 
                      type="text" required placeholder="Ex: 0001234-56.2026.8.19.0001"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-sm"
                      value={audienciaFormData.processo || ''} onChange={e => setAudienciaFormData({...audienciaFormData, processo: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Policiais Convocados *</label>
                    
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
                    <label className="text-sm font-medium text-slate-700">Status *</label>
                    <select 
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
                    <label className="text-sm font-medium text-slate-700">Observações</label>
                    <textarea 
                      rows={3} placeholder="Informações adicionais..."
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                      value={audienciaFormData.observacoes || ''} onChange={e => setAudienciaFormData({...audienciaFormData, observacoes: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Documentos Anexos (PDFs)</label>
                    <div className="flex flex-col gap-3">
                      {audienciaFormData.pdfs && audienciaFormData.pdfs.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {audienciaFormData.pdfs.map(pdf => (
                            <div key={pdf.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-slate-50">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-5 h-5 text-red-500 shrink-0" aria-hidden="true" />
                                <span className="text-sm text-slate-700 truncate">{pdf.name}</span>
                              </div>
                              <button type="button" onClick={() => handleRemoveAudienciaPdf(pdf.id)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0" title="Remover PDF" aria-label={`Remover PDF ${pdf.name}`}>
                                <Trash2 className="w-5 h-5" aria-hidden="true" />
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
                <button type="button" onClick={closeAudienciaModal} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors shadow-sm">
                  Salvar Audiência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Editar Militar' : 'Adicionar Novo Militar'}
              </h3>
              <button onClick={closeModal} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors" aria-label="Fechar modal">
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Matrícula *</label>
                    <input 
                      type="text" required placeholder="Ex: 123.456-7"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.matricula || ''} onChange={e => setFormData({...formData, matricula: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">CPF *</label>
                    <input 
                      type="text" required placeholder="Ex: 111.111.111-11"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Patente *</label>
                    <select 
                      required
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      value={formData.patente || ''} onChange={e => setFormData({...formData, patente: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {PATENTES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Nome Completo *</label>
                    <input 
                      type="text" required placeholder="Nome completo do policial"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Nome de Guerra</label>
                    <input 
                      type="text" placeholder="Nome na tarjeta"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.guerra || ''} onChange={e => setFormData({...formData, guerra: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Função</label>
                    <input 
                      type="text" list="funcoesList" placeholder="Ex: Patrulha"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.funcao || ''} onChange={e => setFormData({...formData, funcao: e.target.value})}
                    />
                    <datalist id="funcoesList">
                      {uniqueFuncoes.map(f => <option key={f} value={f} />)}
                    </datalist>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Telefone</label>
                    <input 
                      type="tel" placeholder="(21) 90000-0000"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input 
                      type="email" placeholder="email@exemplo.com"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Status Operacional</label>
                    <select 
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
                    <label className="text-sm font-medium text-slate-700">Documento Anexo (PDF)</label>
                    <input 
                      type="file" accept=".pdf"
                      className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 5 * 1024 * 1024) {
                          alert('O arquivo excede o limite de 5MB.');
                          e.target.value = '';
                          return;
                        }
                        if (file && file.type === 'application/pdf') {
                          try {
                            const publicUrl = await uploadFile(file);
                            setFormData({...formData, pdfName: file.name, pdfUrl: publicUrl});
                          } catch (err) {
                            console.error(err);
                            alert('Erro ao fazer upload do PDF.');
                            e.target.value = '';
                          }
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
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors">
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
