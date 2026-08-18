/**
 * O jsdom conhece a tag `<dialog>`, mas não implementa a abertura modal: `showModal` e
 * `close` simplesmente não existem no elemento, e chamá-los estoura. Esta função põe as
 * duas no lugar, mantendo o que os testes precisam observar — a propriedade `open` e o
 * evento `close`, que é por onde o Esc e o backdrop avisam a aplicação.
 */
export function aparelharDialogo(elemento: HTMLDialogElement): void {
  elemento.showModal = () => {
    elemento.open = true;
  };

  elemento.close = () => {
    elemento.open = false;
    elemento.dispatchEvent(new Event('close'));
  };
}

/** Aparelha todos os `<dialog>` já renderizados na fixture. */
export function aparelharDialogos(raiz: HTMLElement): void {
  raiz.querySelectorAll('dialog').forEach(aparelharDialogo);
}
