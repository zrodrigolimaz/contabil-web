import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { estadoDoControle } from '../estado-controle';
import { MASCARAS } from '../mascaras';

let sequencia = 0;

@Component({
  selector: 'app-campo-faixa',
  imports: [ReactiveFormsModule, MASCARAS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campo-faixa.html',
})
export class CampoFaixa {
  readonly rotulo = input.required<string>();
  readonly grupo = input.required<FormGroup>();
  readonly tipo = input.required<'inteiro' | 'decimal' | 'data'>();
  readonly prefixo = input<string>();
  readonly exemploDe = input<string>();
  readonly exemploAte = input<string>();

  protected readonly idRotulo = `rotulo-faixa-${sequencia}`;
  protected readonly idDe = `faixa-de-${sequencia}`;
  protected readonly idAte = `faixa-ate-${sequencia}`;
  protected readonly idErro = `erro-faixa-${sequencia++}`;

  protected readonly estado = estadoDoControle(this.grupo);
}
