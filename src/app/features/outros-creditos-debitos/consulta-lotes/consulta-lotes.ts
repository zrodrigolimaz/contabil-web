import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FiltrosPesquisaLote } from '../../../core/models/filtros';
import { Lote } from '../../../core/models/lote';
import { LoteService } from '../../../core/services/lote.service';
import { Paginacao } from '../../../shared/ui/paginacao/paginacao';
import { FiltrosLotes } from './filtros-lotes/filtros-lotes';
import { TabelaLotes } from './tabela-lotes/tabela-lotes';

@Component({
  selector: 'app-consulta-lotes',
  imports: [FiltrosLotes, TabelaLotes, Paginacao],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <app-filtros-lotes [carregando]="carregando()" (pesquisar)="pesquisar($event)" />

      <div class="cartao">
        @if (erro(); as mensagem) {
          <div class="flex justify-center px-6 py-16">
            <p
              class="flex items-center gap-2 rounded-md border border-danger/25 bg-danger/5 px-4 py-2.5 text-[13px] font-medium text-danger"
              role="alert"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4 shrink-0"
                aria-hidden="true"
              >
                <path d="M12 9v4M12 17h.01" />
                <path
                  d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                />
              </svg>
              {{ mensagem }}
            </p>
          </div>
        } @else if (pesquisou()) {
          <app-tabela-lotes
            [lotes]="lotes()"
            [carregando]="carregando()"
            [selecionados]="selecionados()"
            (alternarSelecao)="alternarSelecao($event)"
            (alternarTodos)="alternarTodos($event)"
          />

          <app-paginacao
            [pagina]="pagina()"
            [totalPaginas]="totalPaginas()"
            (irPara)="irPara($event)"
          />
        } @else if (carregando()) {
          <div class="flex justify-center px-6 py-16">
            <p class="flex items-center gap-2 text-[13px] text-petrol-700/80" role="status">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                class="size-4 animate-spin text-primary-600 motion-reduce:animate-none"
                aria-hidden="true"
              >
                <path d="M12 3a9 9 0 1 0 9 9" />
              </svg>
              Consultando lotes…
            </p>
          </div>
        } @else {
          <div class="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <p class="text-[13px] font-semibold text-petrol-900">Nenhuma pesquisa realizada</p>
            <p class="max-w-sm text-[13px] text-petrol-700/70">
              Ajuste os filtros acima e clique em Pesquisar para listar os lotes.
            </p>
          </div>
        }
      </div>
    </div>
  `,
})
export class ConsultaLotes {
  private readonly loteService = inject(LoteService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly lotes = signal<readonly Lote[]>([]);
  protected readonly pagina = signal(1);
  protected readonly totalPaginas = signal(1);
  protected readonly total = signal<number | null>(null);

  /**
   * Seleção por id, e não por índice: assim ela sobrevive à troca de página e às
   * ações da barra, que agem sobre os lotes escolhidos e não sobre linhas da grade.
   */
  protected readonly selecionados = signal<ReadonlySet<number>>(new Set());

  /** Critérios da última pesquisa, para paginar sem depender do formulário. */
  private filtrosAtuais: FiltrosPesquisaLote | null = null;

  /** A grade só aparece depois da primeira consulta bem-sucedida. */
  protected readonly pesquisou = computed(() => this.total() !== null);

  protected pesquisar(filtros: FiltrosPesquisaLote): void {
    this.filtrosAtuais = filtros;
    this.consultar(1);
  }

  protected irPara(pagina: number): void {
    this.consultar(pagina);
  }

  protected alternarSelecao(id: number): void {
    this.selecionados.update((atuais) => {
      const proximos = new Set(atuais);
      if (!proximos.delete(id)) {
        proximos.add(id);
      }

      return proximos;
    });
  }

  /** Age só sobre a página exibida; o que foi marcado nas outras continua marcado. */
  protected alternarTodos(marcar: boolean): void {
    const idsDaPagina = this.lotes().map((lote) => lote.id);

    this.selecionados.update((atuais) => {
      const proximos = new Set(atuais);
      for (const id of idsDaPagina) {
        if (marcar) {
          proximos.add(id);
        } else {
          proximos.delete(id);
        }
      }

      return proximos;
    });
  }

  private consultar(pagina: number): void {
    const filtros = this.filtrosAtuais;
    if (!filtros) {
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    this.loteService
      .pesquisar(filtros, pagina)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => {
          this.lotes.set(resultado.itens);
          this.total.set(resultado.total);
          /* A página vem da resposta: o serviço limita o pedido ao intervalo válido. */
          this.pagina.set(resultado.pagina);
          this.totalPaginas.set(resultado.totalPaginas);
          this.carregando.set(false);
        },
        error: (falha: Error) => {
          this.erro.set(falha.message);
          this.lotes.set([]);
          this.total.set(null);
          this.carregando.set(false);
        },
      });
  }
}
