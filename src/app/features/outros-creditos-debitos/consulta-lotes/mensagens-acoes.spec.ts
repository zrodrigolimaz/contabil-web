import { Lote, SituacaoLote } from '../../../core/models/lote';
import { descreverResultado, pedidoDeExclusao, pedidoDeSituacao } from './mensagens-acoes';

function loteCom(id: number, situacao: SituacaoLote = 'Aberto', quantidadeLancamentos = 1): Lote {
  return {
    id,
    instituicaoResponsavel: '0001 - Banco Cooperativo',
    instituicao: '0101 - Cooperativa Alfa',
    dataEntrada: new Date(2026, 3, 26),
    valor: 1000,
    quantidadeLancamentos,
    usuarioRegistro: 'ana.costa',
    usuarioAprovacao: null,
    situacao,
    dataHoraSituacao: new Date(2026, 3, 27, 12, 35, 11),
    justificativa: null,
  };
}

describe('pedidoDeExclusao', () => {
  it('trata a exclusão como ação de risco', () => {
    const pedido = pedidoDeExclusao(loteCom(1004));

    expect(pedido.titulo).toBe('Excluir lote');
    expect(pedido.mensagem).toBe('Excluir o lote 1004?');
    expect(pedido.rotuloConfirmar).toBe('Excluir');
    expect(pedido.perigo).toBe(true);
  });

  it('cala sobre lançamentos quando o lote está vazio', () => {
    expect(pedidoDeExclusao(loteCom(1004, 'Aberto', 0)).detalhe).toBeUndefined();
  });

  it('avisa que o único lançamento sai junto', () => {
    expect(pedidoDeExclusao(loteCom(1004, 'Aberto', 1)).detalhe).toBe(
      'O lançamento dele sai junto.',
    );
  });

  it('conta os lançamentos que saem junto', () => {
    expect(pedidoDeExclusao(loteCom(1004, 'Aberto', 7)).detalhe).toBe(
      'Os 7 lançamentos dele saem junto.',
    );
  });
});

describe('pedidoDeSituacao', () => {
  it('nomeia o lote quando só um está selecionado', () => {
    const pedido = pedidoDeSituacao('confirmar', [loteCom(1004)]);

    expect(pedido.titulo).toBe('Confirmar lote');
    expect(pedido.mensagem).toBe('Confirmar o lote 1004?');
    expect(pedido.detalhe).toBeUndefined();
    expect(pedido.rotuloConfirmar).toBe('Confirmar');
  });

  it('conta os lotes quando todos os selecionados são alcançados', () => {
    const pedido = pedidoDeSituacao('confirmar', [loteCom(1004), loteCom(1005, 'Enviado')]);

    expect(pedido.titulo).toBe('Confirmar lotes');
    expect(pedido.mensagem).toBe('Confirmar os 2 lotes selecionados?');
    expect(pedido.detalhe).toBeUndefined();
  });

  it('separa alcançados de ignorados ao confirmar', () => {
    const pedido = pedidoDeSituacao('confirmar', [
      loteCom(1004),
      loteCom(1005, 'Confirmado'),
      loteCom(1006, 'Confirmado'),
    ]);

    expect(pedido.mensagem).toBe('Confirmar 1 dos 3 lotes selecionados?');
    expect(pedido.detalhe).toBe('2 já estão confirmados e serão ignorados.');
  });

  it('concorda o singular do ignorado ao confirmar', () => {
    const pedido = pedidoDeSituacao('confirmar', [loteCom(1004), loteCom(1005, 'Confirmado')]);

    expect(pedido.detalhe).toBe('1 já está confirmado e será ignorado.');
  });

  it('só alcança lote aberto ao enviar', () => {
    const pedido = pedidoDeSituacao('enviar', [
      loteCom(1004),
      loteCom(1005, 'Enviado'),
      loteCom(1006, 'Confirmado'),
    ]);

    expect(pedido.titulo).toBe('Enviar lotes');
    expect(pedido.mensagem).toBe('Enviar 1 dos 3 lotes selecionados?');
    expect(pedido.detalhe).toBe('2 não estão abertos e serão ignorados.');
  });

  it('concorda o singular do ignorado ao enviar', () => {
    expect(pedidoDeSituacao('enviar', [loteCom(1004), loteCom(1005, 'Enviado')]).detalhe).toBe(
      '1 não está aberto e será ignorado.',
    );
  });

  it('não marca a mudança de situação como ação de risco', () => {
    expect(pedidoDeSituacao('enviar', [loteCom(1004)]).perigo).toBeUndefined();
  });
});

describe('descreverResultado', () => {
  it('avisa quando nenhum lote mudou', () => {
    expect(descreverResultado('confirmar', 0, 0)).toBe('Nenhum lote confirmado.');
    expect(descreverResultado('enviar', 0, 0)).toBe('Nenhum lote enviado.');
  });

  it('concorda o singular do que mudou', () => {
    expect(descreverResultado('confirmar', 1, 0)).toBe('1 lote confirmado.');
    expect(descreverResultado('enviar', 1, 0)).toBe('1 lote enviado.');
  });

  it('concorda o plural do que mudou', () => {
    expect(descreverResultado('confirmar', 4, 0)).toBe('4 lotes confirmados.');
    expect(descreverResultado('enviar', 4, 0)).toBe('4 lotes enviados.');
  });

  it('emenda a frase dos ignorados quando sobra alguém', () => {
    expect(descreverResultado('confirmar', 1, 1)).toBe(
      '1 lote confirmado. 1 lote já estava confirmado e foi ignorado.',
    );
    expect(descreverResultado('enviar', 2, 3)).toBe(
      '2 lotes enviados. 3 lotes não estavam abertos e foram ignorados.',
    );
  });

  it('descreve só o que mudou quando nada foi ignorado', () => {
    expect(descreverResultado('confirmar', 2, 0)).not.toContain('ignorado');
  });
});
