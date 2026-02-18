import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = signal('');
  loading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.errorMessage.set('');
    this.loading.set(true);

    this.authService.login(this.username, this.password).subscribe({
      next: (resp) => {
        try {
          this.authService.persistSession(resp, this.username);
          this.authService.loadPerfil();
          this.router.navigate(['/dashboard']);
        } catch (e: any) {
          this.errorMessage.set(e?.message || 'Error de autenticación');
        }
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Usuario o contraseña incorrectos');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }
}
