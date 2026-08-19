import { EventoCsc } from '../models/evento';

/** Eventos CSC listados pelo sub-modal "Pesquisa Evento". */
export const EVENTOS_CSC: readonly EventoCsc[] = [
  { codigo: '102/300', descricao: 'Centralização Título CSC Crédito' },
  { codigo: '102/301', descricao: 'Centralização Título CSC Débito' },
  { codigo: '102/310', descricao: 'Centralização Título CSC Estorno de Crédito' },
  { codigo: '102/311', descricao: 'Centralização Título CSC Estorno de Débito' },
  { codigo: '105/120', descricao: 'Tarifa de Manutenção de Conta' },
  { codigo: '105/121', descricao: 'Tarifa de Transferência entre Contas' },
  { codigo: '108/400', descricao: 'Liquidação de Título em Cobrança' },
  { codigo: '108/401', descricao: 'Baixa de Título por Decurso de Prazo' },
  { codigo: '110/200', descricao: 'Repasse de Convênio Folha de Pagamento' },
  { codigo: '110/205', descricao: 'Repasse de Convênio Arrecadação' },
  { codigo: '115/330', descricao: 'Ajuste Contábil de Crédito' },
  { codigo: '115/331', descricao: 'Ajuste Contábil de Débito' },
  { codigo: '120/500', descricao: 'Provisão de Despesa Administrativa' },
  { codigo: '120/501', descricao: 'Reversão de Provisão de Despesa' },
  { codigo: '125/610', descricao: 'Rateio de Custo Centralizado CSC' },
  { codigo: '125/611', descricao: 'Estorno de Rateio de Custo Centralizado CSC' },
  { codigo: '130/700', descricao: 'Crédito de Sobras a Distribuir' },
  { codigo: '130/701', descricao: 'Débito de Perdas a Ratear' },
  { codigo: '140/800', descricao: 'Integralização de Capital Social' },
  { codigo: '140/801', descricao: 'Devolução de Capital Social' },
];
