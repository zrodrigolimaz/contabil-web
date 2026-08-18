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
      <app-filtros-lotes (pesquisar)="pesquisar($event)" />

      <div class="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        @if (carregando()) {
          <p class="text-sm text-petrol-700/70" role="status">Consultando lotes…</p>
        } @else if (erro(); as mensagem) {
          <p class="text-sm font-medium text-danger" role="alert">{{ mensagem }}</p>
        } @else if (resumo(); as texto) {
          <p class="text-sm font-semibold text-petrol-900">{{ texto }}</p>
        } @else {
          <div class="grid size-12 place-items-center rounded-full bg-primary-50 text-primary-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-6"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h2 class="text-base font-semibold text-petrol-900">Consulta de lotes</h2>
          <p class="max-w-xs text-sm text-petrol-700/70">
            Informe os filtros desejados e clique em Pesquisar.
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
