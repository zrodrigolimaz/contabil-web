import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { aparelharDialogos } from '../../../core/testing/dialogo-jsdom';
import { Dialogo } from './dialogo';

@Component({
  imports: [Dialogo],
  template: `
    <app-dialogo [aberto]="aberto()" titulo="Título de teste" (fechar)="fechou.set(true)">
      <p>Conteúdo projetado.</p>
      <button rodape type="button">Confirmar</button>
    </app-dialogo>
  `,
})
class Hospedeiro {
  readonly aberto = signal(false);
  readonly fechou = signal(false);
}

describe('Dialogo', () => {
  let fixture: ComponentFixture<Hospedeiro>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Hospedeiro);
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  });

  function dialogo(): HTMLDialogElement {
    return fixture.nativeElement.querySelector('dialog');
  }

  async function abrir(): Promise<void> {
    fixture.componentInstance.aberto.set(true);
    await fixture.whenStable();
  }

  it('nasce fechado e sem conteúdo montado', () => {
    expect(dialogo().open).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Conteúdo projetado.');
  });

  it('abre com o título e o conteúdo projetado', async () => {
    await abrir();

    expect(dialogo().open).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Título de teste');
    expect(fixture.nativeElement.textContent).toContain('Conteúdo projetado.');
    expect(fixture.nativeElement.textContent).toContain('Confirmar');
  });

  it('liga o título ao diálogo para o leitor de tela anunciá-lo', async () => {
    await abrir();

    const id = dialogo().getAttribute('aria-labelledby');
    expect(fixture.nativeElement.querySelector(`#${id}`).textContent).toContain('Título de teste');
  });

  it('avisa quem o controla quando o usuário fecha', async () => {
    await abrir();

    fixture.nativeElement.querySelector('button[aria-label="Fechar"]').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.fechou()).toBe(true);
  });

  it('fecha quando quem o controla manda fechar', async () => {
    await abrir();

    fixture.componentInstance.aberto.set(false);
    await fixture.whenStable();

    expect(dialogo().open).toBe(false);
  });

  it('não devolve como aviso o fechamento que ele mesmo recebeu', async () => {
    await abrir();

    /* O eco do `close` nativo fecharia um diálogo reaberto nesse intervalo. */
    fixture.componentInstance.aberto.set(false);
    await fixture.whenStable();

    expect(fixture.componentInstance.fechou()).toBe(false);
  });

  it('volta a avisar depois de reabrir', async () => {
    await abrir();
    fixture.componentInstance.aberto.set(false);
    await fixture.whenStable();

    await abrir();
    fixture.nativeElement.querySelector('button[aria-label="Fechar"]').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.fechou()).toBe(true);
  });
});
