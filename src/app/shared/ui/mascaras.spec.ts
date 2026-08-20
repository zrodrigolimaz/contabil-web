import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { Digitos, Inteiro, Moeda } from './mascaras';

@Component({
  imports: [ReactiveFormsModule, Moeda, Inteiro, Digitos],
  template: `
    <input id="moeda" appMoeda [formControl]="moeda" />
    <input id="inteiro" [appInteiro]="4" [formControl]="inteiro" />
    <input id="digitos" [appDigitos]="6" [formControl]="digitos" />
  `,
})
class Hospedeiro {
  readonly moeda = new FormControl<number | null>(null);
  readonly inteiro = new FormControl<number | null>(null);
  readonly digitos = new FormControl<string | null>(null);
}

describe('Máscaras', () => {
  let fixture: ComponentFixture<Hospedeiro>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Hospedeiro);
    await fixture.whenStable();
  });

  function campo(id: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`#${id}`);
  }

  function controles(): Hospedeiro {
    return fixture.componentInstance;
  }

  async function editar(
    entrada: HTMLInputElement,
    inputType: string,
    data: string | null,
    inicio: number,
    fim: number,
  ): Promise<void> {
    entrada.setSelectionRange(inicio, fim);

    const antes = new InputEvent('beforeinput', {
      inputType,
      data: data ?? undefined,
      bubbles: true,
      cancelable: true,
    });

    if (entrada.dispatchEvent(antes)) {
      let de = inicio;
      let ate = fim;
      if (de === ate) {
        if (inputType === 'deleteContentBackward') {
          de = Math.max(0, de - 1);
        }
        if (inputType === 'deleteContentForward') {
          ate = Math.min(entrada.value.length, ate + 1);
        }
      }

      const texto = data ?? '';
      entrada.value = entrada.value.slice(0, de) + texto + entrada.value.slice(ate);
      entrada.setSelectionRange(de + texto.length, de + texto.length);
      entrada.dispatchEvent(new InputEvent('input', { inputType, bubbles: true }));
    }

    await fixture.whenStable();
  }

  async function digitar(entrada: HTMLInputElement, tecla: string, inicio: number, fim = inicio) {
    await editar(entrada, 'insertText', tecla, inicio, fim);
  }

  async function apagarParaTras(entrada: HTMLInputElement, inicio: number, fim = inicio) {
    await editar(entrada, 'deleteContentBackward', null, inicio, fim);
  }

  async function apagarParaFrente(entrada: HTMLInputElement, inicio: number, fim = inicio) {
    await editar(entrada, 'deleteContentForward', null, inicio, fim);
  }

  async function preencher(entrada: HTMLInputElement, digitos: string): Promise<void> {
    for (const tecla of digitos) {
      await digitar(entrada, tecla, entrada.value.length);
    }
  }

  describe('moeda', () => {
    it('digita pelos centavos com o cursor no fim', async () => {
      await preencher(campo('moeda'), '123456');

      expect(campo('moeda').value).toBe('1.234,56');
      expect(campo('moeda').selectionStart).toBe(8);
      expect(controles().moeda.value).toBe(1234.56);
    });

    it('mantém o cursor ao inserir um dígito no meio', async () => {
      await preencher(campo('moeda'), '123456');

      await digitar(campo('moeda'), '9', 4);

      expect(campo('moeda').value).toBe('12.394,56');
      expect(campo('moeda').selectionStart).toBe(5);
      expect(controles().moeda.value).toBe(12394.56);
    });

    it('mantém o cursor ao apagar um dígito no meio', async () => {
      await preencher(campo('moeda'), '1239456');

      await apagarParaTras(campo('moeda'), 5);

      expect(campo('moeda').value).toBe('1.234,56');
      expect(campo('moeda').selectionStart).toBe(4);
      expect(controles().moeda.value).toBe(1234.56);
    });

    it('backspace sobre o separador apaga o dígito anterior a ele', async () => {
      await preencher(campo('moeda'), '123456');

      await apagarParaTras(campo('moeda'), 6);

      expect(campo('moeda').value).toBe('123,56');
      expect(campo('moeda').selectionStart).toBe(3);
      expect(controles().moeda.value).toBe(123.56);
    });

    it('delete sobre o separador apaga o dígito seguinte a ele', async () => {
      await preencher(campo('moeda'), '123456');

      await apagarParaFrente(campo('moeda'), 5);

      expect(campo('moeda').value).toBe('123,46');
      expect(campo('moeda').selectionStart).toBe(5);
      expect(controles().moeda.value).toBe(123.46);
    });

    it('substitui o trecho selecionado mantendo o cursor', async () => {
      await preencher(campo('moeda'), '123456');

      await digitar(campo('moeda'), '9', 2, 5);

      expect(campo('moeda').value).toBe('19,56');
      expect(campo('moeda').selectionStart).toBe(2);
      expect(controles().moeda.value).toBe(19.56);
    });

    it('rejeita a tecla quando os treze dígitos estão preenchidos', async () => {
      await preencher(campo('moeda'), '1234567890123');
      expect(campo('moeda').value).toBe('12.345.678.901,23');

      await digitar(campo('moeda'), '9', 4);

      expect(campo('moeda').value).toBe('12.345.678.901,23');
      expect(campo('moeda').selectionStart).toBe(4);
      expect(controles().moeda.value).toBe(12345678901.23);
    });

    it('esvazia o controle ao apagar a seleção inteira', async () => {
      await preencher(campo('moeda'), '505');

      await apagarParaTras(campo('moeda'), 0, campo('moeda').value.length);

      expect(campo('moeda').value).toBe('');
      expect(controles().moeda.value).toBeNull();
    });
  });

  describe('inteiro', () => {
    it('mantém o cursor ao inserir um dígito no meio', async () => {
      await preencher(campo('inteiro'), '123');

      await digitar(campo('inteiro'), '9', 1);

      expect(campo('inteiro').value).toBe('1923');
      expect(campo('inteiro').selectionStart).toBe(2);
      expect(controles().inteiro.value).toBe(1923);
    });

    it('rejeita a tecla quando o limite está preenchido', async () => {
      await preencher(campo('inteiro'), '1234');

      await digitar(campo('inteiro'), '9', 2);

      expect(campo('inteiro').value).toBe('1234');
      expect(campo('inteiro').selectionStart).toBe(2);
      expect(controles().inteiro.value).toBe(1234);
    });
  });

  describe('dígitos', () => {
    it('descarta letras mantendo o cursor no lugar', async () => {
      await preencher(campo('digitos'), '1234');

      await digitar(campo('digitos'), 'a', 2);

      expect(campo('digitos').value).toBe('1234');
      expect(campo('digitos').selectionStart).toBe(2);
      expect(controles().digitos.value).toBe('1234');
    });

    it('mantém o cursor ao apagar um dígito no meio', async () => {
      await preencher(campo('digitos'), '123456');

      await apagarParaTras(campo('digitos'), 3);

      expect(campo('digitos').value).toBe('12456');
      expect(campo('digitos').selectionStart).toBe(2);
      expect(controles().digitos.value).toBe('12456');
    });
  });
});
