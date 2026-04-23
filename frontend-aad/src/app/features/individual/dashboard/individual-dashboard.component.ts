import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';

const IND_NAV: NavItem[] = [
  { label:'Mağaza',       icon:'🛍️', path:'/shop' },
  { label:'Siparişlerim', icon:'📋', path:'/shop/orders' },
  { label:'Dashboard',    icon:'📊', path:'/shop/dashboard' },
  { label:'AI Asistan',   icon:'🤖', path:'/chat' },
];

@Component({
  selector: 'app-individual-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, FormsModule, SidebarComponent, ChartComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <h2>Profilim & Analitikler 📊</h2>

        <!-- Profil kartı -->
        <div class="profile-card" *ngIf="stats()">
          <div class="avatar-big">{{initials}}</div>
          <div class="profile-info">
            <div class="profile-name">{{user?.firstName}} {{user?.lastName}}</div>
            <div class="profile-email">{{user?.email}}</div>
            <div class="membership-badge" [class]="'mb-'+(stats().profile?.membershipType||'BRONZE').toLowerCase()">
              🏅 {{stats().profile?.membershipType || 'BRONZE'}} Üye
            </div>
          </div>
          <div class="profile-stats">
            <div class="ps-item">
              <div class="ps-val">{{stats().totalOrders}}</div>
              <div class="ps-lbl">Toplam Sipariş</div>
            </div>
            <div class="ps-item">
              <div class="ps-val">{{stats().totalReviews}}</div>
              <div class="ps-lbl">Değerlendirme</div>
            </div>
            <div class="ps-item">
              <div class="ps-val">{{stats().profile?.avgRating || '4.5'}}</div>
              <div class="ps-lbl">Ort. Puan</div>
            </div>
          </div>
        </div>

        <!-- Analytics Cards -->
        <div class="section-title">💰 Harcama Analitikleri</div>
        <div *ngIf="stats()" class="analytics-grid">
          <div class="ana-card">
            <div class="ana-icon">💸</div>
            <div class="ana-val">{{stats().profile?.totalSpend | number:'1.0-0'}} ₺</div>
            <div class="ana-lbl">Toplam Harcama</div>
          </div>
          <div class="ana-card">
            <div class="ana-icon">🛍️</div>
            <div class="ana-val">{{stats().profile?.itemsPurchased}}</div>
            <div class="ana-lbl">Satın Alınan Ürün</div>
          </div>
          <div class="ana-card">
            <div class="ana-icon">🏙️</div>
            <div class="ana-val">{{stats().profile?.city || 'N/A'}}</div>
            <div class="ana-lbl">Şehir</div>
          </div>
          <div class="ana-card">
            <div class="ana-icon">😊</div>
            <div class="ana-val">{{stats().profile?.satisfactionLevel || 'HIGH'}}</div>
            <div class="ana-lbl">Memnuniyet</div>
          </div>
        </div>

        <!-- Charts -->
        <div class="section-title">📊 Sipariş Analizi</div>
        <div class="grid-2" *ngIf="stats()">
          <!-- Sipariş durumu doughnut -->
          <app-chart
            type="doughnut"
            title="🚚 Sipariş Durumu"
            [labels]="orderStatusLabels"
            [datasets]="orderStatusDatasets">
          </app-chart>

          <!-- Harcama bar -->
          <app-chart
            type="bar"
            title="💰 Harcama & Sipariş Özeti"
            [labels]="spendingLabels"
            [datasets]="spendingDatasets">
          </app-chart>
        </div>

        <!-- Profil düzenleme -->
        <div class="section-title">⚙️ Profil Yönetimi</div>
        <div class="pref-card">
          <div class="pref-row">
            <label>Ad</label>
            <input [(ngModel)]="editFirst" class="pref-input" />
          </div>
          <div class="pref-row">
            <label>Soyad</label>
            <input [(ngModel)]="editLast" class="pref-input" />
          </div>
          <div class="pref-row">
            <label>E-posta</label>
            <input [(ngModel)]="editEmail" class="pref-input" disabled />
          </div>
          <div class="pref-row">
            <label>Şehir</label>
            <input [(ngModel)]="editCity" class="pref-input" />
          </div>
          <button class="btn-save" (click)="saveProfile()">💾 Değişiklikleri Kaydet</button>
        </div>

        <!-- Bildirim tercihleri -->
        <div class="section-title">🔔 Tercihler</div>
        <div class="pref-card">
          <div class="pref-toggle" *ngFor="let pref of preferences">
            <div>
              <div class="pref-name">{{pref.name}}</div>
              <div class="pref-desc">{{pref.desc}}</div>
            </div>
            <div class="toggle" [class.on]="pref.enabled" (click)="pref.enabled=!pref.enabled">
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>

        <!-- Toast -->
        <div *ngIf="toastMsg" class="toast">{{toastMsg}}</div>
      </main>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh;background:#0a0e1a}
    .main{margin-left:240px;flex:1;padding:28px;color:#e2e8f0}
    h2{font-size:26px;font-weight:700;color:#fff;margin:0 0 24px}
    .profile-card{background:linear-gradient(135deg,#161d30,#1a1040);border:1px solid #2d3a55;border-radius:20px;padding:28px;display:flex;align-items:center;gap:24px;margin-bottom:28px}
    .avatar-big{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;flex-shrink:0}
    .profile-info{flex:1}
    .profile-name{font-size:22px;font-weight:700;color:#fff;margin-bottom:4px}
    .profile-email{font-size:14px;color:#64748b;margin-bottom:10px}
    .membership-badge{display:inline-block;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700}
    .mb-bronze{background:rgba(180,83,9,.2);color:#fb923c;border:1px solid rgba(180,83,9,.3)}
    .mb-silver{background:rgba(100,116,139,.2);color:#94a3b8;border:1px solid rgba(100,116,139,.3)}
    .mb-gold{background:rgba(234,179,8,.2);color:#fbbf24;border:1px solid rgba(234,179,8,.3)}
    .mb-platinum{background:rgba(99,102,241,.2);color:#a78bfa;border:1px solid rgba(99,102,241,.3)}
    .profile-stats{display:flex;gap:28px}
    .ps-item{text-align:center}
    .ps-val{font-size:22px;font-weight:700;color:#fff}
    .ps-lbl{font-size:12px;color:#64748b;margin-top:4px}
    .section-title{font-size:16px;font-weight:700;color:#fff;margin:0 0 16px;padding-bottom:8px;border-bottom:1px solid #1e2a45}
    .analytics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
    .ana-card{background:#161d30;border:1px solid #1e2a45;border-radius:14px;padding:20px;text-align:center}
    .ana-icon{font-size:28px;margin-bottom:10px}
    .ana-val{font-size:20px;font-weight:700;color:#fff;margin-bottom:4px}
    .ana-lbl{font-size:12px;color:#64748b}
    .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:28px}
    .pref-card{background:#161d30;border:1px solid #1e2a45;border-radius:14px;padding:24px;margin-bottom:28px}
    .pref-row{display:flex;align-items:center;gap:16px;margin-bottom:14px}
    .pref-row label{width:80px;font-size:13px;color:#94a3b8;font-weight:500}
    .pref-input{flex:1;padding:10px 14px;background:#0f1420;border:1px solid #1e2a45;border-radius:10px;color:#fff;font-size:13px;outline:none}
    .pref-input:disabled{opacity:.5;cursor:not-allowed}
    .pref-input:focus{border-color:#6366f1}
    .btn-save{margin-top:8px;padding:11px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:14px}
    .pref-toggle{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid #1e2a45}
    .pref-toggle:last-child{border:none}
    .pref-name{font-size:14px;color:#e2e8f0;font-weight:500;margin-bottom:3px}
    .pref-desc{font-size:12px;color:#64748b}
    .toggle{width:44px;height:24px;border-radius:12px;background:#1e2a45;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
    .toggle.on{background:#6366f1}
    .toggle-knob{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s}
    .toggle.on .toggle-knob{transform:translateX(20px)}
    .toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#1e2a45;color:#a78bfa;border:1px solid #6366f1;padding:12px 24px;border-radius:12px;font-weight:600;z-index:400}
  `]
})
export class IndividualDashboardComponent implements OnInit {
  stats    = signal<any>(null);
  navItems = IND_NAV;
  user: any = null;
  toastMsg = '';
  editFirst=''; editLast=''; editEmail=''; editCity='';

  // Chart data
  orderStatusLabels: string[] = [];
  orderStatusDatasets: any[] = [];
  spendingLabels: string[] = [];
  spendingDatasets: any[] = [];

  preferences = [
    {name:'E-posta Bildirimleri',       desc:'Sipariş güncellemelerini e-posta ile al', enabled:true},
    {name:'Kargo Bildirimleri',          desc:'Kargo durumu değişince bildir',           enabled:true},
    {name:'İndirim Bildirimleri',        desc:'Özel teklifler ve indirimler',            enabled:false},
    {name:'Haftalık Özet',              desc:'Harcama özetini haftalık al',             enabled:false},
  ];

  get initials() {
    return this.user ? (this.user.firstName?.[0]||'')+(this.user.lastName?.[0]||'') : '?';
  }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.me().subscribe((u:any) => {
      this.user = u;
      this.editFirst = u.firstName||'';
      this.editLast  = u.lastName||'';
      this.editEmail = u.email||'';
      this.editCity  = u.profile?.city||'';
    });
    this.api.individualDashboard().subscribe((d: any) => {
      this.stats.set(d);
      this.buildCharts(d);
    });
  }

  private buildCharts(data: any) {
    // 1. Doughnut — Sipariş durumu
    this.orderStatusLabels = ['Teslim Edildi', 'Bekleyen', 'Diğer'];
    const delivered = data.deliveredOrders || 0;
    const pending   = data.pendingOrders   || 0;
    const other     = Math.max(0, (data.totalOrders || 0) - delivered - pending);
    this.orderStatusDatasets = [{
      data: [delivered, pending, other],
      backgroundColor: ['rgba(74,222,128,0.8)', 'rgba(251,191,36,0.8)', 'rgba(96,165,250,0.8)'],
      borderColor:     ['#4ade80', '#fbbf24', '#60a5fa'],
      borderWidth: 2
    }];

    // 2. Bar — Harcama özeti
    this.spendingLabels = ['Toplam Sipariş', 'Teslim Edildi', 'Bekleyen', 'Yorum Sayısı'];
    this.spendingDatasets = [{
      label: 'Adet',
      data: [
        data.totalOrders    || 0,
        data.deliveredOrders || 0,
        data.pendingOrders  || 0,
        data.totalReviews   || 0,
      ],
      backgroundColor: [
        'rgba(99,102,241,0.7)', 'rgba(74,222,128,0.7)',
        'rgba(251,191,36,0.7)', 'rgba(167,139,250,0.7)'
      ],
      borderColor: ['#6366f1','#4ade80','#fbbf24','#a78bfa'],
      borderWidth: 2,
      borderRadius: 6,
    }];
  }

  saveProfile() {
    this.toastMsg = '✅ Profil güncellendi!';
    setTimeout(() => this.toastMsg='', 2500);
  }
}
