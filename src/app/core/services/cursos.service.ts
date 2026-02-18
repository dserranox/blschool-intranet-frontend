import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Curso {
  curId: number;
  curCodigo: string;
  curNombre: string;
  curDescripcion: string;
  comisionesActivas: string[];
}

@Injectable({ providedIn: 'root' })
export class CursosService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/cursos`;

  buscar(filtro?: string) {
    let params = new HttpParams();
    if (filtro && filtro.trim()) {
      params = params.set('filtro', filtro.trim());
    }
    return this.http.get<Curso[]>(this.endpoint, { params });
  }

  obtenerPorId(id: number) {
    return this.http.get<Curso>(`${this.endpoint}/${id}`);
  }

  crear(data: any) {
    return this.http.post<Curso>(this.endpoint, data);
  }

  modificar(id: number, data: any) {
    return this.http.put<Curso>(`${this.endpoint}/${id}`, data);
  }

  eliminar(id: number) {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
