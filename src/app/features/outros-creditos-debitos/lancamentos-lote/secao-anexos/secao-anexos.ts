import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { Anexo, NovoAnexo } from '../../../../core/models/anexo';
import { Dialogo } from '../../../../shared/ui/dialogo/dialogo';
import { InclusaoAnexo } from './inclusao-anexo/inclusao-anexo';

@Component({
  selector: 'app-secao-anexos',
  imports: [DatePipe, Dialogo, InclusaoAnexo],
  templateUrl: './secao-anexos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecaoAnexos {
  readonly anexos = input.required<readonly Anexo[]>();
  readonly desabilitado = input(false);

  readonly incluir = output<NovoAnexo>();
  readonly excluir = output<number>();

  protected readonly idMarcado = signal<number | null>(null);
  protected readonly inclusaoAberta = signal(false);
  protected readonly visualizado = signal<Anexo | null>(null);

  protected readonly marcado = computed(
    () => this.anexos().find((anexo) => anexo.id === this.idMarcado()) ?? null,
  );

  protected alternar(id: number): void {
    this.idMarcado.set(this.idMarcado() === id ? null : id);
  }

  protected aoIncluir(dados: NovoAnexo): void {
    this.inclusaoAberta.set(false);
    this.incluir.emit(dados);
  }

  protected excluirMarcado(): void {
    const marcado = this.marcado();
    if (!marcado) {
      return;
    }

    this.idMarcado.set(null);
    this.excluir.emit(marcado.id);
  }
}
