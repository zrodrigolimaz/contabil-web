import { TestBed } from '@angular/core/testing';

import { LOTES } from '../mocks/lotes.mock';
import { INSTITUICAO_RESPONSAVEL } from '../mocks/opcoes.mock';
import { FILTROS_VAZIOS, FiltrosPesquisaLote } from '../models/filtros';
import { TAMANHO_PAGINA_PADRAO } from '../models/paginacao';
import { erroDe, valorDe } from '../testing/resposta-mock';
import { ID_LOTE_ERRO_SIMULADO, LoteService } from './lote.service';

function comFiltros(parcial: Partial<FiltrosPesquisaLote>): FiltrosPesquisaLote {
  return { ...FILTROS_VAZIOS, ...parcial };
}

describe('LoteService', () => {
  let service: LoteService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = TestBed.inject(LoteService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('pesquisar', () => {
    it('sem filtros devolve a primeira página de todos os lotes', () => {
      const resultado = valorDe(service.pesquisar(FILTROS_VAZIOS));

      expect(resultado.total).toBe(LOTES.length);
      expect(resultado.itens).toHaveLength(TAMANHO_PAGINA_PADRAO);
      expect(resultado.pagina).toBe(1);
      expect(resultado.totalPaginas).toBe(3);
    });

    it('filtra por situação', () => {
      const resultado = valorDe(service.pesquisar(comFiltros({ situacao: 'Aberto' })));

      expect(resultado.total).toBe(7);
      expect(resultado.itens.every((lote) => lote.situacao === 'Aberto')).toBe(true);
    });

    it('filtra pela faixa de ID incluindo os extremos', () => {
      const resultado = valorDe(service.pesquisar(comFiltros({ idLote: { de: 1005, ate: 1008 } })));

      expect(resultado.itens.map((lote) => lote.id)).toEqual([1005, 1006, 1007, 1008]);
    });

    it('aceita faixa com apenas um dos lados preenchido', () => {
      const resultado = valorDe(service.pesquisar(comFiltros({ idLote: { de: 1022, ate: null } })));

      expect(resultado.itens.map((lote) => lote.id)).toEqual([1022, 1023, 1024]);
    });

    it('filtra pela faixa de valor', () => {
      const resultado = valorDe(service.pesquisar(comFiltros({ valor: { de: 1250, ate: 3150 } })));

      expect(resultado.itens.map((lote) => lote.id)).toEqual([1004, 1010, 1017, 1023]);
    });

    it('filtra pela faixa de data de entrada incluindo o dia final inteiro', () => {
      const resultado = valorDe(
        service.pesquisar(comFiltros({ dataEntrada: { de: '2026-07-01', ate: '2026-07-20' } })),
      );

      expect(resultado.itens.map((lote) => lote.id)).toEqual([1022, 1023]);
    });

    it('combina filtros de instituição responsável e situação', () => {
      const resultado = valorDe(
        service.pesquisar(
          comFiltros({
            instituicaoResponsavel: INSTITUICAO_RESPONSAVEL.confederacao,
            situacao: 'Enviado',
          }),
        ),
      );

      expect(resultado.itens.map((lote) => lote.id)).toEqual([1012, 1015, 1018, 1021, 1024]);
    });

    it('devolve resultado vazio quando nada atende aos filtros', () => {
      const resultado = valorDe(service.pesquisar(comFiltros({ idLote: { de: 5000, ate: 6000 } })));

      expect(resultado.itens).toHaveLength(0);
      expect(resultado.total).toBe(0);
      expect(resultado.totalPaginas).toBe(1);
    });

    it('devolve a última página parcial', () => {
      const resultado = valorDe(service.pesquisar(FILTROS_VAZIOS, 3));

      expect(resultado.pagina).toBe(3);
      expect(resultado.itens.map((lote) => lote.id)).toEqual([1021, 1022, 1023, 1024]);
    });

    it('limita a página pedida à última existente', () => {
      const resultado = valorDe(service.pesquisar(FILTROS_VAZIOS, 99));

      expect(resultado.pagina).toBe(3);
      expect(resultado.itens).toHaveLength(4);
    });

    it('falha quando o filtro de ID começa no valor do erro simulado', () => {
      const erro = erroDe(
        service.pesquisar(comFiltros({ idLote: { de: ID_LOTE_ERRO_SIMULADO, ate: null } })),
      );

      expect(erro.message).toBe('Não foi possível consultar os lotes. Tente novamente.');
    });
  });

  describe('enviar', () => {
    it('muda lotes abertos para enviado e reflete na próxima pesquisa', () => {
      const enviados = valorDe(service.enviar([1004]));
      expect(enviados.map((lote) => lote.situacao)).toEqual(['Enviado']);

      const resultado = valorDe(service.pesquisar(comFiltros({ idLote: { de: 1004, ate: 1004 } })));
      expect(resultado.itens[0].situacao).toBe('Enviado');
    });

    it('ignora lotes que não estão abertos', () => {
      const enviados = valorDe(service.enviar([1001, 1006]));

      expect(enviados).toHaveLength(0);
    });
  });

  describe('criar', () => {
    it('abre um lote vazio já visível na consulta', () => {
      const criado = valorDe(service.criar());

      expect(criado.situacao).toBe('Aberto');
      expect(criado.valor).toBe(0);
      expect(criado.quantidadeLancamentos).toBe(0);
      expect(criado.usuarioAprovacao).toBeNull();

      const resultado = valorDe(
        service.pesquisar(comFiltros({ idLote: { de: criado.id, ate: criado.id } })),
      );
      expect(resultado.total).toBe(1);
    });

    it('numera o lote novo depois do último existente', () => {
      const primeiro = valorDe(service.criar());
      const segundo = valorDe(service.criar());

      expect(primeiro.id).toBeGreaterThan(Math.max(...LOTES.map((lote) => lote.id)));
      expect(segundo.id).toBe(primeiro.id + 1);
    });
  });

  describe('atualizarTotais', () => {
    it('leva para a consulta o que mudou dentro do lote', () => {
      const atualizado = valorDe(service.atualizarTotais(1004, 3200.5, 2));

      expect(atualizado.valor).toBe(3200.5);
      expect(atualizado.quantidadeLancamentos).toBe(2);

      const resultado = valorDe(service.pesquisar(comFiltros({ idLote: { de: 1004, ate: 1004 } })));
      expect(resultado.itens[0].valor).toBe(3200.5);
    });

    it('falha para lote que não existe', () => {
      expect(erroDe(service.atualizarTotais(9999, 10, 1)).message).toContain('9999');
    });
  });

  describe('confirmar', () => {
    it('confirma lotes abertos e enviados registrando o usuário de aprovação', () => {
      const confirmados = valorDe(service.confirmar([1004, 1006]));

      expect(confirmados.map((lote) => lote.id)).toEqual([1004, 1006]);
      expect(confirmados.every((lote) => lote.situacao === 'Confirmado')).toBe(true);
      expect(confirmados.every((lote) => lote.usuarioAprovacao === 'ana.costa')).toBe(true);
    });

    it('é idempotente para lotes já confirmados', () => {
      valorDe(service.confirmar([1004]));
      const segunda = valorDe(service.confirmar([1004]));

      expect(segunda).toHaveLength(0);
    });

    it('não altera os demais lotes', () => {
      valorDe(service.confirmar([1004]));

      const resultado = valorDe(service.pesquisar(comFiltros({ situacao: 'Aberto' })));
      expect(resultado.total).toBe(6);
    });
  });
});
