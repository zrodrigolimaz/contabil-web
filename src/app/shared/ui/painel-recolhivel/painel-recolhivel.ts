import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

let sequencia = 0;

@Component({
  selector: 'app-painel-recolhivel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './painel-recolhivel.html',
})
export class PainelRecolhivel {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
  readonly aberto = model(true);

  protected readonly idConteudo = `painel-conteudo-${sequencia++}`;
}
