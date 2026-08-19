import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { estadoDoControle } from '../estado-controle';

let sequencia = 0;

/**
 * Par "De/Até" de uma faixa de pesquisa: rótulo do grupo acima, os dois campos lado a
 * lado e uma única mensagem de erro para o par, que é onde o `faixaValidator` age.
 *
 * O rótulo fica acima, e não ao lado como no sistema legado, para que faixas e campos
 * simples formem uma grade só, com todos os rótulos na mesma altura.
 *
 * O grupo é um `FormGroup` com os controles `de` e `ate`.
 */
@Component({
  selector: 'app-campo-faixa',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campo-faixa.html',
})
export class CampoFaixa {
  readonly rotulo = input.required<string>();
  readonly grupo = input.required<FormGroup>();
  readonly tipo = input.required<'inteiro' | 'decimal' | 'data'>();
  /** Símbolo fixo dentro do campo, como `R$` em uma faixa de valor. */
  readonly prefixo = input<string>();
  /** Exemplo exibido como placeholder; fornecido por quem usa o componente. */
  readonly exemploDe = input<string>();
  readonly exemploAte = input<string>();

  protected readonly idRotulo = `rotulo-faixa-${sequencia}`;
  protected readonly idDe = `faixa-de-${sequencia}`;
  protected readonly idAte = `faixa-ate-${sequencia}`;
  protected readonly idErro = `erro-faixa-${sequencia++}`;

  protected readonly estado = estadoDoControle(this.grupo);

  /** Centavos na faixa de valor; ID de lote é inteiro. */
  protected readonly passo = computed(() => (this.tipo() === 'decimal' ? '0.01' : '1'));
}
