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
  docente_nombre: string | null;
  docente_suplente_nombre: string | null;
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

export interface ComisionActiva {
  comId: number;
  nombre: string;
  cursoNombre: string;
}

@Injectable({ providedIn: 'root' })
export class ComisionesService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/comisiones`;

  listarActivas() {
    return this.http.get<ComisionActiva[]>(`${this.endpoint}/activas`);
  }

  obtenerAnios() {
    return this.http.get<number[]>(`${this.endpoint}/anios`);
  }

  buscarPorAnio(anio: number) {
    return this.http.get<Comision[]>(`${this.endpoint}/anio/${anio}`);
  }

  obtenerPorId(id: number) {
    return this.http.get<Comision>(`${this.endpoint}/${id}`);
  }

  crear(data: any) {
    return this.http.post<Comision>(this.endpoint, data);
  }

  modificar(id: number, data: any) {
    return this.http.put<Comision>(`${this.endpoint}/${id}`, data);
  }

  activar(id: number) {
    return this.http.patch<void>(`${this.endpoint}/${id}/activar`, {});
  }

  desactivar(id: number) {
    return this.http.patch<void>(`${this.endpoint}/${id}/desactivar`, {});
  }

  duplicar(anioDesde: number, anioHasta: number) {
    return this.http.post<void>(`${this.endpoint}/duplicar`, null, {
      params: { anioDesde: anioDesde.toString(), anioHasta: anioHasta.toString() }
    });
  }
}
