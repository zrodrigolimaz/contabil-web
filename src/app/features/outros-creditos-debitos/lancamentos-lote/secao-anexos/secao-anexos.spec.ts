import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideLocalePtBr } from '../../../../app.config';
import { Anexo, NovoAnexo } from '../../../../core/models/anexo';
import { aparelharDialogos } from '../../../../core/testing/dialogo-jsdom';
import { SecaoAnexos } from './secao-anexos';

const ANEXO: Anexo = {
  id: 7,
  nomeReduzido: 'repasse-10-2025.pdf',
  descricao: 'Relatório de repasse',
  dataInclusao: new Date(2025, 10, 12, 9, 40),
  idUsuario: 'ana.costa',
};

describe('SecaoAnexos', () => {
  let fixture: ComponentFixture<SecaoAnexos>;
  let incluidos: NovoAnexo[];
  let excluidos: number[];

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideLocalePtBr()] });

    fixture = TestBed.createComponent(SecaoAnexos);
    incluidos = [];
    excluidos = [];
    fixture.componentInstance.incluir.subscribe((dados) => incluidos.push(dados));
    fixture.componentInstance.excluir.subscribe((id) => excluidos.push(id));
    fixture.componentRef.setInput('anexos', []);
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  });

  async function comAnexos(anexos: readonly Anexo[]): Promise<void> {
    fixture.componentRef.setInput('anexos', anexos);
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  }

  function botao(rotulo: string, dentroDe = 'fieldset'): HTMLButtonElement | undefined {
    return [...fixture.nativeElement.querySelectorAll(`${dentroDe} button`)].find(
      (elemento: HTMLButtonElement) => elemento.textContent?.trim() === rotulo,
    );
  }

  async function clicar(rotulo: string, dentroDe?: string): Promise<void> {
    botao(rotulo, dentroDe)?.click();
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
    await fixture.whenStable();
  }

  async function marcar(anexo: Anexo): Promise<void> {
    fixture.nativeElement
      .querySelector(`input[aria-label="Selecionar anexo ${anexo.nomeReduzido}"]`)
      .click();
    await fixture.whenStable();
  }

  function texto(): string {
    return fixture.nativeElement.textContent;
  }

  it('avisa quando o lançamento não tem anexo', () => {
    expect(texto()).toContain('Nenhum registro encontrado.');
  });

  it('lista o anexo com data e usuário', async () => {
    await comAnexos([ANEXO]);

    expect(texto()).toContain('repasse-10-2025.pdf');
    expect(texto()).toContain('Relatório de repasse');
    expect(texto()).toContain('12/11/2025 09:40');
    expect(texto()).toContain('ana.costa');
  });

  it('pede a marcação de uma linha para visualizar e excluir', async () => {
    await comAnexos([ANEXO]);

    expect(botao('Visualizar')?.disabled).toBe(true);
    expect(botao('Excluir')?.disabled).toBe(true);
  });

  it('mostra os dados do anexo marcado', async () => {
    await comAnexos([ANEXO]);

    await marcar(ANEXO);
    await clicar('Visualizar');

    expect(texto()).toContain('O conteúdo do arquivo não é armazenado nesta simulação.');
  });

  it('exclui o anexo marcado', async () => {
    await comAnexos([ANEXO]);

    await marcar(ANEXO);
    await clicar('Excluir');

    expect(excluidos).toEqual([ANEXO.id]);
  });

  it('inclui o arquivo escolhido no sub-modal', async () => {
    await clicar('Incluir');

    const arquivo = fixture.nativeElement.querySelector('#anexo-arquivo') as HTMLInputElement;
    Object.defineProperty(arquivo, 'files', { value: [{ name: 'contrato.pdf' }] });
    arquivo.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    await clicar('Incluir', 'app-inclusao-anexo');

    expect(incluidos).toEqual([{ nomeReduzido: 'contrato.pdf', descricao: 'contrato.pdf' }]);
  });

  it('em leitura mantém só a visualização', async () => {
    fixture.componentRef.setInput('desabilitado', true);
    await comAnexos([ANEXO]);

    expect(botao('Visualizar')).toBeDefined();
    expect(botao('Incluir')).toBeUndefined();
    expect(botao('Excluir')).toBeUndefined();
  });
});
