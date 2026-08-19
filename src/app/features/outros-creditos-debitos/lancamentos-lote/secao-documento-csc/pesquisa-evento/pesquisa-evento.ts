import { DatePipe } from '@angular/common';
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

import { CampoBuscaEvento, EventoCsc } from '../../../../../core/models/evento';
import { ResultadoPaginado } from '../../../../../core/models/paginacao';
import { EventoService } from '../../../../../core/services/evento.service';
import { Dialogo } from '../../../../../shared/ui/dialogo/dialogo';
import { Paginacao } from '../../../../../shared/ui/paginacao/paginacao';

interface OpcaoCampoBusca {
  readonly valor: CampoBuscaEvento;
  readonly rotulo: string;
}

const CAMPOS_BUSCA: readonly OpcaoCampoBusca[] = [
  { valor: 'idEvento', rotulo: 'ID Evento' },
  { valor: 'codEvento', rotulo: 'Cod. Evento' },
  { valor: 'descricao', rotulo: 'Descrição' },
];

const RESULTADO_VAZIO: ResultadoPaginado<EventoCsc> = {
  itens: [],
  total: 0,
  pagina: 1,
  tamanhoPagina: 0,
  totalPaginas: 0,
};

@Component({
  selector: 'app-pesquisa-evento',
  imports: [DatePipe, Dialogo, Paginacao],
  templateUrl: './pesquisa-evento.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PesquisaEvento {
  private readonly eventos = inject(EventoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly aberto = input.required<boolean>();

  readonly escolher = output<EventoCsc>();
  readonly fechar = output<void>();

  protected readonly campos = CAMPOS_BUSCA;

  protected readonly campo = signal<CampoBuscaEvento>('idEvento');
  protected readonly valor = signal('');
  protected readonly resultado = signal(RESULTADO_VAZIO);
  protected readonly carregando = signal(false);
  protected readonly marcado = signal<EventoCsc | null>(null);

  constructor() {
    /* Sem untracked, o campo e o valor lidos pela pesquisa entrariam nas dependências
       do efeito, e cada tecla digitada recomeçaria o sub-modal. */
    effect(() => {
      if (!this.aberto()) {
        return;
      }

      untracked(() => {
        this.campo.set('idEvento');
        this.valor.set('');
        this.marcado.set(null);
        this.pesquisar(1);
      });
    });
  }

  protected trocarCampo(evento: Event): void {
    this.campo.set((evento.target as HTMLSelectElement).value as CampoBuscaEvento);
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

  protected alternar(evento: EventoCsc): void {
    this.marcado.set(this.marcado()?.idEvento === evento.idEvento ? null : evento);
  }

  protected confirmar(): void {
    const marcado = this.marcado();
    if (marcado) {
      this.escolher.emit(marcado);
    }
  }

  private pesquisar(pagina: number): void {
    this.carregando.set(true);
    this.marcado.set(null);

    this.eventos
      .pesquisar(this.campo(), this.valor(), pagina)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((resultado) => {
        this.resultado.set(resultado);
        this.carregando.set(false);
      });
  }
}
