import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { ConsultaLotes } from './features/outros-creditos-debitos/consulta-lotes/consulta-lotes';

describe('app.routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  it('carrega a página de consulta de lotes na rota raiz (lazy)', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/', ConsultaLotes);
    expect(pagina).toBeInstanceOf(ConsultaLotes);
  });

  it('define o título do documento na rota raiz', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(document.title).toContain('Outros Créditos/Débitos');
  });

  it('manda para a consulta qualquer rota desconhecida', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/lotes/9999', ConsultaLotes);

    expect(pagina).toBeInstanceOf(ConsultaLotes);
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
