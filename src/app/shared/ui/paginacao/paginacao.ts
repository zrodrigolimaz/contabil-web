import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Um dos botões de salto da barra: o glifo que mostra e a página para onde leva. */
interface Passo {
  readonly rotulo: string;
  readonly glifo: string;
  readonly destino: number;
  readonly desabilitado: boolean;
}

/**
 * Navegação entre páginas de uma grade: primeira, anterior, página atual, próxima e
 * última.
 *
 * Componente controlado — não guarda a página, apenas pede a troca por `irPara`. Some
 * quando há uma página só, porque aí não há para onde navegar.
 */
@Component({
  selector: 'app-paginacao',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- O espaçamento mora no <nav> para que o componente não ocupe altura alguma
         quando não há o que paginar. -->
    @if (totalPaginas() > 1) {
      <nav class="flex items-center justify-center gap-1.5 px-6 py-4" aria-label="Paginação">
        @for (passo of anteriores(); track passo.rotulo) {
          <button
            type="button"
            [class]="classePasso"
            [attr.aria-label]="passo.rotulo"
            [disabled]="passo.desabilitado"
            (click)="irPara.emit(passo.destino)"
          >
            <span aria-hidden="true">{{ passo.glifo }}</span>
          </button>
        }

        <span
          class="grid size-8 place-items-center rounded-full bg-primary-600 text-[12.5px] font-semibold tabular-nums text-white"
          aria-current="page"
        >
          {{ pagina() }}
        </span>

        @for (passo of proximos(); track passo.rotulo) {
          <button
            type="button"
            [class]="classePasso"
            [attr.aria-label]="passo.rotulo"
            [disabled]="passo.desabilitado"
            (click)="irPara.emit(passo.destino)"
          >
            <span aria-hidden="true">{{ passo.glifo }}</span>
          </button>
        }
      </nav>
    }
  `,
})
export class Paginacao {
  /** Página exibida, iniciando em 1. */
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();

  readonly irPara = output<number>();

  private readonly naPrimeira = computed(() => this.pagina() <= 1);
  private readonly naUltima = computed(() => this.pagina() >= this.totalPaginas());

  protected readonly anteriores = computed<readonly Passo[]>(() => [
    { rotulo: 'Primeira página', glifo: '«', destino: 1, desabilitado: this.naPrimeira() },
    {
      rotulo: 'Página anterior',
      glifo: '‹',
      destino: this.pagina() - 1,
      desabilitado: this.naPrimeira(),
    },
  ]);

  protected readonly proximos = computed<readonly Passo[]>(() => [
    {
      rotulo: 'Próxima página',
      glifo: '›',
      destino: this.pagina() + 1,
      desabilitado: this.naUltima(),
    },
    {
      rotulo: 'Última página',
      glifo: '»',
      destino: this.totalPaginas(),
      desabilitado: this.naUltima(),
    },
  ]);

  protected readonly classePasso =
    'grid size-8 place-items-center rounded-full border border-petrol-900/[0.14] bg-white ' +
    'text-[14px] leading-none text-petrol-700 transition-colors hover:border-petrol-900/25 ' +
    'hover:bg-petrol-900/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-40 ' +
    'disabled:hover:border-petrol-900/[0.14] disabled:hover:bg-white';
}
