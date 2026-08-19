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

/** A chave é o critério, não o texto: trocar o valor do filtro não recria a pastilha. */
interface ChipFiltro {
  readonly chave: string;
  readonly texto: string;
}

/**
 * Painel de filtros da consulta de lotes.
 *
 * Componente de apresentação: não conhece o serviço nem o resultado — apenas emite
 * os critérios para o container pesquisar.
 */
@Component({
  selector: 'app-filtros-lotes',
  imports: [ReactiveFormsModule, PainelRecolhivel, CAMPO_FORM, CampoFaixa],
  templateUrl: './filtros-lotes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltrosLotes {
  private readonly fb = inject(FormBuilder);

  /** Enquanto a consulta corre, o botão vira "Buscando…" e não aceita novo envio. */
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

  /**
   * Critérios da última pesquisa, resumidos em pastilhas no cabeçalho do painel:
   * com o painel recolhido, é o que responde "o que está filtrando esta grade?".
   */
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

  /** Submit do form — também disparado pelo Enter em qualquer campo. */
  protected aoEnviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.emitir();
  }

  /** Volta aos valores iniciais e refaz a pesquisa sem critérios. */
  protected limpar(): void {
    this.form.reset();
    this.emitir();
  }

  private emitir(): void {
    const filtros = this.montarFiltros();
    this.aplicados.set(filtros);
    this.pesquisar.emit(filtros);
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

function chip(chave: string, valor: string | null, rotulo: string): ChipFiltro | null {
  return valor ? { chave, texto: `${rotulo}: ${valor}` } : null;
}

/** Descreve a faixa do jeito que ela foi preenchida — inteira ou aberta de um lado. */
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
