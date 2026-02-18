import { Injectable, inject, signal, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Subscription, timer } from 'rxjs';

export interface LoginResponse {
  token: string;
  expiresAt: number;
  tokenType: string;
  username: string;
  authorities: string[];
}

export interface PerfilResponse {
  personaId: number;
  nombres: string;
  apellidos: string;
  email: string;
  username: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private zone = inject(NgZone);
  private logoutSub?: Subscription;

  private readonly AUTH_ENDPOINT = `${environment.loginApiUrl}/auth/login`;
  private readonly PERFIL_ENDPOINT = `${environment.apiUrl}/perfil`;

  isAuthenticated = signal(this.checkAuth());
  currentUser = signal(this.getStoredUsername());
  displayName = signal(this.getStoredDisplayName());
  roles = signal<string[]>(this.getStoredRoles());
  personaId = signal<number | null>(this.getStoredPersonaId());

  login(username: string, password: string) {
    return this.http.post<LoginResponse>(this.AUTH_ENDPOINT, { username, password });
  }

  persistSession(resp: LoginResponse, usernameFallback: string) {
    const token = resp.token;
    if (!token) throw new Error('No token in response');

    const username = resp.username || usernameFallback;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
      username,
      permissions: resp.authorities || []
    }));

    this.isAuthenticated.set(true);
    this.currentUser.set(username);
    this.scheduleAutoLogout(resp.expiresAt);
  }

  loadPerfil() {
    this.http.get<PerfilResponse>(this.PERFIL_ENDPOINT).subscribe({
      next: (perfil) => {
        const name = perfil.nombres ? `Miss ${perfil.nombres}` : this.currentUser();
        localStorage.setItem('displayName', name!);
        localStorage.setItem('roles', JSON.stringify(perfil.roles || []));
        if (perfil.personaId) {
          localStorage.setItem('personaId', String(perfil.personaId));
        }
        this.displayName.set(name);
        this.roles.set(perfil.roles || []);
        this.personaId.set(perfil.personaId || null);
      },
      error: () => {
        // Si falla, se queda con el username
        this.displayName.set(this.currentUser());
      }
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('displayName');
    localStorage.removeItem('roles');
    localStorage.removeItem('personaId');
    this.logoutSub?.unsubscribe();
    this.logoutSub = undefined;
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.displayName.set(null);
    this.roles.set([]);
    this.personaId.set(null);
    this.zone.run(() => this.router.navigate(['/login']));
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private checkAuth(): boolean {
    return !!localStorage.getItem('token');
  }

  private getStoredUsername(): string | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw).username;
    } catch {
      return null;
    }
  }

  private getStoredDisplayName(): string | null {
    return localStorage.getItem('displayName');
  }

  private getStoredRoles(): string[] {
    const raw = localStorage.getItem('roles');
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private getStoredPersonaId(): number | null {
    const raw = localStorage.getItem('personaId');
    return raw ? Number(raw) : null;
  }

  isAdmin(): boolean {
    return this.roles().includes('ADMIN');
  }

  private scheduleAutoLogout(expiresAtMs: number) {
    this.logoutSub?.unsubscribe();
    this.logoutSub = undefined;

    const remaining = Math.floor(expiresAtMs - Date.now());
    if (remaining <= 0) {
      this.logout();
      return;
    }

    const MAX_TIMEOUT = 2147483647;
    if (remaining > MAX_TIMEOUT) {
      this.logoutSub = timer(remaining - MAX_TIMEOUT).subscribe(() => {
        this.scheduleAutoLogout(expiresAtMs);
      });
    } else {
      this.logoutSub = timer(remaining).subscribe(() => {
        this.zone.run(() => this.logout());
      });
    }
  }
}
