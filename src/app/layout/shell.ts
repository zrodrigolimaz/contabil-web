import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Abaixo disto a lateral aberta comeria quase metade da tela. */
const TELA_ESTREITA = '(max-width: 767px)';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly consulta = window.matchMedia(TELA_ESTREITA);

  protected readonly telaEstreita = signal(this.consulta.matches);
  private readonly recolhidoPeloUsuario = signal(false);

  protected readonly menuRecolhido = computed(
    () => this.telaEstreita() || this.recolhidoPeloUsuario(),
  );

  protected readonly grupoContabilAberto = signal(true);

  constructor() {
    const aoMudar = (evento: MediaQueryListEvent) => this.telaEstreita.set(evento.matches);

    this.consulta.addEventListener('change', aoMudar);
    inject(DestroyRef).onDestroy(() => this.consulta.removeEventListener('change', aoMudar));
  }

  protected alternarMenu(): void {
    this.recolhidoPeloUsuario.update((recolhido) => !recolhido);
  }
}
