import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type TipoLogros = 'PARCIAL' | 'FINAL';

export interface LogroEvaluacion { id: number; nombre: string; peso: number; orden: number; }

export interface FilaLogros {
  alumnoId: number; apellidos: string; nombres: string; editable: boolean;
  ausente: boolean; nota: number | null;
  /** id de logro -> aporte (claves string por JSON) */
  valores: Record<string, number>;
}

export interface PlanillaLogros {
  evaluacionId: number; tipo: TipoLogros; comisionId: number; comision: string; curso: string; anio: number;
  logros: LogroEvaluacion[]; alumnos: FilaLogros[];
}

export interface GuardarFilaLogros { alumnoId: number; ausente: boolean; valores: Record<number, number | null>; }

export interface Prueba { id: number; nombre: string; fecha: string; etapa: number; }
export type DatosPrueba = Omit<Prueba, 'id'>;

export interface NotaPrueba { nota: number | null; ausente: boolean; }

export interface FilaPruebas {
  alumnoId: number; apellidos: string; nombres: string; editable: boolean;
  /** id de prueba -> nota (sólo las cargadas) */
  notas: Record<string, NotaPrueba>;
}

export interface PlanillaPruebas {
  comisionId: number; comision: string; curso: string; anio: number;
  pruebas: Prueba[]; alumnos: FilaPruebas[];
}

export interface GuardarNotaPrueba { alumnoId: number; evaluacionId: number; nota: number | null; ausente: boolean; }

export interface ComisionCalificable { comId: number; anio: number; nombre: string; cursoNombre: string; }

export interface ResultadoLogro { nombre: string; peso: number; valor: number | null; }
export interface ResultadoEvaluacion { nota: number | null; ausente: boolean; logros: ResultadoLogro[]; }
export interface ResultadoPrueba { nombre: string; fecha: string; etapa: number; nota: number | null; ausente: boolean; }

export interface CalificacionesComision {
  anio: number; comisionId: number; comision: string; curso: string;
  parcial: ResultadoEvaluacion | null; final: ResultadoEvaluacion | null; pruebas: ResultadoPrueba[];
}

@Injectable({ providedIn: 'root' })
export class CalificacionesService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/calificaciones`;

  comisiones(anio: number) {
    return this.http.get<ComisionCalificable[]>(`${this.endpoint}/comisiones`, { params: { anio: anio.toString() } });
  }

  planillaLogros(comisionId: number, tipo: TipoLogros) {
    return this.http.get<PlanillaLogros>(`${this.endpoint}/comision/${comisionId}/${tipo}`);
  }

  guardarLogros(comisionId: number, tipo: TipoLogros, filas: GuardarFilaLogros[]) {
    return this.http.put<PlanillaLogros>(`${this.endpoint}/comision/${comisionId}/${tipo}`, filas);
  }

  planillaPruebas(comisionId: number) {
    return this.http.get<PlanillaPruebas>(`${this.endpoint}/comision/${comisionId}/pruebas`);
  }

  crearPrueba(comisionId: number, datos: DatosPrueba) {
    return this.http.post<Prueba>(`${this.endpoint}/comision/${comisionId}/pruebas`, datos);
  }

  actualizarPrueba(pruebaId: number, datos: DatosPrueba) {
    return this.http.put<Prueba>(`${this.endpoint}/pruebas/${pruebaId}`, datos);
  }

  eliminarPrueba(pruebaId: number) {
    return this.http.delete<void>(`${this.endpoint}/pruebas/${pruebaId}`);
  }

  guardarPruebas(comisionId: number, notas: GuardarNotaPrueba[]) {
    return this.http.put<PlanillaPruebas>(`${this.endpoint}/comision/${comisionId}/pruebas`, notas);
  }

  historial(alumnoId: number) {
    return this.http.get<CalificacionesComision[]>(`${environment.apiUrl}/alumnos/${alumnoId}/calificaciones`);
  }
}
