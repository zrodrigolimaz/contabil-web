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
import { LoteService } from '../../../core/services/lote.service';
import { FiltrosLotes } from './filtros-lotes/filtros-lotes';

@Component({
  selector: 'app-consulta-lotes',
  imports: [FiltrosLotes],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5">
      <app-filtros-lotes [carregando]="carregando()" (pesquisar)="pesquisar($event)" />

      <div class="flex flex-col items-center gap-2 py-14 text-center">
        @if (carregando()) {
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
        } @else if (erro(); as mensagem) {
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
        } @else if (resumo(); as texto) {
          <p class="text-[13px] text-petrol-700/80">{{ texto }}</p>
        } @else {
          <p class="text-[13px] font-semibold text-petrol-900">Nenhuma pesquisa realizada</p>
          <p class="max-w-sm text-[13px] text-petrol-700/70">
            Ajuste os filtros acima e clique em Pesquisar para listar os lotes.
          </p>
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
  /** Provisório: a tabela de resultados substitui este contador na próxima entrega. */
  protected readonly total = signal<number | null>(null);

  protected readonly resumo = computed(() => {
    const quantidade = this.total();
    if (quantidade === null) {
      return null;
    }
    if (quantidade === 0) {
      /* Mesma frase do sistema legado. */
      return 'Nenhum registro encontrado.';
    }

    return quantidade === 1 ? '1 lote encontrado.' : `${quantidade} lotes encontrados.`;
  });

  protected pesquisar(filtros: FiltrosPesquisaLote): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.loteService
      .pesquisar(filtros)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => {
          this.total.set(resultado.total);
          this.carregando.set(false);
        },
        error: (falha: Error) => {
          this.erro.set(falha.message);
          this.total.set(null);
          this.carregando.set(false);
        },
      });
  }
}
