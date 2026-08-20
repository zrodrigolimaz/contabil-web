import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Lancamento } from '../../../../core/models/lancamento';

@Component({
  selector: 'app-grade-lancamentos',
  imports: [CurrencyPipe],
  templateUrl: './grade-lancamentos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeLancamentos {
  readonly lancamentos = input.required<readonly Lancamento[]>();
  readonly selecionado = input.required<number | null>();

  readonly selecionar = output<number>();

  protected marcar(id: number): void {
    this.selecionar.emit(id);
  }
}
