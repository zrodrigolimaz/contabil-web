/** Evento CSC selecionado pelo sub-modal "Pesquisa Evento". */
export interface EventoCsc {
  readonly idEvento: string;
  readonly codEvento: string;
  readonly descricao: string;
  readonly dataInicio: Date;
  readonly dataFim: Date | null;
}

/** Campo pelo qual o sub-modal pesquisa eventos. */
export type CampoBuscaEvento = 'idEvento' | 'codEvento' | 'descricao';
