import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { INSTITUICOES, INSTITUICOES_RESPONSAVEIS } from '../../../../core/mocks/opcoes.mock';
import {
  FiltroSituacaoLote,
  FiltrosPesquisaLote,
  SITUACAO_TODAS,
} from '../../../../core/models/filtros';
import { CampoFaixa } from '../../../../shared/ui/campo-faixa/campo-faixa';
import { CampoForm } from '../../../../shared/ui/campo-form/campo-form';
import { PainelRecolhivel } from '../../../../shared/ui/painel-recolhivel/painel-recolhivel';
import { faixaValidator } from '../../../../shared/validators/faixa.validator';

/**
 * Painel de filtros da consulta de lotes.
 *
 * Componente de apresentação: não conhece o serviço nem o resultado — apenas emite
 * os critérios para o container pesquisar.
 */
@Component({
  selector: 'app-filtros-lotes',
  imports: [ReactiveFormsModule, PainelRecolhivel, CampoForm, CampoFaixa],
  templateUrl: './filtros-lotes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltrosLotes {
  private readonly fb = inject(FormBuilder);

  readonly pesquisar = output<FiltrosPesquisaLote>();

  protected readonly instituicoesResponsaveis = INSTITUICOES_RESPONSAVEIS;
  protected readonly instituicoes = INSTITUICOES;
  protected readonly situacoes: readonly FiltroSituacaoLote[] = [
    SITUACAO_TODAS,
    'Aberto',
    'Enviado',
    'Confirmado',
  ];

  /**
   * Faixas ficam em grupos aninhados porque o `faixaValidator` é cross-field: o erro
   * pertence ao par De/Até, não a um dos lados.
   */
  protected readonly form = this.fb.group({
    instituicaoResponsavel: this.fb.control<string | null>(null),
    instituicao: this.fb.control<string | null>(null),
    situacao: this.fb.nonNullable.control<FiltroSituacaoLote>(SITUACAO_TODAS),
    idLote: this.fb.group(
      {
        de: this.fb.control<number | null>(null),
        ate: this.fb.control<number | null>(null),
      },
      { validators: faixaValidator },
    ),
    valor: this.fb.group(
      {
        de: this.fb.control<number | null>(null),
        ate: this.fb.control<number | null>(null),
      },
      { validators: faixaValidator },
    ),
    dataEntrada: this.fb.group(
      {
        de: this.fb.nonNullable.control(''),
        ate: this.fb.nonNullable.control(''),
      },
      { validators: faixaValidator },
    ),
  });

  /** Submit do form — também disparado pelo Enter em qualquer campo. */
  protected aoEnviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.pesquisar.emit(this.montarFiltros());
  }

  /** Volta aos valores iniciais e refaz a pesquisa sem critérios. */
  protected limpar(): void {
    this.form.reset();
    this.pesquisar.emit(this.montarFiltros());
  }

  /** Traduz o formulário para o contrato do serviço: campo em branco vira `null`. */
  private montarFiltros(): FiltrosPesquisaLote {
    const { instituicaoResponsavel, instituicao, situacao, idLote, valor, dataEntrada } =
      this.form.getRawValue();

    return {
      instituicaoResponsavel: instituicaoResponsavel || null,
      instituicao: instituicao || null,
      situacao,
      idLote: { de: idLote.de ?? null, ate: idLote.ate ?? null },
      valor: { de: valor.de ?? null, ate: valor.ate ?? null },
      dataEntrada: { de: dataEntrada.de || null, ate: dataEntrada.ate || null },
    };
  }
}
