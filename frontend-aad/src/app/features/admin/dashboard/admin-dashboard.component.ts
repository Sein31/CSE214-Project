import { Component, OnInit, signal } from '@angular/core';
import { NgIf, DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NgIf, DecimalPipe, SidebarComponent, ChartComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <div class="header">
          <div>
            <h2>Admin Dashboard 👑</h2>
            <p class="subtitle">Platform geneli analitikler</p>
          </div>
        </div>

        <div *ngIf="stats()" class="content">
          <!-- KPI Cards -->
          <div class="grid-4">
            <div class="kpi-card">
              <div class="kpi-icon">👥</div>
              <div class="kpi-value">{{stats().totalUsers}}</div>
              <div class="kpi-label">Toplam Kullanıcı</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon">🏪</div>
              <div class="kpi-value">{{stats().openStores}}/{{stats().totalStores}}</div>
              <div class="kpi-label">Açık/Toplam Mağaza</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon">📦</div>
              <div class="kpi-value">{{stats().totalOrders | number}}</div>
              <div class="kpi-label">Toplam Sipariş</div>
            </div>
            <div class="kpi-card accent">
              <div class="kpi-icon">💰</div>
              <div class="kpi-value">{{stats().monthlyRevenue | number:'1.0-0'}} ₺</div>
              <div class="kpi-label">Aylık Gelir</div>
            </div>
          </div>

          <!-- Charts Row 1 -->
          <div class="grid-2">
            <!-- Kullanıcı dağılımı pie -->
            <app-chart
              type="pie"
              title="👥 Kullanıcı Rol Dağılımı"
              [labels]="userRoleLabels"
              [datasets]="userRoleDatasets">
            </app-chart>

            <!-- Haftalık vs aylık gelir bar -->
            <app-chart
              type="bar"
              title="💰 Gelir Karşılaştırması (₺)"
              [labels]="revenueLabels"
              [datasets]="revenueDatasets">
            </app-chart>
          </div>

          <!-- Charts Row 2 -->
          <div class="grid-2">
            <!-- Platform içerik bar -->
            <app-chart
              type="bar"
              title="📊 Platform İçerik Özeti"
              [labels]="contentLabels"
              [datasets]="contentDatasets">
            </app-chart>

            <!-- Üyelik dağılımı doughnut -->
            <app-chart
              *ngIf="membershipLabels.length"
              type="doughnut"
              title="🏅 Üyelik Tipi Dağılımı"
              [labels]="membershipLabels"
              [datasets]="membershipDatasets">
            </app-chart>
          </div>

          <!-- Tablolar -->
          <div class="grid-3">
            <div class="card center">
              <div class="big-num">{{stats().totalProducts}}</div>
              <div class="big-label">📦 Ürün</div>
            </div>
            <div class="card center">
              <div class="big-num">{{stats().totalReviews}}</div>
              <div class="big-label">⭐ Değerlendirme</div>
            </div>
            <div class="card center">
              <div class="big-num">{{stats().weeklyRevenue | number:'1.0-0'}} ₺</div>
              <div class="big-label">💵 Haftalık Gelir</div>
            </div>
          </div>
        </div>

        <div *ngIf="!stats()" class="loading">Yükleniyor...</div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; background:#0f1117; }
    .main { margin-left:240px; flex:1; padding:32px; color:#e2e8f0; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; }
    h2 { font-size:28px; font-weight:700; color:#fff; margin:0 0 4px; }
    .subtitle { color:#64748b; font-size:14px; margin:0; }
    .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
    .grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-bottom:24px; }
    .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
    .kpi-card { background:#161b2e; border:1px solid #1e2535; border-radius:12px; padding:24px; }
    .kpi-card.accent { background:linear-gradient(135deg,#1a2a4a,#1e3560); border-color:#2563eb; }
    .kpi-icon { font-size:28px; margin-bottom:12px; }
    .kpi-value { font-size:26px; font-weight:700; color:#fff; }
    .kpi-label { font-size:12px; color:#64748b; margin-top:4px; }
    .card { background:#161b2e; border:1px solid #1e2535; border-radius:12px; padding:24px; }
    .card.center { text-align:center; }
    .big-num { font-size:36px; font-weight:700; color:#fff; }
    .big-label { font-size:14px; color:#64748b; margin-top:8px; }
    .loading { text-align:center; color:#64748b; padding:48px; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats  = signal<any>(null);
  navItems: NavItem[] = [
    { label: 'Dashboard',    icon: '🏠', path: '/admin' },
    { label: 'Kullanıcılar', icon: '👥', path: '/admin/users' },
    { label: 'Mağazalar',    icon: '🏪', path: '/admin/stores' },
    { label: 'Kategoriler',  icon: '📂', path: '/admin/categories' },
    { label: 'AI Asistan',   icon: '🤖', path: '/chat' },
  ];

  // Chart data
  userRoleLabels: string[] = [];
  userRoleDatasets: any[] = [];

  revenueLabels: string[] = [];
  revenueDatasets: any[] = [];

  contentLabels: string[] = [];
  contentDatasets: any[] = [];

  membershipLabels: string[] = [];
  membershipDatasets: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.adminDashboard().subscribe((data: any) => {
      this.stats.set(data);
      this.buildCharts(data);
    });
  }

  private buildCharts(data: any) {
    // 1. Pie — Kullanıcı rol dağılımı
    this.userRoleLabels = ['Admin', 'Corporate', 'Individual'];
    this.userRoleDatasets = [{
      data: [data.adminCount || 0, data.corporateCount || 0, data.individualCount || 0],
      backgroundColor: ['rgba(167,139,250,0.8)', 'rgba(96,165,250,0.8)', 'rgba(74,222,128,0.8)'],
      borderColor:     ['#a78bfa', '#60a5fa', '#4ade80'],
      borderWidth: 2
    }];

    // 2. Bar — Gelir karşılaştırması
    this.revenueLabels = ['Haftalık Gelir', 'Aylık Gelir'];
    this.revenueDatasets = [{
      label: 'Gelir (₺)',
      data: [Number(data.weeklyRevenue) || 0, Number(data.monthlyRevenue) || 0],
      backgroundColor: ['rgba(34,197,94,0.7)', 'rgba(99,102,241,0.7)'],
      borderColor: ['#22c55e', '#6366f1'],
      borderWidth: 2,
      borderRadius: 8,
    }];

    // 3. Bar — Platform içerik
    this.contentLabels = ['Kullanıcılar', 'Mağazalar', 'Siparişler', 'Ürünler', 'Yorumlar'];
    this.contentDatasets = [{
      label: 'Adet',
      data: [
        data.totalUsers    || 0,
        data.totalStores   || 0,
        data.totalOrders   || 0,
        data.totalProducts || 0,
        data.totalReviews  || 0,
      ],
      backgroundColor: [
        'rgba(99,102,241,0.7)', 'rgba(34,197,94,0.7)', 'rgba(251,191,36,0.7)',
        'rgba(96,165,250,0.7)', 'rgba(239,68,68,0.7)'
      ],
      borderColor: ['#6366f1','#22c55e','#fbbf24','#60a5fa','#ef4444'],
      borderWidth: 2,
      borderRadius: 6,
    }];

    // 4. Doughnut — Üyelik tipleri
    if (data.membershipStats?.length) {
      this.membershipLabels = data.membershipStats.map((m: any) => m[0] || m.membershipType || 'N/A');
      this.membershipDatasets = [{
        data: data.membershipStats.map((m: any) => m[1] || m.count || 0),
        backgroundColor: [
          'rgba(251,191,36,0.8)', 'rgba(148,163,184,0.8)',
          'rgba(99,102,241,0.8)', 'rgba(34,197,94,0.8)'
        ],
        borderColor: ['#fbbf24','#94a3b8','#6366f1','#22c55e'],
        borderWidth: 2
      }];
    }
  }
}
