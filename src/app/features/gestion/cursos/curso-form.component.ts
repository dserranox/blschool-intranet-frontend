import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CursosService } from '../../../core/services/cursos.service';

@Component({
  selector: 'app-curso-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './curso-form.component.html',
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
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar el curso');
        this.loading.set(false);
      }
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const data = this.form.value;

    const request$ = this.esNuevo
      ? this.cursosService.crear(data)
      : this.cursosService.modificar(this.cursoId!, data);

    request$.subscribe({
      next: () => this.router.navigate(['/gestion/cursos']),
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
