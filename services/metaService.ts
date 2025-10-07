
import { Meta, Status } from '../types';

const STORAGE_KEY = 'gestorMetasApp';

const getRawMetas = (): Meta[] => {
  try {
    const metasJson = localStorage.getItem(STORAGE_KEY);
    return metasJson ? (JSON.parse(metasJson) as Meta[]) : [];
  } catch (error) {
    console.error("Erro ao carregar metas do localStorage:", error);
    return [];
  }
};

export const getAll = (): Meta[] => {
  const metas = getRawMetas();
  // Ordena as metas para que as mais recentes apareçam primeiro na criação
  return metas.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime());
};

export const getById = (id: number): Meta | undefined => {
  const metas = getRawMetas();
  return metas.find(meta => meta.id === id);
};

export const create = (data: Omit<Meta, 'id' | 'data_criacao'>): Meta => {
  const metas = getRawMetas();
  const newMeta: Meta = {
    id: Date.now(),
    data_criacao: new Date().toISOString(),
    ...data,
  };
  const updatedMetas = [newMeta, ...metas];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMetas));
  return newMeta;
};

export const update = (updatedMeta: Meta): Meta | undefined => {
  let metas = getRawMetas();
  const metaIndex = metas.findIndex(meta => meta.id === updatedMeta.id);

  if (metaIndex === -1) {
    console.error(`Meta com ID ${updatedMeta.id} não encontrada para atualização.`);
    return undefined;
  }

  metas[metaIndex] = updatedMeta;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(metas));
  return updatedMeta;
};

export const deleteById = (id: number): void => {
  let metas = getRawMetas();
  const updatedMetas = metas.filter(meta => meta.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMetas));
};
