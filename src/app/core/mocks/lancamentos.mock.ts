import { Lancamento, SituacaoLancamento } from '../models/lancamento';
import { Lote, SituacaoLote } from '../models/lote';
import { CONTAS_CORRENTES } from './contas-correntes.mock';
import { EVENTOS_CSC } from './eventos-csc.mock';
import { LOTES } from './lotes.mock';
import { HISTORICO, HISTORICOS, OPCOES_PA, PA } from './opcoes.mock';

const LANCAMENTOS_ESCOLHIDOS: readonly Lancamento[] = [
  {
    id: 1,
    idLote: 1002,
    conta: '44444',
    titular: 'Ana Paula Costa',
    valor: 2500.55,
    historico: HISTORICO.credito,
    estorno: false,
    documento: '2025110001',
    descricao: 'Crédito de repasse de convênio.',
    situacao: 'Processado',
    pa: PA.cooperativa,
    idEvento: '102',
    descricaoEvento: 'Centralização Título CSC Crédito',
    complementoHistorico: 'Repasse referente à competência 10/2025.',
    situacaoDocumentoCsc: 'Processado',
    idDocumentoCsc: 'CSC-2025-000141',
    anexos: [
      {
        id: 1,
        nomeReduzido: 'repasse-10-2025.pdf',
        descricao: 'Relatório de repasse da competência 10/2025',
        dataInclusao: new Date(2025, 10, 12, 9, 40),
        idUsuario: 'ana.costa',
      },
    ],
  },
  {
    id: 2,
    idLote: 1002,
    conta: '11223',
    titular: 'Bruno Almeida Lima',
    valor: 1280,
    historico: HISTORICO.debito,
    estorno: false,
    documento: '2025110002',
    descricao: 'Débito de tarifa de manutenção.',
    situacao: 'Processado',
    pa: PA.centro,
    idEvento: '106',
    descricaoEvento: 'Tarifa de Manutenção de Conta',
    complementoHistorico: 'Tarifa mensal da conta 11223.',
    situacaoDocumentoCsc: 'Processado',
    idDocumentoCsc: 'CSC-2025-000142',
    anexos: [],
  },
  {
    id: 3,
    idLote: 1004,
    conta: '20567',
    titular: 'Carla Souza Ferreira',
    valor: 1250,
    historico: HISTORICO.ajusteContabil,
    estorno: false,
    documento: '2025120010',
    descricao: 'Ajuste de conciliação contábil.',
    situacao: 'Pendente',
    pa: PA.cooperativa,
    idEvento: '112',
    descricaoEvento: 'Ajuste Contábil de Crédito',
    complementoHistorico: 'Conciliação da conta transitória de dezembro.',
    situacaoDocumentoCsc: 'Aguardando Processamento CCO',
    idDocumentoCsc: null,
    anexos: [],
  },
  {
    id: 4,
    idLote: 1010,
    conta: '30891',
    titular: 'Diego Matos Ribeiro',
    valor: 1815.4,
    historico: HISTORICO.transferencia,
    estorno: false,
    documento: '2026020031',
    descricao: 'Transferência entre contas da cooperativa.',
    situacao: 'Pendente',
    pa: PA.zonaSul,
    idEvento: '107',
    descricaoEvento: 'Tarifa de Transferência entre Contas',
    complementoHistorico: 'Transferência solicitada pela agência 0102.',
    situacaoDocumentoCsc: 'Aguardando Processamento CCO',
    idDocumentoCsc: null,
    anexos: [],
  },
  {
    id: 5,
    idLote: 1010,
    conta: '51470',
    titular: 'Elisa Rocha Nogueira',
    valor: 500,
    historico: HISTORICO.estornoTarifa,
    estorno: true,
    documento: '2026020032',
    descricao: 'Estorno de tarifa cobrada em duplicidade.',
    situacao: 'Pendente',
    pa: PA.cooperativa,
    idEvento: '104',
    descricaoEvento: 'Centralização Título CSC Estorno de Crédito',
    complementoHistorico: 'Estorno autorizado pelo gerente do PA.',
    situacaoDocumentoCsc: 'Aguardando Processamento CCO',
    idDocumentoCsc: null,
    anexos: [],
  },
  {
    id: 6,
    idLote: 1023,
    conta: '73918',
    titular: 'Gabriela Martins Pinto',
    valor: 2150,
    historico: HISTORICO.liquidacaoTitulo,
    estorno: false,
    documento: '2026070005',
    descricao: 'Liquidação de título em cobrança.',
    situacao: 'Pendente',
    pa: PA.industrial,
    idEvento: '108',
    descricaoEvento: 'Liquidação de Título em Cobrança',
    complementoHistorico: 'Título 998877 liquidado no caixa.',
    situacaoDocumentoCsc: 'Aguardando Processamento CCO',
    idDocumentoCsc: null,
    anexos: [],
  },
  {
    id: 7,
    idLote: 1023,
    conta: '88104',
    titular: 'Comércio de Grãos Horizonte Ltda.',
    valor: 1000,
    historico: HISTORICO.credito,
    estorno: false,
    documento: '2026070006',
    descricao: 'Crédito de sobras a distribuir.',
    situacao: 'Pendente',
    pa: PA.cooperativa,
    idEvento: '118',
    descricaoEvento: 'Crédito de Sobras a Distribuir',
    complementoHistorico: 'Distribuição aprovada em assembleia.',
    situacaoDocumentoCsc: 'Aguardando Processamento CCO',
    idDocumentoCsc: null,
    anexos: [],
  },
];

