import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

let sequencia = 0;

/** Diálogo modal da aplicação; quem abre e fecha é o consumidor, pelo `aberto`. */
@Component({
  selector: 'app-dialogo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!--
      m-auto é o que centraliza: o reset do Tailwind zera o "margin: auto" que o
      navegador dá ao dialog em modo modal, e sem ela ele encosta no canto da tela.
      O hidden é da mesma família: "flex" sozinho venceria o "display: none" que o
      navegador dá ao dialog fechado, que então deixaria uma faixa na página.
    -->
    <dialog
      #dialogo
      [attr.aria-labelledby]="idTitulo"
      (close)="aoFecharNativo()"
      class="m-auto hidden max-h-[calc(100vh-4rem)] w-[calc(100vw-2rem)] flex-col rounded-xl
        border border-petrol-900/[0.14] bg-white p-0 text-petrol-900
        shadow-[0_8px_28px_rgba(11,46,51,0.18)] backdrop:bg-petrol-900/40 open:flex"
      [style.max-width]="larguraMaxima()"
    >
      @if (aberto()) {
        <header
          class="flex shrink-0 items-center justify-between gap-4 border-b border-petrol-900/[0.1]
            px-6 py-4"
        >
          <h2 [id]="idTitulo" class="text-[14px] font-semibold">{{ titulo() }}</h2>

          <button
            type="button"
            class="rounded-md p-1 text-petrol-700/70 transition-colors hover:bg-petrol-900/[0.06]
              hover:text-petrol-900 focus-visible:outline-2 focus-visible:outline-offset-1
              focus-visible:outline-primary-500"
            aria-label="Fechar"
            (click)="dialogo.close()"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              class="size-4"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <!-- relative: sem um bloco de contenção aqui, o que estiver absoluto no
             conteúdo (as legendas sr-only das tabelas) escapa da área rolável e faz
             o próprio dialog rolar, levando o cabeçalho junto. -->
        <div class="relative min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <ng-content />
        </div>

        <footer class="shrink-0 border-t border-petrol-900/[0.1] px-6 py-3">
          <ng-content select="[rodape]" />
        </footer>
      }
    </dialog>
  `,
})
export class Dialogo {
  readonly aberto = input.required<boolean>();
  readonly titulo = input.required<string>();
  readonly larguraMaxima = input('32rem');

  /** Dispara também no Esc e no backdrop. */
  readonly fechar = output<void>();

  protected readonly idTitulo = `dialogo-titulo-${sequencia++}`;

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  /* O `close` nativo chega depois do `close()` do efeito; sem esta marca, o eco
     fecharia um diálogo reaberto nesse intervalo. */
  private fechandoPorComando = false;

  constructor() {
    effect(() => {
      const elemento = this.dialogo().nativeElement;
      const aberto = this.aberto();

      if (aberto && !elemento.open) {
        this.fechandoPorComando = false;
        elemento.showModal();
      } else if (!aberto && elemento.open) {
        this.fechandoPorComando = true;
        elemento.close();
      }
    });
  }

  protected aoFecharNativo(): void {
    if (this.fechandoPorComando) {
      this.fechandoPorComando = false;
      return;
    }

    this.fechar.emit();
  }
}
