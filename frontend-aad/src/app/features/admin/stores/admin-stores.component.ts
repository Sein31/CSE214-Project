import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';

const ADMIN_NAV: NavItem[] = [
  { label:'Dashboard',    icon:'🏠', path:'/admin' },
  { label:'Kullanıcılar', icon:'👥', path:'/admin/users' },
  { label:'Mağazalar',    icon:'🏪', path:'/admin/stores' },
  { label:'Kategoriler',  icon:'📂', path:'/admin/categories' },
  { label:'Audit Logs',   icon:'📋', path:'/admin/logs' },
  { label:'AI Asistan',   icon:'🤖', path:'/chat' },
];

const STATUS_COLORS: Record<string,string> = {
  OPEN:'#22c55e', CLOSED:'#ef4444', PENDING:'#f59e0b', SUSPENDED:'#94a3b8'
};

@Component({
  selector: 'app-admin-stores',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, FormsModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <div class="ph">
          <div><h2>Mağaza Yönetimi 🏪</h2><p class="sub">Mağazaları onayla, aç/kapat</p></div>
          <select [(ngModel)]="filterStatus" (change)="load()" class="fsel">
            <option value="">Tüm Durumlar</option>
            <option value="OPEN">Açık</option>
            <option value="CLOSED">Kapalı</option>
            <option value="PENDING">Onay Bekliyor</option>
            <option value="SUSPENDED">Askıya Alınmış</option>
          </select>
        </div>

        <!-- Pending onay banner -->
        <div class="pending-banner" *ngIf="pendingCount>0">
          ⚠️ <strong>{{pendingCount}} mağaza</strong> onay bekliyor!
        </div>

        <div class="card">
          <table class="tbl">
            <thead>
              <tr><th>ID</th><th>Mağaza Adı</th><th>Sahibi</th><th>Şehir</th><th>Durum</th><th>Kayıt</th><th>İşlemler</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of stores()">
                <td class="tid">#{{s.id}}</td>
                <td class="tname">{{s.name}}</td>
                <td class="temail">{{s.owner?.firstName}} {{s.owner?.lastName}}</td>
                <td style="color:#94a3b8;font-size:13px">{{s.city}}</td>
                <td>
                  <span class="sbadge" [style.background]="getColor(s.status)+'22'"
                        [style.color]="getColor(s.status)">{{s.status}}</span>
                </td>
                <td style="color:#64748b;font-size:12px">{{s.createdAt | date:'dd.MM.yyyy'}}</td>
                <td>
                  <div style="display:flex;gap:6px">
                    <button *ngIf="s.status!=='OPEN'" (click)="setStatus(s,'OPEN')" class="btn-open">✅ Aç</button>
                    <button *ngIf="s.status==='OPEN'" (click)="setStatus(s,'CLOSED')" class="btn-close">🚫 Kapat</button>
                    <button *ngIf="s.status!=='SUSPENDED'" (click)="setStatus(s,'SUSPENDED')" class="btn-sus">⚠️ Askıya Al</button>
                  </div>
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
    .ph{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}
    h2{font-size:26px;font-weight:700;color:#fff;margin:0 0 4px}
    .sub{color:#64748b;font-size:13px;margin:0}
    .fsel{padding:9px 14px;background:#161d30;border:1px solid #1e2a45;border-radius:10px;color:#e2e8f0;font-size:13px}
    .pending-banner{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);color:#fbbf24;padding:12px 20px;border-radius:12px;margin-bottom:20px;font-size:14px}
    .card{background:#161d30;border:1px solid #1e2a45;border-radius:14px;padding:20px}
    .tbl{width:100%;border-collapse:collapse}
    .tbl th{text-align:left;padding:10px 12px;color:#64748b;font-size:11px;font-weight:700;border-bottom:1px solid #1e2a45;text-transform:uppercase}
    .tbl td{padding:12px;border-bottom:1px solid #1e2a4533;font-size:13px}
    .tid{color:#6366f1;font-family:monospace;font-size:12px}
    .tname{color:#fff;font-weight:600}
    .temail{color:#94a3b8;font-size:12px}
    .sbadge{padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700}
    .btn-open{padding:5px 10px;background:rgba(34,197,94,.1);color:#4ade80;border:1px solid rgba(34,197,94,.3);border-radius:7px;cursor:pointer;font-size:11px;font-weight:600}
    .btn-close{padding:5px 10px;background:rgba(239,68,68,.1);color:#fc8181;border:1px solid rgba(239,68,68,.3);border-radius:7px;cursor:pointer;font-size:11px;font-weight:600}
    .btn-sus{padding:5px 10px;background:rgba(245,158,11,.1);color:#fbbf24;border:1px solid rgba(245,158,11,.3);border-radius:7px;cursor:pointer;font-size:11px;font-weight:600}
    .pagination{display:flex;justify-content:center;align-items:center;gap:16px;margin-top:20px}
    .pagination button{padding:7px 16px;background:#1e2a45;border:1px solid #2d3a55;border-radius:8px;color:#94a3b8;cursor:pointer}
    .pagination button:disabled{opacity:.4;cursor:not-allowed}
    .toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#1e2a45;color:#a78bfa;border:1px solid #6366f1;padding:12px 24px;border-radius:12px;font-weight:600;z-index:400}
  `]
})
export class AdminStoresComponent implements OnInit {
  stores      = signal<any[]>([]);
  navItems    = ADMIN_NAV;
  page        = 0; filterStatus=''; toast='';
  pendingCount = 0;

  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }

  load() {
    this.api.allStores(this.page, 20).subscribe((d:any) => {
      const content = d.content || d;
      this.stores.set(content);
      this.pendingCount = content.filter((s:any)=>s.status==='PENDING').length;
    });
  }

  setStatus(s:any, status:string) {
    this.api.updateStoreStatus(s.id, status).subscribe(() => {
      s.status = status;
      this.toast = `Mağaza durumu: ${status}`;
      setTimeout(()=>this.toast='', 2500);
      this.pendingCount = this.stores().filter((s:any)=>s.status==='PENDING').length;
    });
  }

  getColor(s:string) { return STATUS_COLORS[s]||'#94a3b8'; }
  prevPage() { if(this.page>0){ this.page--; this.load(); } }
  nextPage() { this.page++; this.load(); }
}
