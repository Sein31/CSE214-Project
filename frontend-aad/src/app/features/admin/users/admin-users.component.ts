import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';
import { HttpClient } from '@angular/common/http';

const ADMIN_NAV: NavItem[] = [
  { label:'Dashboard',    icon:'🏠', path:'/admin' },
  { label:'Kullanıcılar', icon:'👥', path:'/admin/users' },
  { label:'Mağazalar',    icon:'🏪', path:'/admin/stores' },
  { label:'Kategoriler',  icon:'📂', path:'/admin/categories' },
  { label:'Audit Logs',   icon:'📋', path:'/admin/logs' },
  { label:'AI Asistan',   icon:'🤖', path:'/chat' },
];

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, FormsModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <div class="ph">
          <div><h2>Kullanıcı Yönetimi 👥</h2><p class="sub">Tüm platform kullanıcıları</p></div>
          <div style="display:flex;gap:12px;align-items:center">
            <select [(ngModel)]="filterRole" (change)="load()" class="fsel">
              <option value="">Tüm Roller</option>
              <option value="ADMIN">Admin</option>
              <option value="CORPORATE">Corporate</option>
              <option value="INDIVIDUAL">Individual</option>
            </select>
            <input [(ngModel)]="searchQ" placeholder="E-posta ara..." class="sinp" (keyup.enter)="load()" />
          </div>
        </div>

        <div class="stats-row">
          <div class="sb"><div class="sv">{{stats.total}}</div><div class="sl">Toplam</div></div>
          <div class="sb purple"><div class="sv">{{stats.admins}}</div><div class="sl">Admin</div></div>
          <div class="sb blue"><div class="sv">{{stats.corporate}}</div><div class="sl">Corporate</div></div>
          <div class="sb green"><div class="sv">{{stats.individual}}</div><div class="sl">Individual</div></div>
        </div>

        <div class="card">
          <table class="tbl">
            <thead>
              <tr><th>ID</th><th>Ad Soyad</th><th>E-posta</th><th>Rol</th><th>Durum</th><th>Kayıt</th><th>İşlem</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of users()">
                <td class="tid">#{{u.id}}</td>
                <td class="tname">{{u.firstName}} {{u.lastName}}</td>
                <td class="temail">{{u.email}}</td>
                <td><span class="rbadge" [class]="'r-'+u.roleType?.toLowerCase()">{{u.roleType}}</span></td>
                <td><span class="abadge" [class]="u.isActive?'a-active':'a-inactive'">{{u.isActive?'Aktif':'Pasif'}}</span></td>
                <td class="tdate">{{u.createdAt | date:'dd.MM.yyyy'}}</td>
                <td>
                  <button (click)="toggleUser(u)" class="btn-act"
                          [class.danger]="u.isActive">
                    {{u.isActive ? '🚫 Askıya Al' : '✅ Aktifleştir'}}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="pagination">
            <button (click)="prevPage()" [disabled]="page===0">‹ Önceki</button>
            <span>Sayfa {{page+1}}</span>
            <button (click)="nextPage()">Sonraki ›</button>
          </div>
        </div>

        <div *ngIf="toast" class="toast">{{toast}}</div>
      </main>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh;background:#0a0e1a}
    .main{margin-left:240px;flex:1;padding:28px;color:#e2e8f0}
    .ph{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
    h2{font-size:26px;font-weight:700;color:#fff;margin:0 0 4px}
    .sub{color:#64748b;font-size:13px;margin:0}
    .fsel{padding:9px 14px;background:#161d30;border:1px solid #1e2a45;border-radius:10px;color:#e2e8f0;font-size:13px}
    .sinp{padding:9px 14px;background:#161d30;border:1px solid #1e2a45;border-radius:10px;color:#fff;font-size:13px;outline:none;width:200px}
    .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
    .sb{background:#161d30;border:1px solid #1e2a45;border-radius:12px;padding:18px;text-align:center}
    .sb.purple{border-color:#8b5cf633}.sb.blue{border-color:#3b82f633}.sb.green{border-color:#22c55e33}
    .sv{font-size:22px;font-weight:700;color:#fff;margin-bottom:4px}
    .sl{font-size:12px;color:#64748b}
    .card{background:#161d30;border:1px solid #1e2a45;border-radius:14px;padding:20px}
    .tbl{width:100%;border-collapse:collapse}
    .tbl th{text-align:left;padding:10px 12px;color:#64748b;font-size:11px;font-weight:700;border-bottom:1px solid #1e2a45;text-transform:uppercase}
    .tbl td{padding:12px;border-bottom:1px solid #1e2a4533;font-size:13px}
    .tid{color:#6366f1;font-family:monospace;font-size:12px}
    .tname{color:#fff;font-weight:500}
    .temail{color:#94a3b8;font-size:12px}
    .tdate{color:#64748b;font-size:12px}
    .rbadge{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
    .r-admin{background:rgba(139,92,246,.2);color:#a78bfa}
    .r-corporate{background:rgba(59,130,246,.2);color:#60a5fa}
    .r-individual{background:rgba(34,197,94,.2);color:#4ade80}
    .abadge{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
    .a-active{background:rgba(34,197,94,.15);color:#4ade80}
    .a-inactive{background:rgba(239,68,68,.15);color:#fc8181}
    .btn-act{padding:5px 12px;border:1px solid #2d3a55;border-radius:8px;background:#1e2a45;color:#94a3b8;cursor:pointer;font-size:12px}
    .btn-act.danger{border-color:#ef444433;color:#fc8181;background:rgba(239,68,68,.1)}
    .pagination{display:flex;justify-content:center;align-items:center;gap:16px;margin-top:20px}
    .pagination button{padding:7px 16px;background:#1e2a45;border:1px solid #2d3a55;border-radius:8px;color:#94a3b8;cursor:pointer}
    .pagination button:disabled{opacity:.4;cursor:not-allowed}
    .toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#1e2a45;color:#a78bfa;border:1px solid #6366f1;padding:12px 24px;border-radius:12px;font-weight:600;z-index:400}
  `]
})
export class AdminUsersComponent implements OnInit {
  users    = signal<any[]>([]);
  navItems = ADMIN_NAV;
  page     = 0; filterRole = ''; searchQ = ''; toast = '';
  stats    = {total:0, admins:0, corporate:0, individual:0};

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.allUsers(this.page, 20).subscribe((d:any) => {
      const content = d.content || d;
      this.users.set(content);
      this.stats.total      = d.totalElements || content.length;
      this.stats.admins     = content.filter((u:any)=>u.roleType==='ADMIN').length;
      this.stats.corporate  = content.filter((u:any)=>u.roleType==='CORPORATE').length;
      this.stats.individual = content.filter((u:any)=>u.roleType==='INDIVIDUAL').length;
    });
  }

  toggleUser(u:any) {
    this.api.toggleUserStatus(u.id, !u.isActive).subscribe(() => {
      u.isActive = !u.isActive;
      this.toast = u.isActive ? '✅ Kullanıcı aktifleştirildi' : '🚫 Kullanıcı askıya alındı';
      setTimeout(() => this.toast='', 2500);
    });
  }

  prevPage() { if(this.page>0){ this.page--; this.load(); } }
  nextPage() { this.page++; this.load(); }
}
