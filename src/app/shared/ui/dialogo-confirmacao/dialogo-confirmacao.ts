import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Dialogo } from '../dialogo/dialogo';

export interface PedidoConfirmacao {
  readonly titulo: string;
  readonly mensagem: string;
  readonly detalhe?: string;
  readonly rotuloConfirmar: string;
  readonly perigo?: boolean;
}

@Component({
  selector: 'app-dialogo-confirmacao',
  imports: [Dialogo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialogo
      [aberto]="pedido() !== null"
      [titulo]="pedido()?.titulo ?? ''"
      larguraMaxima="26rem"
      (fechar)="cancelar.emit()"
    >
      @if (pedido(); as atual) {
        <p class="text-[13px] leading-relaxed text-petrol-800">{{ atual.mensagem }}</p>

        @if (atual.detalhe; as detalhe) {
          <p class="mt-2 text-[12.5px] leading-relaxed text-petrol-700/80">{{ detalhe }}</p>
        }
      }

      <!-- Bloco só do rodapé: com mais de um nó na raiz do @if, o conteúdo não chega
           ao slot e os botões caem no corpo do diálogo. -->
      @if (pedido(); as atual) {
        <div rodape class="flex justify-end gap-2">
          <button type="button" class="btn btn-contorno" (click)="cancelar.emit()">Cancelar</button>

          <button
            type="button"
            class="btn"
            [class]="atual.perigo ? 'btn-perigo-solido' : 'btn-primario'"
            (click)="confirmar.emit()"
          >
            {{ atual.rotuloConfirmar }}
          </button>
        </div>
      }
    </app-dialogo>
  `,
})
export class DialogoConfirmacao {
  /** `null` mantém o diálogo fechado. */
  readonly pedido = input.required<PedidoConfirmacao | null>();

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();
}
