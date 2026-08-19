import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovoAnexo } from '../../../../../core/models/anexo';
import { aparelharDialogos } from '../../../../../core/testing/dialogo-jsdom';
import { InclusaoAnexo } from './inclusao-anexo';

describe('InclusaoAnexo', () => {
  let fixture: ComponentFixture<InclusaoAnexo>;
  let incluidos: NovoAnexo[];

  beforeEach(async () => {
    fixture = TestBed.createComponent(InclusaoAnexo);
    incluidos = [];
    fixture.componentInstance.incluir.subscribe((dados) => incluidos.push(dados));
    fixture.componentRef.setInput('aberto', false);
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);

    fixture.componentRef.setInput('aberto', true);
    await fixture.whenStable();
  });

  function campo(id: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`#${id}`);
  }

  async function escolherArquivo(nome: string): Promise<void> {
    const arquivo = campo('anexo-arquivo');
    Object.defineProperty(arquivo, 'files', { value: [{ name: nome }], configurable: true });
    arquivo.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  async function digitarDescricao(texto: string): Promise<void> {
    const descricao = campo('anexo-descricao');
    descricao.value = texto;
    descricao.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function clicarEmIncluir(): Promise<void> {
    const botao = [...fixture.nativeElement.querySelectorAll('button')].find(
      (elemento: HTMLButtonElement) => elemento.textContent?.trim() === 'Incluir',
    ) as HTMLButtonElement;

    botao.click();
    await fixture.whenStable();
  }

  it('sugere o nome do arquivo como descrição', async () => {
    await escolherArquivo('nota-fiscal.pdf');

    expect(campo('anexo-descricao').value).toBe('nota-fiscal.pdf');
  });

  it('preserva a descrição digitada quando o arquivo é trocado', async () => {
    await escolherArquivo('nota-fiscal.pdf');
    await digitarDescricao('Nota fiscal de novembro');
    await escolherArquivo('outro.pdf');

    expect(campo('anexo-descricao').value).toBe('Nota fiscal de novembro');
  });

  it('não inclui sem arquivo escolhido', async () => {
    await digitarDescricao('Só a descrição');
    await clicarEmIncluir();

    expect(incluidos).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Campo obrigatório.');
  });

  it('inclui o arquivo com a descrição informada', async () => {
    await escolherArquivo('nota-fiscal.pdf');
    await digitarDescricao('Nota fiscal de novembro');
    await clicarEmIncluir();

    expect(incluidos).toEqual([
      { nomeReduzido: 'nota-fiscal.pdf', descricao: 'Nota fiscal de novembro' },
    ]);
  });

  it('recomeça vazio a cada abertura', async () => {
    await escolherArquivo('nota-fiscal.pdf');

    fixture.componentRef.setInput('aberto', false);
    await fixture.whenStable();
    fixture.componentRef.setInput('aberto', true);
    await fixture.whenStable();

    expect(campo('anexo-descricao').value).toBe('');
  });
});
