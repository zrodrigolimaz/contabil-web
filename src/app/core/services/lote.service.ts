import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { LOTES } from '../mocks/lotes.mock';
import { FaixaData, FaixaNumerica, FiltrosPesquisaLote, SITUACAO_TODAS } from '../models/filtros';
import { Lote, SituacaoLote } from '../models/lote';
import { ResultadoPaginado } from '../models/paginacao';
import { dataDeIso, fimDoDia, inicioDoDia } from '../utils/data';
import { paginar } from '../utils/paginar';
import { erroMock, respostaMock } from './api-mock';

/**
 * Gatilho determinístico do erro simulado: pesquisar com "ID Lote De" igual a 999
 * faz a consulta falhar. Escolhido por ser digitável na própria tela e por ficar
 * fora da faixa dos lotes de demonstração (1001..1024), sem aleatoriedade.
 */
export const ID_LOTE_ERRO_SIMULADO = 999;

/** Usuário autenticado simulado; preenche "Usuário Aprovação" na confirmação. */
const USUARIO_LOGADO = 'ana.costa';

@Injectable({ providedIn: 'root' })
export class LoteService {
  /** Fonte de verdade em memória: `confirmar` e `enviar` alteram esta lista. */
  private lotes: readonly Lote[] = LOTES;

  /** Aplica os filtros do painel e devolve a página pedida. */
  pesquisar(filtros: FiltrosPesquisaLote, pagina = 1): Observable<ResultadoPaginado<Lote>> {
    if (filtros.idLote.de === ID_LOTE_ERRO_SIMULADO) {
      return erroMock('Não foi possível consultar os lotes. Tente novamente.');
    }

    const encontrados = this.lotes.filter((lote) => atendeAosFiltros(lote, filtros));
    return respostaMock(paginar(encontrados, pagina));
  }

  /** Confirma os lotes ainda não confirmados e registra o usuário de aprovação. */
  confirmar(ids: readonly number[]): Observable<readonly Lote[]> {
    return this.mudarSituacao(ids, 'Confirmado', ['Aberto', 'Enviado']);
  }

  /** Envia os lotes que ainda estão abertos. */
  enviar(ids: readonly number[]): Observable<readonly Lote[]> {
    return this.mudarSituacao(ids, 'Enviado', ['Aberto']);
  }

  /**
   * Muda a situação dos lotes informados que estejam em uma das situações de
   * origem. Idempotente: lotes fora dessas situações ficam intactos e não entram
   * no retorno.
   */
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

/** Faixa inclusiva; `null` em um dos lados desativa aquele limite. */
function dentroDaFaixaNumerica(valor: number, faixa: FaixaNumerica): boolean {
  return (faixa.de === null || valor >= faixa.de) && (faixa.ate === null || valor <= faixa.ate);
}

/** Compara o dia inteiro: o limite "Até" inclui lotes registrados ao longo do dia. */
function dentroDaFaixaDeDatas(data: Date, faixa: FaixaData): boolean {
  const de = dataDeIso(faixa.de);
  const ate = dataDeIso(faixa.ate);

  return (de === null || data >= inicioDoDia(de)) && (ate === null || data <= fimDoDia(ate));
}
