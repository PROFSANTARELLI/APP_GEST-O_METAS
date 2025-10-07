
export enum Status {
  Pendente = 'Pendente',
  EmAndamento = 'Em Andamento',
  Concluida = 'Concluída',
}

export interface SubMeta {
  id: number;
  texto: string;
  concluida: boolean;
}

export interface Meta {
  id: number;
  titulo: string;
  descricao: string;
  status: Status;
  data_criacao: string;
  prazoFinal?: string;
  categoria: string;
  submetas: SubMeta[];
}
