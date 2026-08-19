import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Lote } from '../../../../core/models/lote';
import { Dialogo } from '../../../../shared/ui/dialogo/dialogo';

@Component({
  selector: 'app-dialogo-justificativa',
  imports: [Dialogo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialogo
      [aberto]="lote() !== null"
      [titulo]="'Justificativa do lote ' + (lote()?.id ?? '')"
      larguraMaxima="28rem"
      (fechar)="fechar.emit()"
    >
      <p class="text-[13px] leading-relaxed text-petrol-700">{{ lote()?.justificativa }}</p>

      <div rodape class="flex justify-end">
        <button type="button" class="btn btn-contorno" (click)="fechar.emit()">Fechar</button>
      </div>
    </app-dialogo>
  `,
})
export class DialogoJustificativa {
  /** `null` mantém o diálogo fechado. */
  readonly lote = input.required<Lote | null>();

  readonly fechar = output<void>();
}
