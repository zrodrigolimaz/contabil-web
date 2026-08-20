import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CampoBuscaConta, ContaCorrente } from '../../../../../core/models/conta-corrente';
import { ResultadoPaginado } from '../../../../../core/models/paginacao';
import { ContaCorrenteService } from '../../../../../core/services/conta-corrente.service';
import { Dialogo } from '../../../../../shared/ui/dialogo/dialogo';
import { Paginacao } from '../../../../../shared/ui/paginacao/paginacao';

interface OpcaoCampoBusca {
  readonly valor: CampoBuscaConta;
  readonly rotulo: string;
}

const CAMPOS_BUSCA: readonly OpcaoCampoBusca[] = [
  { valor: 'numero', rotulo: 'Conta Corrente' },
  { valor: 'titular', rotulo: 'Titular' },
  { valor: 'agencia', rotulo: 'Agência' },
];

const RESULTADO_VAZIO: ResultadoPaginado<ContaCorrente> = {
  itens: [],
  total: 0,
  pagina: 1,
  tamanhoPagina: 0,
  totalPaginas: 0,
};

@Component({
  selector: 'app-pesquisa-conta',
  imports: [Dialogo, Paginacao],
  templateUrl: './pesquisa-conta.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PesquisaConta {
  private readonly contas = inject(ContaCorrenteService);
  private readonly destroyRef = inject(DestroyRef);

  readonly aberto = input.required<boolean>();

  readonly escolher = output<ContaCorrente>();
  readonly fechar = output<void>();

  protected readonly campos = CAMPOS_BUSCA;

  protected readonly campo = signal<CampoBuscaConta>('numero');
  protected readonly valor = signal('');
  protected readonly resultado = signal(RESULTADO_VAZIO);
  protected readonly carregando = signal(false);
  protected readonly marcada = signal<ContaCorrente | null>(null);

  constructor() {
    /* Sem untracked, o campo e o valor lidos pela pesquisa entrariam nas dependências
       do efeito, e cada tecla digitada recomeçaria o sub-modal. */
    effect(() => {
      if (!this.aberto()) {
        return;
      }

      untracked(() => {
        this.campo.set('numero');
        this.valor.set('');
        this.marcada.set(null);
        this.pesquisar(1);
      });
    });
  }

  protected trocarCampo(evento: Event): void {
    this.campo.set((evento.target as HTMLSelectElement).value as CampoBuscaConta);
  }

  protected trocarValor(evento: Event): void {
    this.valor.set((evento.target as HTMLInputElement).value);
  }

  protected listar(): void {
    this.pesquisar(1);
  }

  protected irPara(pagina: number): void {
    this.pesquisar(pagina);
  }

  protected marcar(conta: ContaCorrente): void {
    this.marcada.set(conta);
  }

  protected confirmar(): void {
    const marcada = this.marcada();
    if (marcada) {
      this.escolher.emit(marcada);
    }
  }

  private pesquisar(pagina: number): void {
    this.carregando.set(true);
    this.marcada.set(null);

    this.contas
      .pesquisar(this.campo(), this.valor(), pagina)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((resultado) => {
        this.resultado.set(resultado);
        this.carregando.set(false);
      });
  }
}
