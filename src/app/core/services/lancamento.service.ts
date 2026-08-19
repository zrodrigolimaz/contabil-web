import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { LANCAMENTOS } from '../mocks/lancamentos.mock';
import { Lancamento, NovoLancamento } from '../models/lancamento';
import { erroMock, respostaMock } from './api-mock';

@Injectable({ providedIn: 'root' })
export class LancamentoService {
  /** Fonte de verdade em memória; sobrevive enquanto a aba estiver aberta. */
  private lancamentos: readonly Lancamento[] = LANCAMENTOS;
  private proximoId = Math.max(0, ...LANCAMENTOS.map((lancamento) => lancamento.id)) + 1;

  /** Lançamentos do lote, na ordem de inclusão. */
  listarPorLote(idLote: number): Observable<readonly Lancamento[]> {
    return respostaMock(this.lancamentos.filter((lancamento) => lancamento.idLote === idLote));
  }

  /** Inclui o lançamento como "Pendente", aguardando processamento do CCO. */
  incluir(dados: NovoLancamento): Observable<Lancamento> {
    const incluido: Lancamento = {
      ...dados,
      id: this.proximoId++,
      situacao: 'Pendente',
      situacaoDocumentoCsc: 'Aguardando Processamento CCO',
      idDocumentoCsc: null,
    };

    this.lancamentos = [...this.lancamentos, incluido];
    return respostaMock(incluido);
  }

  /** Substitui os dados do lançamento, preservando id e situações. */
  alterar(id: number, dados: NovoLancamento): Observable<Lancamento> {
    const atual = this.buscar(id);
    if (!atual) {
      return erroMock(`Lançamento ${id} não encontrado.`);
    }

    const alterado: Lancamento = {
      ...dados,
      id: atual.id,
      situacao: atual.situacao,
      situacaoDocumentoCsc: atual.situacaoDocumentoCsc,
      idDocumentoCsc: atual.idDocumentoCsc,
    };

    this.lancamentos = this.lancamentos.map((lancamento) =>
      lancamento.id === id ? alterado : lancamento,
    );
    return respostaMock(alterado);
  }

  excluir(id: number): Observable<void> {
    if (!this.buscar(id)) {
      return erroMock(`Lançamento ${id} não encontrado.`);
    }

    this.lancamentos = this.lancamentos.filter((lancamento) => lancamento.id !== id);
    return respostaMock<void>(undefined);
  }

  /** Cria uma cópia pendente do lançamento, sem os anexos do original. */
  duplicar(id: number): Observable<Lancamento> {
    const original = this.buscar(id);
    if (!original) {
      return erroMock(`Lançamento ${id} não encontrado.`);
    }

    const { id: _id, situacao, situacaoDocumentoCsc, idDocumentoCsc, ...dados } = original;
    return this.incluir({ ...dados, anexos: [] });
  }

  private buscar(id: number): Lancamento | undefined {
    return this.lancamentos.find((lancamento) => lancamento.id === id);
  }
}
