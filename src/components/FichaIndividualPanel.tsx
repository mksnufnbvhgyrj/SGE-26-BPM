import React from 'react';
import { Member, Status } from '../types';
import { Search, FileText, ChevronLeft, X, FileUp, Briefcase, User, Activity, CheckCircle, Paperclip, Download, Trash2, Printer, Info, Layers, ShieldAlert, Crosshair, Stethoscope, History, Award, Users, GraduationCap, Baby, Archive, Medal, Shirt, Palmtree, HeartPulse, Hospital, Scale, MapPin, CalendarOff, Calculator, TrendingUp, ChevronsUp, Dumbbell, Clock as ClockIcon, BookOpen, Microscope, FileSpreadsheet, File } from 'lucide-react';
import { MemberAvatar } from './MemberAvatar';
import { DropzoneArea } from './DropzoneArea';
import { formatBytes } from '../utils/formatters';

interface Props {
  members: Member[];
  selectedFichaMemberId: number | null;
  setSelectedFichaMemberId: (id: number | null) => void;
  filteredFichaMembers: Member[];
  fichaSearch: string;
  setFichaSearch: (s: string) => void;
  activeFichaSection: string | null;
  setActiveFichaSection: (s: string | null) => void;
  fichaFormData: Partial<Member>;
  setFichaFormData: (d: Partial<Member>) => void;
  handleSaveFicha: () => void;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>, id: number) => void;
  processAnexoFiles: (f: FileList | File[]) => void;
  handleRemoveAnexo: (id: string) => void;
  setActiveAdminTab: (s: string) => void;
}

