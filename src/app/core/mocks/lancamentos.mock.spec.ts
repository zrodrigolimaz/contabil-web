import { LANCAMENTOS } from './lancamentos.mock';
import { LOTES } from './lotes.mock';

describe('LANCAMENTOS', () => {
  const porLote = new Map<number, typeof LANCAMENTOS>();

  for (const lote of LOTES) {
    porLote.set(
      lote.id,
      LANCAMENTOS.filter((lancamento) => lancamento.idLote === lote.id),
    );
  }

  it('entrega a quantidade de lançamentos que a grade de lotes anuncia', () => {
    const divergentes = LOTES.filter(
      (lote) => porLote.get(lote.id)!.length !== lote.quantidadeLancamentos,
    ).map((lote) => `lote ${lote.id}: ${porLote.get(lote.id)!.length} de ${lote.quantidadeLancamentos}`);

    expect(divergentes).toEqual([]);
  });

  it('soma exatamente o valor do lote', () => {
    const divergentes = LOTES.filter((lote) => {
      const soma = porLote
        .get(lote.id)!
        .reduce((total, lancamento) => total + Math.round(lancamento.valor * 100), 0);

      return soma !== Math.round(lote.valor * 100);
    }).map((lote) => `lote ${lote.id}`);

    expect(divergentes).toEqual([]);
  });

  it('não repete id de lançamento', () => {
    expect(new Set(LANCAMENTOS.map((lancamento) => lancamento.id)).size).toBe(LANCAMENTOS.length);
  });

  it('só emite documento CSC no que já foi processado', () => {
    const incoerentes = LANCAMENTOS.filter(
      (lancamento) =>
        (lancamento.situacaoDocumentoCsc === 'Processado') !== (lancamento.idDocumentoCsc !== null),
    );

    expect(incoerentes).toEqual([]);
  });

  it('mantém todo valor de lançamento acima de zero', () => {
    expect(LANCAMENTOS.filter((lancamento) => lancamento.valor <= 0)).toEqual([]);
  });
});
