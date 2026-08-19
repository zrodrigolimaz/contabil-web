/** Conta corrente localizada pela lupa da seção Conta Corrente. */
export interface ContaCorrente {
  readonly numero: string;
  readonly titular: string;
  readonly agencia: string;
}

/** Campo pelo qual o sub-modal pesquisa contas. */
export type CampoBuscaConta = 'numero' | 'titular' | 'agencia';
