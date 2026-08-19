import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, first, map, of, switchMap } from 'rxjs';

import { HISTORICOS, OPCOES_PA } from '../../../../core/mocks/opcoes.mock';
import { Lancamento } from '../../../../core/models/lancamento';
import { ContaCorrenteService } from '../../../../core/services/conta-corrente.service';
import { CampoForm } from '../../../../shared/ui/campo-form/campo-form';
import { contaExistenteValidator } from '../../../../shared/validators/conta-existente.validator';
import { maiorQueZero } from '../../../../shared/validators/maior-que-zero.validator';

/** O container completa o resto do lançamento. */
export interface DadosFormularioLancamento {
  readonly conta: string;
  readonly titular: string;
  readonly valor: number;
  readonly historico: string;
  readonly estorno: boolean;
  readonly documento: string;
  readonly descricao: string;
  readonly pa: string;
}

@Component({
  selector: 'app-formulario-lancamento',
  imports: [ReactiveFormsModule, CampoForm],
  templateUrl: './formulario-lancamento.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioLancamento {
  private readonly fb = inject(FormBuilder);
  private readonly contas = inject(ContaCorrenteService);
  private readonly destroyRef = inject(DestroyRef);

  readonly lancamento = input<Lancamento | null>(null);
  readonly desabilitado = input(false);
  readonly rotuloEnviar = input('Incluir');
  readonly emEdicao = input(false);

  readonly salvar = output<DadosFormularioLancamento>();
  readonly cancelarEdicao = output<void>();

  protected readonly historicos = HISTORICOS;
  protected readonly opcoesPa = OPCOES_PA;

  /* A conta valida no blur: a cada tecla, o erro apareceria no meio de um número
     ainda incompleto. */
  protected readonly form = this.fb.nonNullable.group({
    conta: [
      '',
      { validators: Validators.required, asyncValidators: this.validarConta(), updateOn: 'blur' },
    ],
    valor: this.fb.control<number | null>(null, [Validators.required, maiorQueZero]),
    historico: ['', Validators.required],
    estorno: [false],
    documento: ['', Validators.required],
    descricao: [''],
    pa: ['', Validators.required],
  });

  protected readonly titular = toSignal(
    this.form.controls.conta.valueChanges.pipe(
      switchMap((numero) => (numero ? this.contas.buscarPorNumero(numero) : of(null))),
      map((conta) => conta?.titular ?? null),
    ),
    { initialValue: null },
  );

  protected readonly situacao = computed(() => this.lancamento()?.situacao ?? 'Pendente');

  constructor() {
    effect(() => {
      const lancamento = this.lancamento();

      if (lancamento) {
        this.form.setValue({
          conta: lancamento.conta,
          valor: lancamento.valor,
          historico: lancamento.historico,
          estorno: lancamento.estorno,
          documento: lancamento.documento,
          descricao: lancamento.descricao,
          pa: lancamento.pa,
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
    /* Conta ainda em validação: espera o veredito em vez de ignorar o clique. */
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

    const { conta, valor, historico, estorno, documento, descricao, pa } = this.form.getRawValue();

    this.salvar.emit({
      conta,
      titular: this.titular() ?? '',
      valor: valor ?? 0,
      historico,
      estorno,
      documento,
      descricao,
      pa,
    });

    if (!this.emEdicao()) {
      this.limpar();
    }
  }

  protected limpar(): void {
    this.form.reset();
  }

  /** A lupa refaz a validação do blur, não uma busca à parte. */
  protected buscarConta(): void {
    this.form.controls.conta.markAsTouched();
    this.form.controls.conta.updateValueAndValidity();
  }

  private validarConta() {
    return contaExistenteValidator((numero) => this.contas.buscarPorNumero(numero));
  }
}
