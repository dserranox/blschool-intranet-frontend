import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { Curso, CursosService, LogroCurso } from '../../../core/services/cursos.service';
import { formatNota, parseNota } from '../../../shared/notas.util';

@Component({
  selector: 'app-curso-form',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './curso-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './curso-form.component.css'
})
export class CursoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cursosService = inject(CursosService);

  form!: FormGroup;
  esNuevo = true;
  esVisualizacion = false;
  cursoId: number | null = null;
  loading = signal(false);
  errorMessage = signal('');
  authService = inject(AuthService);

  /** Logros en edición: el peso se edita como texto ("33,33"). */
  logros: { nombre: string; peso: string }[] = [];
  private logrosOriginales = '[]';
  private logrosNoCargados = false;
  otrosCursos = signal<Curso[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const modo = this.route.snapshot.data['modo'];

    if (id) {
      this.cursoId = Number(id);
      this.esNuevo = false;
      this.esVisualizacion = modo === 'ver';
    }

    this.buildForm();

    if (!this.esNuevo) {
      this.cargarCurso();
    }

    if (this.authService.isAdmin() && !this.esVisualizacion) {
      this.cursosService.buscar().subscribe({
        next: (cursos) => this.otrosCursos.set(cursos.filter(c => c.curId !== this.cursoId))
      });
    }
  }

  private buildForm() {
    this.form = this.fb.group({
      curCodigo: ['', Validators.required],
      curNombre: ['', Validators.required],
      curDescripcion: ['']
    });
  }

  private cargarCurso() {
    this.loading.set(true);
    this.cursosService.obtenerPorId(this.cursoId!).subscribe({
      next: (curso) => {
        this.form.patchValue({
          curCodigo: curso.curCodigo,
          curNombre: curso.curNombre,
          curDescripcion: curso.curDescripcion
        });
        if (this.esVisualizacion) {
          this.form.disable();
        }
        this.cursosService.obtenerLogros(this.cursoId!).subscribe({
          next: (logros) => {
            this.logros = logros.map(l => ({ nombre: l.nombre, peso: formatNota(l.peso) }));
            this.logrosOriginales = this.serializarLogros();
          },
          error: () => {
            this.errorMessage.set('No se pudieron cargar los logros del curso; no los modifiques hasta recargar');
            this.logrosNoCargados = true;
          }
        });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar el curso');
        this.loading.set(false);
      }
    });
  }

  agregarLogro() {
    this.logros.push({ nombre: '', peso: '' });
  }

  eliminarLogro(index: number) {
    this.logros.splice(index, 1);
  }

  moverLogro(index: number, delta: number) {
    const destino = index + delta;
    if (destino < 0 || destino >= this.logros.length) return;
    [this.logros[index], this.logros[destino]] = [this.logros[destino], this.logros[index]];
  }

  /** Copia los logros del curso elegido en el combo y lo vuelve a "Copiar logros de otro curso...". */
  copiarDesde(select: HTMLSelectElement) {
    const cursoId = Number(select.value);
    select.value = '';
    if (!cursoId) return;
    this.cursosService.obtenerLogros(cursoId).subscribe({
      next: (logros) => this.logros = logros.map(l => ({ nombre: l.nombre, peso: formatNota(l.peso) }))
    });
  }

  totalLogros(): number {
    return Math.round(this.logros.reduce((total, l) => total + (parseNota(l.peso) || 0), 0) * 100) / 100;
  }

  /** null si los logros son válidos (o no hay); si no, el motivo. */
  errorLogros(): string | null {
    if (this.logros.length === 0) return null;
    if (this.logros.some(l => !l.nombre.trim())) return 'Todos los logros necesitan nombre';
    if (this.logros.some(l => { const p = parseNota(l.peso); return p === null || Number.isNaN(p) || p <= 0 || p > 100; })) {
      return 'Cada peso debe ser mayor a 0 y hasta 100';
    }
    if (this.totalLogros() !== 100) return `Los pesos deben sumar 100 (suman ${formatNota(this.totalLogros())})`;
    return null;
  }

  formatNota(valor: number): string {
    return formatNota(valor);
  }

  private serializarLogros(): string {
    return JSON.stringify(this.logros.map(l => [l.nombre.trim(), parseNota(l.peso)]));
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const errorLogros = this.authService.isAdmin() ? this.errorLogros() : null;
    if (errorLogros) {
      this.errorMessage.set(errorLogros);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const data = this.form.value;
    const request$ = this.esNuevo
      ? this.cursosService.crear(data)
      : this.cursosService.modificar(this.cursoId!, data);

    request$.subscribe({
      next: (curso) => {
        if (this.esNuevo) {
          this.esNuevo = false;
          this.cursoId = curso.curId;
        }
        const logrosCambiaron = !this.logrosNoCargados && this.serializarLogros() !== this.logrosOriginales;
        if (!this.authService.isAdmin() || !logrosCambiaron) {
          this.router.navigate(['/gestion/cursos']);
          return;
        }
        const logros: LogroCurso[] = this.logros.map(l => ({ nombre: l.nombre.trim(), peso: parseNota(l.peso)! }));
        this.cursosService.guardarLogros(curso.curId, logros).subscribe({
          next: () => this.router.navigate(['/gestion/cursos']),
          error: (err: any) => {
            this.errorMessage.set(err?.error?.message || 'El curso se guardó, pero no los logros');
            this.loading.set(false);
          }
        });
      },
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Error al guardar el curso');
        this.loading.set(false);
      }
    });
  }

  volver() {
    this.router.navigate(['/gestion/cursos']);
  }
}
