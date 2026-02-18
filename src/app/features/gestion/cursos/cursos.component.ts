import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CursosService, Curso } from '../../../core/services/cursos.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cursos',
  imports: [CommonModule, FormsModule],
  templateUrl: './cursos.component.html',
  styleUrl: './cursos.component.css'
})
export class CursosComponent implements OnInit {
  private cursosService = inject(CursosService);
  private router = inject(Router);
  authService = inject(AuthService);

  searchTerm = '';
  cursos = signal<Curso[]>([]);

  ngOnInit() {
    this.cargarCursos();
  }

  cargarCursos() {
    this.cursosService.buscar(this.searchTerm).subscribe({
      next: (data) => this.cursos.set(data)
    });
  }

  filtrar() {
    this.cargarCursos();
  }

  nuevo() {
    this.router.navigate(['/gestion/cursos/nuevo']);
  }

  ver(curso: Curso) {
    this.router.navigate(['/gestion/cursos/ver', curso.curId]);
  }

  editar(curso: Curso) {
    this.router.navigate(['/gestion/cursos/editar', curso.curId]);
  }

  eliminar(curso: Curso) {
    if (!confirm(`¿Está seguro que desea eliminar el curso "${curso.curNombre}"?`)) return;
    this.cursosService.eliminar(curso.curId).subscribe({
      next: () => this.cargarCursos(),
      error: (err: any) => alert(err?.error?.message || 'Error al eliminar el curso')
    });
  }
}
