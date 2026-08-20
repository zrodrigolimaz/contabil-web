import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import { Lancamento, NovoLancamento } from '../../../core/models/lancamento';
import { Lote } from '../../../core/models/lote';
import { LancamentoService } from '../../../core/services/lancamento.service';
import { LoteService } from '../../../core/services/lote.service';
import { Dialogo } from '../../../shared/ui/dialogo/dialogo';
import {
  DadosFormularioLancamento,
  FormularioLancamento,
  ID_FORM_LANCAMENTO,
} from './formulario-lancamento/formulario-lancamento';
import { GradeLancamentos } from './grade-lancamentos/grade-lancamentos';

export type ModoLancamentos = 'novo' | 'edicao' | 'leitura';

export interface ResultadoLancamentos {
  readonly houveMutacao: boolean;
}

@Component({
  selector: 'app-lancamentos-lote',
  imports: [Dialogo, FormularioLancamento, GradeLancamentos],
  templateUrl: './lancamentos-lote.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LancamentosLote {
  private readonly lancamentoService = inject(LancamentoService);
  private readonly loteService = inject(LoteService);
  private readonly destroyRef = inject(DestroyRef);

  readonly modo = input.required<ModoLancamentos | null>();
  readonly lote = input<Lote | null>(null);

  readonly fechar = output<ResultadoLancamentos>();

  protected readonly lancamentos = signal<readonly Lancamento[]>([]);
  protected readonly selecionado = signal<number | null>(null);
  protected readonly emEdicao = signal<Lancamento | null>(null);
  protected readonly executando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly manterDados = signal(false);

  protected readonly idForm = ID_FORM_LANCAMENTO;

  private readonly formulario = viewChild(FormularioLancamento);

  private readonly loteDestino = signal<Lote | null>(null);
  private houveMutacao = false;

  protected readonly aberto = computed(() => this.modo() !== null);
  protected readonly somenteLeitura = computed(() => this.modo() === 'leitura');

  protected readonly titulo = computed(() => {
    const lote = this.loteDestino();
    if (!lote) {
      return 'Lançamentos de um lote novo';
    }

    return this.somenteLeitura()
      ? `Lançamentos do lote ${lote.id} (leitura)`
      : `Lançamentos do lote ${lote.id}`;
  });

  protected readonly marcado = computed(() => {
    const id = this.selecionado();
    return this.lancamentos().find((lancamento) => lancamento.id === id) ?? null;
  });

  protected readonly dica = computed(() => {
    if (this.somenteLeitura()) {
      return 'Lote aberto apenas para leitura.';
    }
    if (this.lancamentos().length === 0) {
      return 'Inclua o primeiro lançamento pelo formulário acima.';
    }

    return this.marcado() ? null : 'Marque um lançamento para alterar, excluir ou duplicar.';
  });

  constructor() {
    effect(() => {
      const modo = this.modo();
      const lote = this.lote();

      this.selecionado.set(null);
      this.emEdicao.set(null);
      this.erro.set(null);

      this.formulario()?.limpar();

      if (modo === null) {
        this.lancamentos.set([]);
        this.loteDestino.set(null);
        this.houveMutacao = false;
        return;
      }

      this.loteDestino.set(lote);
      if (lote) {
        this.carregar(lote.id);
      } else {
        this.lancamentos.set([]);
      }
    });
  }

  protected aoSalvar(dados: DadosFormularioLancamento): void {
    const emEdicao = this.emEdicao();
    if (emEdicao) {
      this.alterar(emEdicao, dados);
      return;
    }

    const lote = this.loteDestino();
    if (lote) {
      this.incluir(lote.id, dados);
      return;
    }

    this.executar(this.loteService.criar(), (criado) => {
      this.loteDestino.set(criado);
      this.incluir(criado.id, dados);
    });
  }

  protected editarMarcado(): void {
    this.emEdicao.set(this.marcado());
    this.formulario()?.destacar();
  }

  protected cancelarEdicao(): void {
    this.emEdicao.set(null);
  }

  protected limparFormulario(): void {
    this.formulario()?.limpar();
  }

  protected excluirMarcado(): void {
    const marcado = this.marcado();
    if (!marcado) {
      return;
    }

    this.executar(this.lancamentoService.excluir(marcado.id), () => {
      this.selecionado.set(null);
      this.emEdicao.set(null);
      this.recarregar();
    });
  }

  protected duplicarMarcado(): void {
    const marcado = this.marcado();
    if (!marcado) {
      return;
    }

    this.executar(this.lancamentoService.duplicar(marcado.id), (copia) => {
      this.selecionado.set(copia.id);
      this.recarregar();
    });
  }

  protected aoFechar(): void {
    this.fechar.emit({ houveMutacao: this.houveMutacao });
  }

  private incluir(idLote: number, dados: DadosFormularioLancamento): void {
    this.executar(this.lancamentoService.incluir(this.montar(idLote, dados)), (incluido) => {
      this.selecionado.set(incluido.id);
      this.recarregar();
    });
  }

  private alterar(atual: Lancamento, dados: DadosFormularioLancamento): void {
    this.executar(
      this.lancamentoService.alterar(atual.id, this.montar(atual.idLote, dados)),
      () => {
        this.emEdicao.set(null);
        this.recarregar();
      },
    );
  }

  private montar(idLote: number, dados: DadosFormularioLancamento): NovoLancamento {
    return { idLote, ...dados };
  }

  private carregar(idLote: number): void {
    this.lancamentoService
      .listarPorLote(idLote)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lancamentos) => this.lancamentos.set(lancamentos),
        error: (falha: Error) => this.erro.set(falha.message),
      });
  }

  private recarregar(): void {
    const lote = this.loteDestino();
    if (!lote) {
      return;
    }

    this.houveMutacao = true;
    this.lancamentoService
      .listarPorLote(lote.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lancamentos) => {
          this.lancamentos.set(lancamentos);
          this.atualizarTotais(lote.id, lancamentos);
        },
        error: (falha: Error) => this.erro.set(falha.message),
      });
  }

  private atualizarTotais(idLote: number, lancamentos: readonly Lancamento[]): void {
    const valor = lancamentos.reduce((total, lancamento) => total + lancamento.valor, 0);

    this.loteService
      .atualizarTotais(idLote, valor, lancamentos.length)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (atualizado) => this.loteDestino.set(atualizado),
        error: (falha: Error) => this.erro.set(falha.message),
      });
  }

  private executar<T>(chamada: Observable<T>, aoConcluir: (valor: T) => void): void {
    this.executando.set(true);
    this.erro.set(null);

    chamada.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (valor) => {
        this.executando.set(false);
        aoConcluir(valor);
      },
      error: (falha: Error) => {
        this.erro.set(falha.message);
        this.executando.set(false);
      },
    });
  }
}
