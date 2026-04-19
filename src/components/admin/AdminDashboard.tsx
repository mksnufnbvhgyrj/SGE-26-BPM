import React, { useState } from 'react';
import { Users, Scale, Briefcase, Settings, LogOut, X, ChevronLeft, ChevronRight, ArrowRightLeft } from 'lucide-react';
import { Member, Audiencia, DashboardStats } from '../../types';
import { StatsCards } from '../common/StatsCards';
import { Header } from '../common/Header';
import { MemberTable } from '../members/MemberTable';

interface AdminDashboardProps {
  members: Member[];
  audiencias: Audiencia[];
  onLogout: () => void;
  onMembersChange: (members: Member[]) => void;
  onAudienciasChange: (audiencias: Audiencia[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  members,
  audiencias,
  onLogout,
  onMembersChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAudienciasChange,
}) => {
  const [activeTab, setActiveTab] = useState<'efetivo' | 'audiencias' | 'permutas' | 'administrativo' | 'configuracoes'>('efetivo');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filtros e ordenação
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Member | null>('ordem');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calcular estatísticas
  const stats: DashboardStats = {
    totalMembers: members.length,
    activeMembers: members.filter(m => m.status === 'Ativo').length,
    onVacation: members.filter(m => m.status === 'Férias').length,
    onLeave: members.filter(m => m.status === 'Licença').length,
    inactive: members.filter(m => m.status === 'Afastado').length,
    upcomingAudiencias: audiencias.filter(a =>
      a.status === 'Agendada' && new Date(a.data + 'T' + a.hora) >= new Date()
    ).length,
  };

  // Handlers
  const handleSort = (field: keyof Member) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este registro?')) {
      onMembersChange(members.filter(m => m.id !== id));
    }
  };

  const handleViewDetails = (member: Member) => {
    console.log('Ver detalhes:', member.nome);
    // Implementar visualização de detalhes
  };

  const handleSaveMember = (memberData: Partial<Member>) => {
    if (editingMember) {
      // Atualizar membro existente
      onMembersChange(members.map(m =>
        m.id === editingMember.id ? { ...m, ...memberData } : m
      ));
    } else {
      // Criar novo membro
      const newMember: Member = {
        ...memberData as Member,
        id: Date.now(),
        ordem: members.length + 1,
      };
      onMembersChange([...members, newMember]);
    }
    setIsModalOpen(false);
    setEditingMember(null);
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar Desktop */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } transition-all duration-300 bg-slate-900 text-white hidden md:flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-4 bg-slate-950">
          {!isSidebarCollapsed && (
            <span className="font-bold text-lg">SGE - 26º BPM</span>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 hover:bg-slate-800 rounded"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem
            icon={Users}
            label="Efetivo"
            isActive={activeTab === 'efetivo'}
            collapsed={isSidebarCollapsed}
            onClick={() => setActiveTab('efetivo')}
          />
          <SidebarItem
            icon={Scale}
            label="Audiências"
            isActive={activeTab === 'audiencias'}
            collapsed={isSidebarCollapsed}
            onClick={() => setActiveTab('audiencias')}
          />
          <SidebarItem
            icon={ArrowRightLeft}
            label="Permutas"
            isActive={activeTab === 'permutas'}
            collapsed={isSidebarCollapsed}
            onClick={() => setActiveTab('permutas')}
          />
          <SidebarItem
            icon={Briefcase}
            label="Administrativo"
            isActive={activeTab === 'administrativo'}
            collapsed={isSidebarCollapsed}
            onClick={() => setActiveTab('administrativo')}
          />
          <SidebarItem
            icon={Settings}
            label="Configurações"
            isActive={activeTab === 'configuracoes'}
            collapsed={isSidebarCollapsed}
            onClick={() => setActiveTab('configuracoes')}
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className={`flex items-center ${
              isSidebarCollapsed ? 'justify-center' : 'gap-3'
            } w-full p-2 hover:bg-slate-800 rounded transition-colors`}
          >
            <LogOut className="w-5 h-5" />
            {!isSidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            role="presentation"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 text-white">
            <div className="h-16 flex items-center justify-between px-4 bg-slate-950">
              <span className="font-bold text-lg">SGE - 26º BPM</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 hover:bg-slate-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              <SidebarItem
                icon={Users}
                label="Efetivo"
                isActive={activeTab === 'efetivo'}
                collapsed={false}
                onClick={() => { setActiveTab('efetivo'); setIsMobileMenuOpen(false); }}
              />
              <SidebarItem
                icon={Scale}
                label="Audiências"
                isActive={activeTab === 'audiencias'}
                collapsed={false}
                onClick={() => { setActiveTab('audiencias'); setIsMobileMenuOpen(false); }}
              />
              <SidebarItem
                icon={ArrowRightLeft}
                label="Permutas"
                isActive={activeTab === 'permutas'}
                collapsed={false}
                onClick={() => { setActiveTab('permutas'); setIsMobileMenuOpen(false); }}
              />
              <SidebarItem
                icon={Briefcase}
                label="Administrativo"
                isActive={activeTab === 'administrativo'}
                collapsed={false}
                onClick={() => { setActiveTab('administrativo'); setIsMobileMenuOpen(false); }}
              />
              <SidebarItem
                icon={Settings}
                label="Configurações"
                isActive={activeTab === 'configuracoes'}
                collapsed={false}
                onClick={() => { setActiveTab('configuracoes'); setIsMobileMenuOpen(false); }}
              />
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={undefined} onLogout={onLogout} />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Tab Content */}
            {activeTab === 'efetivo' && (
              <MemberTable
                members={members}
                searchTerm={searchTerm}
                sortField={sortField}
                sortDirection={sortDirection}
                onSearchChange={setSearchTerm}
                onSort={handleSort}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
              />
            )}

            {activeTab === 'audiencias' && (
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h2 className="text-xl font-bold mb-4">Gestão de Audiências</h2>
                <p className="text-slate-600">Funcionalidade em desenvolvimento...</p>
              </div>
            )}

            {activeTab === 'permutas' && (
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h2 className="text-xl font-bold mb-4">Gestão de Permutas</h2>
                <p className="text-slate-600">Funcionalidade em desenvolvimento...</p>
              </div>
            )}

            {activeTab === 'administrativo' && (
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h2 className="text-xl font-bold mb-4">Módulo Administrativo</h2>
                <p className="text-slate-600">Funcionalidade em desenvolvimento...</p>
              </div>
            )}

            {activeTab === 'configuracoes' && (
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h2 className="text-xl font-bold mb-4">Configurações</h2>
                <p className="text-slate-600">Funcionalidade em desenvolvimento...</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Member Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold">
                {editingMember ? 'Editar Policial' : 'Novo Policial'}
              </h3>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveMember(Object.fromEntries(formData.entries()) as Partial<Member>);
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium mb-1">Nome</label>
                  <input
                    id="nome"
                    name="nome"
                    defaultValue={editingMember?.nome}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="guerra" className="block text-sm font-medium mb-1">Nome de Guerra</label>
                  <input
                    id="guerra"
                    name="guerra"
                    defaultValue={editingMember?.guerra}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="patente" className="block text-sm font-medium mb-1">Patente</label>
                  <input
                    id="patente"
                    name="patente"
                    defaultValue={editingMember?.patente}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="matricula" className="block text-sm font-medium mb-1">Matrícula</label>
                  <input
                    id="matricula"
                    name="matricula"
                    defaultValue={editingMember?.matricula}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={editingMember?.status || 'Ativo'}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Férias">Férias</option>
                    <option value="Licença">Licença</option>
                    <option value="Afastado">Afastado</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  isActive,
  collapsed,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center ${
      collapsed ? 'justify-center' : 'gap-3'
    } w-full p-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'hover:bg-slate-800 text-slate-300 hover:text-white'
    }`}
    title={collapsed ? label : undefined}
  >
    <Icon className="w-5 h-5 shrink-0" />
    {!collapsed && <span className="whitespace-nowrap">{label}</span>}
  </button>
);
