import { TestBed } from '@angular/core/testing';

import { HISTORICO, PA } from '../mocks/opcoes.mock';
import { NovoLancamento } from '../models/lancamento';
import { erroDe, valorDe } from '../testing/resposta-mock';
import { LancamentoService } from './lancamento.service';

const NOVO: NovoLancamento = {
  idLote: 1004,
  conta: '44444',
  titular: 'Ana Paula Costa',
  valor: 750.25,
  historico: HISTORICO.credito,
  estorno: false,
  documento: '2026080001',
  descricao: 'Crédito de ajuste.',
  pa: PA.cooperativa,
  codigoEvento: '102/300',
  descricaoEvento: 'Centralização Título CSC Crédito',
  complementoHistorico: 'Ajuste solicitado pela contabilidade.',
  anexos: [],
};

describe('LancamentoService', () => {
  let service: LancamentoService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = TestBed.inject(LancamentoService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('lista apenas os lançamentos do lote informado', () => {
    const lancamentos = valorDe(service.listarPorLote(1002));

    expect(lancamentos.map((lancamento) => lancamento.id)).toEqual([1, 2]);
  });

  it('devolve lista vazia para lote sem lançamentos carregados', () => {
    expect(valorDe(service.listarPorLote(1008))).toHaveLength(0);
  });

  it('inclui o lançamento como pendente e o adiciona à grade do lote', () => {
    const incluido = valorDe(service.incluir(NOVO));

    expect(incluido.situacao).toBe('Pendente');
    expect(incluido.situacaoDocumentoCsc).toBe('Aguardando Processamento CCO');
    expect(incluido.idDocumentoCsc).toBeNull();

    const doLote = valorDe(service.listarPorLote(1004));
    expect(doLote.map((lancamento) => lancamento.id)).toEqual([3, incluido.id]);
  });

  it('gera identificadores distintos a cada inclusão', () => {
    const primeiro = valorDe(service.incluir(NOVO));
    const segundo = valorDe(service.incluir(NOVO));

    expect(segundo.id).not.toBe(primeiro.id);
  });

  it('altera os dados preservando id e situações', () => {
    const alterado = valorDe(service.alterar(3, { ...NOVO, valor: 999.99 }));

    expect(alterado.id).toBe(3);
    expect(alterado.valor).toBe(999.99);
    expect(alterado.situacao).toBe('Pendente');

    const doLote = valorDe(service.listarPorLote(1004));
    expect(doLote).toEqual([alterado]);
  });

  it('exclui o lançamento do lote', () => {
    valorDe(service.excluir(1));

    expect(valorDe(service.listarPorLote(1002)).map((lancamento) => lancamento.id)).toEqual([2]);
  });

  it('duplica o lançamento com novo id, situação pendente e sem anexos', () => {
    const copia = valorDe(service.duplicar(1));

    expect(copia.id).not.toBe(1);
    expect(copia.idLote).toBe(1002);
    expect(copia.conta).toBe('44444');
    expect(copia.situacao).toBe('Pendente');
    expect(copia.idDocumentoCsc).toBeNull();
    expect(copia.anexos).toHaveLength(0);
    expect(valorDe(service.listarPorLote(1002))).toHaveLength(3);
  });

  it('falha ao operar sobre lançamento inexistente', () => {
    expect(erroDe(service.alterar(999, NOVO)).message).toBe('Lançamento 999 não encontrado.');
    expect(erroDe(service.excluir(999)).message).toBe('Lançamento 999 não encontrado.');
    expect(erroDe(service.duplicar(999)).message).toBe('Lançamento 999 não encontrado.');
  });
});
