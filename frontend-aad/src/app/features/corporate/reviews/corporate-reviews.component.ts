import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-corporate-reviews',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <h2>⭐ Müşteri Yorumları</h2>
        <p class="sub">Ürünlerinize gelen son değerlendirmeler.</p>
        
        <div class="reviews-grid" *ngIf="reviews().length > 0; else noReviews">
          <div class="card review-card" *ngFor="let r of reviews()">
            <div class="stars">
              <span *ngFor="let s of [1,2,3,4,5]" [style.color]="r.starRating >= s ? '#fbbf24' : '#1e2535'">★</span>
            </div>
            <h4 class="rtitle">{{r.title}}</h4>
            <p class="rbody">"{{r.body}}"</p>
            <div class="rfooter">
              <span>Ürün ID: {{r.product?.id}}</span>
              <span>{{r.createdAt | date:'shortDate'}}</span>
            </div>
          </div>
        </div>
        <ng-template #noReviews><div class="card"><p>Henüz mağazanıza yorum yapılmamış.</p></div></ng-template>
      </main>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh;background:#0f1117}
    .main{margin-left:240px;flex:1;padding:32px;color:#e2e8f0}
    h2{font-size:28px;font-weight:700;color:#fff;margin:0 0 4px}
    .sub{color:#64748b;font-size:14px;margin:0 0 24px}
    .card{background:#161b2e;border:1px solid #1e2535;border-radius:12px;padding:24px}
    .reviews-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
    .review-card{display:flex;flex-direction:column}
    .stars{font-size:20px;margin-bottom:8px}
    .rtitle{margin:0 0 8px;font-size:16px;color:#fff}
    .rbody{color:#94a3b8;font-size:14px;font-style:italic;flex:1;margin:0 0 16px}
    .rfooter{display:flex;justify-content:space-between;font-size:12px;color:#64748b;border-top:1px solid #1e2535;padding-top:12px}
  `]
})
export class CorporateReviewsComponent implements OnInit {
  reviews = signal<any[]>([]);
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

  constructor(private api: ApiService) {}

  ngOnInit() {
    // Backendden gelen yorumları listele
    this.api.getAllReviews().subscribe((data: any) => {
      this.reviews.set(data.content || data);
    });
  }
}
