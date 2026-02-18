import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, MatIconModule, MatButtonModule, MatTooltipModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <header class="header">
          <div class="header-left">
            <h1>{{ pageTitle() }}</h1>
          </div>
          <div class="header-right">
            <span class="user-name">{{ authService.displayName() || authService.currentUser() }}</span>
            <button mat-icon-button matTooltip="Cerrar sesión" (click)="logout()" class="btn-logout">
              <mat-icon>exit_to_app</mat-icon>
            </button>
          </div>
        </header>
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      margin-left: 250px;
      background: #f5f6fa;
    }

    .header {
      background: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .header-left h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #2c3e50;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-name {
      color: #555;
      font-weight: 500;
    }

    .btn-logout {
      color: #dc3545;
    }

    .content {
      padding: 2rem;
    }
  `]
})
export class LayoutComponent {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  authService = inject(AuthService);

  private navigationEnd$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map(() => {
      let route = this.activatedRoute;
      while (route.firstChild) {
        route = route.firstChild;
      }
      return route.snapshot.data['title'] || 'BL School Intranet';
    })
  );

  private title = toSignal(this.navigationEnd$, { initialValue: 'BL School Intranet' });

  pageTitle = computed(() => this.title());

  logout() {
    this.authService.logout();
  }
}
