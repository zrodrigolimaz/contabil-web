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
  template: `
    <div
      role="group"
      [attr.aria-labelledby]="idRotulo"
      [formGroup]="grupo()"
      class="flex flex-col gap-1.5"
    >
      <span [id]="idRotulo" class="text-[13px] font-medium text-petrol-800">{{ rotulo() }}</span>

      <div class="grid grid-cols-2 gap-2.5">
        <div class="flex flex-col gap-1">
          <label [for]="idDe" class="text-[11px] text-petrol-700/60">De</label>
          <div class="relative">
            @if (prefixo(); as simbolo) {
              <span
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-petrol-700/55"
                aria-hidden="true"
              >
                {{ simbolo }}
              </span>
            }
            <!--
              O tipo do input é fixo em cada ramo de propósito: o Angular escolhe o
              NumberValueAccessor pelo seletor input[type=number], e com o tipo vindo
              de um binding o controle receberia texto em vez de número.
            -->
            @if (tipo() === 'data') {
              <input
                [id]="idDe"
                type="date"
                formControlName="de"
                class="campo"
                [attr.aria-invalid]="estado.comErro() || null"
                [attr.aria-describedby]="estado.mensagem() ? idErro : null"
              />
            } @else {
              <input
                [id]="idDe"
                type="number"
                [attr.step]="passo()"
                [placeholder]="exemploDe() ?? ''"
                formControlName="de"
                class="campo"
                [class.pl-9]="prefixo()"
                [attr.aria-invalid]="estado.comErro() || null"
                [attr.aria-describedby]="estado.mensagem() ? idErro : null"
              />
            }
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label [for]="idAte" class="text-[11px] text-petrol-700/60">Até</label>
          <div class="relative">
            @if (prefixo(); as simbolo) {
              <span
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-petrol-700/55"
                aria-hidden="true"
              >
                {{ simbolo }}
              </span>
            }
            @if (tipo() === 'data') {
              <input
                [id]="idAte"
                type="date"
                formControlName="ate"
                class="campo"
                [attr.aria-invalid]="estado.comErro() || null"
                [attr.aria-describedby]="estado.mensagem() ? idErro : null"
              />
            } @else {
              <input
                [id]="idAte"
                type="number"
                [attr.step]="passo()"
                [placeholder]="exemploAte() ?? ''"
                formControlName="ate"
                class="campo"
                [class.pl-9]="prefixo()"
                [attr.aria-invalid]="estado.comErro() || null"
                [attr.aria-describedby]="estado.mensagem() ? idErro : null"
              />
            }
          </div>
        </div>
      </div>

      @if (estado.mensagem(); as texto) {
        <p [id]="idErro" role="alert" class="text-[12px] font-medium text-danger">{{ texto }}</p>
      }
    </div>
  `,
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
