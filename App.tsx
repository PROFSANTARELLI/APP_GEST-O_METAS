
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Meta, Status } from './types';
import * as metaService from './services/metaService';
import MetaForm from './components/MetaForm';
import MetaList from './components/MetaList';
import ConfirmationModal from './components/ConfirmationModal';

// --- Sub-componente Dashboard ---
const Dashboard: React.FC<{ metas: Meta[] }> = ({ metas }) => {
  const total = metas.length;
  const concluidas = metas.filter(m => m.status === Status.Concluida).length;
  const emAndamento = metas.filter(m => m.status === Status.EmAndamento).length;
  const pendentes = total - concluidas - emAndamento;

  const getConicGradient = () => {
    if (total === 0) return 'rgb(55 65 81)'; // gray-700
    const pConcluidas = (concluidas / total) * 100;
    const pEmAndamento = (emAndamento / total) * 100;
    
    const concluidasEnd = pConcluidas;
    const emAndamentoEnd = pConcluidas + pEmAndamento;

    return `conic-gradient(
      #4ade80 ${concluidasEnd}%, /* green-400 */
      #facc15 ${concluidasEnd}% ${emAndamentoEnd}%, /* yellow-400 */
      #6b7280 ${emAndamentoEnd}% 100% /* gray-500 */
    )`;
  };

  const StatCard: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => (
    <div className="flex items-center space-x-3">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <div>
        <div className="font-bold text-xl text-white">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700 mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Seu Progresso</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="flex justify-center items-center">
          <div className="relative">
            <div 
              className="w-32 h-32 rounded-full transition-all duration-500" 
              style={{ background: getConicGradient() }}
              role="img"
              aria-label={`Gráfico de progresso: ${concluidas} concluídas, ${emAndamento} em andamento, ${pendentes} pendentes.`}
            >
              <div className="absolute inset-2 bg-gray-800 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-white">{total}</div>
                  <div className="text-xs text-gray-400">Metas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-4">
          <StatCard value={concluidas} label="Concluídas" color="bg-green-400" />
          <StatCard value={emAndamento} label="Em Andamento" color="bg-yellow-400" />
          <StatCard value={pendentes} label="Pendentes" color="bg-gray-500" />
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal App ---
function App() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<Meta | null>(null);
  const [metaToDelete, setMetaToDelete] = useState<Meta | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'ativas' | 'arquivadas'>('ativas');
  const [activeCategory, setActiveCategory] = useState<string>('Todas');

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

  const loadMetas = useCallback(() => {
    const allMetas = metaService.getAll();
    setMetas(allMetas);
  }, []);

  useEffect(() => {
    loadMetas();
  }, [loadMetas]);

  const handleSaveMeta = (data: Omit<Meta, 'id' | 'data_criacao'>) => {
    if (selectedMeta) {
      metaService.update({ ...selectedMeta, ...data });
    } else {
      metaService.create(data);
    }
    setSelectedMeta(null);
    loadMetas();
  };
  
  const handleSelectMeta = (meta: Meta) => setSelectedMeta(meta);
  const handleClearSelection = () => setSelectedMeta(null);
  const handleDeleteRequest = (meta: Meta) => {
    setMetaToDelete(meta);
    setIsModalOpen(true);
  };
  const handleConfirmDelete = () => {
    if (metaToDelete) {
      metaService.deleteById(metaToDelete.id);
      setIsModalOpen(false);
      setMetaToDelete(null);
      if (selectedMeta && selectedMeta.id === metaToDelete.id) {
        setSelectedMeta(null);
      }
      loadMetas();
    }
  };
  const handleCancelDelete = () => {
    setIsModalOpen(false);
    setMetaToDelete(null);
  };

  const categories = useMemo(() => ['Todas', ...Array.from(new Set(metas.map(m => m.categoria)))], [metas]);
  
  const filteredMetas = useMemo(() => {
    return metas.filter(meta => {
      const isInViewMode = viewMode === 'ativas'
        ? meta.status !== Status.Concluida
        : meta.status === Status.Concluida;
      
      const isInActiveCategory = activeCategory === 'Todas' || meta.categoria === activeCategory;

      return isInViewMode && isInActiveCategory;
    });
  }, [metas, viewMode, activeCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white font-sans">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            🎯 Gestor de Metas Pessoais
          </h1>
          <p className="mt-2 text-lg text-gray-300">Evolua seus objetivos e conquiste suas ambições.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <aside className="lg:col-span-1">
            <div className="sticky top-8 bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700">
              <MetaForm
                ai={ai}
                selectedMeta={selectedMeta}
                onSave={handleSaveMeta}
                onClear={handleClearSelection}
                onDeleteRequest={handleDeleteRequest}
              />
            </div>
          </aside>

          <section className="lg:col-span-2">
            <Dashboard metas={metas} />
            
            {/* Controles de Filtro */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-700 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">Visualizar</label>
                  <div className="flex bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setViewMode('ativas')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition ${viewMode === 'ativas' ? 'bg-cyan-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}>Ativas</button>
                    <button onClick={() => setViewMode('arquivadas')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition ${viewMode === 'arquivadas' ? 'bg-purple-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}>Arquivadas</button>
                  </div>
                </div>
                <div className="flex-1">
                  <label htmlFor="category-filter" className="text-xs text-gray-400 mb-1 block">Categoria</label>
                  <select
                    id="category-filter"
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <MetaList metas={filteredMetas} onSelectMeta={handleSelectMeta} />
          </section>
        </main>
      </div>
      
      <ConfirmationModal
        isOpen={isModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Confirmar Exclusão"
        message={`Você tem certeza que deseja excluir a meta "${metaToDelete?.titulo}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}

export default App;
