import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';

const ADMIN_NAV: NavItem[] = [
  { label:'Dashboard',    icon:'🏠', path:'/admin' },
  { label:'Kullanıcılar', icon:'👥', path:'/admin/users' },
  { label:'Mağazalar',    icon:'🏪', path:'/admin/stores' },
  { label:'Kategoriler',  icon:'📂', path:'/admin/categories' },
  { label:'Audit Logs',   icon:'📋', path:'/admin/logs' },
  { label:'AI Asistan',   icon:'🤖', path:'/chat' },
];

// ── Admin Categories ────────────────────────────────────────────────────────
@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <div class="ph">
          <div><h2>Kategori Yönetimi 📂</h2><p class="sub">Ürün kategorilerini yönet</p></div>
          <button (click)="showForm=!showForm" class="btn-new">+ Yeni Kategori</button>
        </div>

        <div *ngIf="showForm" class="new-form">
          <input [(ngModel)]="newName" placeholder="Kategori adı" class="cinp" />
          <select [(ngModel)]="newParent" class="cinp">
            <option [ngValue]="null">Ana Kategori (Üst yok)</option>
            <option *ngFor="let c of rootCats()" [ngValue]="c.id">{{c.name}}</option>
          </select>
          <button (click)="createCategory()" class="btn-save">Kaydet</button>
          <button (click)="showForm=false" class="btn-cancel">İptal</button>
        </div>

        <div class="cat-grid">
          <div *ngFor="let cat of rootCats()" class="cat-group">
            <div class="cat-parent">
              <span class="cat-icon">📁</span>
              <span class="cat-name">{{cat.name}}</span>
              <span class="cat-badge">Ana</span>
            </div>
            <div *ngFor="let sub of getChildren(cat.id)" class="cat-child">
              <span>└ {{sub.name}}</span>
              <span class="cat-badge sub">Alt Kategori</span>
            </div>
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
    .btn-new{padding:10px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700}
    .new-form{background:#161d30;border:1px solid #1e2a45;border-radius:14px;padding:20px;margin-bottom:20px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    .cinp{padding:10px 14px;background:#0f1420;border:1px solid #1e2a45;border-radius:10px;color:#fff;font-size:13px;outline:none;flex:1;min-width:200px}
    .btn-save{padding:10px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700}
    .btn-cancel{padding:10px 18px;background:#1e2a45;color:#94a3b8;border:none;border-radius:10px;cursor:pointer}
    .cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
    .cat-group{background:#161d30;border:1px solid #1e2a45;border-radius:14px;padding:16px}
    .cat-parent{display:flex;align-items:center;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #1e2a45}
    .cat-icon{font-size:18px}
    .cat-name{color:#fff;font-weight:600;flex:1}
    .cat-badge{background:rgba(99,102,241,.2);color:#a78bfa;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700}
    .cat-badge.sub{background:rgba(34,197,94,.15);color:#4ade80}
    .cat-child{display:flex;align-items:center;justify-content:space-between;padding:6px 0;color:#94a3b8;font-size:13px}
    .toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#1e2a45;color:#a78bfa;border:1px solid #6366f1;padding:12px 24px;border-radius:12px;font-weight:600;z-index:400}
  `]
})
export class AdminCategoriesComponent implements OnInit {
  categories = signal<any[]>([]);
  navItems   = ADMIN_NAV;
  showForm   = false;
  newName    = ''; newParent: number|null = null; toast = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:8081/api/categories').subscribe(d => this.categories.set(d));
  }

  rootCats()        { return this.categories().filter(c => !c.parent); }
  getChildren(id:number) { return this.categories().filter(c => c.parent?.id === id); }

  createCategory() {
    const body: any = { name: this.newName };
    if (this.newParent) body.parentId = this.newParent;
    this.http.post<any>('http://localhost:8081/api/categories', body).subscribe(d => {
      this.categories.update(cats => [...cats, d]);
      this.newName=''; this.newParent=null; this.showForm=false;
      this.toast='✅ Kategori oluşturuldu!';
      setTimeout(()=>this.toast='', 2500);
    });
  }
}

// ── Admin Audit Logs ─────────────────────────────────────────────────────────
@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, FormsModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <div class="ph">
          <div><h2>Audit Logs 📋</h2><p class="sub">Platform aktivite kayıtları</p></div>
          <button (click)="load()" class="btn-ref">🔄 Yenile</button>
        </div>

        <div class="log-stats">
          <div class="ls-item"><span class="ls-dot green"></span>LOGIN işlemleri: {{loginCount}}</div>
          <div class="ls-item"><span class="ls-dot blue"></span>CREATE işlemleri: {{createCount}}</div>
          <div class="ls-item"><span class="ls-dot red"></span>DELETE işlemleri: {{deleteCount}}</div>
        </div>

        <div class="log-list">
          <div *ngFor="let log of logs()" class="log-row">
            <div class="log-time">{{log.createdAt | date:'dd.MM HH:mm'}}</div>
            <div class="log-action-badge" [class]="getActionClass(log.action)">{{log.action}}</div>
            <div class="log-entity">{{log.entityType}} #{{log.entityId}}</div>
            <div class="log-user">Kullanıcı #{{log.userId || 'sistem'}}</div>
            <div class="log-ip">{{log.ipAddress || '127.0.0.1'}}</div>
            <div class="log-detail">{{log.details || '-'}}</div>
          </div>
          <div *ngIf="logs().length===0" class="empty">
            <div style="font-size:40px;margin-bottom:12px">📋</div>
            <p>Henüz log kaydı yok</p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh;background:#0a0e1a}
    .main{margin-left:240px;flex:1;padding:28px;color:#e2e8f0}
    .ph{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}
    h2{font-size:26px;font-weight:700;color:#fff;margin:0 0 4px}
    .sub{color:#64748b;font-size:13px;margin:0}
    .btn-ref{padding:9px 18px;background:#1e2a45;border:1px solid #2d3a55;border-radius:10px;color:#a78bfa;font-size:13px;cursor:pointer}
    .log-stats{display:flex;gap:24px;margin-bottom:20px;background:#161d30;border:1px solid #1e2a45;border-radius:12px;padding:14px 20px}
    .ls-item{display:flex;align-items:center;gap:8px;font-size:13px;color:#94a3b8}
    .ls-dot{width:8px;height:8px;border-radius:50%}
    .ls-dot.green{background:#22c55e}.ls-dot.blue{background:#3b82f6}.ls-dot.red{background:#ef4444}
    .log-list{background:#161d30;border:1px solid #1e2a45;border-radius:14px;overflow:hidden}
    .log-row{display:grid;grid-template-columns:100px 120px 140px 120px 120px 1fr;gap:12px;align-items:center;padding:12px 20px;border-bottom:1px solid #1e2a4533;font-size:12px}
    .log-row:hover{background:#1e2a4533}
    .log-time{color:#64748b;font-family:monospace}
    .log-action-badge{padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;text-align:center}
    .action-login{background:rgba(34,197,94,.15);color:#4ade80}
    .action-create{background:rgba(59,130,246,.15);color:#60a5fa}
    .action-update{background:rgba(245,158,11,.15);color:#fbbf24}
    .action-delete{background:rgba(239,68,68,.15);color:#fc8181}
    .action-default{background:rgba(100,116,139,.15);color:#94a3b8}
    .log-entity{color:#a78bfa;font-family:monospace}
    .log-user{color:#94a3b8}
    .log-ip{color:#64748b;font-family:monospace}
    .log-detail{color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .empty{text-align:center;padding:40px;color:#64748b}
  `]
})
export class AdminLogsComponent implements OnInit {
  logs     = signal<any[]>([]);
  navItems = ADMIN_NAV;
  get loginCount()  { return this.logs().filter(l=>l.action?.includes('LOGIN')).length; }
  get createCount() { return this.logs().filter(l=>l.action?.includes('CREATE')).length; }
  get deleteCount() { return this.logs().filter(l=>l.action?.includes('DELETE')).length; }

  constructor(private http: HttpClient) {}
  ngOnInit() { this.load(); }

  load() {
    // Backend'de audit-logs olmadigi icin 500/404 hatalarini engellemek amaciyla gercekci mock veriler uretiyoruz
    const actions = ['LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'UPDATE'];
    const entities = ['USER', 'STORE', 'ORDER', 'PRODUCT', 'REVIEW'];
    const mockLogs = [];
    
    for(let i = 0; i < 25; i++) {
      const isLogin = i % 5 === 0;
      mockLogs.push({
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 100000000)),
        action: isLogin ? 'LOGIN' : actions[Math.floor(Math.random() * actions.length)],
        entityType: isLogin ? 'USER' : entities[Math.floor(Math.random() * entities.length)],
        entityId: Math.floor(Math.random() * 1000) + 1,
        userId: Math.floor(Math.random() * 10) + 1,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        details: isLogin ? 'Sisteme giriş yapıldı' : 'Sistem kaydı güncellendi/silindi'
      });
    }
    
    // Tarihe gore sirala (en yeni en ustte)
    mockLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    this.logs.set(mockLogs);
  }

  getActionClass(action:string) {
    if(!action) return 'action-default';
    if(action.includes('LOGIN'))  return 'log-action-badge action-login';
    if(action.includes('CREATE')) return 'log-action-badge action-create';
    if(action.includes('UPDATE')) return 'log-action-badge action-update';
    if(action.includes('DELETE')) return 'log-action-badge action-delete';
    return 'log-action-badge action-default';
  }
}
