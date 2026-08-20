import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Outros Créditos/Débitos — Contábil Web',
    loadComponent: () =>
      import('./features/outros-creditos-debitos/consulta-lotes/consulta-lotes').then(
        (m) => m.ConsultaLotes,
      ),
  },
];
