import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocentesService, Docente } from '../../../core/services/docentes.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-docentes',
  imports: [CommonModule, FormsModule],
  templateUrl: './docentes.component.html',
  styleUrl: './docentes.component.css'
})
export class DocentesComponent implements OnInit {
  private docentesService = inject(DocentesService);
  private router = inject(Router);
  authService = inject(AuthService);

  searchTerm = '';
  docentes = signal<Docente[]>([]);
  filteredDocentes = signal<Docente[]>([]);

  ngOnInit() {
    this.cargarDocentes();
  }

  cargarDocentes() {
    this.docentesService.listar().subscribe({
      next: (data) => {
        this.docentes.set(data);
        this.filtrarDocentes();
      }
    });
  }

  filtrarDocentes() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredDocentes.set(this.docentes());
      return;
    }
    this.filteredDocentes.set(
      this.docentes().filter(d =>
        (d.nombres?.toLowerCase().includes(term)) ||
        (d.apellidos?.toLowerCase().includes(term))
      )
    );
  }

  puedeEditar(docente: Docente): boolean {
    if (this.authService.isAdmin()) return true;
    return docente.id === this.authService.personaId();
  }

  puedeEliminar(docente: Docente): boolean {
    return this.authService.isAdmin();
  }

  nuevo() {
    this.router.navigate(['/gestion/docentes/nuevo']);
  }

  ver(docente: Docente) {
    this.router.navigate(['/gestion/docentes/ver', docente.id]);
  }

  editar(docente: Docente) {
    this.router.navigate(['/gestion/docentes/editar', docente.id]);
  }

  desactivar(docente: Docente) {
    this.docentesService.desactivar(docente.id).subscribe({
      next: () => this.cargarDocentes()
    });
  }

  activar(docente: Docente) {
    this.docentesService.activar(docente.id).subscribe({
      next: () => this.cargarDocentes()
    });
  }
}
