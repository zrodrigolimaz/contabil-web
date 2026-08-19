import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { OPCOES_PA } from '../../../../core/mocks/opcoes.mock';
import { EventoCsc } from '../../../../core/models/evento';
import { SituacaoDocumentoCsc } from '../../../../core/models/lancamento';
import { CampoForm } from '../../../../shared/ui/campo-form/campo-form';
import { PesquisaEvento } from './pesquisa-evento/pesquisa-evento';

export type GrupoDocumentoCsc = FormGroup<{
  pa: FormControl<string>;
  idEvento: FormControl<string>;
  complementoHistorico: FormControl<string>;
}>;

@Component({
  selector: 'app-secao-documento-csc',
  imports: [ReactiveFormsModule, CampoForm, PesquisaEvento],
  templateUrl: './secao-documento-csc.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecaoDocumentoCsc {
  readonly grupo = input.required<GrupoDocumentoCsc>();
  readonly descricaoEvento = input<string | null>(null);
  readonly situacao = input<SituacaoDocumentoCsc>('Aguardando Processamento CCO');
  readonly idDocumentoCsc = input<string | null>(null);
  readonly desabilitado = input(false);

  protected readonly opcoesPa = OPCOES_PA;
  protected readonly pesquisaAberta = signal(false);

  protected escolherEvento(evento: EventoCsc): void {
    const idEvento = this.grupo().controls.idEvento;

    idEvento.setValue(evento.idEvento);
    idEvento.markAsTouched();
    this.pesquisaAberta.set(false);
  }
}
