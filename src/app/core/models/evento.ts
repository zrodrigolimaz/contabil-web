export interface EventoCsc {
  readonly idEvento: string;
  readonly codEvento: string;
  readonly descricao: string;
  readonly dataInicio: Date;
  readonly dataFim: Date | null;
}

export type CampoBuscaEvento = 'idEvento' | 'codEvento' | 'descricao';
