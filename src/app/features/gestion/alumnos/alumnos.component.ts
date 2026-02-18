import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlumnosService, Alumno } from '../../../core/services/alumnos.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-alumnos',
  imports: [CommonModule, FormsModule],
  templateUrl: './alumnos.component.html',
  styleUrl: './alumnos.component.css'
})
export class AlumnosComponent implements OnInit {
  private alumnosService = inject(AlumnosService);
  authService = inject(AuthService);

  estados = ['ACTIVO', 'INACTIVO', 'PREINSCRIPTO', 'TODOS'];
  estadoSeleccionado = 'ACTIVO';
  searchTerm = '';
  todosAlumnos = signal<Alumno[]>([]);
  alumnos = signal<Alumno[]>([]);

  ngOnInit() {
    this.cargarAlumnos();
  }

  cargarAlumnos() {
    this.alumnosService.listar(this.estadoSeleccionado).subscribe({
      next: (data) => {
        this.todosAlumnos.set(data);
        this.filtrar();
      }
    });
  }

  onEstadoChange() {
    this.searchTerm = '';
    this.cargarAlumnos();
  }

  filtrar() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.alumnos.set(this.todosAlumnos());
    } else {
      this.alumnos.set(
        this.todosAlumnos().filter(a =>
          a.apellidos?.toLowerCase().includes(term) ||
          a.nombres?.toLowerCase().includes(term)
        )
      );
    }
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '-';
    const parts = fecha.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  nuevo() {
    // TODO
  }

  ver(alumno: Alumno) {
    // TODO
  }

  editar(alumno: Alumno) {
    // TODO
  }

  eliminar(alumno: Alumno) {
    // TODO
  }
}
