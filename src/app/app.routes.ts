import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';
import { cambiosSinGuardarGuard } from './core/guards/cambios-sin-guardar.guard';

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
        path: 'gestion/alumnos/nuevo',
        loadComponent: () => import('./features/gestion/alumnos/alumno-form.component').then(m => m.AlumnoFormComponent),
        data: { title: 'Nuevo Alumno' }
      },
      {
        path: 'gestion/alumnos/editar/:id',
        loadComponent: () => import('./features/gestion/alumnos/alumno-form.component').then(m => m.AlumnoFormComponent),
        data: { title: 'Editar Alumno', modo: 'editar' }
      },
      {
        path: 'gestion/alumnos/ver/:id',
        loadComponent: () => import('./features/gestion/alumnos/alumno-form.component').then(m => m.AlumnoFormComponent),
        data: { title: 'Detalle Alumno', modo: 'ver' }
      },
      {
        path: 'gestion/preinscripciones',
        loadComponent: () => import('./features/gestion/preinscripciones/preinscripciones.component').then(m => m.PreinscripcionesComponent),
        data: { title: 'Preinscripciones' }
      },
      {
        path: 'gestion/calificaciones',
        loadComponent: () => import('./features/gestion/calificaciones/calificaciones.component').then(m => m.CalificacionesComponent),
        canDeactivate: [cambiosSinGuardarGuard],
        data: { title: 'Calificaciones' }
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
        path: 'gestion/comisiones/nuevo',
        loadComponent: () => import('./features/gestion/comisiones/comision-form.component').then(m => m.ComisionFormComponent),
        data: { title: 'Nueva Comisión' }
      },
      {
        path: 'gestion/comisiones/editar/:id',
        loadComponent: () => import('./features/gestion/comisiones/comision-form.component').then(m => m.ComisionFormComponent),
        data: { title: 'Editar Comisión', modo: 'editar' }
      },
      {
        path: 'gestion/comisiones/ver/:id',
        loadComponent: () => import('./features/gestion/comisiones/comision-form.component').then(m => m.ComisionFormComponent),
        data: { title: 'Detalle Comisión', modo: 'ver' }
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
