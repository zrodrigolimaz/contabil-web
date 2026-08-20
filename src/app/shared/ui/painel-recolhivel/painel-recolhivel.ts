import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

let sequencia = 0;

/**
 * Cartão com cabeçalho e conteúdo que expande/recolhe.
 *
 * O conteúdo continua no DOM quando recolhido — assim um formulário dentro dele não
 * é remontado nem perde o que foi digitado — e recebe `inert` para sair da ordem de
 * tabulação. A animação usa `grid-template-rows`, que transiciona da altura zero até
 * a altura real sem precisar de valor fixo.
 */
@Component({
  selector: 'app-painel-recolhivel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './painel-recolhivel.html',
})
export class PainelRecolhivel {
  readonly titulo = input.required<string>();
  /** Linha de apoio sob o título, no padrão de cabeçalho de cartão. */
  readonly subtitulo = input<string>();
  readonly aberto = model(true);

  protected readonly idConteudo = `painel-conteudo-${sequencia++}`;
}
