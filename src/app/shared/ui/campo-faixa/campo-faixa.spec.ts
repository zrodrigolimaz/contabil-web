import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import { faixaValidator } from '../../validators/faixa.validator';
import { CampoFaixa } from './campo-faixa';

function grupoDeFaixa(de: unknown = null, ate: unknown = null): FormGroup {
  return new FormGroup(
    { de: new FormControl(de), ate: new FormControl(ate) },
    { validators: faixaValidator },
  );
}

describe('CampoFaixa', () => {
  let fixture: ComponentFixture<CampoFaixa>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CampoFaixa);
  });

  async function montar(
    grupo: FormGroup,
    tipo: 'inteiro' | 'decimal' | 'data' = 'inteiro',
    extras: Record<string, string> = {},
  ): Promise<void> {
    fixture.componentRef.setInput('rotulo', 'ID Lote');
    fixture.componentRef.setInput('grupo', grupo);
    fixture.componentRef.setInput('tipo', tipo);
    for (const [nome, valor] of Object.entries(extras)) {
      fixture.componentRef.setInput(nome, valor);
    }

    await fixture.whenStable();
  }

  function entradas(): HTMLInputElement[] {
    return [...fixture.nativeElement.querySelectorAll('input')];
  }

  function alerta(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[role="alert"]');
  }

  async function digitar(campo: HTMLInputElement, texto: string): Promise<void> {
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  it('rotula o par e liga cada rótulo ao seu campo', async () => {
    await montar(grupoDeFaixa());

    const grupoNaTela: HTMLElement = fixture.nativeElement.querySelector('[role="group"]');
    const idDoRotulo = grupoNaTela.getAttribute('aria-labelledby');
    expect(fixture.nativeElement.querySelector(`#${idDoRotulo}`).textContent).toContain('ID Lote');

    const rotulos: HTMLLabelElement[] = [...fixture.nativeElement.querySelectorAll('label')];
    expect(rotulos.map((rotulo) => rotulo.textContent?.trim())).toEqual(['De', 'Até']);
    expect(rotulos[0].getAttribute('for')).toBe(entradas()[0].id);
    expect(rotulos[1].getAttribute('for')).toBe(entradas()[1].id);
  });

  it('recusa o que não for dígito na faixa de identificador', async () => {
    const grupo = grupoDeFaixa();
    await montar(grupo);

    await digitar(entradas()[0], '10e01-');

    expect(entradas()[0].value).toBe('1001');
    expect(grupo.controls['de'].value).toBe(1001);
  });

  it('escreve o dinheiro no formato de leitura e guarda o número', async () => {
    const grupo = grupoDeFaixa();
    await montar(grupo, 'decimal');

    await digitar(entradas()[0], '123456');

    expect(entradas()[0].value).toBe('1.234,56');
    expect(grupo.controls['de'].value).toBe(1234.56);
  });

  it('esvazia o controle quando o campo de dinheiro fica em branco', async () => {
    const grupo = grupoDeFaixa();
    await montar(grupo, 'decimal');

    await digitar(entradas()[0], '50');
    await digitar(entradas()[0], '');

    expect(grupo.controls['de'].value).toBeNull();
  });

  it('troca para campo de data quando a faixa é de datas', async () => {
    await montar(grupoDeFaixa(), 'data');

    expect(entradas().map((campo) => campo.type)).toEqual(['date', 'date']);
  });

  it('mostra o prefixo e afasta o texto dos campos', async () => {
    await montar(grupoDeFaixa(), 'decimal', { prefixo: 'R$' });

    expect(fixture.nativeElement.textContent).toContain('R$');
    expect(entradas().every((campo) => campo.classList.contains('pl-9'))).toBe(true);
  });

  it('leva os exemplos recebidos para os placeholders', async () => {
    await montar(grupoDeFaixa(), 'inteiro', { exemploDe: '1001', exemploAte: '1078' });

    expect(entradas().map((campo) => campo.placeholder)).toEqual(['1001', '1078']);
  });

  it('não acusa erro enquanto a faixa não foi tocada', async () => {
    await montar(grupoDeFaixa(90, 10));

    expect(alerta()).toBeNull();
    expect(entradas()[0].getAttribute('aria-invalid')).toBeNull();
  });

  it('mostra uma mensagem só para o par quando o início passa do fim', async () => {
    const grupo = grupoDeFaixa(90, 10);
    await montar(grupo);

    grupo.markAllAsTouched();
    await fixture.whenStable();

    expect(alerta()?.textContent?.trim()).toBe('O valor inicial deve ser menor ou igual ao final.');
    expect(fixture.nativeElement.querySelectorAll('[role="alert"]')).toHaveLength(1);
  });

  it('aponta os dois campos para a mensagem de erro do par', async () => {
    const grupo = grupoDeFaixa(90, 10);
    await montar(grupo);

    grupo.markAllAsTouched();
    await fixture.whenStable();

    const idDoErro = alerta()?.id;
    expect(entradas().map((campo) => campo.getAttribute('aria-describedby'))).toEqual([
      idDoErro,
      idDoErro,
    ]);
    expect(entradas().every((campo) => campo.getAttribute('aria-invalid') === 'true')).toBe(true);
  });

  it('some com o erro quando a faixa é corrigida', async () => {
    const grupo = grupoDeFaixa(90, 10);
    await montar(grupo);
    grupo.markAllAsTouched();
    await fixture.whenStable();

    grupo.setValue({ de: 10, ate: 90 });
    await fixture.whenStable();

    expect(alerta()).toBeNull();
    expect(entradas()[0].getAttribute('aria-invalid')).toBeNull();
  });
});
