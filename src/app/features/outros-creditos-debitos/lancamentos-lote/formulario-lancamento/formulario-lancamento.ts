import { CurrencyPipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, first, map, of, switchMap } from 'rxjs';

import { Anexo, NovoAnexo } from '../../../../core/models/anexo';
import { Lancamento } from '../../../../core/models/lancamento';
import { AnexoService } from '../../../../core/services/anexo.service';
import { ContaCorrenteService } from '../../../../core/services/conta-corrente.service';
import { EventoService } from '../../../../core/services/evento.service';
import { contaExistenteValidator } from '../../../../shared/validators/conta-existente.validator';
import { eventoExistenteValidator } from '../../../../shared/validators/evento-existente.validator';
import { maiorQueZero } from '../../../../shared/validators/maior-que-zero.validator';
import { SecaoAnexos } from '../secao-anexos/secao-anexos';
import { SecaoContaCorrente } from '../secao-conta-corrente/secao-conta-corrente';
import { SecaoDocumentoCsc } from '../secao-documento-csc/secao-documento-csc';

export interface DadosFormularioLancamento {
  readonly conta: string;
  readonly titular: string;
  readonly valor: number;
  readonly historico: string;
  readonly estorno: boolean;
  readonly documento: string;
  readonly descricao: string;
  readonly pa: string;
  readonly idEvento: string | null;
  readonly descricaoEvento: string | null;
  readonly complementoHistorico: string;
  readonly anexos: readonly Anexo[];
}

export const ID_FORM_LANCAMENTO = 'form-lancamento';

@Component({
  selector: 'app-formulario-lancamento',
  imports: [CurrencyPipe, ReactiveFormsModule, SecaoAnexos, SecaoContaCorrente, SecaoDocumentoCsc],
  templateUrl: './formulario-lancamento.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioLancamento {
  private readonly fb = inject(FormBuilder);
  private readonly contas = inject(ContaCorrenteService);
  private readonly eventos = inject(EventoService);
  private readonly anexoService = inject(AnexoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly lancamento = input<Lancamento | null>(null);
  readonly desabilitado = input(false);
  readonly emEdicao = input(false);
  readonly leitura = input(false);
  readonly manterDados = input(false);

  readonly salvar = output<DadosFormularioLancamento>();

  protected readonly idForm = ID_FORM_LANCAMENTO;
  protected readonly anexos = signal<readonly Anexo[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    contaCorrente: this.fb.nonNullable.group({
      conta: [
        '',
        { validators: Validators.required, asyncValidators: this.validarConta(), updateOn: 'blur' },
      ],
      valor: this.fb.control<number | null>(null, [Validators.required, maiorQueZero]),
      historico: ['', Validators.required],
      estorno: [false],
      documento: ['', Validators.required],
      descricao: [''],
    }),
    csc: this.fb.nonNullable.group({
      pa: ['', Validators.required],
      idEvento: ['', { asyncValidators: this.validarEvento(), updateOn: 'blur' }],
      complementoHistorico: ['', Validators.required],
    }),
  });

  protected readonly titular = toSignal(
    this.form.controls.contaCorrente.controls.conta.valueChanges.pipe(
      switchMap((numero) => (numero ? this.contas.buscarPorNumero(numero) : of(null))),
      map((conta) => conta?.titular ?? null),
    ),
    { initialValue: null },
  );

  protected readonly descricaoEvento = toSignal(
    this.form.controls.csc.controls.idEvento.valueChanges.pipe(
      switchMap((idEvento) => (idEvento ? this.eventos.buscarPorId(idEvento) : of(null))),
      map((evento) => evento?.descricao ?? null),
    ),
    { initialValue: null },
  );

  protected readonly lancamentoEmDestaque = computed(() =>
    this.emEdicao() || this.leitura() ? this.lancamento() : null,
  );

  protected readonly situacao = computed(() => this.lancamento()?.situacao ?? 'Pendente');

  protected readonly situacaoCsc = computed(
    () => this.lancamento()?.situacaoDocumentoCsc ?? 'Aguardando Processamento CCO',
  );

  protected readonly idDocumentoCsc = computed(() => this.lancamento()?.idDocumentoCsc ?? null);

  constructor() {
    effect(() => {
      const lancamento = this.lancamento();

      this.anexos.set(lancamento?.anexos ?? []);

      if (lancamento) {
        this.form.setValue({
          contaCorrente: {
            conta: lancamento.conta,
            valor: lancamento.valor,
            historico: lancamento.historico,
            estorno: lancamento.estorno,
            documento: lancamento.documento,
            descricao: lancamento.descricao,
          },
          csc: {
            pa: lancamento.pa,
            idEvento: lancamento.idEvento ?? '',
            complementoHistorico: lancamento.complementoHistorico,
          },
        });
      } else {
        this.form.reset();
      }
    });

    effect(() => {
      if (this.desabilitado()) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    });
  }

  protected aoEnviar(): void {
    if (this.form.pending) {
      this.form.statusChanges
        .pipe(
          filter((status) => status !== 'PENDING'),
          first(),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => this.aoEnviar());
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { contaCorrente, csc } = this.form.getRawValue();

    this.salvar.emit({
      ...contaCorrente,
      titular: this.titular() ?? '',
      valor: contaCorrente.valor ?? 0,
      pa: csc.pa,
      idEvento: csc.idEvento || null,
      descricaoEvento: this.descricaoEvento(),
      complementoHistorico: csc.complementoHistorico,
      anexos: this.anexos(),
    });

    if (!this.emEdicao() && !this.manterDados()) {
      this.limpar();
    }
  }

  limpar(): void {
    this.form.reset();
    this.anexos.set([]);
  }

  destacar(): void {
    afterNextRender(
      () => {
        const suave = !matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        this.elemento.nativeElement.scrollIntoView?.({
          behavior: suave ? 'smooth' : 'auto',
          block: 'start',
        });
      },
      { injector: this.injector },
    );
  }

  protected incluirAnexo(dados: NovoAnexo): void {
    this.anexoService
      .enviar(dados)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((anexo) => this.anexos.update((atuais) => [...atuais, anexo]));
  }

  protected excluirAnexo(id: number): void {
    this.anexos.update((atuais) => atuais.filter((anexo) => anexo.id !== id));
  }

  private validarConta() {
    return contaExistenteValidator((numero) => this.contas.buscarPorNumero(numero));
  }

  private validarEvento() {
    return eventoExistenteValidator((idEvento) => this.eventos.buscarPorId(idEvento));
  }
}
