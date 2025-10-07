
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Meta, Status, SubMeta } from '../types';

interface MetaFormProps {
  selectedMeta: Meta | null;
  onSave: (data: Omit<Meta, 'id' | 'data_criacao'>) => void;
  onClear: () => void;
  onDeleteRequest: (meta: Meta) => void;
  ai: GoogleGenAI;
}

const MetaForm: React.FC<MetaFormProps> = ({ selectedMeta, onSave, onClear, onDeleteRequest, ai }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<Status>(Status.Pendente);
  const [prazoFinal, setPrazoFinal] = useState('');
  const [categoria, setCategoria] = useState('');
  const [submetas, setSubmetas] = useState<SubMeta[]>([]);
  const [novaSubmetaTexto, setNovaSubmetaTexto] = useState('');
  
  const [error, setError] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const resetForm = useCallback(() => {
    setTitulo('');
    setDescricao('');
    setStatus(Status.Pendente);
    setPrazoFinal('');
    setCategoria('Geral');
    setSubmetas([]);
    setNovaSubmetaTexto('');
    setError('');
    setAiError('');
  }, []);
  
  useEffect(() => {
    if (selectedMeta) {
      setTitulo(selectedMeta.titulo);
      setDescricao(selectedMeta.descricao);
      setStatus(selectedMeta.status);
      setPrazoFinal(selectedMeta.prazoFinal || '');
      setCategoria(selectedMeta.categoria || 'Geral');
      setSubmetas(selectedMeta.submetas || []);
      setError('');
      setAiError('');
    } else {
      resetForm();
    }
  }, [selectedMeta, resetForm]);

  // Efeito para auto-atualizar o status principal baseado nas sub-metas
  useEffect(() => {
    if (submetas.length > 0) {
      const concluidasCount = submetas.filter(s => s.concluida).length;
      if (concluidasCount === submetas.length) {
        setStatus(Status.Concluida);
      } else if (concluidasCount > 0) {
        setStatus(Status.EmAndamento);
      } else {
        setStatus(Status.Pendente);
      }
    }
  }, [submetas]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("O campo 'Título' é obrigatório.");
      return;
    }
    setError('');
    onSave({ titulo, descricao, status, prazoFinal, categoria: categoria || 'Geral', submetas });
  };
  
  const handleNovoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onClear();
  };

  const handleAddSubmeta = () => {
    if (novaSubmetaTexto.trim()) {
      setSubmetas([...submetas, { id: Date.now(), texto: novaSubmetaTexto, concluida: false }]);
      setNovaSubmetaTexto('');
    }
  };

  const handleToggleSubmeta = (id: number) => {
    setSubmetas(submetas.map(s => s.id === id ? { ...s, concluida: !s.concluida } : s));
  };

  const handleRemoveSubmeta = (id: number) => {
    setSubmetas(submetas.filter(s => s.id !== id));
  };
  
  const handleAiSuggest = async () => {
      if (!titulo.trim()) {
        setAiError("Digite um título para a meta antes de pedir sugestões.");
        return;
      }
      setIsAiLoading(true);
      setAiError('');
      try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Para a meta "${titulo}" com a descrição "${descricao}", sugira 3 a 5 passos curtos e práticos para alcançá-la.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  passos: {
                    type: Type.ARRAY,
                    description: 'Uma lista de passos para alcançar a meta.',
                    items: { type: Type.STRING }
                  }
                }
              }
            },
        });
        
        const result = JSON.parse(response.text);
        const suggestedSteps = result.passos || [];
        const newSubmetas = suggestedSteps.map((step: string, index: number) => ({ id: Date.now() + index, texto: step, concluida: false }));
        setSubmetas(prev => [...prev, ...newSubmetas]);

      } catch (err) {
        console.error("Erro da API Gemini:", err);
        setAiError("Não foi possível obter sugestões. Tente novamente.");
      } finally {
        setIsAiLoading(false);
      }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-cyan-300">{selectedMeta ? 'Editar Meta' : 'Nova Meta'}</h2>
      
      <div>
        <label htmlFor="titulo" className="block text-sm font-medium text-gray-300 mb-1">Título</label>
        <input id="titulo" type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Aprender a programar em React" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </div>

      <div>
        <label htmlFor="descricao" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
        <textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} placeholder="Detalhes sobre a meta..." className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"></textarea>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="prazo" className="block text-sm font-medium text-gray-300 mb-1">Prazo Final</label>
          <input id="prazo" type="date" value={prazoFinal} onChange={(e) => setPrazoFinal(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />
        </div>
        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
          <input id="categoria" type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: Estudos" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />
        </div>
      </div>

      {selectedMeta && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition">
            {Object.values(Status).map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
      )}

      {/* Gerenciador de Sub-metas */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">Passos / Checklist</label>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {submetas.map(submeta => (
                <div key={submeta.id} className="flex items-center gap-2 group bg-gray-700/50 p-2 rounded-md">
                    <input type="checkbox" checked={submeta.concluida} onChange={() => handleToggleSubmeta(submeta.id)} className="form-checkbox h-5 w-5 rounded bg-gray-600 text-cyan-500 border-gray-500 focus:ring-cyan-500" />
                    <span className={`flex-1 text-sm ${submeta.concluida ? 'line-through text-gray-400' : 'text-gray-200'}`}>{submeta.texto}</span>
                    <button type="button" onClick={() => handleRemoveSubmeta(submeta.id)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            ))}
        </div>
        <div className="flex gap-2">
            <input type="text" value={novaSubmetaTexto} onChange={e => setNovaSubmetaTexto(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubmeta())} placeholder="Adicionar novo passo..." className="flex-1 w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />
            <button type="button" onClick={handleAddSubmeta} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded-md text-sm transition">+</button>
        </div>
        <div>
          <button type="button" onClick={handleAiSuggest} disabled={isAiLoading} className="w-full mt-2 flex justify-center items-center gap-2 bg-purple-600/50 hover:bg-purple-600/80 text-purple-200 font-semibold py-2 px-4 rounded-md transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {isAiLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : '✨'}
            {isAiLoading ? 'Sugerindo...' : 'Sugerir Passos com IA'}
          </button>
          {aiError && <p className="text-red-400 text-sm mt-1 text-center">{aiError}</p>}
        </div>
      </div>

      <div className="flex flex-col space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={handleNovoClick} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition">Novo</button>
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition transform hover:scale-105">Salvar</button>
        </div>
        {selectedMeta && (
            <button type="button" onClick={() => onDeleteRequest(selectedMeta)} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition">Excluir Meta</button>
        )}
      </div>
    </form>
  );
};

export default MetaForm;
