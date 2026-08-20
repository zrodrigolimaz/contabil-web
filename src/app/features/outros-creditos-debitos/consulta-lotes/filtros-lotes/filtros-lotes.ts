import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { INSTITUICOES, INSTITUICOES_RESPONSAVEIS } from '../../../../core/mocks/opcoes.mock';
import {
  FiltroSituacaoLote,
  FiltrosPesquisaLote,
  SITUACAO_TODAS,
} from '../../../../core/models/filtros';
import { dataDeIso } from '../../../../core/utils/data';
import { CampoFaixa } from '../../../../shared/ui/campo-faixa/campo-faixa';
import { CAMPO_FORM } from '../../../../shared/ui/campo-form/campo-form';
import { PainelRecolhivel } from '../../../../shared/ui/painel-recolhivel/painel-recolhivel';
import { faixaValidator } from '../../../../shared/validators/faixa.validator';

interface ChipFiltro {
  readonly chave: string;
  readonly texto: string;
}

@Component({
  selector: 'app-filtros-lotes',
  imports: [ReactiveFormsModule, PainelRecolhivel, CAMPO_FORM, CampoFaixa],
  templateUrl: './filtros-lotes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltrosLotes {
  private readonly fb = inject(FormBuilder);

  readonly carregando = input(false);

  readonly pesquisar = output<FiltrosPesquisaLote>();

  protected readonly instituicoesResponsaveis = INSTITUICOES_RESPONSAVEIS;
  protected readonly instituicoes = INSTITUICOES;
  protected readonly situacoes: readonly FiltroSituacaoLote[] = [
    SITUACAO_TODAS,
    'Aberto',
    'Enviado',
    'Confirmado',
  ];

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

  private readonly aplicados = signal<FiltrosPesquisaLote | null>(null);

  protected readonly chips = computed<readonly ChipFiltro[]>(() => {
    const filtros = this.aplicados();
    if (!filtros) {
      return [];
    }

    const itens = [
      chip('instituicaoResponsavel', filtros.instituicaoResponsavel, 'Inst. Resp.'),
      chip('instituicao', filtros.instituicao, 'Instituição'),
      filtros.situacao === SITUACAO_TODAS ? null : chip('situacao', filtros.situacao, 'Situação'),
      chipDeFaixa('idLote', 'ID Lote', filtros.idLote.de, filtros.idLote.ate, String),
      chipDeFaixa('valor', 'Valor', filtros.valor.de, filtros.valor.ate, comoMoeda),
      chipDeFaixa(
        'dataEntrada',
        'Data Entrada',
        filtros.dataEntrada.de,
        filtros.dataEntrada.ate,
        comoData,
      ),
    ].filter((item): item is ChipFiltro => item !== null);

    return itens.length > 0 ? itens : [{ chave: 'todos', texto: 'Todos os lotes' }];
  });

  protected aoEnviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.emitir();
  }

  protected limpar(): void {
    this.form.reset();
    this.emitir();
  }

  private emitir(): void {
    const filtros = this.montarFiltros();
    this.aplicados.set(filtros);
    this.pesquisar.emit(filtros);
  }

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

function chip(chave: string, valor: string | null, rotulo: string): ChipFiltro | null {
  return valor ? { chave, texto: `${rotulo}: ${valor}` } : null;
}

function chipDeFaixa<T extends number | string>(
  chave: string,
  rotulo: string,
  de: T | null,
  ate: T | null,
  formatar: (valor: T) => string,
): ChipFiltro | null {
  if (de !== null && ate !== null) {
    return { chave, texto: `${rotulo}: ${formatar(de)} a ${formatar(ate)}` };
  }
  if (de !== null) {
    return { chave, texto: `${rotulo}: a partir de ${formatar(de)}` };
  }
  if (ate !== null) {
    return { chave, texto: `${rotulo}: até ${formatar(ate)}` };
  }

  return null;
}

function comoMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function comoData(iso: string): string {
  return dataDeIso(iso)?.toLocaleDateString('pt-BR') ?? iso;
}
