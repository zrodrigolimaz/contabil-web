import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Marcador do intervalo de páginas omitido entre os números exibidos. */
const RETICENCIAS = '…';

/** Cada posição da régua de números: uma página ou um trecho omitido. */
type ItemPagina = number | typeof RETICENCIAS;

/** Um dos botões de salto: o glifo que mostra e a página para onde leva. */
interface Passo {
  readonly rotulo: string;
  readonly glifo: string;
  readonly destino: number;
  readonly desabilitado: boolean;
}

/** Acima disso a régua passa a omitir trechos em vez de listar página por página. */
const MAXIMO_SEM_RETICENCIAS = 7;

/**
 * Barra de navegação de uma grade paginada: a contagem de resultados à esquerda e os
 * saltos de página à direita.
 *
 * Componente controlado — não guarda a página, apenas pede a troca por `irPara`. Some
 * quando não há resultado algum; com uma página só, mantém a contagem e dispensa os
 * botões.
 */
@Component({
  selector: 'app-paginacao',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- O espaçamento mora aqui dentro para que o componente não ocupe altura alguma
         quando não há o que paginar. -->
    @if (total() > 0) {
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-t border-petrol-900/[0.08] px-6 py-3.5"
      >
        <p class="text-[12px] tabular-nums text-petrol-700/75" role="status">
          Mostrando {{ primeiro() }}–{{ ultimo() }} de {{ total() }}
        </p>

        @if (totalPaginas() > 1) {
          <nav class="flex items-center gap-1" aria-label="Paginação">
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

            @for (item of numeros(); track $index) {
              @if (item === reticencias) {
                <span class="px-0.5 text-[12px] text-petrol-700/45" aria-hidden="true">{{
                  reticencias
                }}</span>
              } @else if (item === pagina()) {
                <button type="button" [class]="classeAtual" aria-current="page" disabled>
                  {{ item }}
                </button>
              } @else {
                <button
                  type="button"
                  [class]="classePasso"
                  [attr.aria-label]="'Página ' + item"
                  (click)="irPara.emit(item)"
                >
                  {{ item }}
                </button>
              }
            }

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
      </div>
    }
  `,
})
export class Paginacao {
  /** Página exibida, iniciando em 1. */
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  /** Itens que atendem ao filtro, não apenas os da página. */
  readonly total = input.required<number>();
  readonly tamanhoPagina = input.required<number>();

  readonly irPara = output<number>();

  protected readonly reticencias = RETICENCIAS;

  protected readonly primeiro = computed(() => (this.pagina() - 1) * this.tamanhoPagina() + 1);
  protected readonly ultimo = computed(() =>
    Math.min(this.pagina() * this.tamanhoPagina(), this.total()),
  );

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

  protected readonly numeros = computed(() => reguaDePaginas(this.pagina(), this.totalPaginas()));

  protected readonly classePasso =
    'grid size-8 place-items-center rounded-full border border-petrol-900/[0.14] bg-white ' +
    'text-[12.5px] leading-none tabular-nums text-petrol-700 transition-colors ' +
    'hover:border-petrol-900/25 hover:bg-petrol-900/[0.04] focus-visible:outline-2 ' +
    'focus-visible:outline-offset-2 focus-visible:outline-primary-500 ' +
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-petrol-900/[0.14] ' +
    'disabled:hover:bg-white';

  protected readonly classeAtual =
    'grid size-8 place-items-center rounded-full bg-primary-600 text-[12.5px] font-semibold ' +
    'leading-none tabular-nums text-white';
}

/**
 * Régua de páginas com as extremidades sempre visíveis e a vizinhança da página atual
 * ao redor; o que sobra vira reticências. Até sete páginas, lista todas.
 */
function reguaDePaginas(pagina: number, totalPaginas: number): readonly ItemPagina[] {
  if (totalPaginas <= MAXIMO_SEM_RETICENCIAS) {
    return Array.from({ length: totalPaginas }, (_, indice) => indice + 1);
  }

  const itens: ItemPagina[] = [1];
  if (pagina > 3) {
    itens.push(RETICENCIAS);
  }

  const inicio = Math.max(2, pagina - 1);
  const fim = Math.min(totalPaginas - 1, pagina + 1);
  for (let numero = inicio; numero <= fim; numero++) {
    itens.push(numero);
  }

  if (pagina < totalPaginas - 2) {
    itens.push(RETICENCIAS);
  }
  itens.push(totalPaginas);

  return itens;
}
