import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Preinscripcion {
  id: number;
  anio: number;
  estado: 'PENDIENTE' | 'ASIGNADA' | 'DESCARTADA';
  origen: string;
  fechaFormulario: string | null;
  escuelaCursoTurno: string | null;
  alumnoNuevo: boolean;
  alumnoId: number;
  apellidos: string;
  nombres: string;
  dni: string;
  alumnoEstado: string;
  comisionId: number | null;
  comision: string | null;
  curso: string | null;
  comisionAnterior: string | null;
  cursoAnterior: string | null;
}

@Injectable({ providedIn: 'root' })
export class PreinscripcionesService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/preinscripciones`;

  listar(anio: number, estado?: string) {
    const params: Record<string, string> = { anio: anio.toString() };
    if (estado && estado !== 'TODOS') {
      params['estado'] = estado;
    }
    return this.http.get<Preinscripcion[]>(this.endpoint, { params });
  }

  obtenerAnios() {
    return this.http.get<number[]>(`${this.endpoint}/anios`);
  }

  asignar(id: number, comisionId: number) {
    return this.http.put<Preinscripcion>(`${this.endpoint}/${id}/asignar`, null, {
      params: { comisionId: comisionId.toString() }
    });
  }

  descartar(id: number) {
    return this.http.put<Preinscripcion>(`${this.endpoint}/${id}/descartar`, {});
  }
}