export const FichaIndividualPanel = ({
  members, selectedFichaMemberId, setSelectedFichaMemberId,
  filteredFichaMembers, fichaSearch, setFichaSearch,
  activeFichaSection, setActiveFichaSection,
  fichaFormData, setFichaFormData, handleSaveFicha,
  handlePhotoUpload, processAnexoFiles, handleRemoveAnexo,
  setActiveAdminTab
}: Props) => {

  const sections = [
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
  ];

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 flex flex-col gap-4">
      {/* Toolbar / Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center shrink-0 relative z-20">
        <div className="flex items-center gap-3 text-slate-800 font-semibold flex-1">
          <button 
            onClick={() => {
              setActiveAdminTab('administrativo');
              setSelectedFichaMemberId(null);
              setActiveFichaSection(null);
              setFichaSearch('');
            }}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            title="Voltar para Administrativo"
            aria-label="Voltar para Administrativo"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <span className="text-lg">Ficha Individual</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto relative">
          <select 
            className="w-full md:w-auto min-w-[140px] px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 text-slate-500" 
            disabled 
            title="Filtro futuro"
            aria-label="Filtrar membros (Funcionalidade em breve)"
          >
            <option>Filtrar por... (Em breve)</option>
          </select>
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
                      <MemberAvatar name={member.nome} photoUrl={member.photoUrl} size="md" />
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

      {/* Conteúdo */}
      {selectedFichaMemberId ? (() => {
        const member = members.find(m => m.id === selectedFichaMemberId);
        if (!member) return null;
        return (
          <div className="bg-white flex-1 rounded-lg border border-slate-200 flex flex-col p-6 shadow-sm">
            {/* Cabecalho Ficha */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <label
                  htmlFor="photo-upload"
                  className="relative w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold cursor-pointer group overflow-hidden shrink-0 outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      document.getElementById('photo-upload')?.click();
                    }
                  }}
                  aria-label="Alterar foto de perfil"
                >
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={`Foto de perfil de ${member.nome}`} className="w-full h-full object-cover" />
                  ) : (
                    member.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FileUp className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <input 
                    id="photo-upload"
                    type="file" 
                    accept="image/*" 
                    className="sr-only" 
                    onChange={(e) => handlePhotoUpload(e, member.id)}
                  />
                </label>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{member.patente} {member.nome}</h2>
                  <p className="text-slate-600">{member.guerra} <span className="opacity-50">|</span> Matrícula: {member.matricula}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedFichaMemberId(null);
                  setActiveFichaSection(null);
                }}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
                title="Fechar ficha"
                aria-label="Fechar ficha individual"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {activeFichaSection ? (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                    <button 
                      onClick={() => setActiveFichaSection(null)}
                      className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                      title="Voltar para o menu de seções"
                      aria-label="Voltar para o menu de seções"
                    >
                      <ChevronLeft className="w-5 h-5" aria-hidden="true" />
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
                            <label className="block text-xs font-medium text-slate-500 mb-1">Nome de Guerra</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.guerra || ''} onChange={(e) => setFichaFormData({...fichaFormData, guerra: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Quadro</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="Ex: QOPM" value={fichaFormData.quadro || ''} onChange={(e) => setFichaFormData({...fichaFormData, quadro: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Posto/Grad.</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.patente || ''} onChange={(e) => setFichaFormData({...fichaFormData, patente: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">RG Militar</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="000.000" value={fichaFormData.rgMilitar || ''} onChange={(e) => setFichaFormData({...fichaFormData, rgMilitar: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Data de Emissão</label>
                            <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.dataEmissaoRg || ''} onChange={(e) => setFichaFormData({...fichaFormData, dataEmissaoRg: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Comportamento</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.comportamento || 'Bom'} onChange={(e) => setFichaFormData({...fichaFormData, comportamento: e.target.value})}>
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
                            <label className="block text-xs font-medium text-slate-500 mb-1">Nome Completo</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.nome || ''} onChange={(e) => setFichaFormData({...fichaFormData, nome: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">CPF</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="000.000.000-00" value={fichaFormData.cpf || ''} onChange={(e) => setFichaFormData({...fichaFormData, cpf: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Matrícula</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.matricula || ''} onChange={(e) => setFichaFormData({...fichaFormData, matricula: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Vínculo</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="Efetivo" value={fichaFormData.vinculo || ''} onChange={(e) => setFichaFormData({...fichaFormData, vinculo: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Data de Nascimento</label>
                            <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.dataNascimento || ''} onChange={(e) => setFichaFormData({...fichaFormData, dataNascimento: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Cidade de Nascimento</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.cidadeNascimento || ''} onChange={(e) => setFichaFormData({...fichaFormData, cidadeNascimento: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">UF Nascimento</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.ufNascimento || ''} onChange={(e) => setFichaFormData({...fichaFormData, ufNascimento: e.target.value})}>
                              <option value="">Selecione...</option>
                              <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option><option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option><option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option><option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option><option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option><option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option><option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option><option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option><option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">PASEP</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.pasep || ''} onChange={(e) => setFichaFormData({...fichaFormData, pasep: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Reg. Civil</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.regCivil || ''} onChange={(e) => setFichaFormData({...fichaFormData, regCivil: e.target.value})} />
                          </div>
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Pai</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.pai || ''} onChange={(e) => setFichaFormData({...fichaFormData, pai: e.target.value})} />
                          </div>
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Mãe</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.mae || ''} onChange={(e) => setFichaFormData({...fichaFormData, mae: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo Sanguíneo</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.tipoSanguineo || ''} onChange={(e) => setFichaFormData({...fichaFormData, tipoSanguineo: e.target.value})}>
                              <option value="">Selecione...</option>
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="AB">AB</option>
                              <option value="O">O</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Fator RH</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.fatorRh || ''} onChange={(e) => setFichaFormData({...fichaFormData, fatorRh: e.target.value})}>
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
                            <label className="block text-xs font-medium text-slate-500 mb-1">Data Inclusão</label>
                            <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.dataInclusao || ''} onChange={(e) => setFichaFormData({...fichaFormData, dataInclusao: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Situação</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={fichaFormData.status || 'Ativo'} onChange={(e) => setFichaFormData({...fichaFormData, status: e.target.value as Status})}>
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
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
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
                          const anexos = member?.anexos || [];
                          
                          return (
                            <div className="flex flex-col gap-6">
                              {/* Drag & Drop Zone */}
                              <DropzoneArea onDropFiles={processAnexoFiles} />

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
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                                          <a href={anexo.url} target="_blank" rel="noreferrer" download={anexo.name} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Baixar" aria-label="Baixar anexo">
                                            <Download className="w-5 h-5" aria-hidden="true" />
                                          </a>
                                          <button onClick={() => handleRemoveAnexo(anexo.id)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Remover" aria-label="Remover anexo">
                                            <Trash2 className="w-5 h-5" aria-hidden="true" />
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
                      <FileText className="w-12 h-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Em Desenvolvimento</h3>
                      <p className="text-center max-w-md">
                        A seção <strong>{activeFichaSection}</strong> está em desenvolvimento e será disponibilizada em breve.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {sections.map((section, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveFichaSection(section.name)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center gap-3 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors text-slate-600 group"
                    >
                      <section.icon className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      <span className="text-sm font-medium text-center leading-tight">{section.name}</span>
                    </button>
                  ))}
                  
                  {/* Botão Especial: Gerar Ficha Individual */}
                  <button 
                    disabled
                    className="bg-gray-300 border border-gray-400 rounded-lg p-4 flex flex-col items-center justify-center gap-3 text-gray-500 cursor-not-allowed shadow-sm"
                    title="Funcionalidade em breve"
                    aria-label="Gerar Ficha Individual (Funcionalidade em breve)"
                  >
                    <Printer className="w-8 h-8 text-gray-400" />
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium text-center leading-tight">Gerar Ficha Individual</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-400 text-gray-200 px-1.5 py-0.5 rounded mt-1">Em breve</span>
                    </div>
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
  );
};
