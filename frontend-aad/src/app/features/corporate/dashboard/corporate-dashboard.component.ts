import { Component, OnInit, signal } from '@angular/core';
import { NgIf, DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';

@Component({
  selector: 'app-corporate-dashboard',
  standalone: true,
  imports: [NgIf, DecimalPipe, SidebarComponent, ChartComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <div class="header">
          <div>
            <h2>Mağaza Dashboard 🏪</h2>
            <p class="subtitle">Mağazanızın performans özeti</p>
          </div>
        </div>

        <div *ngIf="stats()" class="content">
          <!-- KPI Cards -->
          <div class="grid-4">
            <div class="kpi-card accent-green">
              <div class="kpi-icon">💰</div>
              <div class="kpi-value">{{stats().monthlyRevenue | number:'1.0-0'}} ₺</div>
              <div class="kpi-label">Aylık Gelir</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon">📦</div>
              <div class="kpi-value">{{stats().totalOrders}}</div>
              <div class="kpi-label">Toplam Sipariş</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon">⭐</div>
              <div class="kpi-value">{{stats().avgRating | number:'1.1-1'}}</div>
              <div class="kpi-label">Ortalama Puan</div>
            </div>
            <div class="kpi-card" [class.warning]="stats().lowStockCount > 0">
              <div class="kpi-icon">⚠️</div>
              <div class="kpi-value">{{stats().lowStockCount}}</div>
              <div class="kpi-label">Düşük Stok Ürün</div>
            </div>
          </div>

          <!-- Charts Row 1 -->
          <div class="grid-2" *ngIf="orderStatusLabels.length">
            <app-chart
              type="doughnut"
              title="📦 Sipariş Durumu Dağılımı"
              [labels]="orderStatusLabels"
              [datasets]="orderStatusDatasets">
            </app-chart>

            <app-chart
              type="bar"
              title="📊 Ürün & Sipariş Özeti"
              [labels]="summaryLabels"
              [datasets]="summaryDatasets">
            </app-chart>
          </div>

          <!-- Charts Row 2: Daily Revenue -->
          <div class="grid-1" *ngIf="dailyLabels.length">
            <app-chart
              type="line"
              title="📈 Son 30 Gün Günlük Satış (₺)"
              [labels]="dailyLabels"
              [datasets]="dailyDatasets">
            </app-chart>
          </div>

          <!-- Tables row -->
          <div class="grid-2">
            <div class="card">
              <h3>Sipariş Özeti</h3>
              <div class="dist-row">
                <span>Bekleyen</span>
                <span class="badge yellow">{{stats().pendingOrders}}</span>
              </div>
              <div class="dist-row">
                <span>Teslim Edilen</span>
                <span class="badge green">{{stats().deliveredOrders}}</span>
              </div>
              <div class="dist-row">
                <span>Kargodaki</span>
                <span class="badge blue">{{stats().shippedOrders}}</span>
              </div>
              <div class="dist-row">
                <span>Toplam Yorum</span>
                <span class="badge purple">{{stats().totalReviews}}</span>
              </div>
            </div>

            <div class="card">
              <h3>Genel Özet</h3>
              <div class="dist-row">
                <span>Toplam Sipariş</span>
                <span class="amount">{{stats().totalOrders}}</span>
              </div>
              <div class="dist-row">
                <span>Aktif Ürünler</span>
                <span class="amount">{{stats().totalProducts}}</span>
              </div>
              <div class="dist-row">
                <span>Aylık Gelir</span>
                <span class="amount">{{stats().monthlyRevenue | number:'1.0-0'}} ₺</span>
              </div>
              <div class="dist-row">
                <span>Toplam Gelir</span>
                <span class="amount">{{stats().totalRevenue | number:'1.0-0'}} ₺</span>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!stats()" class="loading">Yükleniyor...</div>
      </main>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh;background:#0f1117}
    .main{margin-left:240px;flex:1;padding:32px;color:#e2e8f0}
    .header{margin-bottom:32px}
    h2{font-size:28px;font-weight:700;color:#fff;margin:0 0 4px}
    .subtitle{color:#64748b;font-size:14px;margin:0}
    .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
    .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px}
    .grid-1{margin-bottom:24px}
    .kpi-card{background:#161b2e;border:1px solid #1e2535;border-radius:12px;padding:24px}
    .kpi-card.accent-green{background:linear-gradient(135deg,#0d2e1a,#0f3d22);border-color:#22c55e}
    .kpi-card.warning{border-color:#f59e0b}
    .kpi-icon{font-size:28px;margin-bottom:12px}
    .kpi-value{font-size:26px;font-weight:700;color:#fff}
    .kpi-label{font-size:12px;color:#64748b;margin-top:4px}
    .card{background:#161b2e;border:1px solid #1e2535;border-radius:12px;padding:24px}
    h3{font-size:16px;font-weight:600;color:#fff;margin:0 0 16px}
    .dist-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1e2535}
    .dist-row:last-child{border:none}
    .badge{padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600}
    .badge.yellow{background:rgba(251,191,36,.15);color:#fbbf24}
    .badge.green{background:rgba(74,222,128,.15);color:#4ade80}
    .badge.blue{background:rgba(96,165,250,.15);color:#60a5fa}
    .badge.purple{background:rgba(167,139,250,.15);color:#a78bfa}
    .amount{color:#4ade80;font-weight:600;font-size:14px}
    .loading{text-align:center;color:#64748b;padding:48px}
  `]
})
export class CorporateDashboardComponent implements OnInit {
  stats = signal<any>(null);
  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: '🏠', path: '/corporate/dashboard' },
    { label: 'Ürünler',    icon: '📦', path: '/corporate/products' },
    { label: 'Siparişler', icon: '🛒', path: '/corporate/orders' },
    { label: 'AI Asistan', icon: '🤖', path: '/chat' },
  ];

  // Chart data
  orderStatusLabels: string[] = [];
  orderStatusDatasets: any[] = [];

  summaryLabels: string[] = [];
  summaryDatasets: any[] = [];

  dailyLabels: string[] = [];
  dailyDatasets: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.myStore().subscribe((stores: any) => {
      if (stores?.length) {
        this.api.corporateDashboard(stores[0].id).subscribe((data: any) => {
          this.stats.set(data);
          this.buildCharts(data);
        });
      }
    });
  }

  private buildCharts(data: any) {
    // 1. Doughnut — Sipariş durumu
    this.orderStatusLabels = ['Bekleyen', 'Kargoda', 'Teslim Edildi'];
    this.orderStatusDatasets = [{
      data: [data.pendingOrders || 0, data.shippedOrders || 0, data.deliveredOrders || 0],
      backgroundColor: ['rgba(251,191,36,0.8)', 'rgba(96,165,250,0.8)', 'rgba(74,222,128,0.8)'],
      borderColor:     ['#fbbf24', '#60a5fa', '#4ade80'],
      borderWidth: 2
    }];

    // 2. Bar — Genel özet
    this.summaryLabels = ['Toplam Sipariş', 'Aktif Ürünler', 'Yorum Sayısı', 'Düşük Stok'];
    this.summaryDatasets = [{
      label: 'Değer',
      data: [data.totalOrders || 0, data.totalProducts || 0, data.totalReviews || 0, data.lowStockCount || 0],
      backgroundColor: [
        'rgba(99,102,241,0.7)', 'rgba(34,197,94,0.7)',
        'rgba(251,191,36,0.7)', 'rgba(239,68,68,0.7)'
      ],
      borderColor: ['#6366f1','#22c55e','#fbbf24','#ef4444'],
      borderWidth: 2,
      borderRadius: 6,
    }];

    // 3. Line — Günlük satış
    if (data.dailySales?.length) {
      this.dailyLabels = data.dailySales.map((d: any) =>
        new Date(d.date).toLocaleDateString('tr-TR', { month:'short', day:'numeric' })
      );
      this.dailyDatasets = [{
        label: 'Günlük Gelir (₺)',
        data: data.dailySales.map((d: any) => Number(d.revenue) || 0),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#22c55e',
        pointRadius: 3,
      }];
    }
  }
}
