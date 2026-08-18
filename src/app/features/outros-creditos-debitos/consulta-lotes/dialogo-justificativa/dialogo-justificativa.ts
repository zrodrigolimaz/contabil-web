import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

import { Lote } from '../../../../core/models/lote';

let sequencia = 0;

/**
 * Justificativa do lote em um `<dialog>` nativo.
 *
 * O elemento nativo já entrega foco preso, Esc para fechar e fundo escurecido, sem
 * dependência nova. O shell de modal sobre CDK Dialog chega com a tela de lançamentos;
 * até lá, este diálogo pequeno resolve sozinho.
 *
 * Componente controlado: quem abre e fecha é o container, pelo `lote` — `null` fechado.
 */
@Component({
  selector: 'app-dialogo-justificativa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!--
      A classe m-auto é o que centraliza: o reset do Tailwind zera a margem de todo
      elemento, inclusive o "margin: auto" que o navegador dá ao dialog em modo modal, e
      sem ela o diálogo encosta no canto superior esquerdo da tela.
    -->
    <dialog
      #dialogo
      [attr.aria-labelledby]="idTitulo"
      (close)="fechar.emit()"
      class="m-auto max-w-md rounded-xl border border-petrol-900/[0.14] bg-white p-0
        text-petrol-900 shadow-[0_8px_28px_rgba(11,46,51,0.18)] backdrop:bg-petrol-900/40"
    >
      @if (lote(); as lote) {
        <div class="flex flex-col gap-3 px-6 py-5">
          <h2 [id]="idTitulo" class="text-[14px] font-semibold">
            Justificativa do lote {{ lote.id }}
          </h2>

          <p class="text-[13px] leading-relaxed text-petrol-700">{{ lote.justificativa }}</p>

          <div class="flex justify-end">
            <button type="button" class="btn btn-contorno" (click)="dialogo.close()">Fechar</button>
          </div>
        </div>
      }
    </dialog>
  `,
})
export class DialogoJustificativa {
  /** Lote cuja justificativa está em exibição; `null` mantém o diálogo fechado. */
  readonly lote = input.required<Lote | null>();

  /** Fechamento pedido pelo usuário — no botão, no Esc ou no backdrop. */
  readonly fechar = output<void>();

  protected readonly idTitulo = `justificativa-titulo-${sequencia++}`;

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const elemento = this.dialogo().nativeElement;
      const aberto = this.lote() !== null;

      if (aberto && !elemento.open) {
        elemento.showModal();
      } else if (!aberto && elemento.open) {
        elemento.close();
      }
    });
  }
}
