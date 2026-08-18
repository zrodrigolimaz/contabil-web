/** Evento CSC selecionado pelo sub-modal "Pesquisa Evento". */
export interface EventoCsc {
  /** Código no formato `evento/subevento`, ex.: `102/300`. */
  readonly codigo: string;
  readonly descricao: string;
}

/** Campo pelo qual o sub-modal pesquisa eventos. */
export type CampoBuscaEvento = 'codigo' | 'descricao';
