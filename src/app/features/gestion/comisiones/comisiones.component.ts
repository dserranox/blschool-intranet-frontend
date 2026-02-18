import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComisionesService, Comision, ComisionClase } from '../../../core/services/comisiones.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-comisiones',
  imports: [CommonModule, FormsModule],
  templateUrl: './comisiones.component.html',
  styleUrl: './comisiones.component.css'
})
export class ComisionesComponent implements OnInit {
  private comisionesService = inject(ComisionesService);
  authService = inject(AuthService);

  anios = signal<number[]>([]);
  anioSeleccionado = 0;
  searchTerm = '';
  todasComisiones = signal<Comision[]>([]);
  comisiones = signal<Comision[]>([]);

  private diasSemana: Record<number, string> = {
    1: 'LUNES',
    2: 'MARTES',
    3: 'MIÉRCOLES',
    4: 'JUEVES',
    5: 'VIERNES',
    6: 'SÁBADO',
    7: 'DOMINGO'
  };

  ngOnInit() {
    this.comisionesService.obtenerAnios().subscribe({
      next: (anios) => {
        this.anios.set(anios);
        if (anios.length > 0) {
          this.anioSeleccionado = anios[anios.length - 1];
          this.cargarComisiones();
        }
      }
    });
  }

  cargarComisiones() {
    this.comisionesService.buscarPorAnio(this.anioSeleccionado).subscribe({
      next: (data) => {
        this.todasComisiones.set(data);
        this.filtrar();
      }
    });
  }

  onAnioChange() {
    this.searchTerm = '';
    this.cargarComisiones();
  }

  filtrar() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.comisiones.set(this.todasComisiones());
    } else {
      this.comisiones.set(
        this.todasComisiones().filter(c => c.cursoNombre.toLowerCase().includes(term))
      );
    }
  }

  formatClase(clase: ComisionClase): string {
    const dia = this.diasSemana[clase.dia] || `DÍA ${clase.dia}`;
    const desde = this.formatHora(clase.hora_desde);
    const hasta = this.formatHora(clase.hora_hasta);
    return `${dia} - ${desde} a ${hasta}`;
  }

  private formatHora(hora: string): string {
    if (!hora) return '';
    // hora viene como "HH:mm:ss" o "HH:mm"
    const parts = hora.split(':');
    return `${parts[0]}:${parts[1]}`;
  }

  nuevo() {
    // TODO
  }

  ver(comision: Comision) {
    // TODO
  }

  editar(comision: Comision) {
    // TODO
  }

  eliminar(comision: Comision) {
    // TODO
  }
}
