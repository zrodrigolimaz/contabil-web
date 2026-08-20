import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { LOTES } from '../mocks/lotes.mock';
import { INSTITUICAO, INSTITUICAO_RESPONSAVEL } from '../mocks/opcoes.mock';
import { USUARIO_LOGADO } from '../mocks/usuario.mock';
import { FaixaData, FaixaNumerica, FiltrosPesquisaLote, SITUACAO_TODAS } from '../models/filtros';
import { Lote, SituacaoLote } from '../models/lote';
import { CampoOrdenacao, Ordenacao, ORDENACAO_PADRAO } from '../models/ordenacao';
import { ResultadoPaginado } from '../models/paginacao';
import { dataDeIso, fimDoDia, inicioDoDia } from '../utils/data';
import { paginar } from '../utils/paginar';
import { erroMock, respostaMock } from './api-mock';

export const ID_LOTE_ERRO_SIMULADO = 999;

export const SO_LOTE_ABERTO_SE_EXCLUI = 'Só é possível excluir lote em situação Aberto.';

@Injectable({ providedIn: 'root' })
export class LoteService {
  private lotes: readonly Lote[] = LOTES;
  private proximoId = Math.max(0, ...LOTES.map((lote) => lote.id)) + 1;

  pesquisar(
    filtros: FiltrosPesquisaLote,
    pagina = 1,
    ordenacao: Ordenacao = ORDENACAO_PADRAO,
  ): Observable<ResultadoPaginado<Lote>> {
    if (filtros.idLote.de === ID_LOTE_ERRO_SIMULADO) {
      return erroMock('Não foi possível consultar os lotes. Tente novamente.');
    }

    const encontrados = this.lotes.filter((lote) => atendeAosFiltros(lote, filtros));
    return respostaMock(paginar(ordenar(encontrados, ordenacao), pagina));
  }

  criar(): Observable<Lote> {
    const agora = new Date();
    const criado: Lote = {
      id: this.proximoId++,
      instituicaoResponsavel: INSTITUICAO_RESPONSAVEL.banco,
      instituicao: INSTITUICAO.alfa,
      dataEntrada: agora,
      valor: 0,
      quantidadeLancamentos: 0,
      usuarioRegistro: USUARIO_LOGADO,
      usuarioAprovacao: null,
      situacao: 'Aberto',
      dataHoraSituacao: agora,
      justificativa: null,
    };

    this.lotes = [...this.lotes, criado];
    return respostaMock(criado);
  }

  atualizarTotais(id: number, valor: number, quantidadeLancamentos: number): Observable<Lote> {
    const atual = this.lotes.find((lote) => lote.id === id);
    if (!atual) {
      return erroMock(`Lote ${id} não encontrado.`);
    }

    const atualizado: Lote = { ...atual, valor, quantidadeLancamentos };
    this.lotes = this.lotes.map((lote) => (lote.id === id ? atualizado : lote));

    return respostaMock(atualizado);
  }

  excluir(id: number): Observable<void> {
    const atual = this.lotes.find((lote) => lote.id === id);
    if (!atual) {
      return erroMock(`Lote ${id} não encontrado.`);
    }

    if (atual.situacao !== 'Aberto') {
      return erroMock(SO_LOTE_ABERTO_SE_EXCLUI);
    }

    this.lotes = this.lotes.filter((lote) => lote.id !== id);
    return respostaMock<void>(undefined);
  }

  confirmar(ids: readonly number[]): Observable<readonly Lote[]> {
    return this.mudarSituacao(ids, 'Confirmado', ['Aberto', 'Enviado']);
  }

  enviar(ids: readonly number[]): Observable<readonly Lote[]> {
    return this.mudarSituacao(ids, 'Enviado', ['Aberto']);
  }

  private mudarSituacao(
    ids: readonly number[],
    destino: SituacaoLote,
    origens: readonly SituacaoLote[],
  ): Observable<readonly Lote[]> {
    const alterados: Lote[] = [];

    this.lotes = this.lotes.map((lote) => {
      if (!ids.includes(lote.id) || !origens.includes(lote.situacao)) {
        return lote;
      }

      const atualizado: Lote = {
        ...lote,
        situacao: destino,
        dataHoraSituacao: new Date(),
        usuarioAprovacao: destino === 'Confirmado' ? USUARIO_LOGADO : lote.usuarioAprovacao,
      };
      alterados.push(atualizado);
      return atualizado;
    });

    return respostaMock(alterados);
  }
}

function atendeAosFiltros(lote: Lote, filtros: FiltrosPesquisaLote): boolean {
  return (
    (!filtros.instituicaoResponsavel ||
      lote.instituicaoResponsavel === filtros.instituicaoResponsavel) &&
    (!filtros.instituicao || lote.instituicao === filtros.instituicao) &&
    (filtros.situacao === SITUACAO_TODAS || lote.situacao === filtros.situacao) &&
    dentroDaFaixaNumerica(lote.id, filtros.idLote) &&
    dentroDaFaixaNumerica(lote.valor, filtros.valor) &&
    dentroDaFaixaDeDatas(lote.dataEntrada, filtros.dataEntrada)
  );
}

function dentroDaFaixaNumerica(valor: number, faixa: FaixaNumerica): boolean {
  return (faixa.de === null || valor >= faixa.de) && (faixa.ate === null || valor <= faixa.ate);
}

function dentroDaFaixaDeDatas(data: Date, faixa: FaixaData): boolean {
  const de = dataDeIso(faixa.de);
  const ate = dataDeIso(faixa.ate);

  return (de === null || data >= inicioDoDia(de)) && (ate === null || data <= fimDoDia(ate));
}

/** Ordem do fluxo, não a alfabética: "Aberto, Confirmado, Enviado" não diria nada. */
const POSICAO_DA_SITUACAO: Record<SituacaoLote, number> = {
  Aberto: 0,
  Enviado: 1,
  Confirmado: 2,
};

const COMPARADOR: Record<CampoOrdenacao, (a: Lote, b: Lote) => number> = {
  id: (a, b) => a.id - b.id,
  dataEntrada: (a, b) => a.dataEntrada.getTime() - b.dataEntrada.getTime(),
  valor: (a, b) => a.valor - b.valor,
  quantidadeLancamentos: (a, b) => a.quantidadeLancamentos - b.quantidadeLancamentos,
  usuarioRegistro: (a, b) => a.usuarioRegistro.localeCompare(b.usuarioRegistro, 'pt-BR'),
  usuarioAprovacao: (a, b) =>
    (a.usuarioAprovacao ?? '').localeCompare(b.usuarioAprovacao ?? '', 'pt-BR'),
  situacao: (a, b) => POSICAO_DA_SITUACAO[a.situacao] - POSICAO_DA_SITUACAO[b.situacao],
  dataHoraSituacao: (a, b) => a.dataHoraSituacao.getTime() - b.dataHoraSituacao.getTime(),
};

function ordenar(lotes: readonly Lote[], { campo, direcao }: Ordenacao): readonly Lote[] {
  const sentido = direcao === 'asc' ? 1 : -1;

  return [...lotes].sort((a, b) => {
    const ausencia = ausenteAoFim(a[campo], b[campo]);
    if (ausencia !== 0) {
      return ausencia;
    }

    const comparados = sentido * COMPARADOR[campo](a, b);
    return comparados !== 0 ? comparados : a.id - b.id;
  });
}

function ausenteAoFim(a: Lote[CampoOrdenacao], b: Lote[CampoOrdenacao]): number {
  if ((a === null) === (b === null)) {
    return 0;
  }

  return a === null ? 1 : -1;
}
