import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Shell } from './shell';

describe('Shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  async function renderizar(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('exibe o título da tela no header', async () => {
    const el = await renderizar();
    const titulo = el.querySelector('header h1');
    expect(titulo?.textContent).toContain('Outros Créditos/Débitos');
  });

  it('exibe o breadcrumb com "Início" como link e a tela atual marcada', async () => {
    const el = await renderizar();
    const breadcrumb = el.querySelector('nav[aria-label="Trilha de navegação"]');
    const link = breadcrumb?.querySelector('a');
    const atual = breadcrumb?.querySelector('[aria-current="page"]');
    expect(link?.textContent).toContain('Início');
    expect(atual?.textContent).toContain('Outros Créditos/Débitos');
  });

  it('exibe o item "Contábil" na navegação lateral', async () => {
    const el = await renderizar();
    const sidebar = el.querySelector('nav[aria-label="Menu principal"]');
    expect(sidebar?.textContent).toContain('Contábil');
  });

  it('marca "Outros Créditos/Débitos" como item atual do menu', async () => {
    const el = await renderizar();
    const sidebar = el.querySelector('nav[aria-label="Menu principal"]');
    const atual = sidebar?.querySelector('[aria-current="page"]');
    expect(atual?.textContent).toContain('Outros Créditos/Débitos');
  });

  it('fecha e reabre o submenu do grupo Contábil ao clicar no grupo', async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const sidebar = () => el.querySelector('nav[aria-label="Menu principal"]')!;
    const grupo = sidebar().querySelector('button[aria-controls="submenu-contabil"]') as HTMLButtonElement;

    expect(sidebar().textContent).toContain('Outros Créditos/Débitos');
    expect(grupo.getAttribute('aria-expanded')).toBe('true');

    grupo.click();
    await fixture.whenStable();
    expect(sidebar().textContent).not.toContain('Outros Créditos/Débitos');
    expect(grupo.getAttribute('aria-expanded')).toBe('false');

    grupo.click();
    await fixture.whenStable();
    expect(sidebar().textContent).toContain('Outros Créditos/Débitos');
  });

  it('recolhe o menu lateral para modo compacto e expande de volta', async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const sidebar = () => el.querySelector('nav[aria-label="Menu principal"]')!;
    const alternar = sidebar().querySelector('button[aria-label="Alternar menu"]') as HTMLButtonElement;

    expect(sidebar().textContent).toContain('Início');
    expect(alternar.getAttribute('aria-expanded')).toBe('true');

    alternar.click();
    await fixture.whenStable();
    expect(sidebar().textContent).not.toContain('Início');
    expect(alternar.getAttribute('aria-expanded')).toBe('false');

    alternar.click();
    await fixture.whenStable();
    expect(sidebar().textContent).toContain('Início');
  });
});
