import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Lote, SituacaoLote } from '../../../../core/models/lote';
import { CampoOrdenacao, Ordenacao } from '../../../../core/models/ordenacao';

export const SEM_VALOR = '—';

interface Coluna {
  readonly campo: CampoOrdenacao;
  readonly rotulo: string;
  readonly numerica?: boolean;
}

const COLUNAS: readonly Coluna[] = [
  { campo: 'id', rotulo: 'ID Lote' },
  { campo: 'dataEntrada', rotulo: 'Data Entrada' },
  { campo: 'valor', rotulo: 'Valor', numerica: true },
  { campo: 'quantidadeLancamentos', rotulo: 'Quant. Lançamentos', numerica: true },
  { campo: 'usuarioRegistro', rotulo: 'Usuário Registro' },
  { campo: 'usuarioAprovacao', rotulo: 'Usuário Aprovação' },
  { campo: 'situacao', rotulo: 'Situação Lote' },
  { campo: 'dataHoraSituacao', rotulo: 'Data/Hora Situação Lote' },
];

const CLASSE_DA_SITUACAO: Record<SituacaoLote, string> = {
  Aberto: 'chip chip-neutro',
  Enviado: 'chip',
  Confirmado: 'chip chip-solido',
};

const LARGURAS_ESQUELETO = ['100%', '45%', '70%', '55%', '35%', '65%', '60%', '50%', '80%'];

@Component({
  selector: 'app-tabela-lotes',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './tabela-lotes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabelaLotes {
  readonly lotes = input.required<readonly Lote[]>();
  readonly carregando = input(false);
  readonly selecionados = input.required<ReadonlySet<number>>();
  readonly ordenacao = input.required<Ordenacao>();

  readonly alternarSelecao = output<number>();
  readonly alternarTodos = output<boolean>();
  readonly ordenar = output<Ordenacao>();

  protected readonly semValor = SEM_VALOR;
  protected readonly classeDaSituacao = CLASSE_DA_SITUACAO;
  protected readonly colunas = COLUNAS;

  protected readonly colunaAtiva = 'bg-white/[0.07] text-white';

  protected readonly setaAcesa = 'fill-primary-300';
  protected readonly setaApagada =
    'fill-white/35 transition-[fill] group-hover:fill-white/70 motion-reduce:transition-none';

  protected readonly linhasEsqueleto = Array.from({ length: 5 });
  protected readonly largurasEsqueleto = LARGURAS_ESQUELETO;

  private readonly marcadosNaPagina = computed(
    () => this.lotes().filter((lote) => this.selecionados().has(lote.id)).length,
  );

  protected readonly todosMarcados = computed(
    () => this.lotes().length > 0 && this.marcadosNaPagina() === this.lotes().length,
  );

  protected readonly parteMarcada = computed(
    () => this.marcadosNaPagina() > 0 && !this.todosMarcados(),
  );

  protected aoAlternarTodos(evento: Event): void {
    this.alternarTodos.emit((evento.target as HTMLInputElement).checked);
  }

  protected aoOrdenar(campo: CampoOrdenacao): void {
    const atual = this.ordenacao();
    const direcao = atual.campo === campo && atual.direcao === 'asc' ? 'desc' : 'asc';

    this.ordenar.emit({ campo, direcao });
  }

  protected sentidoDe(campo: CampoOrdenacao): 'ascending' | 'descending' | 'none' {
    const atual = this.ordenacao();
    if (atual.campo !== campo) {
      return 'none';
    }

    return atual.direcao === 'asc' ? 'ascending' : 'descending';
  }
}
