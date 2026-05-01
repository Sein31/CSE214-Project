import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

export interface NavItem { label: string; icon: string; path: string; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgFor, NgIf],
  template: `
    <aside class="sidebar">
      <!-- Logo -->
      <div class="logo">
        <div class="logo-icon">
          <span>DP</span>
        </div>
        <div class="logo-text">
          <div class="logo-name">DataPulse</div>
          <div class="logo-tagline">Analytics Platform</div>
        </div>
      </div>

      <!-- User badge -->
      <div class="user-badge">
        <div class="user-avatar">{{initials}}</div>
        <div class="user-details">
          <div class="user-name">{{auth.currentUser()?.firstName}} {{auth.currentUser()?.lastName}}</div>
          <div class="user-role">{{auth.currentUser()?.role}}</div>
          <div class="store-badge" *ngIf="auth.currentUser()?.storeName">
            🏪 {{auth.currentUser()?.storeName}}
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="nav">
        <a *ngFor="let item of items"
           [routerLink]="item.path"
           routerLinkActive="active"
           [routerLinkActiveOptions]="{exact: item.path.endsWith('admin') || item.path.endsWith('shop')}"
           class="nav-item">
          <span class="nav-icon">{{item.icon}}</span>
          <span class="nav-label">{{item.label}}</span>
          <span class="nav-indicator"></span>
        </a>
      </nav>

      <!-- Logout -->
      <button class="logout-btn" (click)="auth.logout()">
        <span>⏻</span> Çıkış Yap
      </button>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px; min-height: 100vh; background: var(--bg-card);
      border-right: 1px solid var(--border); display: flex;
      flex-direction: column; padding: 0; position: fixed; left: 0; top: 0;
      overflow-y: auto;
    }
    .logo {
      display: flex; align-items: center; gap: 12px;
      padding: 24px 20px; border-bottom: 1px solid var(--border);
    }
    .logo-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: var(--gradient); display: flex; align-items: center;
      justify-content: center; font-weight: 900; font-size: 13px;
      color: #000; letter-spacing: -.5px; flex-shrink: 0;
    }
    .logo-name { font-size: 16px; font-weight: 700; color: var(--text-1); }
    .logo-tagline { font-size: 11px; color: var(--text-3); margin-top: 1px; }
    .user-badge {
      display: flex; align-items: center; gap: 12px;
      margin: 16px 12px; padding: 12px 14px;
      background: var(--bg-elevated); border-radius: 12px;
      border: 1px solid var(--border);
    }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; color: #000;
    }
    .user-name { font-size: 13px; font-weight: 600; color: var(--text-1); }
    .user-role { font-size: 11px; color: var(--accent); font-weight: 500; margin-top: 2px; }
    .store-badge { font-size: 11px; color: #fbbf24; font-weight: 500; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
    .nav { flex: 1; padding: 8px 12px; display: flex; flex-direction: column; gap: 2px; }
    .nav-item {
      display: flex; align-items: center; gap: 12px; padding: 11px 14px;
      border-radius: 10px; color: var(--text-3); text-decoration: none;
      font-size: 13px; font-weight: 500; transition: all .15s; position: relative;
    }
    .nav-item:hover { background: var(--bg-elevated); color: var(--text-2); }
    .nav-item.active {
      background: linear-gradient(135deg, rgba(0,212,170,.12), rgba(0,150,255,.08));
      color: var(--accent); border: 1px solid rgba(0,212,170,.2);
    }
    .nav-icon { font-size: 17px; width: 22px; text-align: center; flex-shrink: 0; }
    .nav-label { flex: 1; }
    .nav-indicator {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--accent); opacity: 0; transition: opacity .15s;
    }
    .nav-item.active .nav-indicator { opacity: 1; }
    .logout-btn {
      margin: 12px; padding: 12px 14px; background: none;
      border: 1px solid var(--border); border-radius: 10px;
      color: var(--text-3); cursor: pointer; font-size: 13px;
      display: flex; align-items: center; gap: 10px; transition: all .15s;
    }
    .logout-btn:hover { border-color: var(--danger); color: var(--danger); background: rgba(255,82,82,.06); }
  `]
})
export class SidebarComponent {
  @Input() items: NavItem[] = [];
  constructor(public auth: AuthService) {}
  get initials() {
    const u = this.auth.currentUser();
    return u ? (u.firstName?.[0]||'') + (u.lastName?.[0]||'') : '?';
  }
}
