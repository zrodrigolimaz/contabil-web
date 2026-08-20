export interface ContaCorrente {
  readonly numero: string;
  readonly titular: string;
  readonly agencia: string;
}

export type CampoBuscaConta = 'numero' | 'titular' | 'agencia';
