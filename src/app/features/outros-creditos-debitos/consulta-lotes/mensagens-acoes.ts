import { Lote } from '../../../core/models/lote';
import { PedidoConfirmacao } from '../../../shared/ui/dialogo-confirmacao/dialogo-confirmacao';

export type AcaoDeSituacao = 'confirmar' | 'enviar';

const PEDIDO: Record<
  AcaoDeSituacao,
  { verbo: string; alcanca: (lote: Lote) => boolean; ignorados: (quantidade: number) => string }
> = {
  confirmar: {
    verbo: 'Confirmar',
    alcanca: (lote) => lote.situacao !== 'Confirmado',
    ignorados: (quantidade) =>
      quantidade === 1
        ? '1 já está confirmado e será ignorado.'
        : `${quantidade} já estão confirmados e serão ignorados.`,
  },
  enviar: {
    verbo: 'Enviar',
    alcanca: (lote) => lote.situacao === 'Aberto',
    ignorados: (quantidade) =>
      quantidade === 1
        ? '1 não está aberto e será ignorado.'
        : `${quantidade} não estão abertos e serão ignorados.`,
  },
};

const RESULTADO: Record<
  AcaoDeSituacao,
  { alterados: (quantidade: number) => string; ignorados: (quantidade: number) => string }
> = {
  confirmar: {
    alterados: (quantidade) =>
      quantidade === 0
        ? 'Nenhum lote confirmado.'
        : quantidade === 1
          ? '1 lote confirmado.'
          : `${quantidade} lotes confirmados.`,
    ignorados: (quantidade) =>
      quantidade === 1
        ? '1 lote já estava confirmado e foi ignorado.'
        : `${quantidade} lotes já estavam confirmados e foram ignorados.`,
  },
  enviar: {
    alterados: (quantidade) =>
      quantidade === 0
        ? 'Nenhum lote enviado.'
        : quantidade === 1
          ? '1 lote enviado.'
          : `${quantidade} lotes enviados.`,
    ignorados: (quantidade) =>
      quantidade === 1
        ? '1 lote não estava aberto e foi ignorado.'
        : `${quantidade} lotes não estavam abertos e foram ignorados.`,
  },
};

export function pedidoDeExclusao(lote: Lote): PedidoConfirmacao {
  const lancamentos = lote.quantidadeLancamentos;

  return {
    titulo: 'Excluir lote',
    mensagem: `Excluir o lote ${lote.id}?`,
    detalhe:
      lancamentos === 0
        ? undefined
        : lancamentos === 1
          ? 'O lançamento dele sai junto.'
          : `Os ${lancamentos} lançamentos dele saem junto.`,
    rotuloConfirmar: 'Excluir',
    perigo: true,
  };
}

export function pedidoDeSituacao(
  acao: AcaoDeSituacao,
  selecionados: readonly Lote[],
): PedidoConfirmacao {
  const alcancados = selecionados.filter((lote) => PEDIDO[acao].alcanca(lote)).length;
  const total = selecionados.length;
  const ignorados = total - alcancados;

  return {
    titulo: total === 1 ? `${PEDIDO[acao].verbo} lote` : `${PEDIDO[acao].verbo} lotes`,
    mensagem:
      total === 1
        ? `${PEDIDO[acao].verbo} o lote ${selecionados[0].id}?`
        : ignorados === 0
          ? `${PEDIDO[acao].verbo} os ${total} lotes selecionados?`
          : `${PEDIDO[acao].verbo} ${alcancados} dos ${total} lotes selecionados?`,
    detalhe: ignorados === 0 ? undefined : PEDIDO[acao].ignorados(ignorados),
    rotuloConfirmar: PEDIDO[acao].verbo,
  };
}

export function descreverResultado(
  acao: AcaoDeSituacao,
  alterados: number,
  ignorados: number,
): string {
  const frases = [RESULTADO[acao].alterados(alterados)];
  if (ignorados > 0) {
    frases.push(RESULTADO[acao].ignorados(ignorados));
  }

  return frases.join(' ');
}
