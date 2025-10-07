
import React from 'react';
import { Meta, Status } from '../types';

interface MetaItemProps {
  meta: Meta;
  onSelectMeta: (meta: Meta) => void;
}

const statusBadgeStyles: { [key in Status]: string } = {
    [Status.Concluida]: 'bg-green-500/20 text-green-300 border-green-500/30',
    [Status.EmAndamento]: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    [Status.Pendente]: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const getPrazoInfo = (prazoFinal?: string) => {
    if (!prazoFinal) return { text: 'Sem prazo', color: 'text-gray-500' };
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const prazo = new Date(prazoFinal + 'T00:00:00-03:00'); // Considerar fuso local
    const diffTime = prazo.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Atrasado', color: 'text-red-400' };
    if (diffDays === 0) return { text: 'Termina hoje', color: 'text-yellow-400' };
    if (diffDays <= 7) return { text: `Faltam ${diffDays} dias`, color: 'text-yellow-500' };
    return { text: new Date(prazo).toLocaleDateString('pt-BR', { timeZone: 'UTC'}), color: 'text-gray-400'};
};

const MetaItem: React.FC<MetaItemProps> = ({ meta, onSelectMeta }) => {
  const concluida = meta.status === Status.Concluida;
  const prazoInfo = getPrazoInfo(meta.prazoFinal);

  const progresso = meta.submetas.length > 0
    ? (meta.submetas.filter(s => s.concluida).length / meta.submetas.length) * 100
    : (meta.status === Status.Concluida ? 100 : 0);

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:shadow-lg ${concluida ? 'opacity-70' : ''}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusBadgeStyles[meta.status]}`}>
                        {meta.status}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {meta.categoria}
                    </span>
                </div>

                <h4 className={`text-xl font-bold text-gray-100 break-words ${concluida ? 'line-through text-gray-500' : ''}`}>{meta.titulo}</h4>
                <p className="text-sm text-gray-400 mt-2 break-words">{meta.descricao || "Sem descrição."}</p>
                
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                    <span>
                      Prazo: <span className={prazoInfo.color}>{prazoInfo.text}</span>
                    </span>
                </div>
            </div>
            <div className="flex-shrink-0 mt-4 sm:mt-0">
                <button
                    onClick={() => onSelectMeta(meta)}
                    className="bg-gray-700 hover:bg-cyan-700 text-white font-semibold py-2 px-5 rounded-md transition duration-300 ease-in-out text-sm"
                >
                    Detalhes
                </button>
            </div>
        </div>

        {/* Progresso e Sub-metas */}
        {meta.submetas.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-700/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-400">Progresso</span>
              <span className="text-xs font-bold text-cyan-300">{Math.round(progresso)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progresso}%` }}
              ></div>
            </div>

            <div className="mt-3 space-y-2">
              {meta.submetas.slice(0, 3).map(sub => (
                <div key={sub.id} className="flex items-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${sub.concluida ? 'text-green-400' : 'text-gray-600'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className={`${sub.concluida ? 'line-through text-gray-500' : 'text-gray-300'}`}>{sub.texto}</span>
                </div>
              ))}
              {meta.submetas.length > 3 && (
                <div className="text-xs text-gray-500 pl-6">...e mais {meta.submetas.length - 3}</div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default MetaItem;
