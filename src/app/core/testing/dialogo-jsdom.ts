/**
 * O jsdom conhece a tag `<dialog>` mas não implementa a abertura modal: `showModal` e
 * `close` não existem no elemento, e chamá-los estoura. Esta função põe as duas no
 * lugar, preservando o que os testes observam — `open` e o evento `close`.
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

export function aparelharDialogos(raiz: HTMLElement): void {
  raiz.querySelectorAll('dialog').forEach(aparelharDialogo);
}
