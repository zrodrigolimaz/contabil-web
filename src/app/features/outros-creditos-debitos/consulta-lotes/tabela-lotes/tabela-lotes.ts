import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Lote } from '../../../../core/models/lote';

/** Marcador de campo sem valor, no lugar de deixar a célula em branco. */
export const SEM_VALOR = '—';

/**
 * Grade de resultados da consulta de lotes.
 *
 * Componente de apresentação: recebe a página já paginada e o conjunto de ids
 * selecionados, e apenas avisa quais linhas o usuário marcou. Quem decide o que
 * fazer com a seleção é o container.
 */
@Component({
  selector: 'app-tabela-lotes',
  imports: [DatePipe, DecimalPipe],
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

  /** Células cinzas no lugar do corpo enquanto a consulta responde. */
  protected readonly linhasEsqueleto = Array.from({ length: 5 });
  protected readonly celulasEsqueleto = Array.from({ length: 9 });

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
