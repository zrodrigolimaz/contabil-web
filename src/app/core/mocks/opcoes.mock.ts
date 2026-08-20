export const INSTITUICAO_RESPONSAVEL = {
  banco: '0001 - Banco Cooperativo',
  central: '0002 - Central Regional',
  confederacao: '0003 - Confederação',
} as const;

export const INSTITUICOES_RESPONSAVEIS: readonly string[] = Object.values(INSTITUICAO_RESPONSAVEL);

export const INSTITUICAO = {
  alfa: '0101 - Cooperativa Alfa',
  beta: '0102 - Cooperativa Beta',
  gama: '0103 - Cooperativa Gama',
  delta: '0104 - Cooperativa Delta',
} as const;

export const INSTITUICOES: readonly string[] = Object.values(INSTITUICAO);

export const HISTORICO = {
  manual: '090 - Lançamento Manual',
  credito: '001 - Crédito em conta corrente',
  debito: '002 - Débito em conta corrente',
  estornoTarifa: '015 - Estorno de tarifa',
  transferencia: '030 - Transferência entre contas',
  ajusteContabil: '045 - Ajuste contábil',
  liquidacaoTitulo: '060 - Liquidação de título',
} as const;

export const HISTORICOS: readonly string[] = Object.values(HISTORICO);

export const PA = {
  cooperativa: 'Cooperativa',
  centro: 'PA 01 - Centro',
  zonaSul: 'PA 02 - Zona Sul',
  industrial: 'PA 03 - Distrito Industrial',
} as const;

export const OPCOES_PA: readonly string[] = Object.values(PA);
