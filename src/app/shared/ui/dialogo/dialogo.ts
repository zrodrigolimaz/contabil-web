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

@Component({
  selector: 'app-dialogo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialogo.html',
})
export class Dialogo {
  readonly aberto = input.required<boolean>();
  readonly titulo = input.required<string>();
  readonly larguraMaxima = input('32rem');

  readonly fechar = output<void>();

  protected readonly idTitulo = `dialogo-titulo-${sequencia++}`;

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

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
