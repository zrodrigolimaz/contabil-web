import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { HISTORICOS } from '../../../../core/mocks/opcoes.mock';
import { ContaCorrente } from '../../../../core/models/conta-corrente';
import { SituacaoLancamento } from '../../../../core/models/lancamento';
import { CampoForm } from '../../../../shared/ui/campo-form/campo-form';
import { PesquisaConta } from './pesquisa-conta/pesquisa-conta';

export type GrupoContaCorrente = FormGroup<{
  conta: FormControl<string>;
  valor: FormControl<number | null>;
  historico: FormControl<string>;
  estorno: FormControl<boolean>;
  documento: FormControl<string>;
  descricao: FormControl<string>;
}>;

@Component({
  selector: 'app-secao-conta-corrente',
  imports: [ReactiveFormsModule, CampoForm, PesquisaConta],
  templateUrl: './secao-conta-corrente.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecaoContaCorrente {
  readonly grupo = input.required<GrupoContaCorrente>();
  readonly titular = input<string | null>(null);
  readonly situacao = input<SituacaoLancamento>('Pendente');
  readonly desabilitado = input(false);

  protected readonly historicos = HISTORICOS;
  protected readonly pesquisaAberta = signal(false);

  protected escolherConta(conta: ContaCorrente): void {
    const controle = this.grupo().controls.conta;

    controle.setValue(conta.numero);
    controle.markAsTouched();
    this.pesquisaAberta.set(false);
  }
}
