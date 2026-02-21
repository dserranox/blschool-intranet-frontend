import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AlumnosService, Alumno } from '../../../core/services/alumnos.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';

@Component({
  selector: 'app-alumnos',
  imports: [CommonModule, FormsModule],
  templateUrl: './alumnos.component.html',
  styleUrl: './alumnos.component.css'
})
export class AlumnosComponent implements OnInit {
  private alumnosService = inject(AlumnosService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  authService = inject(AuthService);

  estados = ['INSCRIPTO', 'INACTIVO', 'PREINSCRIPTO', 'TODOS'];
  estadoSeleccionado = '';
  searchTerm = '';
  todosAlumnos = signal<Alumno[]>([]);
  alumnos = signal<Alumno[]>([]);

  pageSizes = [10, 20, 50, 100];
  pageSize = signal(10);
  currentPage = signal(0);
  alumnosPaginados = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.alumnos().slice(start, start + this.pageSize());
  });
  totalPages = computed(() => Math.ceil(this.alumnos().length / this.pageSize()));

  ngOnInit() {
    this.estadoSeleccionado = this.alumnosService.ultimoEstado;
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
    this.alumnosService.ultimoEstado = this.estadoSeleccionado;
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
          a.nombres?.toLowerCase().includes(term) ||
          a.curso?.toLowerCase().includes(term)
        )
      );
    }
    this.currentPage.set(0);
  }

  onPageSizeChange() {
    this.currentPage.set(0);
  }

  paginaAnterior() {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
    }
  }

  paginaSiguiente() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
    }
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '-';
    const parts = fecha.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  nuevo() {
    this.router.navigate(['/gestion/alumnos/nuevo']);
  }

  ver(alumno: Alumno) {
    this.router.navigate(['/gestion/alumnos/ver', alumno.id]);
  }

  editar(alumno: Alumno) {
    this.router.navigate(['/gestion/alumnos/editar', alumno.id]);
  }

  eliminar(alumno: Alumno) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Dar de baja',
        mensaje: `¿Está seguro de dar de baja a ${alumno.apellidos}, ${alumno.nombres}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.alumnosService.darDeBaja(alumno.id).subscribe({
          next: () => this.cargarAlumnos()
        });
      }
    });
  }
}
