import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { CAMPO_FORM } from './campo-form';

@Component({
  imports: [CAMPO_FORM, ReactiveFormsModule],
  template: `
    <app-campo-form rotulo="Documento" paraId="doc" [controle]="controle" [obrigatorio]="true">
      <input id="doc" class="campo" [formControl]="controle" />
    </app-campo-form>
  `,
})
class Hospedeiro {
  readonly controle = new FormControl('', { validators: Validators.required });
}

describe('CampoForm', () => {
  let fixture: ComponentFixture<Hospedeiro>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Hospedeiro);
    await fixture.whenStable();
  });

  function alerta(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[role="alert"]');
  }

  function campo(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  it('liga o rótulo ao campo projetado', () => {
    const rotulo: HTMLLabelElement = fixture.nativeElement.querySelector('label');

    expect(rotulo.getAttribute('for')).toBe('doc');
    expect(rotulo.textContent).toContain('Documento');
  });

  it('não mostra erro antes de o campo ser tocado', () => {
    expect(fixture.componentInstance.controle.invalid).toBe(true);
    expect(alerta()).toBeNull();
  });

  it('mostra a mensagem do mapa central depois de tocar o campo', async () => {
    fixture.componentInstance.controle.markAsTouched();
    await fixture.whenStable();

    expect(alerta()?.textContent?.trim()).toBe('Campo obrigatório.');
  });

  it('esconde a mensagem quando o campo passa a ser válido', async () => {
    const { controle } = fixture.componentInstance;
    controle.markAsTouched();
    await fixture.whenStable();

    controle.setValue('123');
    await fixture.whenStable();

    expect(alerta()).toBeNull();
  });

  it('anuncia o campo como inválido e o liga à mensagem', async () => {
    expect(campo().getAttribute('aria-invalid')).toBeNull();
    expect(campo().getAttribute('aria-describedby')).toBeNull();

    fixture.componentInstance.controle.markAsTouched();
    await fixture.whenStable();

    expect(campo().getAttribute('aria-invalid')).toBe('true');
    expect(campo().getAttribute('aria-describedby')).toBe(alerta()?.id);
  });

  it('tira os atributos de erro quando o campo passa a ser válido', async () => {
    const { controle } = fixture.componentInstance;
    controle.markAsTouched();
    await fixture.whenStable();

    controle.setValue('123');
    await fixture.whenStable();

    expect(campo().getAttribute('aria-invalid')).toBeNull();
    expect(campo().getAttribute('aria-describedby')).toBeNull();
  });

  it('troca o texto quando muda o motivo, sem o campo voltar a ser válido', async () => {
    const { controle } = fixture.componentInstance;
    controle.markAsTouched();
    await fixture.whenStable();
    expect(alerta()?.textContent?.trim()).toBe('Campo obrigatório.');

    controle.setErrors({ maiorQueZero: true });
    await fixture.whenStable();
    expect(alerta()?.textContent?.trim()).toBe('Informe um valor maior que zero.');

    controle.setErrors({ contaInexistente: true });
    await fixture.whenStable();
    expect(alerta()?.textContent?.trim()).toBe('Conta corrente não encontrada.');
  });
});
