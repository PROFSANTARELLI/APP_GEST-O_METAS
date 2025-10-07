
import React from 'react';
import { Meta } from '../types';
import MetaItem from './MetaItem';

interface MetaListProps {
  metas: Meta[];
  onSelectMeta: (meta: Meta) => void;
}

const MetaList: React.FC<MetaListProps> = ({ metas, onSelectMeta }) => {
  if (metas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-800/30 backdrop-blur-sm p-8 rounded-2xl text-center border border-dashed border-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-200">Nenhuma meta encontrada.</h3>
        <p className="text-gray-400 mt-1">Tente ajustar os filtros ou crie uma nova meta!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {metas.map((meta, index) => (
         <div key={meta.id} style={{ animationDelay: `${index * 50}ms`, opacity: 0 }} className="animate-fade-in-up">
            <MetaItem meta={meta} onSelectMeta={onSelectMeta} />
         </div>
      ))}
       <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default MetaList;
