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
  templateUrl: './dialogo.html',
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
