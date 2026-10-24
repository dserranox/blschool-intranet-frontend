import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type TipoLogros = 'PARCIAL' | 'FINAL';
/** Planillas por logros: Parcial/Final de la comisión o una prueba (cursos Year/First) */
export type TipoPlanillaLogros = TipoLogros | 'PRUEBA';

export interface LogroEvaluacion { id: number; nombre: string; peso: number; orden: number; }

export interface FilaLogros {
  alumnoId: number; apellidos: string; nombres: string; editable: boolean;
  ausente: boolean; nota: number | null;
  /** id de logro -> aporte (claves string por JSON) */
  valores: Record<string, number>;
}

export interface PlanillaLogros {
  evaluacionId: number; tipo: TipoPlanillaLogros; nombre: string; comisionId: number; comision: string; curso: string; anio: number;
  /** true: admite Final Mark cargado a mano, excluyente con los logros (pruebas de Year/First) */
  notaManual: boolean;
  logros: LogroEvaluacion[]; alumnos: FilaLogros[];
}

export interface GuardarFilaLogros {
  alumnoId: number; ausente: boolean; valores: Record<number, number | null>;
  /** Final Mark manual (sólo si la planilla tiene notaManual) */
  nota?: number | null;
}

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
  /** Year/First: cada prueba se carga en su planilla de logros */
  porLogros: boolean;
  pruebas: Prueba[]; alumnos: FilaPruebas[];
}

export interface GuardarNotaPrueba { alumnoId: number; evaluacionId: number; nota: number | null; ausente: boolean; }

export interface ComisionCalificable { comId: number; anio: number; nombre: string; cursoNombre: string; }

export interface ResultadoLogro { nombre: string; peso: number; valor: number | null; }
export interface ResultadoEvaluacion { nota: number | null; ausente: boolean; logros: ResultadoLogro[]; }
export interface ResultadoPrueba {
  nombre: string; fecha: string; etapa: number; nota: number | null; ausente: boolean;
  /** detalle por logro (vacío si es nota única o Final Mark manual) */
  logros: ResultadoLogro[];
}

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

  planillaLogrosPrueba(pruebaId: number) {
    return this.http.get<PlanillaLogros>(`${this.endpoint}/pruebas/${pruebaId}/logros`);
  }

  guardarLogrosPrueba(pruebaId: number, filas: GuardarFilaLogros[]) {
    return this.http.put<PlanillaLogros>(`${this.endpoint}/pruebas/${pruebaId}/logros`, filas);
  }

  historial(alumnoId: number) {
    return this.http.get<CalificacionesComision[]>(`${environment.apiUrl}/alumnos/${alumnoId}/calificaciones`);
  }
}
