import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Outros Créditos/Débitos',
    loadComponent: () =>
      import('./features/outros-creditos-debitos/consulta-lotes/consulta-lotes').then(
        (m) => m.ConsultaLotes,
      ),
  },
];
