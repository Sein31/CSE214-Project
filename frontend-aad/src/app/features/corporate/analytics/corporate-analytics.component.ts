import { Component, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-corporate-analytics',
  standalone: true,
  imports: [NgIf, SidebarComponent, ChartComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <h2>📈 Detaylı Analitik</h2>
        <p class="sub">Mağazanızın günlük gelirleri ve kategori bazlı satış analizleri.</p>
        
        <div class="content" *ngIf="loaded()">
          <div class="grid-2">
            <!-- Günlük Gelir Line Chart -->
            <app-chart
              type="line"
              title="Son 30 Günlük Gelir"
              [labels]="dailyLabels"
              [datasets]="dailyDatasets">
            </app-chart>

            <!-- Kategori Satış Doughnut Chart -->
            <app-chart
              type="doughnut"
              title="Kategori Bazlı Satış (Adet)"
              [labels]="categoryLabels"
              [datasets]="categoryDatasets">
            </app-chart>
          </div>
        </div>
        
        <div *ngIf="!loaded()" class="loading">Veriler Yükleniyor...</div>
      </main>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh;background:#0f1117}
    .main{margin-left:240px;flex:1;padding:32px;color:#e2e8f0}
    h2{font-size:28px;font-weight:700;color:#fff;margin:0 0 4px}
    .sub{color:#64748b;font-size:14px;margin:0 0 24px}
    .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:24px}
    .loading{text-align:center;padding:48px;color:#64748b}
  `]
})
export class CorporateAnalyticsComponent implements OnInit {
  loaded = signal<boolean>(false);
  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: '🏠', path: '/corporate/dashboard' },
    { label: 'AI Asistan', icon: '🤖', path: '/chat' },
    { label: 'Analitik',   icon: '📈', path: '/corporate/analytics' },
    { label: 'Siparişler', icon: '🛒', path: '/corporate/orders' },
    { label: 'Ürünler',    icon: '📦', path: '/corporate/products' },
    { label: 'Müşteriler', icon: '👥', path: '/corporate/customers' },
    { label: 'Kargo',      icon: '🚚', path: '/corporate/shipments' },
    { label: 'Yorumlar',   icon: '⭐', path: '/corporate/reviews' },
  ];

  dailyLabels: string[] = [];
  dailyDatasets: any[] = [];

  categoryLabels: string[] = [];
  categoryDatasets: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.myStore().subscribe((stores: any) => {
      if (stores?.length) {
        const storeId = stores[0].id;
        this.loadAnalytics(storeId);
      }
    });
  }

  private loadAnalytics(storeId: number) {
    let requestsDone = 0;
    
    // 1. Günlük Gelir (Son 10 yıl)
    this.api.dailyRevenue(storeId, 3650).subscribe((data: any) => {
      if (data && data.length) {
        this.dailyLabels = data.map((d: any) => {
          const dateVal = d.date || d.DATE;
          return dateVal ? new Date(dateVal).toLocaleDateString('tr-TR', { year:'numeric', month:'short', day:'numeric' }) : '';
        });
        this.dailyDatasets = [{
          label: 'Günlük Gelir (₺)',
          data: data.map((d: any) => {
            const revVal = d.revenue || d.REVENUE;
            return parseFloat(Number(revVal || 0).toFixed(2));
          }),
          borderColor: '#8b5cf6', // mor
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4
        }];
      }
      requestsDone++;
      if (requestsDone === 2) this.loaded.set(true);
    });

    // 2. Kategori Satışları
    this.api.salesByCategory(storeId).subscribe((data: any) => {
      if (data && data.length) {
        this.categoryLabels = data.map((d: any) => d.categoryName || d.CATEGORYNAME);
        this.categoryDatasets = [{
          label: 'Satılan Adet',
          data: data.map((d: any) => {
            const val = d.totalSales || d.TOTALSALES;
            return parseInt(Number(val || 0).toString(), 10);
          }),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
          borderWidth: 0
        }];
      }
      requestsDone++;
      if (requestsDone === 2) this.loaded.set(true);
    });
  }
}
