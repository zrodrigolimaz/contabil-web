import { ValidationErrors } from '@angular/forms';

const MENSAGENS: Record<string, string> = {
  required: 'Campo obrigatório.',
  faixaInvertida: 'O valor inicial deve ser menor ou igual ao final.',
  maiorQueZero: 'Informe um valor maior que zero.',
  contaInexistente: 'Conta corrente não encontrada.',
  eventoInexistente: 'Evento não encontrado.',
};

export function mensagemDeErro(erros: ValidationErrors | null | undefined): string | null {
  if (!erros) {
    return null;
  }

  for (const chave of Object.keys(erros)) {
    const mensagem = MENSAGENS[chave];
    if (mensagem) {
      return mensagem;
    }
  }

  return null;
}