const SITUACAO_DO_LANCAMENTO: Record<SituacaoLote, SituacaoLancamento> = {
  Aberto: 'Pendente',
  Enviado: 'Processado',
  Confirmado: 'Processado',
};

const TEXTOS: Record<string, { descricao: string; complemento: string; idEvento: string }> = {
  [HISTORICO.manual]: {
    descricao: 'Lançamento manual de acerto.',
    complemento: 'Acerto registrado pela contabilidade.',
    idEvento: '112',
  },
  [HISTORICO.credito]: {
    descricao: 'Crédito em conta corrente.',
    complemento: 'Crédito conferido com o extrato do dia.',
    idEvento: '102',
  },
  [HISTORICO.debito]: {
    descricao: 'Débito em conta corrente.',
    complemento: 'Débito autorizado pelo gerente da conta.',
    idEvento: '103',
  },
  [HISTORICO.estornoTarifa]: {
    descricao: 'Estorno de tarifa cobrada indevidamente.',
    complemento: 'Estorno aprovado no atendimento do PA.',
    idEvento: '104',
  },
  [HISTORICO.transferencia]: {
    descricao: 'Transferência entre contas da cooperativa.',
    complemento: 'Transferência solicitada pela agência.',
    idEvento: '107',
  },
  [HISTORICO.ajusteContabil]: {
    descricao: 'Ajuste de conciliação contábil.',
    complemento: 'Conciliação da conta transitória.',
    idEvento: '113',
  },
  [HISTORICO.liquidacaoTitulo]: {
    descricao: 'Liquidação de título em cobrança.',
    complemento: 'Título liquidado no caixa do PA.',
    idEvento: '108',
  },
};

function sorteioReprodutivel(semente: number): (limite: number) => number {
  let estado = semente;

  return (limite) => {
    estado = (estado * 16807) % 2147483647;
    return estado % limite;
  };
}

function repartir(valorDoLote: number, quantidade: number, sortear: (n: number) => number): number[] {
  const totalEmCentavos = Math.round(valorDoLote * 100);
  const pesos = Array.from({ length: quantidade }, () => 70 + sortear(60));
  const somaDosPesos = pesos.reduce((total, peso) => total + peso, 0);

  let distribuido = 0;

  return pesos.map((peso, indice) => {
    const parte =
      indice === quantidade - 1
        ? totalEmCentavos - distribuido
        : Math.round((totalEmCentavos * peso) / somaDosPesos);

    distribuido += parte;
    return parte / 100;
  });
}

function lancamentosDoLote(lote: Lote, primeiroId: number): Lancamento[] {
  const sortear = sorteioReprodutivel(lote.id * 7919);
  const valores = repartir(lote.valor, lote.quantidadeLancamentos, sortear);
  const situacao = SITUACAO_DO_LANCAMENTO[lote.situacao];
  const processado = situacao === 'Processado';
  const ano = lote.dataEntrada.getFullYear();
  const mes = `${lote.dataEntrada.getMonth() + 1}`.padStart(2, '0');

  return valores.map((valor, indice) => {
    const conta = CONTAS_CORRENTES[sortear(CONTAS_CORRENTES.length)];
    const historico = HISTORICOS[sortear(HISTORICOS.length)];
    const texto = TEXTOS[historico];
    const evento = EVENTOS_CSC.find((atual) => atual.idEvento === texto.idEvento) ?? EVENTOS_CSC[0];
    const sequencial = `${indice + 1}`.padStart(4, '0');

    return {
      id: primeiroId + indice,
      idLote: lote.id,
      conta: conta.numero,
      titular: conta.titular,
      valor,
      historico,
      estorno: historico === HISTORICO.estornoTarifa,
      documento: `${ano}${mes}${sequencial}`,
      descricao: texto.descricao,
      situacao,
      pa: OPCOES_PA[sortear(OPCOES_PA.length)],
      idEvento: evento.idEvento,
      descricaoEvento: evento.descricao,
      complementoHistorico: texto.complemento,
      situacaoDocumentoCsc: processado ? 'Processado' : 'Aguardando Processamento CCO',
      idDocumentoCsc: processado
        ? `CSC-${ano}-${`${lote.id * 10 + indice}`.padStart(6, '0')}`
        : null,
      anexos: [],
    };
  });
}

function lancamentosDeVolume(): readonly Lancamento[] {
  const lotesJaEscritos = new Set(LANCAMENTOS_ESCOLHIDOS.map((lancamento) => lancamento.idLote));
  const gerados: Lancamento[] = [];

  let proximoId = LANCAMENTOS_ESCOLHIDOS.length + 1;

  for (const lote of LOTES) {
    if (lotesJaEscritos.has(lote.id)) {
      continue;
    }

    const doLote = lancamentosDoLote(lote, proximoId);
    proximoId += doLote.length;
    gerados.push(...doLote);
  }

  return gerados;
}

export const LANCAMENTOS: readonly Lancamento[] = [
  ...LANCAMENTOS_ESCOLHIDOS,
  ...lancamentosDeVolume(),
];
