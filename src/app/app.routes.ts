import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: '',
    loadComponent: () => import('./features/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { title: 'Dashboard' }
      },
      {
        path: 'gestion/alumnos',
        loadComponent: () => import('./features/gestion/alumnos/alumnos.component').then(m => m.AlumnosComponent),
        data: { title: 'Alumnos' }
      },
      {
        path: 'gestion/docentes',
        loadComponent: () => import('./features/gestion/docentes/docentes.component').then(m => m.DocentesComponent),
        data: { title: 'Docentes' }
      },
      {
        path: 'gestion/docentes/nuevo',
        loadComponent: () => import('./features/gestion/docentes/docente-form.component').then(m => m.DocenteFormComponent),
        data: { title: 'Nuevo Docente' }
      },
      {
        path: 'gestion/docentes/editar/:id',
        loadComponent: () => import('./features/gestion/docentes/docente-form.component').then(m => m.DocenteFormComponent),
        data: { title: 'Editar Docente', modo: 'editar' }
      },
      {
        path: 'gestion/docentes/ver/:id',
        loadComponent: () => import('./features/gestion/docentes/docente-form.component').then(m => m.DocenteFormComponent),
        data: { title: 'Detalle Docente', modo: 'ver' }
      },
      {
        path: 'gestion/cursos',
        loadComponent: () => import('./features/gestion/cursos/cursos.component').then(m => m.CursosComponent),
        data: { title: 'Cursos' }
      },
      {
        path: 'gestion/cursos/nuevo',
        loadComponent: () => import('./features/gestion/cursos/curso-form.component').then(m => m.CursoFormComponent),
        data: { title: 'Nuevo Curso' }
      },
      {
        path: 'gestion/cursos/editar/:id',
        loadComponent: () => import('./features/gestion/cursos/curso-form.component').then(m => m.CursoFormComponent),
        data: { title: 'Editar Curso', modo: 'editar' }
      },
      {
        path: 'gestion/cursos/ver/:id',
        loadComponent: () => import('./features/gestion/cursos/curso-form.component').then(m => m.CursoFormComponent),
        data: { title: 'Detalle Curso', modo: 'ver' }
      },
      {
        path: 'gestion/comisiones',
        loadComponent: () => import('./features/gestion/comisiones/comisiones.component').then(m => m.ComisionesComponent),
        data: { title: 'Comisiones' }
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
