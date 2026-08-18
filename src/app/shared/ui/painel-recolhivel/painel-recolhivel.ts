import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

let sequencia = 0;

/**
 * Cartão com cabeçalho e conteúdo que expande/recolhe.
 *
 * O conteúdo continua no DOM quando recolhido — assim um formulário dentro dele não
 * é remontado nem perde o que foi digitado — e recebe `inert` para sair da ordem de
 * tabulação. A animação usa `grid-template-rows`, que transiciona da altura zero até
 * a altura real sem precisar de valor fixo.
 */
@Component({
  selector: 'app-painel-recolhivel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="cartao">
      <div
        class="flex items-center gap-4 px-6 py-4"
        [class]="aberto() ? 'border-b border-petrol-900/[0.12] bg-surface/60' : ''"
      >
        <div class="shrink-0">
          <h2 class="text-[14px] font-semibold text-petrol-900">{{ titulo() }}</h2>
          @if (subtitulo(); as descricao) {
            <p class="mt-0.5 text-[12px] text-petrol-700/70">{{ descricao }}</p>
          }
        </div>

        @if (!aberto()) {
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <ng-content select="[resumo]" />
          </div>
        } @else {
          <span class="flex-1"></span>
        }

        <button
          type="button"
          [attr.aria-expanded]="aberto()"
          [attr.aria-controls]="idConteudo"
          [attr.aria-label]="(aberto() ? 'Recolher ' : 'Expandir ') + titulo()"
          (click)="aberto.set(!aberto())"
          class="grid size-7 shrink-0 place-items-center rounded-md text-petrol-700 transition-colors hover:bg-petrol-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-4 transition-transform motion-reduce:transition-none"
            [class.rotate-180]="!aberto()"
            aria-hidden="true"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      </div>

      <div
        class="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
        [class]="aberto() ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
      >
        <div [id]="idConteudo" class="overflow-hidden" [attr.inert]="aberto() ? null : ''">
          <div class="px-6 pb-6 pt-6">
            <ng-content />
          </div>
        </div>
      </div>
    </section>
  `,
})
export class PainelRecolhivel {
  readonly titulo = input.required<string>();
  /** Linha de apoio sob o título, no padrão de cabeçalho de cartão. */
  readonly subtitulo = input<string>();
  readonly aberto = model(true);

  protected readonly idConteudo = `painel-conteudo-${sequencia++}`;
}
