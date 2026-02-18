import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ComisionClase {
  id: number;
  dia: number;
  hora_desde: string;
  hora_hasta: string;
  docente: number | null;
  docente_suplente: number | null;
}

export interface Comision {
  comId: number;
  anio: number;
  nombre: string;
  cupo: number;
  activa: boolean;
  inscriptos: number;
  preInscriptos: number;
  curso_id: number;
  cursoNombre: string;
  clases: ComisionClase[];
}

@Injectable({ providedIn: 'root' })
export class ComisionesService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/comisiones`;

  obtenerAnios() {
    return this.http.get<number[]>(`${this.endpoint}/anios`);
  }

  buscarPorAnio(anio: number) {
    return this.http.get<Comision[]>(`${this.endpoint}/anio/${anio}`);
  }
}
