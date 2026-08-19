import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Lote, SituacaoLote } from '../../../../core/models/lote';

/** Marcador de campo sem valor, no lugar de deixar a célula em branco. */
export const SEM_VALOR = '—';

/** Tom da pastilha por situação; o avanço no fluxo aparece na intensidade da cor. */
const CLASSE_DA_SITUACAO: Record<SituacaoLote, string> = {
  Aberto: 'chip chip-neutro',
  Enviado: 'chip',
  Confirmado: 'chip chip-solido',
};

/**
 * Larguras das barras de esqueleto, uma por coluna. Variar o tamanho evita o bloco
 * uniforme que não se parece com texto nenhum.
 */
const LARGURAS_ESQUELETO = ['100%', '45%', '70%', '55%', '35%', '65%', '60%', '50%', '80%'];

/**
 * Grade de resultados da consulta de lotes.
 *
 * Componente de apresentação: recebe a página já paginada e o conjunto de ids
 * selecionados, e apenas avisa quais linhas o usuário marcou. Quem decide o que
 * fazer com a seleção é o container.
 */
@Component({
  selector: 'app-tabela-lotes',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './tabela-lotes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabelaLotes {
  readonly lotes = input.required<readonly Lote[]>();
  readonly carregando = input(false);
  /** Ids marcados em toda a consulta, não só nesta página. */
  readonly selecionados = input.required<ReadonlySet<number>>();

  /** Id do lote cuja caixa foi clicada. */
  readonly alternarSelecao = output<number>();
  /** Novo estado da caixa mestre: marcar ou desmarcar a página inteira. */
  readonly alternarTodos = output<boolean>();

  protected readonly semValor = SEM_VALOR;
  protected readonly classeDaSituacao = CLASSE_DA_SITUACAO;

  /** Células cinzas no lugar do corpo enquanto a consulta responde. */
  protected readonly linhasEsqueleto = Array.from({ length: 5 });
  protected readonly largurasEsqueleto = LARGURAS_ESQUELETO;

  private readonly marcadosNaPagina = computed(
    () => this.lotes().filter((lote) => this.selecionados().has(lote.id)).length,
  );

  protected readonly todosMarcados = computed(
    () => this.lotes().length > 0 && this.marcadosNaPagina() === this.lotes().length,
  );

  /**
   * Terceiro estado da caixa mestre: parte da página marcada. Não existe como
   * atributo HTML, só como propriedade do elemento — daí o binding de propriedade.
   */
  protected readonly parteMarcada = computed(
    () => this.marcadosNaPagina() > 0 && !this.todosMarcados(),
  );

  protected aoAlternarTodos(evento: Event): void {
    this.alternarTodos.emit((evento.target as HTMLInputElement).checked);
  }
}
