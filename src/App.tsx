import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from './lib/supabase';
import { Search, Download, Plus, Edit2, Trash2, Users, CheckCircle, Sun, Activity, X, ArrowUpDown, FolderOpen, FileText, FileUp, Settings, LogOut, Menu, Scale, ChevronLeft, ChevronRight, Briefcase, User, Info, Layers, ShieldAlert, Crosshair, Paperclip, Stethoscope, History, Award, GraduationCap, Baby, Archive, Medal, Shirt, Palmtree, HeartPulse, Hospital, MapPin, CalendarOff, Calculator, TrendingUp, ChevronsUp, Dumbbell, Clock as ClockIcon, BookOpen, Microscope, Printer, FileSpreadsheet, File, Upload, UploadCloud } from 'lucide-react';

import Clock from './components/Clock';

import { Status, Notification, Anexo, Member, Audiencia, AuthState } from './types';
import LoginScreen from './components/LoginScreen';
import UserDashboard from './components/UserDashboard';
import { INITIAL_DATA, INITIAL_AUDIENCIAS, PATENTES, formatMatricula, formatBytes, getStatusClasses } from './utils/constants';

export default function App() {
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
  
  const [fichaSearch, setFichaSearch] = useState('');
  const [debouncedFichaSearch, setDebouncedFichaSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFichaSearch(fichaSearch), 300);
    return () => clearTimeout(timer);
  }, [fichaSearch]);

  const [selectedFichaMemberId, setSelectedFichaMemberId] = useState<number | null>(null);
  const [activeFichaSection, setActiveFichaSection] = useState<string | null>(null);
  const [fichaFormData, setFichaFormData] = useState<Partial<Member>>({});
  const [isDraggingAnexo, setIsDraggingAnexo] = useState(false);

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

  useEffect(() => {
    if (activeFichaSection === 'Dados Principais' && selectedFichaMemberId) {
      const member = members.find(m => m.id === selectedFichaMemberId);
      if (member) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
      const currentMs = new Date().getTime();
      const newNotification: Notification = {
        id: currentMs.toString(),
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
      // Limit to 5MB per file to avoid localStorage/Base64 issues
      if (file.size > 5 * 1024 * 1024) {
        showToast(`O arquivo ${file.name} excede o limite de 5MB.`, 'danger');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      const newAnexos = await Promise.all(
        validFiles.map((file: File) => {
          return new Promise<Anexo>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              resolve({
                id: crypto.randomUUID(),
                name: file.name,
                url: base64String,
                type: file.type || 'application/octet-stream',
                date: new Date().toISOString(),
                size: file.size
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      const currentMs = new Date().getTime();
      const newNotification: Notification = {
        id: currentMs.toString(),
        message: 'Novos anexos foram adicionados à sua ficha.',
        date: new Date().toISOString(),
        read: false
      };
      
      setMembers(prevMembers => prevMembers.map(m => 
        m.id === selectedFichaMemberId 
          ? { 
              ...m, 
              anexos: [...(m.anexos || []), ...newAnexos],
              notifications: [newNotification, ...(m.notifications || [])]
            } 
          : m
      ));
      showToast('Anexos importados com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao processar anexos:', error);
      showToast('Ocorreu um erro ao processar os arquivos.', 'danger');
    }
  };

  const handleUploadAnexo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAnexoFiles(e.target.files);
    }
    e.target.value = ''; // Reset input
  };

  const handleDragOverAnexo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAnexo(true);
  };

  const handleDragLeaveAnexo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAnexo(false);
  };

  const handleDropAnexo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAnexo(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAnexoFiles(e.dataTransfer.files);
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, memberId: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newNotification: Notification = {
          id: crypto.randomUUID(),
          message: 'Sua foto de perfil foi atualizada.',
          date: new Date().toISOString(),
          read: false
        };
        setMembers(members.map(m => 
          m.id === memberId 
            ? { ...m, photoUrl: base64String, notifications: [newNotification, ...(m.notifications || [])] } 
            : m
        ));
        showToast('Foto atualizada com sucesso!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const uniqueFuncoes = useMemo(() => [...new Set(members.map(m => m.funcao))].sort(), [members]);

  const filteredFichaMembers = useMemo(() => {
    if (!debouncedFichaSearch.trim()) return [];
    
    const searchLower = debouncedFichaSearch.toLowerCase();
    return members.filter(item => 
      item.nome.toLowerCase().includes(searchLower) || 
      item.matricula.includes(searchLower) || 
      item.id.toString() === searchLower
    );
  }, [members, debouncedFichaSearch]);

  const filteredAndSortedMembers = useMemo(() => {
    return members
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
  }, [members, debouncedSearch, filterStatus, sortField, sortAsc]);

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
        let nextIdForNew = currentMaxId + 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const importedMembers: Member[] = data.map((row: any) => {
          const findKey = (candidates: string[]) => {
            const key = Object.keys(row).find(k => 
              candidates.some(c => k.toLowerCase().trim().includes(c.toLowerCase()))
            );
            return key ? row[key] : undefined;
          };

          const statusRaw = findKey(['status', 'situação', 'situacao', 'estado']) || 'Ativo';
          let status: Status = 'Ativo';
          const sLower = String(statusRaw).toLowerCase();
          if (['férias', 'ferias', 'vacation'].some(s => sLower.includes(s))) status = 'Férias';
          else if (['licença', 'licenca', 'lts'].some(s => sLower.includes(s))) status = 'Licença';
          else if (['afastado', 'away'].some(s => sLower.includes(s))) status = 'Afastado';

          return {
            id: 0, // Temporary
            ordem: Number(findKey(['ordem', 'nº', 'posicao', 'posição'])) || 0,
            matricula: String(findKey(['matricula', 'matrícula', 'id', 'registro']) || '').trim(),
            cpf: String(findKey(['cpf', 'documento']) || '').trim(),
            patente: String(findKey(['patente', 'grad', 'graduação', 'graduacao', 'posto']) || '').trim(),
            nome: String(findKey(['nome', 'nome completo', 'policial']) || '').trim(),
            guerra: String(findKey(['guerra', 'nome de guerra', 'conhecido']) || '').trim(),
            funcao: String(findKey(['funcao', 'função', 'cargo', 'atribuição']) || '').trim(),
            telefone: String(findKey(['telefone', 'celular', 'contato']) || '').trim(),
            email: String(findKey(['email', 'e-mail', 'correio']) || '').trim(),
            status: status
          };
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
            updatedMembers.push({ ...newM, id: nextIdForNew++ });
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
      const newNotification: Notification = {
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

  const handleSaveAudiencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!audienciaFormData.policialIds || audienciaFormData.policialIds.length === 0) {
      showToast('Selecione pelo menos um policial convocado.', 'danger');
      return;
    }
    const currentMs = new Date().getTime();
    if (editingAudienciaId) {
      setAudiencias(audiencias.map(a => a.id === editingAudienciaId ? { ...a, ...audienciaFormData } as Audiencia : a));
      showToast('Audiência atualizada com sucesso!');
    } else {
      const newAudiencia = {
        ...audienciaFormData,
        id: currentMs,
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

  const handleAudienciaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      if (file.size > 5 * 1024 * 1024) {
        showToast('O arquivo excede o limite de 5MB.', 'danger');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newPdf = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          url: base64String
        };
        setAudienciaFormData(prev => ({
          ...prev,
          pdfs: [...(prev.pdfs || []), newPdf]
        }));
      };
      reader.readAsDataURL(file);
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
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

  if (authState.role === null) {
    return <LoginScreen onLogin={setAuthState} members={members} />;
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
          <button onClick={() => setAuthState({ role: null })} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 w-full rounded-md hover:bg-slate-800 hover:text-white transition-colors text-left`} title="Sair do Sistema">
            <LogOut className="w-5 h-5 shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">Sair do Sistema</span>}
          </button>
        </div>
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
              <button onClick={() => setAuthState({ role: null })} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md hover:bg-slate-800 hover:text-white transition-colors text-left">
                <LogOut className="w-5 h-5" /> Sair do Sistema
              </button>
            </div>
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
        <div className="overflow-auto flex-1">
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
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50 transition-colors group cursor-pointer text-xs md:text-sm"
                    onClick={() => {
                      setSelectedFichaMemberId(item.id);
                      setActiveAdminTab('ficha_individual');
                    }}
                  >
                    <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100 text-slate-500 font-mono hidden md:table-cell">#{item.ordem}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100 font-medium text-slate-900 hidden md:table-cell">{formatMatricula(item.matricula)}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100 text-slate-700">{item.patente}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] md:text-xs font-bold shrink-0 overflow-hidden">
                          {item.photoUrl ? (
                            <img src={item.photoUrl} alt={item.nome} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(item.nome)
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{item.nome}</div>
                          <div className="text-xs text-slate-500">{item.guerra}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100 text-slate-700 hidden md:table-cell">{item.funcao}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100">
                      <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-wide ${getStatusClasses(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100 text-center hidden md:table-cell">
                      {item.pdfUrl ? (
                        <a href={item.pdfUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title={item.pdfName}>
                          <FileText className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 border-b border-slate-100 text-right">
                      <button onClick={(e) => { e.stopPropagation(); openModal(item); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button aria-label="Excluir item" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
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
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 hidden md:table-cell">Local</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 hidden md:table-cell">Processo</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Policiais Convocados</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 hidden md:table-cell">Doc</th>
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
                      <td className="px-4 py-3 border-b border-slate-100 text-slate-700 hidden md:table-cell">{item.local}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-slate-700 font-mono hidden md:table-cell">{item.processo}</td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <div className="flex flex-col gap-1.5">
                          {item.policialIds && item.policialIds.length > 0 ? (
                            item.policialIds.map(pid => {
                              const policial = members.find(m => m.id === pid);
                              if (!policial) return null;
                              return (
                                <div key={pid} className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
                                    {policial.photoUrl ? (
                                      <img src={policial.photoUrl} alt={policial.nome} className="w-full h-full object-cover" />
                                    ) : (
                                      getInitials(policial.nome)
                                    )}
                                  </div>
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
                      <td className="px-4 py-3 border-b border-slate-100 text-center hidden md:table-cell">
                        {item.pdfs && item.pdfs.length > 0 ? (
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {item.pdfs.map((pdf, idx) => (
                              <a key={pdf.id} href={pdf.url} target="_blank" rel="noreferrer" className="inline-flex items-center p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title={pdf.name}>
                                <FileText className="w-4 h-4" />
                                {item.pdfs!.length > 1 && <span className="text-[10px] ml-0.5 font-bold">{idx + 1}</span>}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-right">
                        <button onClick={() => openAudienciaModal(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button aria-label="Excluir item" onClick={() => handleDeleteAudiencia(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
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
    <div className="flex-1 overflow-auto p-4 md:p-6 flex flex-col gap-4">
      {/* Toolbar / Filtros (Ficha Individual) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center shrink-0 relative z-20">
        <div className="flex items-center gap-3 text-slate-800 font-semibold flex-1">
          <button 
            onClick={() => {
              setActiveAdminTab('administrativo');
              setSelectedFichaMemberId(null);
              setActiveFichaSection(null);
              setFichaSearch('');
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Ficha Individual</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto relative">
          <div className="relative flex-1 md:w-auto md:min-w-[300px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, matrícula ou ID..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900"
              value={fichaSearch}
              onChange={(e) => {
                setFichaSearch(e.target.value);
                if (e.target.value === '') setSelectedFichaMemberId(null);
              }}
            />
            
            {/* Search Results Dropdown */}
            {fichaSearch.trim() !== '' && !selectedFichaMemberId && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                {filteredFichaMembers.length > 0 ? (
                  filteredFichaMembers.map(member => (
                    <button
                      key={member.id}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors flex items-center gap-3"
                      onClick={() => {
                        setSelectedFichaMemberId(member.id);
                        setActiveFichaSection(null);
                        setFichaSearch('');
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                        {member.photoUrl ? (
                          <img src={member.photoUrl} alt={member.nome} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(member.nome)
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{member.patente} {member.nome}</span>
                        <span className="text-xs text-slate-500">Matrícula: {member.matricula} | ID: {member.id}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center">Nenhum policial encontrado.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Área de Conteúdo da Ficha Individual */}
      {selectedFichaMemberId ? (() => {
        const member = members.find(m => m.id === selectedFichaMemberId);
        if (!member) return null;
        return (
          <div className="bg-white flex-1 rounded-lg border border-slate-200 flex flex-col p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <label className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg md:text-xl font-bold cursor-pointer group overflow-hidden shrink-0">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.nome} className="w-full h-full object-cover" />
                  ) : (
                    member.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FileUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handlePhotoUpload(e, member.id)}
                  />
                </label>
                <div className="min-w-0">
                  <h2 className="text-lg md:text-2xl font-bold text-slate-900 truncate">{member.patente} {member.nome}</h2>
                  <p className="text-xs md:text-base text-slate-500 truncate">{member.guerra} | Matrícula: {member.matricula}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedFichaMemberId(null);
                  setActiveFichaSection(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                title="Fechar ficha"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {activeFichaSection ? (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                    <button 
                      onClick={() => setActiveFichaSection(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                      title="Voltar para seções"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800">{activeFichaSection}</h3>
                  </div>
                  
                  {activeFichaSection === 'Dados Principais' ? (
                    <div className="flex flex-col gap-8 pb-8">
                      {/* Dados Funcionais */}
                      <section className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                        <h4 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-600" /> Dados Funcionais
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="ficha-guerra" className="block text-xs font-medium text-slate-500 mb-1">Nome de Guerra</label>
                            <input id="ficha-guerra" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.guerra || ''} onChange={(e) => setFichaFormData({...fichaFormData, guerra: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-quadro" className="block text-xs font-medium text-slate-500 mb-1">Quadro</label>
                            <input id="ficha-quadro" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="Ex: QOPM" value={fichaFormData.quadro || ''} onChange={(e) => setFichaFormData({...fichaFormData, quadro: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-patente" className="block text-xs font-medium text-slate-500 mb-1">Posto/Grad.</label>
                            <input id="ficha-patente" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.patente || ''} onChange={(e) => setFichaFormData({...fichaFormData, patente: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-rgmilitar" className="block text-xs font-medium text-slate-500 mb-1">RG Militar</label>
                            <input id="ficha-rgmilitar" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="000.000" value={fichaFormData.rgMilitar || ''} onChange={(e) => setFichaFormData({...fichaFormData, rgMilitar: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-dt-rg" className="block text-xs font-medium text-slate-500 mb-1">Data de Emissão</label>
                            <input id="ficha-dt-rg" type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.dataEmissaoRg || ''} onChange={(e) => setFichaFormData({...fichaFormData, dataEmissaoRg: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-comp" className="block text-xs font-medium text-slate-500 mb-1">Comportamento</label>
                            <select id="ficha-comp" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.comportamento || 'Bom'} onChange={(e) => setFichaFormData({...fichaFormData, comportamento: e.target.value})}>
                              <option value="Excepcional">Excepcional</option>
                              <option value="Ótimo">Ótimo</option>
                              <option value="Bom">Bom</option>
                              <option value="Insuficiente">Insuficiente</option>
                              <option value="Mau">Mau</option>
                            </select>
                          </div>
                        </div>
                      </section>

                      {/* Dados Pessoais */}
                      <section className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                        <h4 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" /> Dados Pessoais
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="lg:col-span-2">
                            <label htmlFor="ficha-nome" className="block text-xs font-medium text-slate-500 mb-1">Nome Completo</label>
                            <input id="ficha-nome" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.nome || ''} onChange={(e) => setFichaFormData({...fichaFormData, nome: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-cpf" className="block text-xs font-medium text-slate-500 mb-1">CPF</label>
                            <input id="ficha-cpf" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="000.000.000-00" value={fichaFormData.cpf || ''} onChange={(e) => setFichaFormData({...fichaFormData, cpf: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-matricula" className="block text-xs font-medium text-slate-500 mb-1">Matrícula</label>
                            <input id="ficha-matricula" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.matricula || ''} onChange={(e) => setFichaFormData({...fichaFormData, matricula: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-vinculo" className="block text-xs font-medium text-slate-500 mb-1">Vínculo</label>
                            <input id="ficha-vinculo" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="Efetivo" value={fichaFormData.vinculo || ''} onChange={(e) => setFichaFormData({...fichaFormData, vinculo: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-dt-nasc" className="block text-xs font-medium text-slate-500 mb-1">Data de Nascimento</label>
                            <input id="ficha-dt-nasc" type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.dataNascimento || ''} onChange={(e) => setFichaFormData({...fichaFormData, dataNascimento: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-cidade-nasc" className="block text-xs font-medium text-slate-500 mb-1">Cidade de Nascimento</label>
                            <input id="ficha-cidade-nasc" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.cidadeNascimento || ''} onChange={(e) => setFichaFormData({...fichaFormData, cidadeNascimento: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-uf" className="block text-xs font-medium text-slate-500 mb-1">UF Nascimento</label>
                            <select id="ficha-uf" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.ufNascimento || ''} onChange={(e) => setFichaFormData({...fichaFormData, ufNascimento: e.target.value})}>
                              <option value="">Selecione...</option>
                              <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option><option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option><option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option><option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option><option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option><option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option><option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option><option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option><option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="ficha-pasep" className="block text-xs font-medium text-slate-500 mb-1">PASEP</label>
                            <input id="ficha-pasep" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.pasep || ''} onChange={(e) => setFichaFormData({...fichaFormData, pasep: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-reg-civil" className="block text-xs font-medium text-slate-500 mb-1">Reg. Civil</label>
                            <input id="ficha-reg-civil" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.regCivil || ''} onChange={(e) => setFichaFormData({...fichaFormData, regCivil: e.target.value})} />
                          </div>
                          <div className="lg:col-span-2">
                            <label htmlFor="ficha-pai" className="block text-xs font-medium text-slate-500 mb-1">Pai</label>
                            <input id="ficha-pai" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.pai || ''} onChange={(e) => setFichaFormData({...fichaFormData, pai: e.target.value})} />
                          </div>
                          <div className="lg:col-span-2">
                            <label htmlFor="ficha-mae" className="block text-xs font-medium text-slate-500 mb-1">Mãe</label>
                            <input id="ficha-mae" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.mae || ''} onChange={(e) => setFichaFormData({...fichaFormData, mae: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-sangue" className="block text-xs font-medium text-slate-500 mb-1">Tipo Sanguíneo</label>
                            <select id="ficha-sangue" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.tipoSanguineo || ''} onChange={(e) => setFichaFormData({...fichaFormData, tipoSanguineo: e.target.value})}>
                              <option value="">Selecione...</option>
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="AB">AB</option>
                              <option value="O">O</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="ficha-fator-rh" className="block text-xs font-medium text-slate-500 mb-1">Fator RH</label>
                            <select id="ficha-fator-rh" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.fatorRh || ''} onChange={(e) => setFichaFormData({...fichaFormData, fatorRh: e.target.value})}>
                              <option value="">Selecione...</option>
                              <option value="+">Positivo (+)</option>
                              <option value="-">Negativo (-)</option>
                            </select>
                          </div>
                        </div>
                      </section>

                      {/* Situação Funcional */}
                      <section className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                        <h4 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-600" /> Situação Funcional
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="ficha-dt-inc" className="block text-xs font-medium text-slate-500 mb-1">Data Inclusão</label>
                            <input id="ficha-dt-inc" type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.dataInclusao || ''} onChange={(e) => setFichaFormData({...fichaFormData, dataInclusao: e.target.value})} />
                          </div>
                          <div>
                            <label htmlFor="ficha-status" className="block text-xs font-medium text-slate-500 mb-1">Situação</label>
                            <select id="ficha-status" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.status || 'Ativo'} onChange={(e) => setFichaFormData({...fichaFormData, status: e.target.value})}>
                              <option value="Ativo">Ativo</option>
                              <option value="Férias">Férias</option>
                              <option value="Licença">Licença</option>
                              <option value="Afastado">Afastado</option>
                            </select>
                          </div>
                        </div>
                      </section>
                      
                      <div className="flex justify-end gap-3 mt-4">
                        <button 
                          onClick={() => setActiveFichaSection(null)}
                          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors font-medium"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleSaveFicha}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Salvar Alterações
                        </button>
                      </div>
                    </div>
                  ) : activeFichaSection === 'Anexos' ? (
                    <div className="flex flex-col gap-8 pb-8">
                      <section className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-md font-semibold text-slate-800 flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-blue-600" /> Documentos Anexos
                          </h4>
                        </div>
                        
                        {(() => {
                          const member = members.find(m => m.id === selectedFichaMemberId);
                          const anexos = member?.anexos || [];
                          
                          return (
                            <div className="flex flex-col gap-6">
                              {/* Drag & Drop Zone */}
                              <div 
                                onDragOver={handleDragOverAnexo}
                                onDragLeave={handleDragLeaveAnexo}
                                onDrop={handleDropAnexo}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                                  isDraggingAnexo 
                                    ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                                    : 'border-slate-300 bg-white hover:bg-slate-50'
                                }`}
                              >
                                <UploadCloud className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDraggingAnexo ? 'text-blue-600' : 'text-slate-400'}`} />
                                <h3 className="text-lg font-semibold text-slate-800 mb-1">Arraste e solte seus arquivos aqui</h3>
                                <p className="text-sm text-slate-500 mb-6">ou clique no botão abaixo para selecionar do seu computador</p>
                                
                                <label className="cursor-pointer px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2 shadow-sm">
                                  <Search className="w-4 h-4" /> Procurar Arquivos
                                  <input 
                                    type="file" 
                                    multiple 
                                    className="hidden" 
                                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                                    onChange={handleUploadAnexo}
                                  />
                                </label>
                                <p className="text-xs text-slate-400 mt-4">Formatos suportados: PDF, Word, Excel. Tamanho máximo: 5MB por arquivo.</p>
                              </div>

                              {/* Lista de Anexos */}
                              {anexos.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                  {anexos.map(anexo => {
                                    const isPdf = anexo.type.includes('pdf') || anexo.name.toLowerCase().endsWith('.pdf');
                                    const isExcel = anexo.type.includes('spreadsheet') || anexo.type.includes('excel') || anexo.name.toLowerCase().match(/\.(xls|xlsx)$/);
                                    const isWord = anexo.type.includes('word') || anexo.name.toLowerCase().match(/\.(doc|docx)$/);
                                    
                                    return (
                                      <div key={anexo.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                          <div className={`p-2 rounded-md shrink-0 ${isPdf ? 'bg-red-100 text-red-600' : isExcel ? 'bg-green-100 text-green-600' : isWord ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {isPdf ? <FileText className="w-5 h-5" /> : isExcel ? <FileSpreadsheet className="w-5 h-5" /> : isWord ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
                                          </div>
                                          <div className="overflow-hidden">
                                            <p className="text-sm font-medium text-slate-800 truncate" title={anexo.name}>{anexo.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                              <span>{new Date(anexo.date).toLocaleDateString('pt-BR')}</span>
                                              {anexo.size && (
                                                <>
                                                  <span>•</span>
                                                  <span>{formatBytes(anexo.size)}</span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                          <a href={anexo.url} target="_blank" rel="noreferrer" download={anexo.name} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Baixar">
                                            <Download className="w-4 h-4" />
                                          </a>
                                          {/* eslint-disable-next-line react-hooks/refs */}
                                          <button aria-label="Excluir item" onClick={() => handleRemoveAnexo(anexo.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2" title="Remover">
                                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </section>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
                      <Edit2 className="w-12 h-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Em Desenvolvimento</h3>
                      <p className="text-center max-w-md">
                        A seção <strong>{activeFichaSection}</strong> está em desenvolvimento e será disponibilizada em breve.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {[
                    { name: 'Dados Principais', icon: User },
                    { name: 'Dados Complementares', icon: Info },
                    { name: 'Agregações', icon: Layers },
                    { name: 'APED', icon: ShieldAlert },
                    { name: 'Arma de Fogo', icon: Crosshair },
                    { name: 'Anexos', icon: Paperclip },
                    { name: 'Atestados', icon: Stethoscope },
                    { name: 'Averbações', icon: History },
                    { name: 'Cargo/Função', icon: Briefcase },
                    { name: 'Certificados', icon: Award },
                    { name: 'Comissões', icon: Users },
                    { name: 'Cursos', icon: GraduationCap },
                    { name: 'Dependentes', icon: Baby },
                    { name: 'Diversos', icon: Archive },
                    { name: 'Elogios/Medalha', icon: Medal },
                    { name: 'Fardamento', icon: Shirt },
                    { name: 'Férias', icon: Palmtree },
                    { name: 'Inspeção de Saúde', icon: HeartPulse },
                    { name: 'Junta Médica', icon: Hospital },
                    { name: 'Justiça e Disciplina', icon: Scale },
                    { name: 'Lotações', icon: MapPin },
                    { name: 'Licenças/Dispensa', icon: CalendarOff },
                    { name: 'Pontuação', icon: Calculator },
                    { name: 'Progressões', icon: TrendingUp },
                    { name: 'Promoções', icon: ChevronsUp },
                    { name: 'TAF', icon: Dumbbell },
                    { name: 'Tempo de Serviço', icon: ClockIcon },
                    { name: 'TCC', icon: BookOpen },
                    { name: 'Trabalhos Cientifícos', icon: Microscope },
                  ].map((section, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveFichaSection(section.name)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-4 flex flex-col items-center justify-center gap-2 md:gap-3 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors text-slate-600 group"
                    >
                      <section.icon className="w-5 h-5 md:w-8 md:h-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      <span className="text-[10px] md:text-sm font-medium text-center leading-tight">{section.name}</span>
                    </button>
                  ))}
                  
                  {/* Botão Especial: Gerar Ficha Individual */}
                  <button 
                    onClick={() => window.print()}
                    className="bg-blue-600 border border-blue-700 rounded-lg p-3 md:p-4 flex flex-col items-center justify-center gap-2 md:gap-3 hover:bg-blue-700 text-white transition-colors shadow-sm group"
                  >
                    <Printer className="w-5 h-5 md:w-8 md:h-8 text-blue-200 group-hover:text-white transition-colors" />
                    <span className="text-[10px] md:text-sm font-medium text-center leading-tight">Gerar Ficha Individual</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })() : (
        <div className="bg-white flex-1 min-h-[400px] rounded-lg border border-slate-200 flex flex-col items-center justify-center text-slate-500 p-8 shadow-sm">
          <FileText className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-medium text-slate-900 mb-2">Ficha Individual</h3>
          <p className="text-center max-w-md">
            Utilize a barra de busca acima para encontrar um policial por nome, matrícula ou ID e abrir sua ficha individual para edição.
          </p>
        </div>
      )}
    </div>
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
